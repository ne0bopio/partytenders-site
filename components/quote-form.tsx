"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  buildMailtoHref,
  buildQuoteMessage,
  buildSmsHref,
  canOpenSms,
  QUOTE_NEED_EVENT,
  type QuoteRequest,
} from "@/lib/quote";
import { PARTY_TYPES, PHONE_DISPLAY, SERVICES } from "@/lib/site";

type Draft = {
  message: string;
  sms: string;
  mailto: string;
};

function toggleValue(current: string[], value: string, single: boolean) {
  const selected = current.includes(value);
  if (single) return selected ? [] : [value];
  return selected ? current.filter((item) => item !== value) : [...current, value];
}

export function QuoteForm() {
  const [party, setParty] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    const onNeed = (event: Event) => {
      const need = (event as CustomEvent<string>).detail;
      if (!need) return;
      setServices((current) =>
        current.includes(need) ? current : [...current, need],
      );
    };
    window.addEventListener(QUOTE_NEED_EVENT, onNeed);
    return () => window.removeEventListener(QUOTE_NEED_EVENT, onNeed);
  }, []);

  async function copyMessage(message: string) {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const read = (name: string) => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement) return field.value.trim();
      return "";
    };
    const request: QuoteRequest = {
      party,
      services,
      guests: read("guests"),
      date: read("date"),
      where: read("where"),
      name: read("name"),
      contact: read("contact"),
    };
    const message = buildQuoteMessage(request);
    const sms = buildSmsHref(message);
    if (
      canOpenSms({
        userAgent: navigator.userAgent,
        maxTouchPoints: navigator.maxTouchPoints,
      })
    ) {
      window.location.href = sms;
      return;
    }
    setCopied(false);
    setCopyFailed(false);
    setDraft({ message, sms, mailto: buildMailtoHref(message) });
  }

  return (
    <form id="qform" noValidate onSubmit={onSubmit}>
      <fieldset>
        <legend>What&apos;s the party?</legend>
        <div className="chips" data-name="party" data-single="">
          {PARTY_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={party.includes(option)}
              onClick={() => setParty((current) => toggleValue(current, option, true))}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>What do you need?</legend>
        <div className="chips" data-name="need">
          {SERVICES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={services.includes(option)}
              onClick={() =>
                setServices((current) => toggleValue(current, option, false))
              }
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="row">
        <label>
          Guests
          <input name="guests" inputMode="numeric" placeholder="80" />
        </label>
        <label>
          Date
          <input name="date" type="date" />
        </label>
      </div>
      <label>
        Where
        <input name="where" placeholder="Town, or the venue" />
      </label>
      <div className="row">
        <label>
          Your name
          <input name="name" autoComplete="name" />
        </label>
        <label>
          Phone or email
          <input name="contact" autoComplete="email" />
        </label>
      </div>
      <button className="send" type="submit">
        Text Danielle with this request
      </button>
      {draft ? (
        <div className="q-done" role="status">
          <p>
            This browser can&apos;t open a text to {PHONE_DISPLAY}. Copy the
            request, or email it from your mail app.
          </p>
          <p className="q-message">{draft.message}</p>
          <div className="q-actions">
            <button type="button" onClick={() => copyMessage(draft.message)}>
              {copied ? "Copied" : "Copy message"}
            </button>
            <a className="ghost" href={draft.mailto}>
              Email this request
            </a>
            <a className="ghost" href={draft.sms}>
              Try Messages anyway
            </a>
          </div>
          {copyFailed ? (
            <p>Select the message above and copy it by hand.</p>
          ) : null}
        </div>
      ) : null}
      <p className="q-note">
        First booking on the site: 15% off any rental or mixer package. On a
        phone, submit opens a text to Danielle for you to review and send. On a
        computer, you can copy the request or email it.
      </p>
    </form>
  );
}
