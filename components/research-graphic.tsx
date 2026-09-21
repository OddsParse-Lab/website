// A projected Gaussian probability surface: mathematical geometry, not market data.
function project(x: number, y: number, z: number) {
  return [480 + x * 110 + y * 58, 480 + y * 34 - z * 290 - x * 13];
}

function curve(fixed: number, cross = false) {
  return Array.from({ length: 101 }, (_, i) => {
    const variable = -3.1 + i * 6.2 / 100;
    const x = cross ? fixed : variable;
    const y = cross ? variable : fixed;
    const z = Math.exp(-(x * x + y * y) / 2.5);
    const [px, py] = project(x, y, z);
    return `${i === 0 ? "M" : "L"}${px.toFixed(2)},${py.toFixed(2)}`;
  }).join(" ");
}

export function ResearchGraphic() {
  return <div className="research-art" aria-hidden="true">
    <svg className="construction-grid" viewBox="0 0 1400 850" preserveAspectRatio="xMidYMid slice" fill="none">
      <g stroke="currentColor" strokeWidth="1" strokeDasharray="2 4"><path d="M0 190H252V565M0 405H655V850M380 190H860M380 190V405M655 190V405" /><path d="M0 530H480" opacity=".5" /></g>
      <g fill="currentColor">{[[252,405],[252,565],[380,190],[655,190],[655,405],[480,530]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" />)}</g>
    </svg>
    <svg className="probability-surface" viewBox="0 0 1000 800" fill="none">
      <defs><linearGradient id="surface-fade" x1=".2" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#bdc2c5"/><stop offset="1" stopColor="#e2e5e6"/></linearGradient></defs>
      <g className="plot-axes" stroke="currentColor" strokeWidth="1.2"><path d="M70 532 910 433M275 360 710 615M480 480V91"/><path d="m474 102 6-11 6 11M898 429l12 4-10 7M698 615h12l-6-11"/><path d="M480 480v140" strokeDasharray="3 7"/></g>
      <g stroke="url(#surface-fade)" strokeWidth="1.15">{Array.from({ length: 23 }, (_, i) => <path key={`x${i}`} d={curve(-3.1 + i * 6.2 / 22)} />)}{Array.from({ length: 23 }, (_, i) => <path key={`y${i}`} d={curve(-3.1 + i * 6.2 / 22, true)} />)}</g>
      <path d={curve(0)} stroke="#a3aaaf" strokeWidth="1.6" className="central-curve" />
      <circle cx="480" cy="190" r="4" fill="#a3aaaf" />
      <path d="M480 190v290" stroke="#b9bfc3" strokeDasharray="3 6" />
      <g fill="currentColor" className="plot-labels"><text x="922" y="438">x</text><text x="720" y="626">y</text><text x="466" y="77">p(x)</text><text x="498" y="499">0</text></g>
    </svg>
  </div>;
}
