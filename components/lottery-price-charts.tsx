"use client";

import { Chart as ChartJS, LinearScale, PointElement, LineElement, ScatterController, Tooltip, type ChartOptions, type Plugin } from "chart.js";
import { Scatter } from "react-chartjs-2";
import data from "@/content/posts/lottery-price-data.json";

ChartJS.register(LinearScale, PointElement, LineElement, ScatterController, Tooltip);

type ChartName = "payout" | "calibration";
const assets = ["BTC", "ETH"] as const;
const colors = ["#242424", "#858585"];
const font = { family: '"DM Sans", system-ui, sans-serif', size: 12 };
const titles = { payout: "The price of a long shot", calibration: "The gap to breaking even" };

export function LotteryPriceChart({ name, description }: { name: ChartName; description: string }) {
  const payout = name === "payout";
  const series = assets.map(asset => data[asset].fine.map(row => ({
    x: Number(row.price),
    y: payout ? row.net.value : row.win.value - row.breakeven,
    low: payout ? row.net.low : row.win.low - row.breakeven,
    high: payout ? row.net.high : row.win.high - row.breakeven,
  })));
  const baseline = payout ? 1 : 0;
  const bounds = series.flatMap(rows => rows.flatMap(row => [row.low, row.high]));
  const bands: Plugin<"scatter"> = {
    id: "lottery-intervals",
    beforeDatasetsDraw({ ctx, scales, chartArea }) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
      ctx.clip();
      series.forEach((rows, index) => {
        ctx.fillStyle = index === 0 ? "rgba(36,36,36,0.09)" : "rgba(133,133,133,0.10)";
        ctx.beginPath();
        rows.forEach((row, i) => {
          const x = scales.x.getPixelForValue(row.x), y = scales.y.getPixelForValue(row.high);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        [...rows].reverse().forEach(row => ctx.lineTo(scales.x.getPixelForValue(row.x), scales.y.getPixelForValue(row.low)));
        ctx.closePath();
        ctx.fill();
      });
      const y = scales.y.getPixelForValue(baseline);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#aaaaaa";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(chartArea.left, y); ctx.lineTo(chartArea.right, y); ctx.stroke();
      ctx.restore();
    },
  };
  const options: ChartOptions<"scatter"> = {
    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: { mode: "index", intersect: false, axis: "x" },
    layout: { padding: { top: 12, right: 8 } },
    scales: {
      x: {
        type: "linear", min: 1, max: 99, border: { display: false }, grid: { display: false },
        afterBuildTicks: scale => { scale.ticks = [1, 20, 40, 60, 80, 99].map(value => ({ value })); },
        ticks: { font, color: "#828282", padding: 10, maxRotation: 0 },
      },
      y: {
        min: payout ? 0 : Math.floor(Math.min(...bounds)),
        max: payout ? Math.ceil(Math.max(1.1, ...bounds) * 10) / 10 : Math.ceil(Math.max(0, ...bounds)),
        border: { display: false }, grid: { color: "#e9e9e9", drawTicks: false },
        ticks: { font, color: "#828282", padding: 10, maxTicksLimit: 6, callback: value => payout ? "$" + Number(value).toFixed(2) : value + " pp" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#222222", titleColor: "#ffffff", bodyColor: "#f5f5f5",
        titleFont: font, bodyFont: font, padding: 12, cornerRadius: 7,
        bodySpacing: 6, boxWidth: 7, boxHeight: 7,
        callbacks: {
          title: items => "Entry price: " + items[0]?.parsed.x + "¢",
          label: item => {
            const point = series[item.datasetIndex][item.dataIndex];
            const format = (n: number) => payout ? "$" + n.toFixed(3) : n.toFixed(2) + " pp";
            return [item.dataset.label + ": " + format(point.y), "90% interval: " + format(point.low) + " to " + format(point.high)];
          },
        },
      },
    },
  };
  return <div className="research-chart" data-chart={"lottery-" + name}>
    <h3>{titles[name]}</h3>
    <p className="research-chart-unit">{payout ? "Settlement payout per $1 spent, including modeled fees" : "Observed win rate minus fee-inclusive breakeven · percentage points"}</p>
    <div className="research-chart-legend">
      {assets.map((asset, i) => <span key={asset}><i style={{ borderColor: colors[i], borderTopStyle: i ? "dashed" : "solid" }} />{asset}</span>)}
      <span><i style={{ borderColor: "#aaaaaa", borderTopStyle: "dashed" }} />{payout ? "$1 = break even" : "0 = break even"}</span>
    </div>
    <div className="research-chart-plot">
      <Scatter options={options} plugins={[bands]} data={{ datasets: series.map((rows, i) => ({
        label: assets[i], data: rows, showLine: true, borderColor: colors[i], backgroundColor: colors[i],
        borderWidth: 2, borderDash: i ? [5, 4] : [], pointRadius: 0, pointHoverRadius: 4,
        pointHitRadius: 10, tension: 0,
      })) }} role="img" aria-label={description} />
    </div>
    <p className="research-chart-axis">Entry price · cents</p>
    <div className="sr-only"><table>
      <caption>{titles[name]} — estimates and 90% day-bootstrap intervals</caption>
      <thead><tr><th scope="col">Price (¢)</th><th scope="col">BTC</th><th scope="col">ETH</th></tr></thead>
      <tbody>{series[0].map((row, i) => <tr key={row.x}><th scope="row">{row.x}</th>{series.map((rows, j) => <td key={j}>{rows[i].y.toFixed(3)} [{rows[i].low.toFixed(3)}, {rows[i].high.toFixed(3)}]{payout ? " dollars per dollar" : " percentage points"}</td>)}</tr>)}</tbody>
    </table></div>
  </div>;
}
