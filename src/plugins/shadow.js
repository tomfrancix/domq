function named(name, fn) { Object.defineProperty(fn, '_domqName', { value: name, enumerable: false }); return fn; }

function composedParent(el) {
  if (el.assignedSlot) return el.assignedSlot;
  const root = el.getRootNode && el.getRootNode();
  if (root && root.host instanceof Element) return root.host;
  return el.parentElement;
}

const shadowRootRel = named('shadowRoot', (nodes) => (function* () {
  for (const el of nodes) {
    const sr = el.shadowRoot;
    if (sr && sr instanceof ShadowRoot) for (const child of sr.children) yield child;
  }
})());

const composedAncestorsRel = named('composedAncestors', (nodes, ctx) => {
  const limit = (ctx && ctx.budget && typeof ctx.budget.maxDepth === 'number') ? ctx.budget.maxDepth : null;
  return (function* () {
    for (const el of nodes) {
      let cur = el;
      let depth = 0;
      while (cur) {
        const p = composedParent(cur);
        if (!p) break;
        if (limit != null && depth >= limit) break;
        yield p;
        cur = p;
        depth += 1;
      }
    }
  })();
});

const composedDescendantsRel = named('composedDescendants', (nodes, ctx) => {
  const limit = (ctx && ctx.budget && typeof ctx.budget.maxDepth === 'number') ? ctx.budget.maxDepth : null;

  function* iterChildren(el) {
    for (const c of el.children) yield c;
    if (el.shadowRoot) for (const c of el.shadowRoot.children) yield c;
  }

  return (function* () {
    for (const root of nodes) {
      const stack = [];
      const kids = Array.from(iterChildren(root));
      for (let i = kids.length - 1; i >= 0; i -= 1) stack.push({ el: kids[i], depth: 1 });
      while (stack.length) {
        const { el, depth } = stack.pop();
        if (limit != null && depth > limit) continue;
        yield el;
        const ck = Array.from(iterChildren(el));
        for (let i = ck.length - 1; i >= 0; i -= 1) stack.push({ el: ck[i], depth: depth + 1 });
      }
    }
  })();
});

const assignedSlotRel = named('assignedSlot', (nodes) => (function* () { for (const el of nodes) if (el.assignedSlot) yield el.assignedSlot; })());
const assignedElementsRel = named('assignedElements', (nodes) => (function* () {
  for (const el of nodes) {
    if (el instanceof HTMLSlotElement) {
      const assigned = el.assignedElements ? el.assignedElements({ flatten: true }) : [];
      for (const a of assigned) yield a;
    }
  }
})());

export function shadow(dq, Query) {
  dq.relations.shadowRoot = shadowRootRel;
  dq.relations.composedAncestors = composedAncestorsRel;
  dq.relations.composedDescendants = composedDescendantsRel;
  dq.relations.assignedSlot = assignedSlotRel;
  dq.relations.assignedElements = assignedElementsRel;

  const methods = { shadowRoot: shadowRootRel, composedAncestors: composedAncestorsRel, composedDescendants: composedDescendantsRel, assignedSlot: assignedSlotRel, assignedElements: assignedElementsRel };
  for (const [name, fn] of Object.entries(methods)) {
    if (!Query.prototype[name]) Query.prototype[name] = function (...args) { return this.get(fn, ...args); };
  }
}
