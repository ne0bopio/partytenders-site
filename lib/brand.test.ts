import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  BRAND_LOGO_ASPECT,
  BRAND_LOGO_ON_DARK,
  BRAND_LOGO_ON_LIGHT,
  BRAND_MARK,
} from "./brand";

function readBrand(file: string): string {
  return readFileSync(new URL(`../public/brand/${file}`, import.meta.url), "utf8");
}

describe("draft logo assets", () => {
  it("points the night hero at the cream lockup", () => {
    assert.equal(BRAND_LOGO_ON_DARK, "/brand/logo-full-light.svg");
    assert.ok(BRAND_LOGO_ASPECT > 3);
    const light = readBrand("logo-full-light.svg");
    assert.match(light, /#F2E7D6/);
    assert.match(light, /#D4AE69/);
    assert.match(light, /Your party, we tend/);
    assert.match(light, /id="mark-deco"/);
    assert.ok(Math.abs(BRAND_LOGO_ASPECT - 761.75 / 224) < 0.001);
  });

  it("keeps the night lockup and both marks", () => {
    assert.equal(BRAND_LOGO_ON_LIGHT, "/brand/logo-full.svg");
    assert.equal(BRAND_MARK, "/brand/logo-mark.svg");
    assert.match(readBrand("logo-full.svg"), /#150B0E/);
    assert.match(readBrand("logo-mark.svg"), /id="mark-deco"/);
    assert.match(readBrand("logo-mark-light.svg"), /#F2E7D6/);
  });
});
