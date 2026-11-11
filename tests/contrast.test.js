import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrast } from '../src/ui/contrast.js';

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
function token(name) {
  const m = css.match(new RegExp(`--${name}[ \\t]*:[ \\t]*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `token --${name} ausente em tokens.css`);
  return m[1];
}

test('contrast: referências conhecidas', () => {
  assert.equal(Math.round(contrast('#000000', '#FFFFFF')), 21);
  assert.equal(contrast('#FFFFFF', '#FFFFFF'), 1);
});

const pares = [
  ['tinta', 'papel'],
  ['branco', 'azul-tinta'],
  ['azul-tinta', 'papel'],
  ['ok', 'ok-fundo'],
  ['atencao', 'atencao-fundo'],
  ['problema', 'problema-fundo'],
  ['texto-secundario', 'papel'],
];
for (const [a, b] of pares) {
  test(`contraste ${a} sobre ${b} >= 4,5`, () => {
    const c = contrast(token(a), token(b));
    assert.ok(c >= 4.5, `${a}/${b} = ${c.toFixed(2)}`);
  });
}
