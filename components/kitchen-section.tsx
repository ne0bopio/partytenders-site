import type { CSSProperties } from "react";
import { NeedLink } from "@/components/need-link";

const ITEMS = [
  "Customer favorites",
  "Appetizers",
  "Classic Italian dishes",
  "Desserts",
  "Coffee service",
] as const;

export function KitchenSection() {
  return (
    <section className="line w-kit" id="kitchen" data-world="kit">
      <p className="by">PartyTenders</p>
      <h2 className="lname" style={{ "--n": 7 } as CSSProperties}>
        <i>the</i>
        <span>Kitchen</span>
      </h2>
      <div className="menucard">
        <p className="mc-h">Catering, on request</p>
        <ul>
          {ITEMS.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <i />
              <em>ask</em>
            </li>
          ))}
        </ul>
      </div>
      <p className="ltext">An extensive menu, set with you for the size of the party.</p>
      <div className="links">
        <NeedLink href="#quote" need="Catering">
          Ask about catering
        </NeedLink>
      </div>
    </section>
  );
}
