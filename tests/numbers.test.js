import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumberBR, formatBR } from '../src/core/numbers.js';

test('parseNumberBR aceita vírgula decimal', () => {
  assert.equal(parseNumberBR('4,2'), 4.2);
});

test('parseNumberBR aceita ponto decimal', () => {
  assert.equal(parseNumberBR('4.2'), 4.2);
});

test('parseNumberBR ignora espaços nas pontas', () => {
  assert.equal(parseNumberBR(' 9 '), 9);
});

test('parseNumberBR aceita sinal negativo (o limite fica com setField)', () => {
  assert.equal(parseNumberBR('-3'), -3);
});

test('parseNumberBR devolve null para vazio, só espaços e texto', () => {
  assert.equal(parseNumberBR(''), null);
  assert.equal(parseNumberBR('   '), null);
  assert.equal(parseNumberBR('abc'), null);
});

test('parseNumberBR devolve null para formatos que não são decimal simples', () => {
  assert.equal(parseNumberBR('4,2,1'), null);
  assert.equal(parseNumberBR('1e3'), null);
  assert.equal(parseNumberBR('Infinity'), null);
  assert.equal(parseNumberBR('NaN'), null);
  assert.equal(parseNumberBR('1.000,5'), null);
});

test('parseNumberBR nunca devolve NaN', () => {
  for (const t of ['', 'x', '--1', '1-', '0x10']) {
    const v = parseNumberBR(t);
    assert.ok(v === null || Number.isFinite(v), `entrada ${JSON.stringify(t)} devolveu ${v}`);
  }
});

test('formatBR usa vírgula decimal', () => {
  assert.equal(formatBR(19.833, 1), '19,8');
});

test('formatBR sem casas decimais', () => {
  assert.equal(formatBR(2160, 0), '2160');
});
