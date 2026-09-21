const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../components/use-project-motion.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

// Run the real hook with a deterministic clock and browser animation lifecycle.
function setup({ reducedMotion = false } = {}) {
  let now = 0, nextId = 0, selected = 0, cleanup, nullRefs = 0;
  const tasks = new Map();
  const animations = [];
  const listeners = new Map();
  const touchListeners = new Map();
  function schedule(callback, delay) {
    const id = ++nextId;
    tasks.set(id, { callback, at: now + delay });
    return id;
  }
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const entry = [...tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      const [id, task] = entry;
      now = task.at;
      tasks.delete(id);
      task.callback();
    }
    now = end;
  }
  const stage = {
    style: {},
    contains: () => false,
    animate(_frames, { duration }) {
      animations.push({ duration });
      const animation = { onfinish: null, cancel: () => tasks.delete(id) };
      const id = schedule(() => animation.onfinish?.(), duration);
      return animation;
    },
  };
  const explorer = {
    addEventListener: (name, fn) => touchListeners.set(name, fn),
    removeEventListener: name => touchListeners.delete(name),
  };
  const document = { documentElement: { scrollHeight: 900 }, activeElement: null };
  const context = {
    exports: {},
    require: () => ({
      useState: initial => [initial, next => { selected = next; }],
      useRef: initial => ({ current: initial === null ? (++nullRefs === 1 ? stage : explorer) : initial }),
      useEffect: fn => { cleanup = fn(); },
    }),
    window: {
      innerHeight: 900,
      matchMedia: () => ({ matches: reducedMotion }),
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: name => listeners.delete(name),
      setTimeout: schedule,
      clearTimeout: id => tasks.delete(id),
    },
    document,
    getComputedStyle: () => ({ transform: stage.style.transform || 'none', opacity: stage.style.opacity || '1' }),
    requestAnimationFrame: fn => schedule(fn, 16),
    cancelAnimationFrame: id => tasks.delete(id),
  };
  vm.runInNewContext(compiled, context);
  const hook = context.exports.useProjectMotion(4);
  function wheel(deltaY, extra = {}) {
    let prevented = false;
    listeners.get('wheel')({ deltaY, deltaX: 0, deltaMode: 0, preventDefault: () => { prevented = true; }, ...extra });
    return prevented;
  }
  function scroll(delta, duration) {
    for (let elapsed = 0; elapsed < duration; elapsed += 40) { wheel(delta); advance(40); }
  }
  return { advance, wheel, scroll, stage, document, hook, animations,
    selected: () => selected,
    cleanup: () => { cleanup(); assert.equal(tasks.size, 0); assert.equal(listeners.size, 0); assert.equal(touchListeners.size, 0); },
  };
}

test('continuous scrolling reaches successive projects without a pause, in both directions', () => {
  const app = setup();
  app.scroll(60, 1800);
  assert.equal(app.selected(), 3);
  app.scroll(-60, 2000);
  assert.equal(app.selected(), 0);
  app.cleanup();
});

test('input during a transition carries into the next card', () => {
  const app = setup();
  app.wheel(60); app.advance(40); app.wheel(60);
  app.advance(480);
  app.wheel(20); app.advance(60); app.wheel(20);
  app.advance(25);
  assert.equal(app.selected(), 1);
  assert.equal(app.stage.style.transform, 'translate3d(0, -22px, 0)');
  assert(Number(app.stage.style.opacity) < 1);
  app.advance(550);
  assert.equal(app.stage.style.opacity, '1');
  assert.equal(app.selected(), 1);
  app.cleanup();
});

test('stopping during a transition clears pending input rather than flipping later', () => {
  const app = setup();
  app.wheel(60); app.wheel(60);
  app.advance(20); app.wheel(60); app.wheel(60);
  app.advance(1200);
  assert.equal(app.selected(), 1);
  app.cleanup();
});

test('a partial drag returns to its origin, and project boundaries do not wrap', () => {
  const app = setup();
  app.wheel(12);
  assert(Number(app.stage.style.opacity) < 1);
  app.advance(79);
  assert.equal(app.animations.length, 0);
  app.advance(2);
  assert.equal(app.animations.length, 1, 'Return begins after 80 ms of inactivity');
  app.advance(400);
  assert.equal(app.stage.style.opacity, '1');
  assert.equal(app.selected(), 0);
  app.scroll(-60, 1200);
  assert.equal(app.selected(), 0);
  app.hook.selectProject(3); app.advance(700);
  app.scroll(60, 1200);
  assert.equal(app.selected(), 3);
  app.cleanup();
});

test('reduced motion supports continuous navigation, while zoom and overflow keep native scrolling', () => {
  const app = setup({ reducedMotion: true });
  app.scroll(60, 400);
  assert.equal(app.selected(), 3);
  assert.equal(app.wheel(-60, { ctrlKey: true }), false);
  assert.equal(app.wheel(-10, { deltaX: 80 }), false);
  app.document.documentElement.scrollHeight = 1200;
  assert.equal(app.wheel(-60), false);
  assert.equal(app.selected(), 3);
  app.cleanup();
});
