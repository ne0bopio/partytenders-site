import { Fragment } from "react";

const WORDS = [
  "Bartenders",
  "Servers",
  "Grill cooks",
  "Catering",
  "Rentals",
  "Mixer packages",
] as const;

function Star() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 0l2.4 6.3L19 5l-4.6 5L19 15l-6.6-1.3L10 20l-2.4-6.3L1 15l4.6-5L1 5l6.6 1.3z"
      />
    </svg>
  );
}

export function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="tk-track" id="ticker">
        {[0, 1, 2, 3].map((run) => (
          <Fragment key={run}>
            {WORDS.map((word) => (
              <Fragment key={`${run}-${word}`}>
                <span>{word}</span>
                <Star />
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
