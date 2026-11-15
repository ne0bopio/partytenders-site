import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { QuoteStore } from "./submit-quote";

export function createQuoteStore(): QuoteStore | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async insert(row) {
      const { data, error } = await supabase
        .from("quote_requests")
        .insert(row)
        .select("id")
        .single();
      if (error || !data?.id) {
        return { ok: false, error: error?.message ?? "insert failed" };
      }
      return { ok: true, id: String(data.id) };
    },
    async markEmailed(id) {
      const { error } = await supabase
        .from("quote_requests")
        .update({ email_sent: true })
        .eq("id", id);
      if (error) console.error("[quote] could not mark email sent", error.message);
    },
  };
}
