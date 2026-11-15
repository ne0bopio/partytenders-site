import { z } from "zod";
import { PARTY_TYPES, SERVICES } from "./site";

const partyType = z.enum(PARTY_TYPES);
const service = z.enum(SERVICES);

function isEmptyOrRealDate(value: string) {
  if (value === "") return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const quoteInputSchema = z.object({
  party: z.array(partyType).max(1),
  services: z.array(service).max(SERVICES.length),
  guests: z
    .string()
    .trim()
    .max(5)
    .refine(
      (value) =>
        value === "" ||
        (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10000),
      "Guests must be a whole number from 1 to 10000.",
    ),
  date: z
    .string()
    .trim()
    .max(10)
    .refine(isEmptyOrRealDate, "Use a real date."),
  where: z.string().trim().max(200),
  name: z.string().trim().max(120),
  contact: z.string().trim().max(200),
  company: z.string().trim().max(200).optional().default(""),
});

export type ParsedQuote = z.infer<typeof quoteInputSchema>;

export function parseQuoteInput(
  raw: unknown,
): { ok: true; value: ParsedQuote } | { ok: false; error: string } {
  const parsed = quoteInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }
  return {
    ok: true,
    value: {
      ...parsed.data,
      services: [...new Set(parsed.data.services)],
    },
  };
}
