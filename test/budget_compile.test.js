import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.js';

test('budget maxNodes triggers DOMQ_BUDGET_NODES', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const root = document.getElementById('root');

  assert.throws(() => {
    dq(root).budget({ maxNodes: 3 }).descendants().toArray();
  }, (err) => {
    assert.equal(err.code, 'DOMQ_BUDGET_NODES');
    assert.match(err.message, /maxNodes=3/);
    return true;
  });

  cleanup();
});

test('compile() builds reusable query functions', async () => {
  const { document, cleanup } = createDom('<!doctype html>\n<html>\n  <body>\n    <div id="root" data-root="1">\n      <section id="s1" class="section">\n        <div id="a" class="box" data-x="1">\n          <span id="a1" data-kind="leaf">  Hello   world </span>\n          <span id="a2" data-kind="leaf" data-x="2">Second</span>\n          <input id="inp" type="text" value="yes" data-kebab-case="ok" />\n        </div>\n        <div id="b" class="box">\n          <button id="btn" class="cta primary" data-action="primary">Click</button>\n        </div>\n      </section>\n      <section id="s2" class="section">\n        <div id="c" class="box">\n          <span id="c1" data-kind="leaf">Third</span>\n        </div>\n      </section>\n    </div>\n  </body>\n</html>\n');
  const { dq } = await import('../src/index.js');

  const getPrimary = dq.compile(q =>
    q.closest('section')
     .descendants()
     .where(dq.attr('data-action').eq('primary'))
     .one()
  );

  const a2 = document.getElementById('a2');
  const btn = getPrimary(a2);
  assert.equal(btn.id, 'btn');

  cleanup();
});
