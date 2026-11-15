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

type Outcome = "saved" | "fallback";

function toggleValue(current: string[], value: string, single: boolean) {
  const selected = current.includes(value);
  if (single) return selected ? [] : [value];
  return selected ? current.filter((item) => item !== value) : [...current, value];
}

export function QuoteForm() {
  const [party, setParty] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [saving, setSaving] = useState(false);
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
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
    const next: Draft = {
      message,
      sms: buildSmsHref(message),
      mailto: buildMailtoHref(message),
    };
    setSaving(true);
    setCopied(false);
    setCopyFailed(false);
    let saved = false;
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...request, company: read("company") }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      saved = response.ok && body?.ok === true;
    } catch {
      saved = false;
    }
    setDraft(next);
    setOutcome(saved ? "saved" : "fallback");
    setSaving(false);
    if (
      !saved &&
      canOpenSms({
        userAgent: navigator.userAgent,
        maxTouchPoints: navigator.maxTouchPoints,
      })
    ) {
      window.location.href = next.sms;
    }
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
      <label className="hp" aria-hidden="true">
        Company
        <input name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
      <button className="send" type="submit" disabled={saving}>
        {saving ? "Sending…" : "Send this request"}
      </button>
      {draft && outcome ? (
        <div className="q-done" role="status">
          <p>
            {outcome === "saved"
              ? "Danielle has this request. You can also text her the same note."
              : `We couldn't file this from the site. Text Danielle at ${PHONE_DISPLAY}, or copy the note.`}
          </p>
          <p className="q-message">{draft.message}</p>
          <div className="q-actions">
            <a href={draft.sms}>Text Danielle</a>
            <button
              className="ghost"
              type="button"
              onClick={() => copyMessage(draft.message)}
            >
              {copied ? "Copied" : "Copy message"}
            </button>
            <a className="ghost" href={draft.mailto}>
              Email this request
            </a>
          </div>
          {copyFailed ? (
            <p>Select the message above and copy it by hand.</p>
          ) : null}
        </div>
      ) : null}
      <p className="q-note">
        First booking on the site: 15% off any rental or mixer package. Sending
        saves the request for Danielle. You can also text it to her, or copy it.
      </p>
    </form>
  );
}
