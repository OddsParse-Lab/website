const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/anachron-stats.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function load(fetch) { const context = { exports: {}, fetch }; vm.runInNewContext(compiled, context); return context.exports; }
const point = (hour, value) => ({ t: `2026-11-15T${String(hour).padStart(2, '0')}:00:00Z`, value });
const sample = {
  live_since: '2026-11-15', updated_at: '2026-11-15T21:42:43Z', data_through: '2026-11-15T20:00:00Z',
  venues: ['Kalshi', 'Polymarket US'], max_drawdown_pct: 4.6, sharpe_ratio: null, sharpe_days: 0,
  markets_settled: 536, curve: [point(0, 0), point(9, -13.8), point(20, 100)],
};

test('preserves normalized profit, negative excursions, irregular timestamps and API account drawdown', () => {
  const result = load().parseAnachronStats({ ...sample, curve: [...sample.curve].reverse() });
  assert.equal(JSON.stringify(result.curve.map(p => p.y)), '[0,-13.8,100]');
  assert.equal(result.curve[2].x - result.curve[1].x, 11 * 3600000);
  assert.equal(result.maxDrawdown, 4.6); // Do not derive account drawdown from a normalized profit curve.
  assert.equal(result.marketsSettled, 536);
  assert.equal(result.sharpeRatio, null);
});

test('keeps unavailable Sharpe separate from zero and accepts negative ratios', () => {
  assert.equal(load().parseAnachronStats({ ...sample, sharpe_ratio: 8, sharpe_days: 1 }).sharpeRatio, null);
  assert.equal(load().parseAnachronStats({ ...sample, sharpe_ratio: 0, sharpe_days: 2 }).sharpeRatio, 0);
  assert.equal(load().parseAnachronStats({ ...sample, sharpe_ratio: -1.2, sharpe_days: 2 }).sharpeRatio, -1.2);
  assert.equal(load().parseAnachronStats({ ...sample, sharpe_ratio: null, sharpe_days: 3 }).sharpeRatio, null);
});

test('empty, single-point and all-zero histories do not invent a baseline or divide by zero', () => {
  for (const curve of [[], [point(0, 0)], [point(0, 0), point(1, 0)]]) {
    const result = load().parseAnachronStats({ ...sample, curve, max_drawdown_pct: 0, markets_settled: 0 });
    assert.equal(JSON.stringify(result.curve.map(p => p.y)), JSON.stringify(curve.map(p => p.value)));
    assert.equal(result.maxDrawdown, 0); assert.equal(result.marketsSettled, 0);
  }
});

test('retains UTC spacing when the API switches from daily to hourly sampling', () => {
  const result = load().parseAnachronStats({ ...sample, live_since: '2026-10-01', curve: [
    { t: '2026-10-01T00:00:00Z', value: 0 }, { t: '2026-10-02T00:00:00Z', value: 2 },
    point(19, 89.1), point(20, 100),
  ] });
  assert.equal(result.curve[1].x - result.curve[0].x, 86400000);
  assert.equal(result.curve[3].x - result.curve[2].x, 3600000);
});

test('rejects invalid or duplicated points, future samples, and malformed metrics', () => {
  for (const payload of [null, {}, { ...sample, live_since: '2026-02-30' },
    { ...sample, curve: [point(0, 0), point(0, 1)] }, { ...sample, curve: [point(22, 3)] },
    { ...sample, curve: [point(0, '100')] }, { ...sample, curve: [point(0, Infinity)] },
    { ...sample, curve: [point(0, 110)] }, { ...sample, max_drawdown_pct: -1 },
    { ...sample, markets_settled: -1 }, { ...sample, sharpe_days: 1.5 },
    { ...sample, venues: [null] }, { ...sample, data_through: 'not-a-date' }]) {
    assert.throws(() => load().parseAnachronStats(payload));
  }
});

test('fetch passes abort signal without credentials or caching and rejects HTTP/JSON failures', async () => {
  const signal = new AbortController().signal;
  const api = load(async (url, options) => {
    assert.equal(url, 'https://echo.oddsparse.trade/api/anachron-stats');
    assert.equal(options.signal, signal); assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'omit');
    return { ok: true, json: async () => sample };
  });
  assert.equal((await api.fetchAnachronStats(signal)).marketsSettled, 536);
  await assert.rejects(load(async () => ({ ok: false, status: 503 })).fetchAnachronStats(signal), /503/);
  await assert.rejects(load(async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } })).fetchAnachronStats(signal), /Invalid JSON/);
});
