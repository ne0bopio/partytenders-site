export const SITE_URL = "https://partytenderseventparty.com";

export const PHONE_E164 = "+14843582578";
export const PHONE_DISPLAY = "484-358-2578";

/** No public email is printed on the current site. */
export const QUOTE_EMAIL = "";

export const INSTAGRAM_URL =
  "https://www.instagram.com/partytenders_yourpartywetend";
export const FACEBOOK_URL = "https://www.facebook.com/eventsyourpartywetend";
export const FUSION_URL = "https://fusionmixologycart.vercel.app";

export const PARTY_TYPES = [
  "Holiday party",
  "Birthday",
  "Wedding",
  "Corporate",
  "Shower",
  "Other",
] as const;

export const SERVICES = [
  "Bartenders",
  "Servers",
  "Grill cook",
  "Catering",
  "Rentals",
  "Mixer package",
  "Planning",
] as const;

export type PartyType = (typeof PARTY_TYPES)[number];
export type Service = (typeof SERVICES)[number];
