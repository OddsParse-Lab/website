const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/arb-profit.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function load(fetch) {
  const context = { exports: {}, fetch };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const day = (date, daily, cumulative, complete = true) => ({ date, daily_return_pct: daily, cumulative_return_pct: cumulative, complete });
const payload = days => ({ updated_at: '2026-10-06T00:49:33Z', days });
const example = payload([
  day('2026-10-04', 25.76, 25.76),
  day('2026-10-05', 16.04, 45.94),
  day('2026-10-06', 0.06, 46.02, false),
]);

test('averages completed days, excluding the partial day, without multiplying percentages', () => {
  const result = load().parseArbProfit({ ...example, average_daily_return_pct: 999 });
  assert.ok(Math.abs(result.averageDailyReturn - 20.9) < 1e-10);
  assert.equal(result.completedDays, 2);
  assert.equal(result.cumulativeReturn, 46.02);
});

test('reads latest cumulative return by date, independent of response order', () => {
  const result = load().parseArbProfit(payload([...example.days].reverse()));
  assert.equal(result.cumulativeReturn, 46.02);
  assert.equal(result.averageDailyReturn.toFixed(2), '20.90');
  assert.equal(result.startDate, '2026-10-04');
});

test('zero and negative completed returns participate in the arithmetic mean', () => {
  const result = load().parseArbProfit(payload([day('2026-10-01', 0, 0), day('2026-10-02', -10, -10)]));
  assert.equal(result.averageDailyReturn, -5);
  assert.equal(result.completedDays, 2);
  assert.equal(result.cumulativeReturn, -10);
  assert.equal(load().parseArbProfit(payload([day('2026-10-01', 0, 0)])).averageDailyReturn, 0);
});

test('empty and partial-only histories have no fabricated daily average', () => {
  assert.equal(load().parseArbProfit(payload([])).averageDailyReturn, null);
  assert.equal(load().parseArbProfit(payload([])).cumulativeReturn, null);
  assert.equal(load().parseArbProfit(payload([])).startDate, null);
  const result = load().parseArbProfit(payload([day('2026-10-06', 0.06, 46.02, false)]));
  assert.equal(result.averageDailyReturn, null);
  assert.equal(result.cumulativeReturn, 46.02);
});

test('rejects malformed and duplicated entries rather than biasing the average', () => {
  for (const value of [null, {}, payload([{ date: 'bad' }]), payload([day('2026-10-01', null, 1)]),
    payload([day('2026-10-01', '20', 1)]), payload([day('2026-10-01', Infinity, 1)]),
    payload([day('2026-10-01', 1, 1), day('2026-10-01', 2, 2)])]) {
    assert.throws(() => load().parseArbProfit(value));
  }
});

test('requests the API without credentials or cache and passes cancellation through', async () => {
  const signal = new AbortController().signal;
  const api = load(async (url, options) => {
    assert.equal(url, 'https://echo.oddsparse.trade/api/arb-profit');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => example };
  });
  assert.equal((await api.fetchArbProfit(signal)).averageDailyReturn.toFixed(2), '20.90');
});

test('HTTP failures and invalid JSON propagate instead of becoming zero returns', async () => {
  const signal = new AbortController().signal;
  await assert.rejects(load(async () => ({ ok: false, status: 503 })).fetchArbProfit(signal), /503/);
  await assert.rejects(load(async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } })).fetchArbProfit(signal), /Invalid JSON/);
});


test('uses the API cumulative field without substituting a compounded or average return', () => {
  const result = load().parseArbProfit(payload([
    day('2026-10-04', 47.98, 47.98),
    day('2026-10-05', 61.64, 109.62),
    day('2026-10-06', 2.55, 112.17, false),
  ]));
  assert.equal(result.averageDailyReturn.toFixed(2), '54.81');
  assert.equal(result.cumulativeReturn, 112.17);
  assert.equal(result.startDate, '2026-10-04');
});
