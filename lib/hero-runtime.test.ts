import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyDrag } from "./hero-runtime";

describe("hero drag axis lock", () => {
  it("waits inside the slop so a tap does not rotate", () => {
    assert.equal(classifyDrag(3, -4), "pending");
    assert.equal(classifyDrag(0, 0), "pending");
  });

  it("locks a horizontal drag to rotate", () => {
    assert.equal(classifyDrag(28, 6), "rotate");
    assert.equal(classifyDrag(-36, 8), "rotate");
  });

  it("locks a vertical swipe to scroll", () => {
    assert.equal(classifyDrag(4, 30), "scroll");
    assert.equal(classifyDrag(-6, -40), "scroll");
  });

  it("prefers scroll when the axes are equal", () => {
    assert.equal(classifyDrag(18, 18), "scroll");
    assert.equal(classifyDrag(-22, 22), "scroll");
  });
});
