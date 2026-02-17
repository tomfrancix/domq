import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.js';

test('attr/data/dataset/text/value predicates', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const a = document.getElementById('a');
  const inp = document.getElementById('inp');
  const a1 = document.getElementById('a1');

  assert.equal(dq(a).where(dq.attr('data-x').eq('1')).one().id, 'a');
  assert.equal(dq(a).where(dq.attr('missing').exists()).count(), 0);

  assert.equal(dq(inp).where(dq.data('kebab-case').eq('ok')).one().id, 'inp');
  assert.equal(dq(inp).where(dq.dataset('kebab-case').eq('ok')).one().id, 'inp');

  assert.equal(dq(a1).where(dq.text().eq('Hello world')).one().id, 'a1');
  assert.equal(dq(a1).where(dq.text().includes('world')).one().id, 'a1');

  assert.equal(dq(inp).where(dq.value().eq('yes')).one().id, 'inp');

  cleanup();
});

test('matches/tag/hasClass/role predicates', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const btn = document.getElementById('btn');

  assert.equal(dq(btn).where(dq.matches('button.cta')).one().id, 'btn');
  assert.equal(dq(btn).where(dq.tag('button')).one().id, 'btn');
  assert.equal(dq(btn).where(dq.hasClass('primary')).one().id, 'btn');

  btn.setAttribute('role', 'dialog');
  assert.equal(dq(btn).where(dq.role('dialog')).one().id, 'btn');

  cleanup();
});

test('and/or/not combinators', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const s1 = document.getElementById('s1');

  const q = dq(s1).descendants().where(dq.and(dq.tag('span'), dq.attr('data-kind').eq('leaf')));
  assert.deepEqual(q.map(el => el.id), ['a1', 'a2']);

  const q2 = dq(s1).descendants().where(dq.or(dq.attr('data-x').eq('1'), dq.attr('data-x').eq('2')));
  assert.deepEqual(q2.map(el => el.id), ['a', 'a2']);

  const q3 = dq(s1).descendants().where(dq.not(dq.tag('div')));
  assert.ok(q3.map(el => el.id).includes('btn'));

  cleanup();
});
