"use client";

import { useEffect, useRef } from "react";

type Point = [number, number, number];
const ROTATION_DURATION = 120_000;

// Rotate in world space before projecting so the surface retains its volume.
function project([x, y, z]: Point, angle = 0) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = x * cos - y * sin;
  const ry = x * sin + y * cos;
  return [480 + rx * 110 + ry * 58, 480 + ry * 34 - z * 290 - rx * 13];
}

// Cache the Gaussian samples; animation only updates their projected positions.
function curve(fixed: number, cross = false): Point[] {
  return Array.from({ length: 81 }, (_, i) => {
    const variable = -3.1 + i * 6.2 / 80;
    const x = cross ? fixed : variable;
    const y = cross ? variable : fixed;
    const z = Math.exp(-(x * x + y * y) / 2.5);
    return [x, y, z];
  });
}

function path(points: Point[], angle = 0) {
  return points.map((point, i) => {
    const [px, py] = project(point, angle);
    return `${i === 0 ? "M" : "L"}${px.toFixed(2)},${py.toFixed(2)}`;
  }).join(" ");
}

const curves = [false, true].flatMap(cross =>
  Array.from({ length: 23 }, (_, i) => curve(-3.1 + i * 6.2 / 22, cross))
);
const centralCurve = curve(0);
const axes: Point[][] = [
  [[-3.8, 0, 0], [3.8, 0, 0]],
  [[0, -3.8, 0], [0, 3.8, 0]],
  [[0, 0, 0], [0, 0, 1.34]],
];

function arrow(points: Point[], angle = 0) {
  const [sx, sy] = project(points[0], angle);
  const [x, y] = project(points[1], angle);
  const direction = Math.atan2(y - sy, x - sx);
  const dx = Math.cos(direction);
  const dy = Math.sin(direction);
  return `M${x - dx * 11 + dy * 5},${y - dy * 11 - dx * 5}L${x},${y}L${x - dx * 11 - dy * 5},${y - dy * 11 + dx * 5}`;
}

export function ResearchGraphic() {
  const surfaceRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = surfaceRef.current;
    if (!svg) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lines = svg.querySelectorAll<SVGPathElement>("[data-surface-line]");
    const axisLines = svg.querySelectorAll<SVGPathElement>("[data-axis-line]");
    const arrowheads = svg.querySelectorAll<SVGPathElement>("[data-axis-arrow]");
    const labels = svg.querySelectorAll<SVGTextElement>("[data-axis-label]");
    const samples = [...curves, centralCurve];
    let frame = 0;
    let previous = 0;
    let elapsed = 0;

    function animate(time: number) {
      if (previous) elapsed += Math.min(time - previous, 100);
      previous = time;
      const angle = elapsed / ROTATION_DURATION * Math.PI * 2;
      lines.forEach((line, index) => line.setAttribute("d", path(samples[index], angle)));
      axisLines.forEach((line, index) => line.setAttribute("d", path(axes[index], angle)));
      arrowheads.forEach((line, index) => line.setAttribute("d", arrow(axes[index], angle)));
      labels.forEach((label, index) => {
        const [x, y] = project(axes[index][1], angle);
        label.setAttribute("x", String(x + 12));
        label.setAttribute("y", String(y + 5));
      });
      frame = requestAnimationFrame(animate);
    }

    function syncMotion() {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!motion.matches && !document.hidden) frame = requestAnimationFrame(animate);
    }

    syncMotion();
    motion.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncMotion);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncMotion);
    };
  }, []);

  return <div className="research-art" aria-hidden="true">
    <svg className="construction-grid" viewBox="0 0 1400 850" preserveAspectRatio="xMidYMid slice" fill="none">
      <g stroke="currentColor" strokeWidth="1" strokeDasharray="2 4"><path d="M0 190H252V565M0 405H655V850M380 190H860M380 190V405M655 190V405" /><path d="M0 530H480" opacity=".5" /></g>
      <g fill="currentColor">{[[252,405],[252,565],[380,190],[655,190],[655,405],[480,530]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" />)}</g>
    </svg>
    <svg ref={surfaceRef} className="probability-surface" viewBox="0 0 1000 800" fill="none">
      <defs><linearGradient id="surface-fade" x1=".2" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#bdc2c5"/><stop offset="1" stopColor="#e2e5e6"/></linearGradient></defs>
      <g className="plot-axes" stroke="currentColor" strokeWidth="1.2">
        {axes.map((points, index) => <path key={`axis${index}`} data-axis-line d={path(points)} />)}
        {axes.map((points, index) => <path key={`arrow${index}`} data-axis-arrow d={arrow(points)} />)}
        <path d="M480 480v140" strokeDasharray="3 7"/>
      </g>
      <g stroke="url(#surface-fade)" strokeWidth="1.15">{curves.map((points, index) => <path key={index} data-surface-line d={path(points)} />)}</g>
      <path data-surface-line d={path(centralCurve)} stroke="#a3aaaf" strokeWidth="1.6" className="central-curve" />
      <circle cx="480" cy="190" r="4" fill="#a3aaaf" />
      <path d="M480 190v290" stroke="#b9bfc3" strokeDasharray="3 6" />
      <g fill="currentColor" className="plot-labels">
        {axes.slice(0, 2).map((points, index) => {
          const [x, y] = project(points[1]);
          return <text key={index} data-axis-label x={x + 12} y={y + 5}>{index === 0 ? "x" : "y"}</text>;
        })}
        <text x="466" y="77">p(x)</text><text x="498" y="499">0</text>
      </g>
    </svg>
  </div>;
}
