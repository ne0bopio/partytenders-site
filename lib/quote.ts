import { PHONE_E164, QUOTE_EMAIL } from "@/lib/site";

/**
 * What the quote form collects.
 * Step 2 posts this object to an API route, which saves it in Supabase and
 * emails Danielle. This step only turns it into a message the visitor sends.
 */
export type QuoteRequest = {
  party: string[];
  services: string[];
  guests: string;
  date: string;
  where: string;
  name: string;
  contact: string;
};

export const QUOTE_NEED_EVENT = "partytenders:need";

export function buildQuoteMessage(request: QuoteRequest): string {
  const lines = [
    "Hi Danielle, I would like a PartyTenders quote.",
    request.party.length ? `Event: ${request.party.join(", ")}` : "",
    request.services.length ? `Services: ${request.services.join(", ")}` : "",
    request.guests ? `Guests: ${request.guests}` : "",
    request.date ? `Date: ${request.date}` : "",
    request.where ? `Location: ${request.where}` : "",
    request.name ? `Name: ${request.name}` : "",
    request.contact ? `Contact: ${request.contact}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

/** Same sms: shape the static site used, including the iOS `?&body` form. */
export function buildSmsHref(
  message: string,
  phone: string = PHONE_E164,
): string {
  return `sms:${phone}?&body=${encodeURIComponent(message)}`;
}

export function buildMailtoHref(
  message: string,
  email: string = QUOTE_EMAIL,
): string {
  const subject = encodeURIComponent("PartyTenders quote request");
  const body = encodeURIComponent(message);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

/**
 * Phones and tablets can hand an sms: link to the messaging app.
 * Desktop browsers usually cannot, so the form offers copy and email there.
 */
export function canOpenSms(agent: {
  userAgent: string;
  maxTouchPoints?: number;
}): boolean {
  const { userAgent } = agent;
  const touch = agent.maxTouchPoints ?? 0;
  const iOS =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && touch > 1);
  return iOS || /Android/i.test(userAgent);
}
