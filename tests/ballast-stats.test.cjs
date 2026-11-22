const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/ballast-stats.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function load(fetch) { const context = { exports: {}, fetch }; vm.runInNewContext(compiled, context); return context.exports; }
const sample = {
  live_since: '2026-11-17', updated_at: '2026-11-22T04:43:02Z',
  average_daily_return_pct: 1.38, cumulative_return_pct: 6.65, sharpe_ratio: 49.91, sharpe_days: 4,
  decision_latency_us: { p50: 111, p90: 155 }, contracts_traded: 299774,
  days: [{ date: '2026-11-22', daily_return_pct: 0.95, complete: false }],
};

test('uses the reported completed-day mean without adding the partial day or scaling display units', () => {
  const result = load().parseBallastStats(sample);
  assert.equal(result.averageDailyReturn, 1.38);
  assert.equal(result.sharpeRatio, 49.91);
  assert.equal(result.decisionLatency, 111);
  assert.equal(result.contractsTraded, 299774);
  assert.equal(result.liveSince, '2026-11-17');
  assert.equal(result.updatedAt, sample.updated_at);
});

test('distinguishes unavailable metrics from zero, and permits negative returns and Sharpe', () => {
  const api = load();
  const empty = api.parseBallastStats({ ...sample, average_daily_return_pct: null, sharpe_ratio: null, decision_latency_us: null, contracts_traded: null });
  for (const key of ['averageDailyReturn', 'sharpeRatio', 'decisionLatency', 'contractsTraded']) assert.equal(empty[key], null);
  const zero = api.parseBallastStats({ ...sample, average_daily_return_pct: 0, sharpe_ratio: 0, decision_latency_us: { p50: 0 }, contracts_traded: 0 });
  for (const key of ['averageDailyReturn', 'sharpeRatio', 'decisionLatency', 'contractsTraded']) assert.equal(zero[key], 0);
  assert.equal(api.parseBallastStats({ ...sample, average_daily_return_pct: -0.5 }).averageDailyReturn, -0.5);
  assert.equal(api.parseBallastStats({ ...sample, sharpe_ratio: -1.2 }).sharpeRatio, -1.2);
  assert.equal(api.parseBallastStats({ ...sample, sharpe_days: 1 }).sharpeRatio, null);
});

test('rejects malformed metrics and reporting dates instead of displaying misleading numbers', () => {
  for (const patch of [
    { average_daily_return_pct: '1.38' }, { sharpe_ratio: Infinity }, { decision_latency_us: { p90: 155 } },
    { decision_latency_us: { p50: -1 } }, { contracts_traded: -1 }, { contracts_traded: 1.5 },
    { live_since: '2026-02-30' }, { updated_at: 'invalid' }, { sharpe_days: 1.5 },
  ]) assert.throws(() => load().parseBallastStats({ ...sample, ...patch }));
  for (const payload of [null, {}, []]) assert.throws(() => load().parseBallastStats(payload));
});

test('requests current data without credentials, passes cancellation, and rejects network/HTTP/JSON failures', async () => {
  const signal = new AbortController().signal;
  const api = load(async (url, options) => {
    assert.equal(url, 'https://echo.oddsparse.trade/api/ballast-stats');
    assert.equal(options.signal, signal); assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'omit');
    return { ok: true, json: async () => sample };
  });
  assert.equal((await api.fetchBallastStats(signal)).contractsTraded, 299774);
  await assert.rejects(load(async () => ({ ok: false, status: 503 })).fetchBallastStats(signal), /503/);
  await assert.rejects(load(async () => { throw new Error('Aborted'); }).fetchBallastStats(signal), /Aborted/);
  await assert.rejects(load(async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } })).fetchBallastStats(signal), /Invalid JSON/);
});
