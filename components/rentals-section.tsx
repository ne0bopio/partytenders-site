import type { CSSProperties } from "react";
import { NeedLink } from "@/components/need-link";

const INVENTORY: { name: string; note?: string }[] = [
  { name: "Portable bars" },
  { name: "Ice coolers", note: "1 to 50 qt" },
  { name: "Ice buckets", note: "with scoop" },
  { name: "Drink dispensers" },
  { name: "Linens" },
  { name: "Chafers", note: "with fuel" },
  { name: "Glassware" },
];

export function RentalsSection() {
  return (
    <section className="line w-night rentals" id="rentals" data-world="night">
      <p className="by">PartyTenders</p>
      <h2 className="lname" style={{ "--n": 7 } as CSSProperties}>
        <i>the</i>
        <span>Rentals</span>
      </h2>
      <ol className="inventory">
        {INVENTORY.map((item) => (
          <li key={item.name}>
            <span>{item.name}</span>
            {item.note ? <em>{item.note}</em> : null}
          </li>
        ))}
      </ol>
      <div
        className="sticker st-c"
        data-spin="1"
        style={{ "--spin": "-8" } as CSSProperties}
      >
        <span>
          15% off
          <br />
          your first
          <br />
          booking here
        </span>
      </div>
      <p className="ltext">
        First-time customers who book on the site get 15% off any rental or
        mixer package.
      </p>
      <div className="links">
        <NeedLink href="#quote" need="Rentals">
          Ask about rentals
        </NeedLink>
      </div>
    </section>
  );
}
