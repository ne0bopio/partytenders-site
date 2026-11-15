import type { CSSProperties } from "react";
import { NeedLink } from "@/components/need-link";
import { Photo } from "@/components/photo";

export function BarSection() {
  return (
    <section className="line w-bar" id="bar" data-world="bar">
      <p className="by">PartyTenders</p>
      <h2 className="lname" style={{ "--n": 3 } as CSSProperties}>
        <i>the</i>
        <span>Bar</span>
      </h2>
      <div className="collage line-col">
        <figure
          className="pasted c1"
          data-speed=".14"
          data-rot="-5"
          style={{ "--rot": "-5" } as CSSProperties}
        >
          <Photo
            src="/fotos/barra-50.jpg"
            alt="Wine, liquor and garnish set out on a portable bar with candles"
            objectPosition="60% 50%"
            sizes="(min-width: 860px) 280px, 44vw"
          />
        </figure>
        <figure className="frame c2" data-speed="-.06">
          <Photo
            src="/fotos/shots.jpg"
            alt="A PartyTenders bartender pouring a round of shots"
            objectPosition="50% 30%"
            sizes="(min-width: 860px) 300px, 46vw"
          />
        </figure>
        <figure
          className="pasted c3"
          data-speed=".22"
          data-rot="6"
          style={{ "--rot": "6" } as CSSProperties}
        >
          <Photo
            src="/fotos/patio-bar.jpg"
            alt="A bartender behind an outdoor stone bar stocked for a party"
            objectPosition="45% 50%"
            sizes="(min-width: 860px) 320px, 42vw"
          />
        </figure>
      </div>
      <p className="ltext">
        Every bartender is RAMP &amp; TIPS certified and shows up with the bar
        tools. Add a mixer package with fresh juice, homemade syrups, garnish,
        ice and cups, or rent a portable bar.
      </p>
      <div className="links">
        <NeedLink href="#quote" need="Bartenders">
          Ask about the bar
        </NeedLink>
        <NeedLink href="#quote" need="Mixer package">
          Ask about a mixer package
        </NeedLink>
      </div>
    </section>
  );
}
