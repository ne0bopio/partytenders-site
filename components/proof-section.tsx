import { Laurels } from "@/components/laurels";

const VENUES = [
  "Gotham Hall",
  "Sailors' Snug Harbor",
  "The Ryland Inn",
  "Stone House",
  "Natirar",
] as const;

export function ProofSection() {
  return (
    <section className="proof w-night" id="proof" data-world="night">
      <Laurels />
      <p className="proof-k">Best of The Bash, four years</p>
      <p className="venues-k">Danielle has worked</p>
      <ul className="venues">
        {VENUES.map((venue) => (
          <li key={venue}>{venue}</li>
        ))}
      </ul>
    </section>
  );
}
