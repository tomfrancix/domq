import { describeElement, toIterable, toElement } from './util.js';

function nowMs() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

function checkBudget(ctx) {
  const b = ctx.budget;
  if (!b) return;
  if (typeof b.maxNodes === 'number' && ctx.visitedNodes > b.maxNodes) {
    const err = new Error(`domq: traversal budget exceeded (maxNodes=${b.maxNodes})`);
    err.code = 'DOMQ_BUDGET_NODES';
    throw err;
  }
  if (typeof b.maxMs === 'number') {
    const elapsed = nowMs() - ctx.startedAt;
    if (elapsed > b.maxMs) {
      const err = new Error(`domq: traversal budget exceeded (maxMs=${b.maxMs}, elapsed=${Math.round(elapsed)}ms)`);
      err.code = 'DOMQ_BUDGET_TIME';
      throw err;
    }
  }
}

export class Query {
  constructor(iterableFactory, steps) {
    this._iterableFactory = iterableFactory;
    this._steps = steps || [];
    this._budget = {};
    this._debugEnabled = false;
    this._debugLabel = null;
  }

  static from(node) {
    const el = toElement(node);
    return new Query(
      (ctx) => (function* () { if (!el) return; ctx.visitedNodes += 1; checkBudget(ctx); yield el; })(),
      el ? [`from(${describeElement(el)})`] : ['from(null)']
    );
  }

  static fromAll(iterable) {
    const it = toIterable(iterable);
    return new Query(
      (ctx) => (function* () {
        for (const el of it) {
          if (!(el instanceof Element)) continue;
          ctx.visitedNodes += 1;
          checkBudget(ctx);
          yield el;
        }
      })(),
      ['fromAll(...)']
    );
  }

  static installBaseRelations(relations) {
    for (const [name, fn] of Object.entries(relations)) {
      if (Query.prototype[name]) continue;
      Query.prototype[name] = function (...args) { return this.get(fn, ...args); };
    }
  }

  get(relation, ...args) {
    if (typeof relation !== 'function') throw new TypeError('domq: relation must be a function');
    const prevFactory = this._iterableFactory;
    const step = relation._domqName ? `${relation._domqName}(${args.map(String).join(', ')})` : 'relation(...)';
    const nextFactory = (ctx) => relation(prevFactory(ctx), ctx, ...args);
    return this._clone(nextFactory, [...this._steps, step]);
  }

  where(pred) {
    if (typeof pred !== 'function') throw new TypeError('domq: predicate must be a function');
    const prevFactory = this._iterableFactory;
    const label = pred._domqDescribe ? pred._domqDescribe() : 'predicate';
    const nextFactory = (ctx) => (function* () { for (const el of prevFactory(ctx)) if (pred(el)) yield el; })();
    return this._clone(nextFactory, [...this._steps, `where(${label})`]);
  }

  not(pred) {
    if (typeof pred !== 'function') throw new TypeError('domq: predicate must be a function');
    const prevFactory = this._iterableFactory;
    const label = pred._domqDescribe ? pred._domqDescribe() : 'predicate';
    const nextFactory = (ctx) => (function* () { for (const el of prevFactory(ctx)) if (!pred(el)) yield el; })();
    return this._clone(nextFactory, [...this._steps, `not(${label})`]);
  }

  unique() {
    const prevFactory = this._iterableFactory;
    const nextFactory = (ctx) => (function* () {
      const seen = new Set();
      for (const el of prevFactory(ctx)) { if (seen.has(el)) continue; seen.add(el); yield el; }
    })();
    return this._clone(nextFactory, [...this._steps, 'unique()']);
  }

  uniqueBy(keyFn) {
    if (typeof keyFn !== 'function') throw new TypeError('domq: keyFn must be a function');
    const prevFactory = this._iterableFactory;
    const nextFactory = (ctx) => (function* () {
      const seen = new Set();
      for (const el of prevFactory(ctx)) { const key = keyFn(el); if (seen.has(key)) continue; seen.add(key); yield el; }
    })();
    return this._clone(nextFactory, [...this._steps, 'uniqueBy(fn)']);
  }

  reverse() {
    const prevFactory = this._iterableFactory;
    const nextFactory = (ctx) => { const arr = Array.from(prevFactory(ctx)); arr.reverse(); return arr; };
    return this._clone(nextFactory, [...this._steps, 'reverse()']);
  }

  budget(budget) { this._budget = Object.assign({}, this._budget, budget || {}); return this; }
  debug(label = true) { this._debugEnabled = Boolean(label); this._debugLabel = (typeof label === 'string') ? label : null; return this; }
  explain() { return this._steps.join(' -> '); }

  first() {
    const { ctx, iterable } = this._evaluate();
    let count = 0;
    for (const el of iterable) { count += 1; this._maybeDebug(ctx, count); return el; }
    this._maybeDebug(ctx, 0);
    return null;
  }

  exists() {
    const { ctx, iterable } = this._evaluate();
    for (const _ of iterable) { this._maybeDebug(ctx, 1); return true; }
    this._maybeDebug(ctx, 0);
    return false;
  }

  one() {
    const { ctx, iterable } = this._evaluate();
    const matches = [];
    for (const el of iterable) { matches.push(el); if (matches.length > 2) break; }
    this._maybeDebug(ctx, matches.length);
    if (matches.length === 1) return matches[0];
    const summary = matches.map(describeElement).join(', ');
    const err = new Error(`domq.one(): expected exactly 1 match, got ${matches.length}.\nPipeline: ${this.explain()}\n` + (matches.length ? `Sample: ${summary}` : 'No matches.'));
    err.code = 'DOMQ_ONE';
    throw err;
  }

  maybeOne() {
    const { ctx, iterable } = this._evaluate();
    let first = null;
    let count = 0;
    for (const el of iterable) { count += 1; if (count === 1) first = el; if (count > 1) break; }
    this._maybeDebug(ctx, count);
    if (count <= 1) return first;
    const err = new Error(`domq.maybeOne(): expected 0 or 1 match, got ${count}.\nPipeline: ${this.explain()}`);
    err.code = 'DOMQ_MAYBEONE';
    throw err;
  }

  at(n) {
    if (!Number.isInteger(n)) throw new TypeError('domq.at(n) requires an integer');
    const prevFactory = this._iterableFactory;
    const nextFactory = (ctx) => (function* () {
      const arr = Array.from(prevFactory(ctx));
      const idx = n < 0 ? arr.length + n : n;
      if (idx < 0 || idx >= arr.length) return;
      yield arr[idx];
    })();
    return this._clone(nextFactory, [...this._steps, `at(${n})`]);
  }

  take(n) {
    if (!Number.isInteger(n) || n < 0) throw new TypeError('domq.take(n) requires n >= 0 integer');
    const prevFactory = this._iterableFactory;
    const nextFactory = (ctx) => (function* () { let i = 0; for (const el of prevFactory(ctx)) { if (i++ >= n) break; yield el; } })();
    return this._clone(nextFactory, [...this._steps, `take(${n})`]);
  }

  skip(n) {
    if (!Number.isInteger(n) || n < 0) throw new TypeError('domq.skip(n) requires n >= 0 integer');
    const prevFactory = this._iterableFactory;
    const nextFactory = (ctx) => (function* () { let i = 0; for (const el of prevFactory(ctx)) { if (i++ < n) continue; yield el; } })();
    return this._clone(nextFactory, [...this._steps, `skip(${n})`]);
  }

  slice(start, end) {
    if (!Number.isInteger(start)) throw new TypeError('domq.slice(start, end) requires integer start');
    if (end != null && !Number.isInteger(end)) throw new TypeError('domq.slice(start, end) requires integer end or null');
    const prevFactory = this._iterableFactory;
    const nextFactory = (ctx) => (function* () { const arr = Array.from(prevFactory(ctx)); for (const el of arr.slice(start, end == null ? undefined : end)) yield el; })();
    return this._clone(nextFactory, [...this._steps, `slice(${start}, ${end == null ? 'null' : end})`]);
  }

  count() {
    const { ctx, iterable } = this._evaluate();
    let c = 0;
    for (const _ of iterable) c += 1;
    this._maybeDebug(ctx, c);
    return c;
  }

  toArray() {
    const { ctx, iterable } = this._evaluate();
    const arr = Array.from(iterable);
    this._maybeDebug(ctx, arr.length);
    return arr;
  }

  map(fn) {
    if (typeof fn !== 'function') throw new TypeError('domq.map(fn) requires a function');
    const { ctx, iterable } = this._evaluate();
    const out = [];
    let i = 0;
    for (const el of iterable) out.push(fn(el, i++));
    this._maybeDebug(ctx, i);
    return out;
  }

  _clone(iterableFactory, steps) {
    const q = new Query(iterableFactory, steps);
    q._budget = Object.assign({}, this._budget);
    q._debugEnabled = this._debugEnabled;
    q._debugLabel = this._debugLabel;
    return q;
  }

  _evaluate() {
    const ctx = { budget: Object.assign({}, this._budget), debugEnabled: this._debugEnabled, debugLabel: this._debugLabel, visitedNodes: 0, startedAt: nowMs() };
    const iterable = (function* (factory, ctx) { for (const el of factory(ctx)) { ctx.visitedNodes += 1; checkBudget(ctx); yield el; } })(this._iterableFactory, ctx);
    return { ctx, iterable };
  }

  _maybeDebug(ctx, matchCount) {
    if (!ctx.debugEnabled) return;
    const label = ctx.debugLabel ? ` ${ctx.debugLabel}` : '';
    const elapsed = Math.round((nowMs() - ctx.startedAt) * 100) / 100;
    console.log(`[domq${label}] matches=${matchCount} visited=${ctx.visitedNodes} time=${elapsed}ms\n${this.explain()}`);
  }
}

export { checkBudget };
