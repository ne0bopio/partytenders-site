import { createQuoteMailer } from "@/lib/email";
import { rateLimitQuote } from "@/lib/rate-limit";
import { submitQuote, type SubmitQuoteResult } from "@/lib/submit-quote";
import { createQuoteStore } from "@/lib/supabase-admin";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function httpResult(result: SubmitQuoteResult) {
  if (result.ok) return { status: 200, body: { ok: true as const } };
  const status =
    result.reason === "invalid"
      ? 400
      : result.reason === "rate_limited"
        ? 429
        : result.reason === "unconfigured"
          ? 503
          : 500;
  return { status, body: { ok: false as const, reason: result.reason } };
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const store = createQuoteStore();
  const result = await submitQuote({
    raw,
    ip: clientIp(request),
    configured: store !== null,
    notifyTo: process.env.QUOTE_NOTIFY_EMAIL ?? "",
    from: process.env.QUOTE_FROM_EMAIL ?? "",
    allow: rateLimitQuote,
    store: store ?? {
      async insert() {
        return { ok: false, error: "Supabase is not configured" };
      },
      async markEmailed() {},
    },
    mailer: createQuoteMailer(),
  });

  const { status, body } = httpResult(result);
  return Response.json(body, { status });
}
