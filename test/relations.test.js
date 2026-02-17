import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.js';

test('ancestors() yields nearest-first and respects maxDepth', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const a1 = document.getElementById('a1');

  const ids = dq(a1).ancestors().map(el => el.id);
  assert.deepEqual(ids.slice(0, 3), ['a', 's1', 'root']);

  const limited = dq(a1).budget({ maxDepth: 2 }).ancestors().map(el => el.id);
  assert.deepEqual(limited, ['a', 's1']);

  cleanup();
});

test('descendants() yields preorder and respects maxDepth', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const s1 = document.getElementById('s1');

  const ids = dq(s1).descendants().map(el => el.id);
  assert.deepEqual(ids, ['a', 'a1', 'a2', 'inp', 'b', 'btn']);

  const limited = dq(s1).budget({ maxDepth: 1 }).descendants().map(el => el.id);
  assert.deepEqual(limited, ['a', 'b']);

  cleanup();
});

test('siblings()/followingSiblings()/precedingSiblings() ordering', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const a = document.getElementById('a');
  const b = document.getElementById('b');

  assert.deepEqual(dq(a).siblings().map(x => x.id), ['b']);
  assert.deepEqual(dq(a).followingSiblings().map(x => x.id), ['b']);
  assert.deepEqual(dq(b).precedingSiblings().map(x => x.id), ['a']);

  cleanup();
});

test('closest() and find() work with selectors', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const btn = document.getElementById('btn');

  const section = dq(btn).closest('section').one();
  assert.equal(section.id, 's1');

  const leaves = dq(section).find('[data-kind="leaf"]').map(el => el.id);
  assert.deepEqual(leaves, ['a1', 'a2']);

  cleanup();
});

test('within() yields closest selector match and can be composed', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const a2 = document.getElementById('a2');

  const primaryBtn =
    dq(a2)
      .within('section')
      .descendants()
      .where(dq.attr('data-action').eq('primary'))
      .one();

  assert.equal(primaryBtn.id, 'btn');

  cleanup();
});

test('until() walks ancestors until boundary (exclusive)', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const a1 = document.getElementById('a1');

  const ids = dq(a1).until('#root').map(el => el.id);
  assert.deepEqual(ids, ['a', 's1']);

  cleanup();
});
