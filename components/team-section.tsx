import type { CSSProperties } from "react";
import { NeedLink } from "@/components/need-link";
import { Photo } from "@/components/photo";

export function TeamSection() {
  return (
    <section className="line w-team" id="team" data-world="team">
      <p className="by">PartyTenders</p>
      <h2 className="lname" style={{ "--n": 4 } as CSSProperties}>
        <i>the</i>
        <span>Team</span>
      </h2>
      <div className="collage line-col">
        <figure className="frame c1 tall" data-speed="-.05">
          <Photo
            src="/fotos/salon-rosa.jpg"
            alt="A ballroom bar lit in pink during an event"
            objectPosition="40% 50%"
            sizes="(min-width: 860px) 280px, 44vw"
          />
        </figure>
        <figure className="arch c2" data-speed=".12">
          <Photo
            src="/fotos/danielle.jpg"
            alt="Danielle Belletiere, founder of PartyTenders"
            objectPosition="50% 20%"
            sizes="(min-width: 860px) 300px, 46vw"
          />
        </figure>
        <figure
          className="pasted c3"
          data-speed=".2"
          data-rot="-4"
          style={{ "--rot": "-4" } as CSSProperties}
        >
          <Photo
            src="/fotos/aniversario-50.jpg"
            alt="A 50th anniversary cake table the team served"
            objectPosition="50% 40%"
            sizes="(min-width: 860px) 320px, 42vw"
          />
        </figure>
      </div>
      <p className="ltext">
        Trained wait staff for anything from a small cocktail party to a large
        corporate event, grill cooks for the backyard, and help with the
        planning: we connect you with the right vendors.
      </p>
      <div className="links">
        <NeedLink href="#quote" need="Servers">
          Ask about staff
        </NeedLink>
        <NeedLink href="#quote" need="Planning">
          Plan with us
        </NeedLink>
      </div>
    </section>
  );
}
