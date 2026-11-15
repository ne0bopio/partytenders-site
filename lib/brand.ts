/**
 * Deco Monogram: a PT ligature in a chamfered art-deco badge.
 * Drop a replacement into `public/brand/` using the same names.
 *
 * - `logo-full-light.svg` / `.png` — cream type for dark backgrounds.
 *   The hero lockup uses the SVG.
 * - `logo-full.svg` / `.png` — night type for light backgrounds.
 * - `logo-mark-light.svg` / `.png` — cream PT badge for dark backgrounds.
 *   The header uses this on night.
 * - `logo-mark.svg` / `.png` — night badge for light backgrounds.
 *   The header uses this on cream.
 *
 * Favicons live in `public/` (`favicon.svg`, `favicon.ico`,
 * `favicon-32.png`, `favicon-16.png`, `apple-touch-icon.png`).
 * If a replacement lockup is not 761.75×224, update `BRAND_LOGO_ASPECT`.
 */
export const BRAND_LOGO_ON_DARK = "/brand/logo-full-light.svg";
export const BRAND_LOGO_ON_DARK_RASTER = "/brand/logo-full-light.png";
export const BRAND_LOGO_ON_LIGHT = "/brand/logo-full.svg";
export const BRAND_MARK = "/brand/logo-mark.svg";
export const BRAND_MARK_ON_DARK = "/brand/logo-mark-light.svg";

/** Width ÷ height of `public/brand/logo-full-light.svg` (761.75 × 224). */
export const BRAND_LOGO_ASPECT = 761.75 / 224;

export const BRAND_POSTER = "/brand/hero-poster.svg";
