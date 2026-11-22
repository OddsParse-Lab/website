const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../lib/strategy-wheel.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { wrapIndex, nearestPosition, wheelDistance, springStep, releaseTarget, wheelAppearance } = context.exports;

function simulate(hz, position = .3, velocity = 0, target = 1) {
  for (let i = 0; i < hz; i++) ({ position, velocity } = springStep(position, velocity, target, 1 / hz));
  return { position, velocity };
}

test('continuous navigation wraps in both directions without a last-item barrier', () => {
  for (const count of [1, 4, 5, 6, 17, 50]) {
    for (let step = -count * 4; step <= count * 4; step++) {
      const index = wrapIndex(step, count);
      assert.ok(index >= 0 && index < count);
      assert.equal(wheelDistance(index, step, count), 0);
    }
  }
});

test('clicking an adjacent item across the seam takes the short path', () => {
  assert.equal(nearestPosition(3, .1, 4), -1);
  assert.equal(nearestPosition(0, 3.8, 4), 4);
  assert.equal(nearestPosition(49, 0, 50), -1);
  assert.equal(nearestPosition(0, 49, 50), 50);
});

test('spring settling is independent of refresh rate and does not overshoot at rest', () => {
  for (const hz of [30, 60, 120, 144]) {
    const actual = simulate(hz);
    assert.ok(Math.abs(actual.position - 1) < .000001);
    assert.ok(Math.abs(actual.position - simulate(60).position) < 1e-12);
  }
  let position = .2, velocity = 0;
  for (let i = 0; i < 100; i++) {
    const next = springStep(position, velocity, 1, 1 / 60);
    assert.ok(next.position >= position && next.position <= 1);
    ({ position, velocity } = next);
  }
});

test('releasing a slow drag selects the nearest item, while fast flicks have bounded travel', () => {
  assert.equal(releaseTarget(.3, 0), 0);
  assert.equal(releaseTarget(.7, 0), 1);
  assert.equal(releaseTarget(.3, 4), 1);
  assert.equal(releaseTarget(.7, -4), 0);
  for (const position of [-7.8, -.1, .6, 27.5]) {
    for (const velocity of [-1000, 1000]) assert.ok(Math.abs(releaseTarget(position, velocity) - position) < 2);
  }
});

test('a spring can reverse direction immediately without waiting for an earlier transition', () => {
  let position = 0, velocity = 0;
  for (let i = 0; i < 8; i++) ({ position, velocity } = springStep(position, velocity, 2, 1 / 60));
  for (let i = 0; i < 60; i++) ({ position, velocity } = springStep(position, velocity, -1, 1 / 60));
  assert.ok(Math.abs(position + 1) < .00001);
});

test('expansion leaves the selected item anchored while opening the arc around it', () => {
  const rest = wheelAppearance(0, 0), open = wheelAppearance(0, 1);
  assert.equal(rest.y, 0);
  assert.equal(open.y, 0);
  assert.equal(rest.x, open.x);
  assert.ok(open.scale > rest.scale);
  assert.ok(wheelAppearance(1, 1).y > wheelAppearance(1, 0).y);
  assert.equal(wheelAppearance(3).opacity, 0);
});
