export const BALLAST_STATS_URL = "https://echo.oddsparse.trade/api/ballast-stats";

export type BallastStats = {
  averageDailyReturn: number | null;
  sharpeRatio: number | null;
  decisionLatency: number | null;
  contractsTraded: number | null;
  liveSince: string;
  updatedAt: string;
};

function metric(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Invalid Ballast metric");
  return value;
}

export function parseBallastStats(value: unknown): BallastStats {
  if (!value || typeof value !== "object") throw new Error("Invalid Ballast data");
  const data = value as Record<string, unknown>;
  if (typeof data.updated_at !== "string" || !Number.isFinite(Date.parse(data.updated_at)) ||
      typeof data.live_since !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.live_since) ||
      !Number.isFinite(Date.parse(data.live_since)) || new Date(data.live_since).toISOString().slice(0, 10) !== data.live_since ||
      typeof data.sharpe_days !== "number" || !Number.isSafeInteger(data.sharpe_days) || data.sharpe_days < 0) {
    throw new Error("Invalid Ballast reporting period");
  }
  const latency = data.decision_latency_us;
  if (latency !== null && (typeof latency !== "object" || !latency)) throw new Error("Invalid Ballast latency");
  const decisionLatency = latency === null ? null : metric((latency as Record<string, unknown>).p50);
  const contractsTraded = metric(data.contracts_traded);
  if ((decisionLatency !== null && decisionLatency < 0) ||
      (contractsTraded !== null && (!Number.isSafeInteger(contractsTraded) || contractsTraded < 0))) {
    throw new Error("Invalid Ballast execution metric");
  }
  const sharpeRatio = metric(data.sharpe_ratio);
  return {
    // Use the API's completed-day average; percentages and microseconds are already in display units.
    averageDailyReturn: metric(data.average_daily_return_pct),
    sharpeRatio: data.sharpe_days >= 2 ? sharpeRatio : null,
    decisionLatency, contractsTraded, liveSince: data.live_since, updatedAt: data.updated_at,
  };
}

export async function fetchBallastStats(signal: AbortSignal): Promise<BallastStats> {
  const response = await fetch(BALLAST_STATS_URL, { signal, cache: "no-store", credentials: "omit" });
  if (!response.ok) throw new Error(`Ballast request failed: ${response.status}`);
  return parseBallastStats(await response.json());
}
