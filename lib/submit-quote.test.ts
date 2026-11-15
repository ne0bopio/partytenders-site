import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { allowRequest } from "./rate-limit";
import {
  submitQuote,
  type NewQuoteRow,
  type QuoteMail,
  type QuoteStore,
} from "./submit-quote";

const valid = {
  party: ["Wedding"],
  services: ["Bartenders"],
  guests: "80",
  date: "2026-12-01",
  where: "Jersey City",
  name: "Alex",
  contact: "alex@example.com",
  company: "",
};

function memoryStore() {
  const rows: NewQuoteRow[] = [];
  const emailed: string[] = [];
  const store: QuoteStore = {
    async insert(row) {
      rows.push(row);
      return { ok: true, id: `id-${rows.length}` };
    },
    async markEmailed(id) {
      emailed.push(id);
    },
  };
  return { store, rows, emailed };
}

function mailer(sent: string[]) {
  return {
    async send(message: QuoteMail) {
      sent.push(message.text);
      return { sent: true };
    },
  };
}

async function post(
  raw: unknown,
  extras: Partial<Parameters<typeof submitQuote>[0]> = {},
) {
  const saved = memoryStore();
  const sent: string[] = [];
  const result = await submitQuote({
    raw,
    ip: "203.0.113.4",
    configured: true,
    notifyTo: "danielle@example.com",
    from: "PartyTenders <quotes@example.com>",
    allow: () => true,
    store: saved.store,
    mailer: mailer(sent),
    ...extras,
  });
  return { result, ...saved, sent };
}

describe("submitQuote", () => {
  it("stores a new request and emails the same note", async () => {
    const { result, rows, emailed, sent } = await post(valid);
    assert.deepEqual(result, {
      ok: true,
      stored: true,
      id: "id-1",
      notified: true,
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.party, "Wedding");
    assert.deepEqual(rows[0]?.services, ["Bartenders"]);
    assert.equal(rows[0]?.guests, 80);
    assert.equal(rows[0]?.event_date, "2026-12-01");
    assert.equal(rows[0]?.status, "new");
    assert.equal(rows[0]?.email_sent, false);
    assert.match(rows[0]?.message ?? "", /Event: Wedding/);
    assert.match(sent[0] ?? "", /Request id-1/);
    assert.deepEqual(emailed, ["id-1"]);
  });

  it("drops a filled honeypot without saving or emailing", async () => {
    const { result, rows, sent } = await post({ ...valid, company: "https://spam.test" });
    assert.deepEqual(result, { ok: true, stored: false, notified: false });
    assert.equal(rows.length, 0);
    assert.equal(sent.length, 0);
  });

  it("does not save when Supabase is not configured", async () => {
    const { result, rows, sent } = await post(valid, { configured: false });
    assert.deepEqual(result, { ok: false, reason: "unconfigured" });
    assert.equal(rows.length, 0);
    assert.equal(sent.length, 0);
  });

  it("does not save when the address is over the limit", async () => {
    const store = new Map<string, number[]>();
    const { result, rows } = await post(valid, {
      allow: (ip) => allowRequest(ip, 5_000, store, 1, 60_000),
    });
    assert.equal(result.ok, true);
    const second = await post(valid, {
      allow: (ip) => allowRequest(ip, 5_001, store, 1, 60_000),
    });
    assert.deepEqual(second.result, { ok: false, reason: "rate_limited" });
    assert.equal(rows.length, 1);
    assert.equal(second.rows.length, 0);
  });

  it("rejects an invalid body before touching the store", async () => {
    const { result, rows } = await post({ ...valid, guests: "eighty" });
    assert.deepEqual(result, { ok: false, reason: "invalid" });
    assert.equal(rows.length, 0);
  });

  it("reports a save failure and does not send mail", async () => {
    const sent: string[] = [];
    const result = await submitQuote({
      raw: valid,
      ip: "203.0.113.4",
      configured: true,
      notifyTo: "danielle@example.com",
      from: "PartyTenders <quotes@example.com>",
      allow: () => true,
      store: {
        async insert() {
          return { ok: false, error: "connection refused" };
        },
        async markEmailed() {},
      },
      mailer: mailer(sent),
    });
    assert.deepEqual(result, { ok: false, reason: "save_failed" });
    assert.equal(sent.length, 0);
  });

  it("keeps the saved request when email fails", async () => {
    const saved = memoryStore();
    const result = await submitQuote({
      raw: valid,
      ip: "203.0.113.9",
      configured: true,
      notifyTo: "danielle@example.com",
      from: "PartyTenders <quotes@example.com>",
      allow: () => true,
      store: saved.store,
      mailer: {
        async send() {
          return { sent: false };
        },
      },
    });
    assert.deepEqual(result, {
      ok: true,
      stored: true,
      id: "id-1",
      notified: false,
    });
    assert.deepEqual(saved.emailed, []);
  });
});

describe("quote_requests migration", () => {
  const sql = readFileSync(
    path.join(process.cwd(), "supabase/migrations/20261115000000_create_quote_requests.sql"),
    "utf8",
  );

  it("turns on row level security and does not let anon write or read", () => {
    const executable = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    assert.match(executable, /enable row level security/i);
    assert.match(
      executable,
      /revoke all on table public\.quote_requests from public, anon, authenticated/i,
    );
    assert.doesNotMatch(executable, /create policy/i);
    assert.doesNotMatch(executable, /grant .+ to anon/i);
  });

  it("defaults status to new and leaves admin access for step 3", () => {
    assert.match(sql, /status text not null default 'new'/);
    assert.match(sql, /Step 3/);
    assert.match(sql, /for select/);
    assert.match(sql, /for update/);
  });
});
