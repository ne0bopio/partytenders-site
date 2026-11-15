import { buildQuoteMessage, type QuoteRequest } from "./quote";
import { parseQuoteInput } from "./quote-schema";

export type NewQuoteRow = {
  party: string | null;
  services: string[];
  guests: number | null;
  event_date: string | null;
  location: string | null;
  name: string | null;
  contact: string | null;
  message: string;
  status: "new";
  email_sent: boolean;
  source: "website";
};

export type QuoteStore = {
  insert(
    row: NewQuoteRow,
  ): Promise<{ ok: true; id: string } | { ok: false; error: string }>;
  markEmailed(id: string): Promise<void>;
};

export type QuoteMail = {
  to: string;
  from: string;
  subject: string;
  text: string;
};

export type QuoteMailer = {
  send(message: QuoteMail): Promise<{ sent: boolean }>;
};

export type SubmitQuoteResult =
  | { ok: true; stored: boolean; id?: string; notified: boolean }
  | { ok: false; reason: "invalid" | "rate_limited" | "unconfigured" | "save_failed" };

function blankToNull(value: string) {
  return value === "" ? null : value;
}

export function toQuoteRow(request: QuoteRequest): NewQuoteRow {
  return {
    party: request.party[0] ?? null,
    services: request.services,
    guests: request.guests === "" ? null : Number(request.guests),
    event_date: blankToNull(request.date),
    location: blankToNull(request.where),
    name: blankToNull(request.name),
    contact: blankToNull(request.contact),
    message: buildQuoteMessage(request),
    status: "new",
    email_sent: false,
    source: "website",
  };
}

export async function submitQuote(input: {
  raw: unknown;
  ip: string;
  configured: boolean;
  notifyTo: string;
  from: string;
  allow: (ip: string) => boolean;
  store: QuoteStore;
  mailer: QuoteMailer;
}): Promise<SubmitQuoteResult> {
  const parsed = parseQuoteInput(input.raw);
  if (!parsed.ok) return { ok: false, reason: "invalid" };
  if (parsed.value.company !== "") {
    console.warn("[quote] dropped a honeypot submission");
    return { ok: true, stored: false, notified: false };
  }
  if (!input.allow(input.ip)) return { ok: false, reason: "rate_limited" };
  if (!input.configured) {
    console.warn(
      "[quote] Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
    return { ok: false, reason: "unconfigured" };
  }

  const request: QuoteRequest = {
    party: [...parsed.value.party],
    services: parsed.value.services,
    guests: parsed.value.guests,
    date: parsed.value.date,
    where: parsed.value.where,
    name: parsed.value.name,
    contact: parsed.value.contact,
  };
  const row = toQuoteRow(request);
  const inserted = await input.store.insert(row);
  if (!inserted.ok) {
    console.error("[quote] save failed", inserted.error);
    return { ok: false, reason: "save_failed" };
  }

  let notified = false;
  try {
    const sent = await input.mailer.send({
      to: input.notifyTo,
      from: input.from,
      subject: `PartyTenders quote${request.name ? ` from ${request.name}` : ""}`,
      text: `${row.message}\n\nRequest ${inserted.id}`,
    });
    notified = sent.sent;
  } catch (error) {
    console.error(
      "[quote] email failed",
      error instanceof Error ? error.message : "unknown",
    );
  }

  if (notified) {
    try {
      await input.store.markEmailed(inserted.id);
    } catch (error) {
      console.error(
        "[quote] could not mark email sent",
        error instanceof Error ? error.message : "unknown",
      );
    }
  }

  return { ok: true, stored: true, id: inserted.id, notified };
}
