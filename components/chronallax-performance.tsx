"use client";

import { useEffect, useState } from "react";
import { fetchArbProfit, type ArbPerformance } from "@/lib/arb-profit";

type PerformanceState = { data: ArbPerformance | null; status: "loading" | "ready" | "error" };

export function ChronallaxPerformance() {
  const [{ data, status }, setState] = useState<PerformanceState>({ data: null, status: "loading" });

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;
    let requestTimeout: ReturnType<typeof setTimeout>;

    async function refresh() {
      if (controller || document.hidden) return;
      controller = new AbortController();
      requestTimeout = setTimeout(() => controller?.abort(), 10_000);
      try {
        const result = await fetchArbProfit(controller.signal);
        if (!disposed) setState({ data: result, status: "ready" });
      } catch {
        if (!disposed) setState(previous => ({ ...previous, status: "error" }));
      } finally {
        clearTimeout(requestTimeout);
        controller = null;
      }
    }

    void refresh();
    const interval = setInterval(() => { void refresh(); }, 60_000);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      clearInterval(interval);
      clearTimeout(requestTimeout);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const average = data?.averageDailyReturn;
  const startDate = data?.startDate;
  const since = startDate ? new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${startDate}T00:00:00Z`)) : null;
  const updated = data ? new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC",
  }).format(new Date(data.updatedAt)) : null;
  const caption = average != null
    ? null
    : status === "loading" ? "Loading performance data…"
    : data ? "No completed daily results yet." : "Performance data temporarily unavailable.";

  return <>
    <div className="chronallax-result" aria-live="polite" aria-atomic="true">
      <div className="chronallax-returns">
        <div>
          <span className="result-label">Average daily return</span>
          <p className="result-number">{average != null ? <>{average.toFixed(2)}<span>%</span></> : "—"}</p>
          {caption && <span className="result-caption">{caption}</span>}
        </div>
        <div>
          <span className="result-label">Cumulative return</span>
          <p className="result-number">{data?.cumulativeReturn != null ? <><span className="result-approx">≈</span>{data.cumulativeReturn.toFixed(0)}<span>%</span></> : "—"}</p>
          {startDate && <span className="result-caption">Since <time dateTime={startDate}>{since}</time> · to date</span>}
        </div>
      </div>
    </div>
    <dl className="chronallax-metrics">
      <div><dt>Decision latency · p50</dt><dd>39.3 <span>μs</span></dd></div>
      <div><dt>End-to-end order latency · p50</dt><dd>3.4 <span>ms</span></dd></div>
      <div><dt>Markets monitored in parallel</dt><dd>65,297</dd></div>
    </dl>
    <div className="project-note" aria-live="polite"><p>
      Daily return is based on realized profit relative to peak capital in use that day.<br />
      <span>{status === "error"
        ? data ? `Update unavailable · Last data ${updated} UTC` : "Unable to load live returns. Retrying automatically."
        : data ? <>Updated <time dateTime={data.updatedAt}>{updated} UTC</time></> : "Fetching live returns…"}</span>
    </p></div>
  </>;
}
