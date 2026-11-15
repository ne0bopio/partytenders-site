const YEARS = ["2019", "2020", "2021", "2023"] as const;

function leaf(x: number, y: number, rotation: number, key: string) {
  return (
    <ellipse
      key={key}
      cx={x}
      cy={y}
      rx={4.2}
      ry={9}
      transform={`rotate(${rotation} ${x} ${y})`}
      fill="currentColor"
    />
  );
}

function Laurel({ year }: { year: string }) {
  const leaves = [];
  for (let i = 0; i < 7; i += 1) {
    const angle = ((200 - i * 19) * Math.PI) / 180;
    const x = 60 + Math.cos(angle) * 42;
    const y = 62 - Math.sin(angle) * 42;
    const rotation = -(200 - i * 19) + 90 + 180;
    leaves.push(leaf(x, y, rotation, `${year}-l-${i}`));
    leaves.push(leaf(120 - x, y, -rotation, `${year}-r-${i}`));
  }

  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={`Best of The Bash ${year}`}>
      {leaves}
      <text
        x="60"
        y="58"
        textAnchor="middle"
        fontSize="13"
        style={{ fontSize: "13px", letterSpacing: "0.08em" }}
      >
        BEST OF
      </text>
      <text x="60" y="84" textAnchor="middle">
        {year}
      </text>
    </svg>
  );
}

export function Laurels() {
  return (
    <div className="laurels" id="laurels">
      {YEARS.map((year) => (
        <Laurel key={year} year={year} />
      ))}
    </div>
  );
}
