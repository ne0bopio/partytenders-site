import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allowRequest } from "./rate-limit";

describe("allowRequest", () => {
  it("allows five posts in the window and blocks the sixth", () => {
    const store = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < 5; i += 1) {
      assert.equal(allowRequest("1.2.3.4", now + i, store), true);
    }
    assert.equal(allowRequest("1.2.3.4", now + 5, store), false);
  });

  it("lets a new window through after the old hits expire", () => {
    const store = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < 5; i += 1) allowRequest("1.2.3.4", now, store);
    assert.equal(allowRequest("1.2.3.4", now + 15 * 60 * 1000, store), true);
  });

  it("counts addresses separately", () => {
    const store = new Map<string, number[]>();
    for (let i = 0; i < 5; i += 1) allowRequest("1.1.1.1", 10, store);
    assert.equal(allowRequest("2.2.2.2", 10, store), true);
  });
});
