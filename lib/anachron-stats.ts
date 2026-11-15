export const ANACHRON_STATS_URL = "https://echo.oddsparse.trade/api/anachron-stats";

export type AnachronStats = {
  curve: { x: number; y: number }[];
  maxDrawdown: number | null;
  sharpeRatio: number | null;
  sharpeDays: number;
  marketsSettled: number;
  venues: string[];
  liveSince: string;
  updatedAt: string;
  dataThrough: string;
};

function timestamp(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new Error("Invalid performance timestamp");
  }
  return value;
}

function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Invalid performance number");
  return value;
}

function count(value: unknown): number {
  const result = number(value);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error("Invalid performance count");
  return result;
}

export function parseAnachronStats(value: unknown): AnachronStats {
  if (!value || typeof value !== "object") throw new Error("Invalid Anachron data");
  const data = value as Record<string, unknown>;
  const updatedAt = timestamp(data.updated_at), dataThrough = timestamp(data.data_through);
  if (typeof data.live_since !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.live_since) ||
      !Number.isFinite(Date.parse(data.live_since)) || new Date(data.live_since).toISOString().slice(0, 10) !== data.live_since ||
      !Array.isArray(data.curve) || !Array.isArray(data.venues) || !data.venues.every(venue => typeof venue === "string" && venue.trim())) {
    throw new Error("Invalid Anachron history");
  }
  const dates = new Set<number>();
  // These are already normalized cumulative profit points, NOT percentage returns.
  // Keep their values and actual elapsed time; never renormalize or average them.
  const curve = data.curve.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Invalid curve point");
    const point = entry as Record<string, unknown>;
    const x = Date.parse(timestamp(point.t)), y = number(point.value);
    if (dates.has(x) || x > Date.parse(dataThrough) || x < Date.parse(data.live_since as string) || Math.abs(y) > 100.001) {
      throw new Error("Invalid curve point");
    }
    dates.add(x);
    return { x, y };
  }).sort((a, b) => a.x - b.x);
  const maxDrawdown = data.max_drawdown_pct === null ? null : number(data.max_drawdown_pct);
  if (maxDrawdown !== null && (maxDrawdown < 0 || maxDrawdown > 100)) throw new Error("Invalid drawdown");
  const sharpeDays = count(data.sharpe_days);
  const sharpeRatio = data.sharpe_ratio === null ? null : number(data.sharpe_ratio);
  return {
    curve, maxDrawdown, sharpeRatio: sharpeDays >= 2 ? sharpeRatio : null,
    sharpeDays, marketsSettled: count(data.markets_settled), venues: data.venues as string[],
    liveSince: data.live_since, updatedAt, dataThrough,
  };
}

export async function fetchAnachronStats(signal: AbortSignal): Promise<AnachronStats> {
  const response = await fetch(ANACHRON_STATS_URL, { signal, cache: "no-store", credentials: "omit" });
  if (!response.ok) throw new Error(`Anachron request failed: ${response.status}`);
  return parseAnachronStats(await response.json());
}
