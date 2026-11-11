import test from 'node:test';
import assert from 'node:assert/strict';
import { priceLabel, blockerText, mainPartName } from '../src/ui/projects-step.js';
import { PROJECTS, BLOCKER_REASONS } from '../src/data/projects.js';

const SRC = 'Fonte X';
const P = (min, max, date = '2026-04-27') => ({ min, max, source: SRC, date });
const parts = {
  a: { name: 'Placa A', price: P(100, 120, '2026-05-01') },
  b: { name: 'Fonte B', price: P(20, 30, '2026-03-02') },
  c: { name: 'Antena C' },
};
const proj = (slots) => ({ slots });

test('priceLabel: todas as peças padrão com preço -> soma como faixa, data mais antiga e fonte', () => {
  const t = priceLabel(proj({ placa: { default: 'a' }, fonte: { default: 'b' } }), parts);
  assert.equal(t, 'R$ 120–150 · em 02/03/2026 · fonte: Fonte X');
});

test('priceLabel: faixa sem intervalo mostra um valor só', () => {
  const t = priceLabel(proj({ aparelho: { default: 'b' } }), { b: { price: P(380, 380, '2026-04-27') } });
  assert.equal(t, 'R$ 380 · em 27/04/2026 · fonte: Fonte X');
});

test('priceLabel: só a placa tem preço -> "placa ~R$ X" com data e fonte', () => {
  const t = priceLabel(proj({ placa: { default: 'a' }, antena: { default: 'c' } }), parts);
  assert.equal(t, 'placa ~R$ 100–120 · em 01/05/2026 · fonte: Fonte X');
});

test('priceLabel: aparelho principal com preço, outras peças sem', () => {
  const t = priceLabel(proj({ aparelho: { default: 'b' }, antena: { default: 'c' } }), parts);
  assert.equal(t, 'aparelho ~R$ 20–30 · em 02/03/2026 · fonte: Fonte X');
});

test('priceLabel: nada com preço -> sem preço de referência', () => {
  assert.equal(priceLabel(proj({ placa: { default: 'c' } }), parts), 'sem preço de referência');
  assert.equal(priceLabel(proj({}), parts), 'sem preço de referência');
});

test('priceLabel com os dados reais: nunca inventa e sempre traz data e fonte quando há valor', () => {
  for (const p of Object.values(PROJECTS)) {
    const t = priceLabel(p);
    if (t !== 'sem preço de referência') assert.match(t, /R\$ .* · em \d{2}\/\d{2}\/\d{4} · fonte: .+/);
  }
  assert.match(priceLabel(PROJECTS[1]), /^R\$ 380 /);
});

test('mainPartName: placa ou aparelho padrão', () => {
  assert.equal(mainPartName(PROJECTS[1]), 'Seeed Wio Tracker L1 Pro');
  assert.equal(mainPartName(PROJECTS[4]), 'Kit XIAO nRF52840 + Wio-SX1262');
});

test('BLOCKER_REASONS cobre R1 a R5 e todo projeto em-breve tem motivo', () => {
  for (const k of ['R1', 'R2', 'R3', 'R4', 'R5']) assert.ok(BLOCKER_REASONS[k], k);
  assert.match(BLOCKER_REASONS.R3, /1 W/);
  for (const p of Object.values(PROJECTS).filter((x) => x.status === 'em-breve')) {
    assert.ok(blockerText(p).length > 10, `projeto ${p.id}`);
  }
  assert.equal(blockerText({ blockedBy: ['R2', 'R4'] }), `${BLOCKER_REASONS.R2}; ${BLOCKER_REASONS.R4}`);
});
