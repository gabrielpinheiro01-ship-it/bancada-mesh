import { test } from 'node:test';
import assert from 'node:assert/strict';
import { needsReview } from '../scripts/check-firmware.mjs';

test('mesma versão (com ou sem v) não pede revisão', () => {
  assert.equal(needsReview('v1.18.0', '1.18.0'), false);
  assert.equal(needsReview('1.18.0', '1.18.0'), false);
});

test('versão maior pede revisão', () => {
  assert.equal(needsReview('v1.19.0', '1.18.0'), true);
  assert.equal(needsReview('v1.18.1', '1.18.0'), true);
});

test('versão menor não pede revisão', () => {
  assert.equal(needsReview('v1.17.9', '1.18.0'), false);
});

test('comparação é numérica, não textual', () => {
  assert.equal(needsReview('v1.10.0', '1.9.0'), true);
  assert.equal(needsReview('v1.9.0', '1.10.0'), false);
});

test('tag que não é versão semântica lança erro', () => {
  assert.throws(() => needsReview('latest', '1.18.0'));
  assert.throws(() => needsReview('v1.18', '1.18.0'));
  assert.throws(() => needsReview('', '1.18.0'));
});
