import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.js';

test('first/exists/at/take/skip/slice/reverse', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const s1 = document.getElementById('s1');

  assert.equal(dq(s1).descendants().first().id, 'a');
  assert.equal(dq(s1).descendants().exists(), true);

  assert.equal(dq(s1).descendants().at(1).one().id, 'a1');
  assert.equal(dq(s1).descendants().at(-1).one().id, 'btn');

  assert.deepEqual(dq(s1).descendants().take(2).map(el => el.id), ['a', 'a1']);
  assert.deepEqual(dq(s1).descendants().skip(4).map(el => el.id), ['b', 'btn']);

  assert.deepEqual(dq(s1).descendants().slice(1, 3).map(el => el.id), ['a1', 'a2']);
  assert.deepEqual(dq(s1).descendants().take(3).reverse().map(el => el.id), ['a2', 'a1', 'a']);

  cleanup();
});

test('unique() dedupes repeated nodes across relation compositions', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const s1 = document.getElementById('s1');

  const repeated = dq(s1).descendants().ancestors().where(dq.tag('section'));
  assert.ok(repeated.count() > 1);

  const uniq = repeated.unique().map(el => el.id);
  assert.deepEqual(uniq, ['s1']);

  cleanup();
});

test('one() and maybeOne() throw with context on invalid cardinality', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const s1 = document.getElementById('s1');

  assert.throws(() => dq(s1).descendants().where(dq.tag('span')).one(), (err) => {
    assert.equal(err.code, 'DOMQ_ONE');
    assert.match(err.message, /Pipeline:/);
    return true;
  });

  assert.throws(() => dq(s1).descendants().where(dq.tag('div')).maybeOne(), (err) => {
    assert.equal(err.code, 'DOMQ_MAYBEONE');
    assert.match(err.message, /Pipeline:/);
    return true;
  });

  cleanup();
});

test('explain() returns a readable pipeline string', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const a1 = document.getElementById('a1');
  const q = dq(a1).ancestors().where(dq.tag('section')).at(0);

  const s = q.explain();
  assert.match(s, /from\(/);
  assert.match(s, /ancestors/);
  assert.match(s, /where\(tag\("section"\)\)/);
  assert.match(s, /at\(0\)/);

  cleanup();
});
