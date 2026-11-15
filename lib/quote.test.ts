import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMailtoHref, buildQuoteMessage, buildSmsHref } from "./quote";

const full = {
  party: ["Wedding"],
  services: ["Bartenders", "Servers"],
  guests: "80",
  date: "2026-12-01",
  where: "Jersey City",
  name: "Alex",
  contact: "alex@example.com",
};

describe("buildQuoteMessage", () => {
  it("keeps the greeting and joins the filled lines", () => {
    assert.equal(
      buildQuoteMessage(full),
      [
        "Hi Danielle, I would like a PartyTenders quote.",
        "Event: Wedding",
        "Services: Bartenders, Servers",
        "Guests: 80",
        "Date: 2026-12-01",
        "Location: Jersey City",
        "Name: Alex",
        "Contact: alex@example.com",
      ].join("\n"),
    );
  });

  it("drops empty fields", () => {
    assert.equal(
      buildQuoteMessage({
        party: [],
        services: [],
        guests: "",
        date: "",
        where: "",
        name: "",
        contact: "",
      }),
      "Hi Danielle, I would like a PartyTenders quote.",
    );
  });
});

describe("quote links", () => {
  it("keeps the sms: body shape the phones already use", () => {
    const message = buildQuoteMessage(full);
    assert.equal(
      buildSmsHref(message),
      `sms:+14843582578?&body=${encodeURIComponent(message)}`,
    );
  });

  it("opens a mailto draft with the same message", () => {
    const href = buildMailtoHref("Hello Danielle");
    assert.equal(
      href,
      "mailto:?subject=PartyTenders%20quote%20request&body=Hello%20Danielle",
    );
  });
});
