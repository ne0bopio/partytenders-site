/** Five quote posts per address per 15 minutes, in this server process. */
export const QUOTE_RATE_LIMIT = 5;
export const QUOTE_RATE_WINDOW_MS = 15 * 60 * 1000;

const hits = new Map<string, number[]>();

export function allowRequest(
  key: string,
  now: number,
  store: Map<string, number[]>,
  limit = QUOTE_RATE_LIMIT,
  windowMs = QUOTE_RATE_WINDOW_MS,
): boolean {
  const recent = (store.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    store.set(key, recent);
    return false;
  }
  recent.push(now);
  store.set(key, recent);
  return true;
}

export function rateLimitQuote(key: string, now = Date.now()): boolean {
  return allowRequest(key, now, hits);
}
