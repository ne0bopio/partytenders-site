/**
 * Draft logo, concept B: a wine coupe with a brass rim beside the wordmark.
 * The client has not chosen a final concept. Drop the new files in
 * `public/brand/` using the same names.
 *
 * - `logo-full-light.svg` / `.png` — cream type for dark backgrounds.
 *   The hero lockup uses the SVG. The PNG is the same artwork for places
 *   that cannot draw the outlined SVG.
 * - `logo-full.svg` / `.png` — night type for light backgrounds.
 * - `logo-mark.svg` / `.png` — the glass icon only, drawn for light
 *   backgrounds (the stem is night `#150B0E`).
 *
 * The wordmark and tagline are outlined paths (Federo, Cormorant Garamond
 * italic 500). If a replacement lockup is not this aspect, update
 * `BRAND_LOGO_ASPECT`.
 * Light artwork (cream `#F2E7D6`, brass `#D4AE69`) reads on the night hero.
 */
export const BRAND_LOGO_ON_DARK = "/brand/logo-full-light.svg";
export const BRAND_LOGO_ON_DARK_RASTER = "/brand/logo-full-light.png";
export const BRAND_LOGO_ON_LIGHT = "/brand/logo-full.svg";
export const BRAND_MARK = "/brand/logo-mark.svg";

/** Width ÷ height of `public/brand/logo-full-light.svg`. */
export const BRAND_LOGO_ASPECT = 809.72 / 240;

export const BRAND_POSTER = "/brand/hero-poster.svg";
