import type { CSSProperties } from "react";
import { Photo } from "@/components/photo";

export function Hero() {
  return (
    <section className="hero w-night" data-world="night">
      <div className="lockup">
        <p className="lk-top">Jersey City &amp; South Florida</p>
        <h1 className="wordmark">PartyTenders</h1>
        <p className="lk-sub">Your party, we tend.</p>
      </div>
      <div className="collage hero-col">
        <figure
          className="pasted p-left"
          data-speed=".10"
          data-rot="-6"
          style={{ "--rot": "-6" } as CSSProperties}
        >
          <Photo
            src="/fotos/fiesta-bar.jpg"
            alt="A PartyTenders portable bar set up for a backyard fiesta"
            objectPosition="35% 40%"
            sizes="(min-width: 860px) 260px, 40vw"
            priority
          />
        </figure>
        <figure className="arch" data-speed="-.04">
          <Photo
            src="/fotos/pour.jpg"
            alt="Danielle pouring champagne into a hundred flutes before a toast"
            objectPosition="58% 32%"
            sizes="(min-width: 860px) 300px, 54vw"
            priority
          />
        </figure>
        <figure
          className="pasted p-right"
          data-speed=".16"
          data-rot="5"
          style={{ "--rot": "5" } as CSSProperties}
        >
          <Photo
            src="/fotos/venue-flores.jpg"
            alt="Wine on ice at a ballroom wedding under a ceiling of flowers"
            objectPosition="30% 70%"
            sizes="(min-width: 860px) 300px, 42vw"
            priority
          />
        </figure>
        <div
          className="sticker st-a"
          data-spin="1"
          style={{ "--spin": "-8" } as CSSProperties}
        >
          <span>
            Best of
            <br />
            The Bash
            <br />
            <b>4×</b>
          </span>
        </div>
        <div
          className="sticker st-b"
          data-spin="-1"
          style={{ "--spin": "8" } as CSSProperties}
        >
          <span>
            RAMP &amp;
            <br />
            TIPS
            <br />
            certified
          </span>
        </div>
      </div>
      <a className="hero-cta" href="#quote">
        Get a quote
      </a>
    </section>
  );
}
