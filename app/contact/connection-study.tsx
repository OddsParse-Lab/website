"use client";

import { useEffect, useRef } from "react";
import styles from "./contact.module.css";

type Point = [number, number, number];
const ROTATION_DURATION = 120_000;
const TILT = .78;
const ROLL = -.36;
const cosTilt = Math.cos(TILT);
const sinTilt = Math.sin(TILT);
const cosRoll = Math.cos(ROLL);
const sinRoll = Math.sin(ROLL);

function sample(angle: number, width: number): Point {
  const radius = 1 + width * Math.cos(angle / 2);
  return [radius * Math.cos(angle), radius * Math.sin(angle), width * Math.sin(angle / 2)];
}

// Cache the surface in 3D; each frame only rotates and projects its points.
const contours = Array.from({ length: 15 }, (_, index) =>
  Array.from({ length: 181 }, (_, step) => sample(step * Math.PI / 90, -.38 + index * .76 / 14))
);
const crosslines = Array.from({ length: 48 }, (_, index) => {
  const angle = index * Math.PI / 24;
  return [sample(angle, -.38), sample(angle, .38)];
});
const lines = [...contours, ...crosslines];

function projectPaths(angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return lines.map(points => points.map(([x, y, z], index) => {
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    const projectedY = ry * cosTilt - z * sinTilt;
    const px = 320 + 173 * (rx * cosRoll - projectedY * sinRoll);
    const py = 180 + 173 * (rx * sinRoll + projectedY * cosRoll);
    return `${index ? "L" : "M"}${px.toFixed(2)},${py.toFixed(2)}`;
  }).join(" "));
}

const initialPaths = projectPaths(0);

export function ConnectionStudy() {
  const surfaceRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = surfaceRef.current;
    if (!svg) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const paths = svg.querySelectorAll<SVGPathElement>("[data-connection-line]");
    let frame = 0;
    let previous: number | null = null;
    let elapsed = 0;

    function animate(time: number) {
      if (previous !== null) elapsed = (elapsed + Math.min(time - previous, 100)) % ROTATION_DURATION;
      previous = time;
      const projected = projectPaths(elapsed / ROTATION_DURATION * Math.PI * 2);
      paths.forEach((path, index) => path.setAttribute("d", projected[index]));
      frame = requestAnimationFrame(animate);
    }

    function syncMotion() {
      cancelAnimationFrame(frame);
      previous = null;
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

  return <svg ref={surfaceRef} className={styles.study} viewBox="0 0 640 360" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth=".8">
      {initialPaths.map((path, index) => <path
        key={index}
        data-connection-line
        d={path}
        opacity={index >= contours.length ? .3 : index === 0 || index === contours.length - 1 ? .9 : .58}
      />)}
    </g>
  </svg>;
}
