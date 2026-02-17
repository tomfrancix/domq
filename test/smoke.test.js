import test from 'node:test';
import assert from 'node:assert/strict';
import { createDom } from './helpers/dom.js';

test('exports exist and plugins are available', async () => {
  const { cleanup } = createDom();
  const { dq, extra, shadow } = await import('../src/index.js');

  assert.equal(typeof dq, 'function');
  assert.equal(typeof dq.attr, 'function');
  assert.equal(typeof dq.compile, 'function');
  assert.ok(dq.relations);
  assert.equal(typeof dq.relations.ancestors, 'function');

  assert.equal(typeof extra, 'function');
  assert.equal(typeof shadow, 'function');

  cleanup();
});
