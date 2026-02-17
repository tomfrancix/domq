export function toElement(node) {
  if (!node) return null;
  if (node instanceof Element) return node;
  if (node && typeof node === 'object' && 'nodeType' in node) {
    if (node.nodeType === 1) return node;
    if (node.parentElement instanceof Element) return node.parentElement;
  }
  return null;
}

export function toIterable(iterable) {
  if (!iterable) return [];
  if (typeof iterable[Symbol.iterator] === 'function') return iterable;
  if (typeof iterable.length === 'number') {
    return (function* () { for (let i = 0; i < iterable.length; i += 1) yield iterable[i]; })();
  }
  return [];
}

export function describeElement(el) {
  if (!(el instanceof Element)) return String(el);
  const tag = el.tagName ? el.tagName.toLowerCase() : 'element';
  const id = el.id ? `#${el.id}` : '';
  let cls = '';
  if (typeof el.className === 'string' && el.className.trim()) {
    const parts = el.className.trim().split(/\s+/).slice(0, 3);
    cls = parts.length ? `.${parts.join('.')}` : '';
  }
  const attrs = [];
  const keys = ['data-testid', 'data-test', 'data-qa', 'name', 'role', 'aria-label'];
  for (const k of keys) {
    const v = el.getAttribute && el.getAttribute(k);
    if (v) attrs.push(`${k}=\"${v}\"`);
    if (attrs.length >= 2) break;
  }
  const attrStr = attrs.length ? `[${attrs.join(' ')}]` : '';
  return `${tag}${id}${cls}${attrStr}`;
}

export function normaliseText(s) { return String(s ?? '').replace(/\s+/g, ' ').trim(); }

export function getOwnText(el) {
  let out = '';
  for (const n of el.childNodes) if (n.nodeType === 3) out += n.nodeValue || '';
  return normaliseText(out);
}

export function getValue(el) {
  const tag = el.tagName ? el.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return String(el.value ?? '');
  return '';
}

export function safeMatches(el, selector) { try { return el.matches(selector); } catch { return false; } }
