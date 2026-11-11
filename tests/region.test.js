import test from 'node:test';
import assert from 'node:assert/strict';
import { DDD_BY_UF } from '../src/data/ddd.js';
import { regionDef, validateCustomRegion } from '../src/core/region.js';

test('DDD_BY_UF: MG tem 31 e não tem 36; total 67; 27 UFs', () => {
  assert.ok(DDD_BY_UF.MG.includes('31'));
  assert.ok(!DDD_BY_UF.MG.includes('36'));
  assert.equal(Object.keys(DDD_BY_UF).length, 27);
  const all = Object.values(DDD_BY_UF).flat();
  assert.equal(all.length, 67);
  assert.equal(new Set(all).size, 67);
});

test('regionDef com UF e DDD', () => {
  assert.equal(regionDef('MG', '31', null), 'region def br br-mg br-mg-31');
});

test('regionDef com região própria válida', () => {
  assert.equal(regionDef('SP', '12', 'br-sp-valeparaiba'), 'region def br br-sp br-sp-valeparaiba');
  assert.equal(regionDef('SP', null, 'br-sp-valeparaiba'), 'region def br br-sp br-sp-valeparaiba');
});

test('regionDef ignora região própria inválida', () => {
  assert.equal(regionDef('SP', '15', 'BR-SP-Vale'), 'region def br br-sp br-sp-15');
  assert.equal(regionDef('SP', '15', 'br-mg-31'), 'region def br br-sp br-sp-15');
});

test('regionDef sem UF ou DDD deixa lacuna', () => {
  assert.equal(regionDef(null, null, null), 'region def br br-____ br-____-____');
  assert.equal(regionDef('MG', null, null), 'region def br br-mg br-____-____');
  assert.equal(regionDef(null, '31', null), 'region def br br-____ br-____-____');
});

test('regionDef: DDD que não é da UF não vira região', () => {
  assert.equal(regionDef('SP', '31', null), 'region def br br-sp br-____-____');
});

test('regionDef: UF fora da lista é ausente', () => {
  assert.equal(regionDef('XX', '31', null), 'region def br br-____ br-____-____');
});

test('validateCustomRegion', () => {
  assert.equal(validateCustomRegion('BR-SP-Vale', 'SP').ok, false);
  assert.equal(validateCustomRegion('br-sp-valeparaíba', 'SP').ok, false);
  assert.equal(validateCustomRegion('br-sp-valeparaiba', 'SP').ok, true);
  assert.equal(validateCustomRegion('br-sp-valeparaiba', 'SP').reason, null);
  assert.equal(validateCustomRegion('br-mg-31', 'SP').ok, false);
  assert.equal(validateCustomRegion('br-sp-', 'SP').ok, false);
  assert.equal(validateCustomRegion('br-sp-a b', 'SP').ok, false);
  assert.equal(validateCustomRegion('br-sp-vale', null).ok, false);
  assert.match(validateCustomRegion('br-mg-31', 'SP').reason, /br-sp-/);
  assert.match(validateCustomRegion('BR-SP-Vale', 'SP').reason, /minúsculas/);
});

test('região própria: sem hífen duplo nem hífen no fim', () => {
  assert.equal(validateCustomRegion('br-sp--', 'SP').ok, false);
  assert.equal(validateCustomRegion('br-sp-a-', 'SP').ok, false);
  assert.equal(validateCustomRegion('br-sp-a--b', 'SP').ok, false);
  assert.equal(validateCustomRegion('br-sp-a-b', 'SP').ok, true);
});
