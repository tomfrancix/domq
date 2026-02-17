import test from 'node:test';
import assert from 'node:assert/strict';
import { dq } from '../src/index.js';

test('exports exist', () => {
  assert.equal(typeof dq, 'function');
  assert.equal(typeof dq.attr, 'function');
  assert.equal(typeof dq.compile, 'function');
});
