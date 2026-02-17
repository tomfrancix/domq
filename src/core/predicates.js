import { getOwnText, getValue, normaliseText, safeMatches } from './util.js';

function attachDescribe(fn, describe) {
  Object.defineProperty(fn, '_domqDescribe', { value: () => describe, enumerable: false });
  return fn;
}

export function predicate(fn, describe = 'predicate') {
  if (typeof fn !== 'function') throw new TypeError('dq.predicate(fn) requires a function');
  return attachDescribe((el) => Boolean(fn(el)), String(describe));
}

export function and(...preds) {
  preds = preds.flat().filter(Boolean);
  const desc = preds.map(p => (p && p._domqDescribe ? p._domqDescribe() : 'predicate')).join(' AND ');
  return attachDescribe((el) => preds.every(p => p(el)), `(${desc})`);
}

export function or(...preds) {
  preds = preds.flat().filter(Boolean);
  const desc = preds.map(p => (p && p._domqDescribe ? p._domqDescribe() : 'predicate')).join(' OR ');
  return attachDescribe((el) => preds.some(p => p(el)), `(${desc})`);
}

export function not(pred) {
  const desc = pred && pred._domqDescribe ? pred._domqDescribe() : 'predicate';
  return attachDescribe((el) => !pred(el), `NOT(${desc})`);
}

class ComparatorBuilder {
  constructor(kind, getter) { this._kind = kind; this._getter = getter; }
  exists() { return attachDescribe((el) => { const v = this._getter(el); return v !== null && v !== undefined && v !== ''; }, `${this._kind}.exists()`); }
  eq(value) { return attachDescribe((el) => this._getter(el) === value, `${this._kind} == ${JSON.stringify(value)}`); }
  ne(value) { return attachDescribe((el) => this._getter(el) !== value, `${this._kind} != ${JSON.stringify(value)}`); }
  includes(substr) { const s = String(substr); return attachDescribe((el) => String(this._getter(el) ?? '').includes(s), `${this._kind}.includes(${JSON.stringify(s)})`); }
  startsWith(prefix) { const p = String(prefix); return attachDescribe((el) => String(this._getter(el) ?? '').startsWith(p), `${this._kind}.startsWith(${JSON.stringify(p)})`); }
  endsWith(suffix) { const s = String(suffix); return attachDescribe((el) => String(this._getter(el) ?? '').endsWith(s), `${this._kind}.endsWith(${JSON.stringify(s)})`); }
  matches(re) { const rx = (re instanceof RegExp) ? re : new RegExp(String(re)); return attachDescribe((el) => rx.test(String(this._getter(el) ?? '')), `${this._kind}.matches(${rx.toString()})`); }
  truthy() { return attachDescribe((el) => Boolean(this._getter(el)), `${this._kind}.truthy()`); }
  gt(n) { const num = Number(n); return attachDescribe((el) => Number(this._getter(el)) > num, `${this._kind} > ${num}`); }
  gte(n) { const num = Number(n); return attachDescribe((el) => Number(this._getter(el)) >= num, `${this._kind} >= ${num}`); }
  lt(n) { const num = Number(n); return attachDescribe((el) => Number(this._getter(el)) < num, `${this._kind} < ${num}`); }
  lte(n) { const num = Number(n); return attachDescribe((el) => Number(this._getter(el)) <= num, `${this._kind} <= ${num}`); }
}

export function attr(name) { const key = String(name); return new ComparatorBuilder(`attr(${JSON.stringify(key)})`, (el) => el.getAttribute(key)); }

export function data(key) {
  const k = String(key);
  return new ComparatorBuilder(`data(${JSON.stringify(k)})`, (el) => {
    const ds = el.dataset || {};
    if (k in ds) return ds[k];
    const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (camel in ds) return ds[camel];
    return el.getAttribute(`data-${k}`);
  });
}

export function dataset(key) { return data(key); }
export function text() { return new ComparatorBuilder('text()', (el) => normaliseText(el.textContent || '')); }
export function ownText() { return new ComparatorBuilder('ownText()', (el) => getOwnText(el)); }
export function value() { return new ComparatorBuilder('value()', (el) => getValue(el)); }

export function tag(tagName) { const t = String(tagName).toLowerCase(); return attachDescribe((el) => (el.tagName || '').toLowerCase() === t, `tag(${JSON.stringify(t)})`); }
export function hasClass(className) { const c = String(className); return attachDescribe((el) => el.classList ? el.classList.contains(c) : false, `hasClass(${JSON.stringify(c)})`); }
export function matches(selector) { const s = String(selector); return attachDescribe((el) => safeMatches(el, s), `matches(${JSON.stringify(s)})`); }
export function role(roleName) { const r = String(roleName); return attachDescribe((el) => el.getAttribute('role') === r, `role(${JSON.stringify(r)})`); }
