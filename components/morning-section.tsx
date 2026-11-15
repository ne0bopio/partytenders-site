import type { CSSProperties } from "react";
import { MORNING_JOE_URL } from "@/lib/site";

const ITEMS = [
  "Bagels, muffins and danish",
  "Yogurt parfaits and fruit cups",
  "Bacon and sausage trays",
  "Cookies, cupcakes and brownies",
  "A box of coffee for 12",
  "Orange, cranberry, grapefruit and pineapple juice",
] as const;

export function MorningSection() {
  return (
    <section className="line w-cream" id="morning" data-world="cream">
      <p className="by">PartyTenders</p>
      <h2 className="lname two" style={{ "--n": 7 } as CSSProperties}>
        <i>the</i>
        <span>Morning</span>
        <span>Joe</span>
      </h2>
      <ul className="breakfast">
        {ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="ltext">Breakfast for the office or the morning after, delivered.</p>
      <div className="links">
        <a href={MORNING_JOE_URL} target="_blank" rel="noopener noreferrer">
          Order on ezCater
        </a>
      </div>
    </section>
  );
}
