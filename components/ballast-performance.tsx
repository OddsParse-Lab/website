"use client";

import { useEffect, useState } from "react";
import { fetchBallastStats, type BallastStats } from "@/lib/ballast-stats";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const datetime = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
type State = { data: BallastStats | null; status: "loading" | "ready" | "error" };

export function BallastPerformance() {
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
        const result = await fetchBallastStats(request.signal);
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

  return <div className="ballast-performance">
    <dl className="ballast-metrics">
      <div><dt>Average daily return</dt><dd>{data?.averageDailyReturn != null ? <>{data.averageDailyReturn.toFixed(2)}<span>%</span></> : "—"}</dd></div>
      <div><dt title="Annualized from completed days’ returns on peak capital in use, using √365.">Sharpe ratio</dt><dd>{data?.sharpeRatio != null ? data.sharpeRatio.toFixed(2) : "—"}</dd></div>
      <div><dt>Decision latency · p50</dt><dd>{data?.decisionLatency != null ? <>{number.format(data.decisionLatency)}<span>μs</span></> : "—"}</dd></div>
      <div><dt>Contracts traded</dt><dd>{data?.contractsTraded != null ? number.format(data.contractsTraded) : "—"}</dd></div>
    </dl>
    <div className="project-note"><p>
      Daily return is based on realized profit relative to peak capital in use that day.<br />
      <span role="status">{data ? <>
        Since <time dateTime={data.liveSince}>{date.format(new Date(data.liveSince))}</time> · {status === "error" ? "Update unavailable · Last data " : "Updated "}
        <time dateTime={data.updatedAt}>{datetime.format(new Date(data.updatedAt))} UTC</time>
      </> : status === "loading" ? "Fetching live statistics…" : "Performance temporarily unavailable. Retrying automatically."}</span>
    </p></div>
  </div>;
}
