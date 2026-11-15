import {
  FACEBOOK_URL,
  INSTAGRAM_URL,
  PHONE_DISPLAY,
  PHONE_E164,
} from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="foot w-night" data-world="night">
      <p className="foot-mark">PartyTenders</p>
      <p>
        Jersey City, NJ and South Florida ·{" "}
        <a href={`tel:${PHONE_E164}`}>{PHONE_DISPLAY}</a>
      </p>
      <p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
        {" · "}
        <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
          Facebook
        </a>
      </p>
      <p className="foot-sm">© 2026 PartyTenders LLC</p>
    </footer>
  );
}
