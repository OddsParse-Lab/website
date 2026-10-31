"use client";

import { Chart as ChartJS, LinearScale, CategoryScale, PointElement, LineElement, BarElement, ScatterController, BarController, Tooltip, type ChartOptions, type ChartDataset, type Plugin } from "chart.js";
import { Scatter, Bar } from "react-chartjs-2";
import data from "@/content/posts/spotlag-charts.json";

ChartJS.register(LinearScale, CategoryScale, PointElement, LineElement, BarElement, ScatterController, BarController, Tooltip);

export type SpotlagChartName = "response" | "repricing" | "replay-ev" | "disagreement" | "tails";
type Point = { x: number; y: number };
const INK = "#242424", LIGHT = "#b2b2b2", MID = "#747474";
const FONT = '"DM Sans", system-ui, sans-serif';
const tickFont = { family: FONT, size: 12 };
const titles: Record<SpotlagChartName, string> = {
  response: "The book moved before the signal",
  repricing: "When quotes repriced",
  "replay-ev": "Little room after fees",
  disagreement: "A larger gap was not a better signal",
  tails: "More uncertainty than the model allowed",
};

function chrome() {
  return {
    responsive: true, maintainAspectRatio: false, animation: false as const,
    interaction: { mode: "index" as const, intersect: false, axis: "x" as const },
    layout: { padding: { top: 12, right: 8 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#222222", titleColor: "#ffffff", bodyColor: "#f5f5f5",
        titleFont: { family: FONT, size: 12, weight: 500 as const },
        bodyFont: { family: FONT, size: 12 },
        padding: 12, cornerRadius: 7, bodySpacing: 6,
        boxWidth: 7, boxHeight: 7, boxPadding: 5, usePointStyle: true,
      },
    },
  };
}

function options(xTitle: string, unit: string): ChartOptions<"scatter"> {
  const base = chrome();
  return {
    ...base,
    scales: {
      x: { type: "linear", border: { display: false }, grid: { display: false }, ticks: { color: "#828282", font: tickFont, maxTicksLimit: 6, padding: 10 } },
      y: { border: { display: false }, grid: { color: "#e9e9e9", drawTicks: false }, ticks: { color: "#828282", font: tickFont, maxTicksLimit: 5, padding: 10 } },
    },
    plugins: { ...base.plugins, tooltip: { ...base.plugins.tooltip, callbacks: {
      title: items => `${xTitle}: ${items[0]?.parsed.x ?? ""}`,
      label: item => `${item.dataset.label}: ${(item.parsed.y ?? 0).toFixed(2)}${unit}`,
    } } },
  };
}

function line(label: string, points: Point[], color: string, dash: number[] = []): ChartDataset<"scatter"> {
  return { label, data: points, showLine: true, borderColor: color, backgroundColor: color, borderWidth: 2, borderDash: dash, pointRadius: 0, pointHoverRadius: 5, pointHitRadius: 12, tension: 0 };
}

function reference(label?: string): Plugin<"scatter"> {
  return {
    id: "reference-rule",
    beforeDatasetsDraw(chart) {
      const x = chart.scales.x.getPixelForValue(0);
      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.strokeStyle = "#c2c2c2"; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, chartArea.top); ctx.lineTo(x, chartArea.bottom); ctx.stroke();
      if (label) {
        ctx.fillStyle = "#808080"; ctx.font = `11px ${FONT}`;
        ctx.fillText(label, Math.min(x + 7, chartArea.right - ctx.measureText(label).width), chartArea.top + 9);
      }
      ctx.restore();
    },
  };
}

const intervals: Plugin<"scatter"> = {
  id: "confidence-intervals",
  beforeDatasetsDraw(chart) {
    const { ctx, scales } = chart;
    ctx.save(); ctx.strokeStyle = "#929292"; ctx.lineWidth = 2;
    data.ev.forEach((row, index) => {
      const low = scales.x.getPixelForValue(row.low), high = scales.x.getPixelForValue(row.high), y = scales.y.getPixelForValue(index);
      ctx.beginPath(); ctx.moveTo(low, y); ctx.lineTo(high, y);
      ctx.moveTo(low, y - 6); ctx.lineTo(low, y + 6); ctx.moveTo(high, y - 6); ctx.lineTo(high, y + 6); ctx.stroke();
    });
    ctx.restore();
  },
};

function Legend({ items }: { items: [string, string, boolean?][] }) {
  return <div className="research-chart-legend">{items.map(([label, color, dashed]) => <span key={label}><i style={{ borderColor: color, borderTopStyle: dashed ? "dashed" : "solid" }} />{label}</span>)}</div>;
}

function ChartData({ name }: { name: SpotlagChartName }) {
  let headings: string[], rows: (string | number)[][];
  if (name === "response") {
    headings = ["Seconds", "Events (¢)", "Placebo (¢)"];
    rows = data.response.taus.map((x, i) => [x, data.response.curve_event[i].toFixed(3), data.response.curve_placebo[i].toFixed(3)]);
  } else if (name === "repricing") {
    headings = ["Seconds", "Events (%)", "Placebo (%)", "Excess (pp)"];
    rows = data.repricing.map(row => [row.time, row.event, row.placebo, row.excess]);
  } else if (name === "replay-ev") {
    headings = ["Entry", "n", "EV (¢)", "95% interval (¢)"];
    rows = data.ev.map(row => [row.label, row.n, row.mean, `${row.low} to ${row.high}`]);
  } else if (name === "disagreement") {
    headings = ["Gap (pp)", "n", "Model (%)", "Observed (%)", "Ask (%)", "Net (¢)"];
    rows = data.disagreement.map(row => [row.label, row.n, row.model.toFixed(1), row.actual.toFixed(1), row.ask.toFixed(1), row.pnl]);
  } else {
    headings = ["Normal quantile", "Observed error"];
    rows = data.tails.map(row => [row.x.toFixed(3), row.y.toFixed(3)]);
  }
  return <div className="sr-only">
      <table><caption>{titles[name]} data</caption><thead><tr>{headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, col) => <td key={col}>{value}</td>)}</tr>)}</tbody></table>
  </div>;
}

export function SpotlagChart({ name, description }: { name: SpotlagChartName; description: string }) {
  let chart;
  if (name === "response" || name === "repricing") {
    const response = name === "response";
    const datasets = response ? [
      line("Events", data.response.taus.map((x, i) => ({ x, y: data.response.curve_event[i] })), INK),
      line("Placebo", data.response.taus.map((x, i) => ({ x, y: data.response.curve_placebo[i] })), LIGHT, [5, 4]),
    ] : [
      line("Events", data.repricing.map(row => ({ x: row.time, y: row.event })), INK),
      line("Placebo", data.repricing.map(row => ({ x: row.time, y: row.placebo })), LIGHT, [5, 4]),
      line("Excess (pp)", data.repricing.map(row => ({ x: row.time, y: row.excess })), MID, [2, 4]),
    ];
    const config = options("Seconds", response ? "¢" : "%");
    config.scales!.y = { ...config.scales!.y, min: response ? -.25 : 0, max: response ? 5 : 105, afterBuildTicks: scale => { scale.ticks = (response ? [0, 1, 2, 3, 4, 5] : [0, 25, 50, 75, 100]).map(value => ({ value })); } };
    config.scales!.x = { ...config.scales!.x, min: response ? -2 : -1, max: 3 };
    if (!response) config.plugins!.tooltip!.callbacks!.label = item => `${item.dataset.label}: ${item.parsed.y}${item.datasetIndex === 2 ? " pp" : "%"}`;
    chart = <>
      <p className="research-chart-unit">{response ? "Directional price change · ¢" : "Repriced share · % / excess · pp"}</p>
      <Legend items={response ? [["Events", INK], ["Placebo", LIGHT, true]] : [["Events", INK], ["Placebo", LIGHT, true], ["Excess", MID, true]]} />
      <div className="research-chart-plot"><Scatter data={{ datasets }} options={config} plugins={[reference("Index received")]} role="img" aria-label={description} /></div>
      <p className="research-chart-axis">Seconds relative to index receipt</p>
    </>;
  } else if (name === "replay-ev") {
    const config = options("EV", "¢");
    config.interaction = { mode: "nearest", intersect: false, axis: "y" };
    config.scales!.x = { ...config.scales!.x, min: -.8, max: .8, afterBuildTicks: scale => { scale.ticks = [-.8, -.4, 0, .4, .8].map(value => ({ value })); }, ticks: { font: tickFont, color: "#828282", autoSkip: false, maxRotation: 0, padding: 10 } };
    config.scales!.y = { ...config.scales!.y, min: -.5, max: 2.5, reverse: true, afterBuildTicks: scale => { scale.ticks = [0, 1, 2].map(value => ({ value })); }, grid: { display: false }, ticks: { font: tickFont, color: "#747474", stepSize: 1, autoSkip: false, callback: value => data.ev[Number(value)]?.label ?? "" } };
    config.plugins!.tooltip!.callbacks = {
      title: items => data.ev[items[0].dataIndex].label,
      label: item => { const row = data.ev[item.dataIndex]; return [`EV: ${row.mean > 0 ? "+" : ""}${row.mean.toFixed(2)}¢`, `95% CI: ${row.low.toFixed(2)} to ${row.high.toFixed(2)}¢`, `n = ${row.n.toLocaleString("en-US")}`]; },
    };
    config.plugins!.tooltip!.displayColors = false;
    chart = <>
      <p className="research-chart-unit">Mean and 95% confidence interval</p>
      <div className="research-chart-plot research-chart-plot-ev"><Scatter data={{ datasets: [{ label: "Fee-adjusted EV", data: data.ev.map((row, y) => ({ x: row.mean, y })), backgroundColor: INK, borderColor: "#ffffff", borderWidth: 2, pointRadius: 6, pointHoverRadius: 8 }] }} options={config} plugins={[reference(), intervals]} role="img" aria-label={description} /></div>
      <p className="research-chart-axis">Fee-adjusted EV per contract · ¢</p>
    </>;
  } else if (name === "disagreement") {
    const config = options("Gap", "%");
    config.scales!.x = { ...config.scales!.x, min: -.5, max: 5.5, ticks: { display: false } };
    config.scales!.y = { ...config.scales!.y, min: 45, max: 100, afterFit: scale => { scale.width = 44; } };
    config.plugins!.tooltip!.callbacks!.title = items => `Gap: ${data.disagreement[items[0].dataIndex].label} pp`;
    const base = chrome();
    const barOptions: ChartOptions<"bar"> = {
      ...base,
      scales: {
        x: { border: { display: false }, grid: { display: false }, ticks: { font: { ...tickFont, size: 11 }, color: "#828282", maxRotation: 0, minRotation: 0, autoSkip: false } },
        y: { min: -20, max: 10, afterFit: scale => { scale.width = 44; }, border: { display: false }, grid: { color: "#e9e9e9", drawTicks: false }, ticks: { font: tickFont, color: "#828282", padding: 10, stepSize: 10 } },
      },
      plugins: { ...base.plugins, tooltip: { ...base.plugins.tooltip, displayColors: false, callbacks: {
        title: items => `Gap: ${items[0].label} pp`,
        label: item => [`Modeled net: ${item.parsed.y?.toFixed(2)}¢`, `n = ${data.disagreement[item.dataIndex].n.toLocaleString("en-US")}`],
      } } },
    };
    chart = <>
      <p className="research-chart-unit">Probability / price · %</p>
      <Legend items={[["Model", INK], ["Observed", MID, true], ["Ask", LIGHT, true]]} />
      <div className="research-chart-plot"><Scatter data={{ datasets: [
        line("Model", data.disagreement.map((r, x) => ({ x, y: r.model })), INK),
        line("Observed", data.disagreement.map((r, x) => ({ x, y: r.actual })), MID, [5, 4]),
        line("Ask", data.disagreement.map((r, x) => ({ x, y: r.ask })), LIGHT, [2, 4]),
      ] }} options={config} role="img" aria-label={description} /></div>
      <p className="research-chart-unit research-chart-subplot">Modeled net per contract · ¢</p>
      <div className="research-chart-plot research-chart-plot-bar"><Bar data={{ labels: data.disagreement.map(row => row.label), datasets: [{ label: "Modeled net", data: data.disagreement.map(row => row.pnl), backgroundColor: data.disagreement.map(row => row.pnl >= 0 ? INK : "#b2b2b2"), borderRadius: 3, maxBarThickness: 30 }] }} options={barOptions} role="img" aria-label="Modeled net profit by model-minus-ask gap; the 15–20 point bucket loses 15.49 cents per contract." /></div>
      <p className="research-chart-axis">Model probability minus ask · percentage points</p>
    </>;
  } else {
    const config = options("Normal quantile", "");
    config.interaction = { mode: "nearest", intersect: false };
    config.scales!.x = { ...config.scales!.x, min: -3.2, max: 3.2 };
    config.scales!.y = { ...config.scales!.y, min: -9, max: 4 };
    config.plugins!.tooltip!.filter = item => item.datasetIndex === 0;
    config.plugins!.tooltip!.callbacks = {
      title: items => `Normal quantile: ${items[0]?.parsed.x?.toFixed(2)}`,
      label: item => `Observed error: ${item.parsed.y?.toFixed(3)}`,
    };
    chart = <>
      <p className="research-chart-unit">Standardized settlement error · 278 markets</p>
      <Legend items={[["Observed", INK], ["Normal reference", LIGHT, true]]} />
      <div className="research-chart-plot"><Scatter data={{ datasets: [
        { label: "Observed", data: data.tails, backgroundColor: "#242424a6", pointRadius: 3, pointHoverRadius: 6, pointHitRadius: 8 },
        { ...line("Normal reference", [{ x: -3.2, y: -3.2 }, { x: 3.2, y: 3.2 }], LIGHT, [5, 4]), pointHoverRadius: 0 },
      ] }} options={config} role="img" aria-label={description} /></div>
      <p className="research-chart-axis">Standard normal quantile</p>
    </>;
  }
  return <div className="research-chart" data-chart={name}>
    <h3>{titles[name]}</h3>
    {chart}
    <ChartData name={name} />
  </div>;
}
