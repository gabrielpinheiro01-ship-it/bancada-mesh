import { test } from 'node:test';
import assert from 'node:assert/strict';

test('tipos carregam', async () => {
  const m = await import('../src/core/types.js');
  assert.ok(m);
});
