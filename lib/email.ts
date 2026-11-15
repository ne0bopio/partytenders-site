import "server-only";
import { Resend } from "resend";
import type { QuoteMailer } from "./submit-quote";

/** Resend today. Swap this function if the mail provider changes. */
export function createQuoteMailer(): QuoteMailer {
  return {
    async send(message) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey || !message.to || !message.from) {
        console.warn(
          "[quote] email skipped: set RESEND_API_KEY, QUOTE_FROM_EMAIL, and QUOTE_NOTIFY_EMAIL",
        );
        return { sent: false };
      }
      try {
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
          from: message.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
        });
        if (error) {
          console.error("[quote] email failed", error.message);
          return { sent: false };
        }
        return { sent: true };
      } catch (error) {
        console.error(
          "[quote] email failed",
          error instanceof Error ? error.message : "unknown",
        );
        return { sent: false };
      }
    },
  };
}
