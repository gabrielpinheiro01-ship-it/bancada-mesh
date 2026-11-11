import test from 'node:test';
import assert from 'node:assert/strict';
import { runAudit, summarize, buildRuleCtx, DEFAULT_RULE_SETS } from '../src/core/audit.js';
import { createState, swapPart } from '../src/core/state.js';

test('runAudit ordena bad, depois warn, depois ok, e por id dentro do nível', () => {
  let s = createState(4);
  s = swapPart(s, 'painel', 'painel-6v-2w'); // EN-07 warn
  s = swapPart(s, 'carregador', 'tp4056-sem-protecao'); // EN-10 bad
  const items = runAudit(s);
  const order = { bad: 0, warn: 1, ok: 2 };
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1];
    const b = items[i];
    assert.ok(order[a.level] <= order[b.level], `${a.id} antes de ${b.id}`);
    if (a.level === b.level) assert.ok(a.id < b.id, `ids fora de ordem: ${a.id} ${b.id}`);
  }
  assert.ok(items.some((i) => i.level === 'bad') && items.some((i) => i.level === 'ok'));
});

test('summarize conta bad e warn', () => {
  assert.deepEqual(summarize([{ level: 'bad' }, { level: 'warn' }, { level: 'warn' }, { level: 'ok' }]), { bad: 1, warn: 2 });
  assert.deepEqual(summarize([]), { bad: 0, warn: 0 });
});

test('runAudit aceita conjuntos de regras: lista, item ou null; preenche source', () => {
  const meta = { checkedAt: '2026-11-10', firmware: '1.18.0' };
  const sets = [[
    { id: 'X-1', source: 's1', ...meta, evaluate: () => null },
    { id: 'X-2', source: 's2', ...meta, evaluate: () => ({ id: 'X-2', level: 'warn', slot: 'placa', title: 't', why: 'w' }) },
    { id: 'X-3', source: 's3', ...meta, evaluate: () => [
      { id: 'X-3b', level: 'ok', slot: 'placa', title: 't', why: 'w', source: 's3' },
      { id: 'X-3a', level: 'bad', slot: 'placa', title: 't', why: 'w', source: 's3' },
    ] },
  ]];
  const items = runAudit(createState(4), sets);
  assert.deepEqual(items.map((i) => i.id), ['X-3a', 'X-2', 'X-3b']);
  assert.equal(items.find((i) => i.id === 'X-2').source, 's2');
});

test('DEFAULT_RULE_SETS inclui as regras de energia', () => {
  assert.ok(Array.isArray(DEFAULT_RULE_SETS) && DEFAULT_RULE_SETS.length >= 1);
  assert.ok(DEFAULT_RULE_SETS.flat().some((r) => r.id === 'EN-02'));
});

test('buildRuleCtx: energia do projeto 4 e flag lessConservative', () => {
  const s = createState(4);
  const ctx = buildRuleCtx(s);
  assert.equal(ctx.lessConservative, false);
  assert.equal(ctx.energy.currentMa, 10);
  assert.equal(ctx.energy.batteryMah, 7000);
  assert.equal(ctx.energy.panelW, 3);
  assert.equal(ctx.parts.placa.mcu, 'nrf52');
  assert.equal(buildRuleCtx({ ...s, daysNoSun: 5 }).lessConservative, true);
  assert.equal(buildRuleCtx({ ...s, daysRecharge: 3 }).lessConservative, true);
  assert.equal(buildRuleCtx({ ...s, hsp: 5 }).lessConservative, true);
  assert.equal(buildRuleCtx({ ...s, daysNoSun: 10, hsp: 4 }).lessConservative, false);
});
