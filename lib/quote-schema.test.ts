import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseQuoteInput } from "./quote-schema";

const valid = {
  party: ["Holiday party"],
  services: ["Bartenders", "Bartenders"],
  guests: "80",
  date: "2026-06-15",
  where: "Jersey City",
  name: "Alex",
  contact: "484-555-0100",
};

describe("parseQuoteInput", () => {
  it("accepts a normal form submission and drops duplicate services", () => {
    const parsed = parseQuoteInput(valid);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.deepEqual(parsed.value.services, ["Bartenders"]);
    assert.equal(parsed.value.company, "");
  });

  it("accepts an empty request", () => {
    const parsed = parseQuoteInput({
      party: [],
      services: [],
      guests: "",
      date: "",
      where: "",
      name: "",
      contact: "",
    });
    assert.equal(parsed.ok, true);
  });

  it("rejects party types and services that are not on the form", () => {
    assert.equal(
      parseQuoteInput({ ...valid, party: ["Casino night"] }).ok,
      false,
    );
    assert.equal(
      parseQuoteInput({ ...valid, services: ["Pyrotechnics"] }).ok,
      false,
    );
  });

  it("rejects more than one party type", () => {
    assert.equal(
      parseQuoteInput({ ...valid, party: ["Wedding", "Birthday"] }).ok,
      false,
    );
  });

  it("rejects guests that are not a whole number in range", () => {
    assert.equal(parseQuoteInput({ ...valid, guests: "eighty" }).ok, false);
    assert.equal(parseQuoteInput({ ...valid, guests: "0" }).ok, false);
    assert.equal(parseQuoteInput({ ...valid, guests: "10001" }).ok, false);
  });

  it("rejects dates that are not real calendar days", () => {
    assert.equal(parseQuoteInput({ ...valid, date: "2026-02-31" }).ok, false);
    assert.equal(parseQuoteInput({ ...valid, date: "June 15" }).ok, false);
  });

  it("rejects oversized text", () => {
    assert.equal(parseQuoteInput({ ...valid, where: "x".repeat(201) }).ok, false);
    assert.equal(parseQuoteInput({ ...valid, name: "x".repeat(121) }).ok, false);
  });
});
