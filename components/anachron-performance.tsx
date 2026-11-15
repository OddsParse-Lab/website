"use client";

import { useEffect, useState } from "react";
import { fetchAnachronStats, type AnachronStats } from "@/lib/anachron-stats";
import { AnachronChart } from "./anachron-chart";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const datetime = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" });
const number = new Intl.NumberFormat("en-US");
type State = { data: AnachronStats | null; status: "loading" | "ready" | "error" };

export function AnachronPerformance({ active }: { active: boolean }) {
  const [{ data, status }, setState] = useState<State>({ data: null, status: "loading" });
  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;
    async function refresh() {
      if (controller || document.hidden) return;
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(() => request.abort(), 10000);
      try {
        const result = await fetchAnachronStats(request.signal);
        if (!disposed) setState({ data: result, status: "ready" });
      } catch {
        if (!disposed) setState(previous => ({ ...previous, status: "error" }));
      } finally {
        clearTimeout(timeout);
        controller = null;
      }
    }
    void refresh();
    const interval = setInterval(() => { void refresh(); }, 60000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { disposed = true; controller?.abort(); clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  return <div className="anachron-performance">
    <figure className="anachron-figure" aria-labelledby="anachron-curve-label">
      <figcaption className="anachron-chart-heading" id="anachron-curve-label">
        <span>Settled performance</span>
        <span>{data ? <>Since <time dateTime={data.liveSince}>{date.format(new Date(data.liveSince))}</time></> : "Since inception"}</span>
      </figcaption>
      <div className="anachron-chart">
        {data?.curve.length ? active && <AnachronChart points={data.curve} /> : <div className="anachron-chart-empty" role="status">
          <span>{status === "loading" ? "Loading performance…" : data ? "No settled results yet." : "Performance temporarily unavailable."}</span>
        </div>}
      </div>
    </figure>
    <dl className="anachron-metrics">
      <div><dt>Maximum drawdown</dt><dd>{data?.maxDrawdown != null ? <>{data.maxDrawdown.toFixed(1)}<span>%</span></> : "—"}</dd></div>
      <div><dt title="Annualized from daily returns on capital using √365; at least two completed UTC days required.">Sharpe ratio</dt><dd>{data?.sharpeRatio != null ? data.sharpeRatio.toFixed(2) : <span className="anachron-pending" aria-label="Not yet available">—</span>}</dd></div>
      <div><dt>Markets settled</dt><dd>{data ? number.format(data.marketsSettled) : "—"}</dd></div>
    </dl>
    <div className="project-note anachron-note"><p>
      <span role="status">{data ? <>{status === "error" ? "Update unavailable · Last data " : "Data through "}<time dateTime={data.dataThrough}>{datetime.format(new Date(data.dataThrough))} UTC</time> · 1h delay</> : status === "error" ? "Retrying automatically." : "Fetching live statistics…"}</span>
    </p></div>
  </div>;
}
