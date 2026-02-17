function attachDescribe(fn, desc) { Object.defineProperty(fn, '_domqDescribe', { value: () => desc, enumerable: false }); return fn; }
function getComputed(el) { try { return window.getComputedStyle(el); } catch { return null; } }

function visiblePredicate() {
  return attachDescribe((el) => {
    if (!(el instanceof Element)) return false;
    const cs = getComputed(el);
    if (!cs) return false;
    if (cs.display === 'none') return false;
    if (cs.visibility === 'hidden') return false;
    if (Number(cs.opacity) === 0) return false;
    const rects = el.getClientRects();
    return rects && rects.length > 0;
  }, 'visible()');
}

function inViewportPredicate(options = {}) {
  const threshold = typeof options.threshold === 'number' ? options.threshold : 0;
  return attachDescribe((el) => {
    if (!(el instanceof Element)) return false;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (vw <= 0 || vh <= 0) return false;

    const interLeft = Math.max(0, Math.min(vw, r.right) - Math.max(0, r.left));
    const interTop = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top));
    const interArea = interLeft * interTop;
    const area = Math.max(0, r.width) * Math.max(0, r.height);
    if (area === 0) return false;

    return (interArea / area) >= threshold;
  }, `inViewport(${JSON.stringify({ threshold })})`);
}

function styleFactory(prop) {
  const p = String(prop);
  return {
    eq(value) { return attachDescribe((el) => { const cs = getComputed(el); return cs ? cs.getPropertyValue(p) === String(value) : false; }, `style(${JSON.stringify(p)}) == ${JSON.stringify(String(value))}`); },
    ne(value) { return attachDescribe((el) => { const cs = getComputed(el); return cs ? cs.getPropertyValue(p) !== String(value) : false; }, `style(${JSON.stringify(p)}) != ${JSON.stringify(String(value))}`); },
    matches(re) { const rx = re instanceof RegExp ? re : new RegExp(String(re)); return attachDescribe((el) => { const cs = getComputed(el); const v = cs ? cs.getPropertyValue(p) : ''; return rx.test(v); }, `style(${JSON.stringify(p)}).matches(${rx.toString()})`); },
    includes(substr) { const s = String(substr); return attachDescribe((el) => { const cs = getComputed(el); const v = cs ? cs.getPropertyValue(p) : ''; return v.includes(s); }, `style(${JSON.stringify(p)}).includes(${JSON.stringify(s)})`); }
  };
}

function rectFactory() {
  return {
    width: { gt(n) { const num = Number(n); return attachDescribe((el) => el.getBoundingClientRect().width > num, `rect().width > ${num}`); }, lt(n) { const num = Number(n); return attachDescribe((el) => el.getBoundingClientRect().width < num, `rect().width < ${num}`); } },
    height: { gt(n) { const num = Number(n); return attachDescribe((el) => el.getBoundingClientRect().height > num, `rect().height > ${num}`); }, lt(n) { const num = Number(n); return attachDescribe((el) => el.getBoundingClientRect().height < num, `rect().height < ${num}`); } }
  };
}

export function extra(dq) {
  dq.visible = visiblePredicate;
  dq.inViewport = inViewportPredicate;
  dq.style = styleFactory;
  dq.rect = rectFactory;
}
