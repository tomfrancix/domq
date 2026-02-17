import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.js';

test('extra plugin installs expensive predicates', async () => {
  const { document, cleanup } = createDom(`
    <!doctype html><html><body>
      <div id="v1" style="display:block;opacity:1; width: 100px; height: 20px;">X</div>
      <div id="v2" style="display:none;opacity:1;">Y</div>
    </body></html>
  `);

  const { dq, extra } = await import('../src/index.js');
  dq.use(extra);

  const v1 = document.getElementById('v1');
  const v2 = document.getElementById('v2');

  // happy-dom does not perform layout, so getClientRects() often returns empty.
  // Stub it to emulate "has boxes" for a visible element.
  v1.getClientRects = () => ([{ left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20 }]);

  assert.equal(dq(v1).where(dq.visible()).exists(), true);
  assert.equal(dq(v2).where(dq.visible()).exists(), false);

  assert.equal(dq(v2).where(dq.style('display').eq('none')).exists(), true);

  cleanup();
});

test('shadow plugin adds composed traversal relations', async () => {
  const { document, cleanup } = createDom(`
    <!doctype html><html><body>
      <div id="host"></div>
    </body></html>
  `);

  const { dq, shadow } = await import('../src/index.js');
  dq.use(shadow);

  const host = document.getElementById('host');
  const sr = host.attachShadow({ mode: 'open' });

  const inside = document.createElement('span');
  inside.id = 'inside';
  sr.appendChild(inside);

  const found = dq(host).composedDescendants().where(dq.tag('span')).one();
  assert.equal(found.id, 'inside');

  const anc = dq(inside).composedAncestors().first();
  assert.equal(anc.id, 'host');

  cleanup();
});