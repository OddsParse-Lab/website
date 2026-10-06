export const ARB_PROFIT_URL = "https://echo.oddsparse.trade/api/arb-profit";

export type ArbPerformance = {
  averageDailyReturn: number | null;
  cumulativeReturn: number | null;
  completedDays: number;
  startDate: string | null;
  updatedAt: string;
};

type Day = { date: string; daily_return_pct: number; cumulative_return_pct: number; complete: boolean };

// Values from this API are already percentages. Average completed UTC days only;
// a partial current day is still included in the latest cumulative figure.
export function parseArbProfit(value: unknown): ArbPerformance {
  if (!value || typeof value !== "object") throw new Error("Invalid performance data");
  const payload = value as Record<string, unknown>;
  if (!Array.isArray(payload.days) || typeof payload.updated_at !== "string" || !Number.isFinite(Date.parse(payload.updated_at))) {
    throw new Error("Invalid performance data");
  }
  const dates = new Set<string>();
  const days: Day[] = payload.days.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Invalid daily result");
    const day = entry as Record<string, unknown>;
    if (typeof day.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(Date.parse(day.date)) ||
        typeof day.daily_return_pct !== "number" || !Number.isFinite(day.daily_return_pct) ||
        typeof day.cumulative_return_pct !== "number" || !Number.isFinite(day.cumulative_return_pct) ||
        typeof day.complete !== "boolean" || dates.has(day.date)) {
      throw new Error("Invalid daily result");
    }
    dates.add(day.date);
    return day as Day;
  }).sort((a, b) => a.date.localeCompare(b.date));
  const completed = days.filter(day => day.complete);
  return {
    averageDailyReturn: completed.length ? completed.reduce((sum, day) => sum + day.daily_return_pct / completed.length, 0) : null,
    cumulativeReturn: days.length ? days[days.length - 1].cumulative_return_pct : null,
    completedDays: completed.length,
    startDate: days.length ? days[0].date : null,
    updatedAt: payload.updated_at,
  };
}

export async function fetchArbProfit(signal: AbortSignal): Promise<ArbPerformance> {
  const response = await fetch(ARB_PROFIT_URL, { signal, cache: "no-store", credentials: "omit" });
  if (!response.ok) throw new Error(`Performance request failed: ${response.status}`);
  return parseArbProfit(await response.json());
}
