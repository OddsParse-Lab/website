"use client";

import { useEffect, useMemo, useState } from "react";
import { Chart as ChartJS, LinearScale, LineController, LineElement, PointElement, Filler, Tooltip, type ChartOptions, type Plugin } from "chart.js";
import { Line } from "react-chartjs-2";
import type { AnachronStats } from "@/lib/anachron-stats";

ChartJS.register(LinearScale, LineController, LineElement, PointElement, Filler, Tooltip);

const FONT = '"DM Sans", Arial, sans-serif';
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const crosshair: Plugin<"line"> = {
  id: "anachron-crosshair",
  afterDatasetsDraw(chart) {
    const active = chart.getActiveElements()[0];
    if (!active) return;
    const { ctx, chartArea } = chart, { x } = active.element;
    ctx.save();
    ctx.strokeStyle = "#aeb3b6";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke();
    ctx.restore();
  },
};

export function AnachronChart({ points }: { points: AnachronStats["curve"] }) {
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const data = useMemo(() => ({ datasets: [{
    label: "Normalized settled P&L", data: points,
    borderColor: "#373d40", borderWidth: 1.8, borderCapStyle: "round" as const,
    borderJoinStyle: "round" as const, cubicInterpolationMode: "monotone" as const,
    fill: "origin", pointRadius: points.length === 1 ? 3 : 0,
    pointHoverRadius: 4, pointHoverBackgroundColor: "#373d40",
    pointHoverBorderColor: "#fff", pointHoverBorderWidth: 2, pointHitRadius: 16,
    backgroundColor: ({ chart }: { chart: ChartJS }) => {
      if (!chart.chartArea) return "transparent";
      const gradient = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
      gradient.addColorStop(0, "rgba(80, 90, 98, .12)");
      gradient.addColorStop(1, "rgba(80, 90, 98, 0)");
      return gradient;
    },
  }] }), [points]);
  const options = useMemo<ChartOptions<"line">>(() => {
    const first = points[0].x, last = points[points.length - 1].x;
    const intraday = last - first < 2 * 86400000;
    const low = points.reduce((min, point) => Math.min(min, point.y), 0);
    const high = points.reduce((max, point) => Math.max(max, point.y), 0);
    const minimum = Math.floor(low / 25) * 25, maximum = Math.ceil(high / 25) * 25 || (low === 0 ? 25 : 0);
    const yStep = maximum - minimum > 75 ? 50 : 25;
    const yTicks = new Set([minimum, maximum]);
    for (let value = Math.ceil(minimum / yStep) * yStep; value <= maximum; value += yStep) yTicks.add(value);
    const hours = [1, 3, 6, 12, 24, 48, 168, 336, 720, 2160, 8760];
    const xStep = (hours.find(hours => (last - first) / (hours * 3600000) <= 4) ?? 8760) * 3600000;
    const xTicks: number[] = [];
    for (let value = Math.ceil(first / xStep) * xStep; value <= last; value += xStep) xTicks.push(value);
    return {
      responsive: true, maintainAspectRatio: false, parsing: false, normalized: true,
      animation: reducedMotion ? false : { duration: 700, easing: "easeOutQuart" },
      transitions: { resize: { animation: { duration: 0 } } },
      interaction: { mode: "nearest", intersect: false, axis: "x" },
      layout: { padding: { top: 6, right: 4 } },
      scales: {
        x: { type: "linear", min: first, max: last === first ? first + 3600000 : last,
          afterBuildTicks: scale => { if (xTicks.length > 1) scale.ticks = xTicks.map(value => ({ value })); },
          border: { display: false }, grid: { display: false },
          ticks: { maxTicksLimit: 4, maxRotation: 0, color: "#949a9e", padding: 8, font: { family: FONT, size: 10 },
            callback: value => intraday ? time.format(Number(value)) : date.format(Number(value)) },
        },
        y: { type: "linear", position: "right", min: minimum, max: maximum,
          afterBuildTicks: scale => { scale.ticks = [...yTicks].sort((a, b) => a - b).map(value => ({ value })); },
          border: { display: false }, grid: { color: context => context.tick.value === 0 ? "#dce0e2" : "#eff1f2", drawTicks: false },
          ticks: { autoSkip: false, padding: 10, color: "#949a9e", font: { family: FONT, size: 10 }, callback: value => number.format(Number(value)) },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false, backgroundColor: "#24282b", titleColor: "#fff", bodyColor: "#d8dcde",
          titleFont: { family: FONT, size: 11, weight: 500 }, bodyFont: { family: FONT, size: 11 },
          padding: 10, cornerRadius: 5, caretSize: 4,
          callbacks: {
            title: items => items.length ? `${date.format(items[0].parsed.x!)} · ${time.format(items[0].parsed.x!)} UTC` : "",
            label: item => `Normalized P&L  ${number.format(item.parsed.y!)}`,
          },
        },
      },
    };
  }, [points, reducedMotion]);
  return <Line data={data} options={options} plugins={[crosshair]} role="img"
    aria-label={`Anachron cumulative settled profit on a normalized scale, from ${date.format(points[0].x)} to ${date.format(points[points.length - 1].x)}. Not a percentage return.`} />;
}
