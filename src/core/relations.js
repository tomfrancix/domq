import { safeMatches } from './util.js';

function named(name, fn) { Object.defineProperty(fn, '_domqName', { value: name, enumerable: false }); return fn; }
function maxDepth(ctx) { return (ctx && ctx.budget && typeof ctx.budget.maxDepth === 'number') ? ctx.budget.maxDepth : null; }

export const self = named('self', (nodes) => nodes);

export const parent = named('parent', (nodes) => (function* () { for (const el of nodes) if (el.parentElement) yield el.parentElement; })());

export const ancestors = named('ancestors', (nodes, ctx) => {
  const limit = maxDepth(ctx);
  return (function* () {
    for (const el of nodes) {
      let cur = el.parentElement;
      let depth = 0;
      while (cur) {
        if (limit != null && depth >= limit) break;
        yield cur;
        cur = cur.parentElement;
        depth += 1;
      }
    }
  })();
});

export const children = named('children', (nodes) => (function* () { for (const el of nodes) for (const c of el.children) yield c; })());

export const descendants = named('descendants', (nodes, ctx) => {
  const limit = maxDepth(ctx);
  return (function* () {
    for (const root of nodes) {
      const stack = [];
      const kids = root.children;
      for (let i = kids.length - 1; i >= 0; i -= 1) stack.push({ el: kids[i], depth: 1 });
      while (stack.length) {
        const { el, depth } = stack.pop();
        if (limit != null && depth > limit) continue;
        yield el;
        const ck = el.children;
        for (let i = ck.length - 1; i >= 0; i -= 1) stack.push({ el: ck[i], depth: depth + 1 });
      }
    }
  })();
});

export const siblings = named('siblings', (nodes) => (function* () {
  for (const el of nodes) {
    const p = el.parentElement;
    if (!p) continue;
    for (const c of p.children) if (c !== el) yield c;
  }
})());

export const followingSiblings = named('followingSiblings', (nodes) => (function* () {
  for (const el of nodes) { let cur = el.nextElementSibling; while (cur) { yield cur; cur = cur.nextElementSibling; } }
})());

export const precedingSiblings = named('precedingSiblings', (nodes) => (function* () {
  for (const el of nodes) {
    const acc = [];
    let cur = el.previousElementSibling;
    while (cur) { acc.push(cur); cur = cur.previousElementSibling; }
    acc.reverse();
    for (const x of acc) yield x;
  }
})());

export const next = named('next', (nodes) => (function* () { for (const el of nodes) if (el.nextElementSibling) yield el.nextElementSibling; })());
export const prev = named('prev', (nodes) => (function* () { for (const el of nodes) if (el.previousElementSibling) yield el.previousElementSibling; })());

export const closest = named('closest', (nodes, _ctx, selector) => {
  const s = String(selector);
  return (function* () { for (const el of nodes) { const c = el.closest(s); if (c) yield c; } })();
});

export const find = named('find', (nodes, _ctx, selector) => {
  const s = String(selector);
  return (function* () {
    for (const el of nodes) {
      try { for (const x of el.querySelectorAll(s)) yield x; } catch {}
    }
  })();
});

export const within = named('within', (nodes, _ctx, selector) => {
  const s = String(selector);
  return (function* () { for (const el of nodes) { const c = el.closest(s); if (c) yield c; } })();
});

export const until = named('until', (nodes, _ctx, boundary) => {
  const boundaryPred = (typeof boundary === 'string') ? (el) => safeMatches(el, boundary)
    : (typeof boundary === 'function') ? boundary : null;
  if (!boundaryPred) throw new TypeError('domq.until(boundary) requires a selector string or predicate function');

  return (function* () {
    for (const el of nodes) {
      let cur = el;
      while (cur && cur.parentElement) {
        cur = cur.parentElement;
        if (!cur) break;
        if (boundaryPred(cur)) break;
        yield cur;
      }
    }
  })();
});
