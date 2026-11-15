/**
 * Logo files are swappable. Drop replacements into `public/brand/`
 * and keep these names.
 *
 * The chosen mark is the Deco Monogram: a PT monogram in a chamfered
 * art-deco badge, brass on night, for the hero, the header, and the
 * favicon. Those files are still being drawn. Until they arrive, the
 * paths below point at the previous coupe lockup. Do not treat that
 * artwork as the final logo.
 *
 * - `logo-full-light.svg` / `.png` — cream type for dark backgrounds.
 *   The hero lockup uses the SVG.
 * - `logo-full.svg` / `.png` — night type for light backgrounds.
 * - `logo-mark-light.svg` / `.png` — mark for dark backgrounds.
 *   Header on night, and the favicon once the Deco files arrive.
 * - `logo-mark.svg` / `.png` — mark for light backgrounds.
 *
 * If a replacement lockup changes size, update `BRAND_LOGO_ASPECT`.
 */
export const BRAND_LOGO_ON_DARK = "/brand/logo-full-light.svg";
export const BRAND_LOGO_ON_DARK_RASTER = "/brand/logo-full-light.png";
export const BRAND_LOGO_ON_LIGHT = "/brand/logo-full.svg";
export const BRAND_MARK = "/brand/logo-mark.svg";
export const BRAND_MARK_ON_DARK = "/brand/logo-mark-light.svg";

/** Width ÷ height of `public/brand/logo-full-light.svg` (809.72 × 240). */
export const BRAND_LOGO_ASPECT = 809.72 / 240;

export const BRAND_POSTER = "/brand/hero-poster.svg";
