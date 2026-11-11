import test from 'node:test';
import assert from 'node:assert/strict';
import { runAudit, buildRuleCtx } from '../src/core/audit.js';
import { HARDWARE_RULES } from '../src/rules/hardware.js';
import { createState, swapPart, setField } from '../src/core/state.js';

function make(parts = {}, fields = {}) {
  let s = createState(4);
  for (const [slot, id] of Object.entries(parts)) s = swapPart(s, slot, id);
  for (const [f, v] of Object.entries(fields)) s = setField(s, f, v).state;
  return s;
}
const hw = (s) => runAudit(s, [HARDWARE_RULES]);
const find = (items, id) => items.find((i) => i.id === id);
const rule = (id) => HARDWARE_RULES.find((r) => r.id === id);
const withPart = (ctx, slot, extra) => ({ ...ctx, parts: { ...ctx.parts, [slot]: { ...ctx.parts[slot], ...extra } } });
const withProject = (ctx, extra) => ({ ...ctx, project: { ...ctx.project, ...extra } });
const base = () => buildRuleCtx(make());

test('toda regra de peças tem fonte com link, data e firmware', () => {
  const ids = HARDWARE_RULES.map((r) => r.id);
  for (const id of ['HW-01', 'HW-02', 'HW-04', 'HW-05', 'HW-06', 'HW-07', 'HW-08', 'HW-09', 'HW-10', 'HW-11', 'HW-13', 'HW-14']) {
    assert.ok(ids.includes(id), `falta ${id}`);
  }
  for (const r of HARDWARE_RULES) {
    assert.match(r.source, /meshcore-hubreal\/references\//);
    assert.match(r.source, /https:\/\//);
    assert.equal(r.checkedAt, '2026-11-10');
    assert.equal(r.firmware, '1.18.0');
  }
});

test('padrão do projeto 4: nenhum item de peça dispara', () => {
  assert.deepEqual(hw(make()).map((i) => i.id), []);
});

test('HW-01: banda diferente de 915 é Problema; 915 não dispara', () => {
  const r = rule('HW-01');
  assert.equal(r.evaluate(withPart(base(), 'placa', { bandMhz: 868 })).level, 'bad');
  assert.equal(r.evaluate(withPart(base(), 'placa', { bandMhz: 433 })).level, 'bad');
  assert.equal(r.evaluate(base()), null);
});

test('HW-02: antena de 868 é Problema com correção para a padrão; 915 não dispara', () => {
  const items = hw(make({ antena: 'antena-868' }));
  const it = find(items, 'HW-02');
  assert.equal(it.level, 'bad');
  assert.equal(it.slot, 'antena');
  assert.deepEqual(it.fix, { label: 'Trocar por Antena omni 915 MHz 5 dBi', slot: 'antena', partId: 'omni-915-5dbi' });
  assert.equal(find(hw(make()), 'HW-02'), undefined);
  const ctx = withPart(base(), 'antena', { bandMinMhz: 900, bandMaxMhz: 923 });
  assert.equal(rule('HW-02').evaluate(ctx).level, 'bad');
  assert.equal(rule('HW-02').evaluate(withPart(base(), 'antena', { bandMinMhz: 923.125, bandMaxMhz: 923.125 })), null);
});

test('HW-04: antena caseira é Atenção; comercial não dispara', () => {
  const it = find(hw(make({ antena: 'colinear-caseira' })), 'HW-04');
  assert.equal(it.level, 'warn');
  assert.match(it.why, /NanoVNA/);
  assert.match(it.why, /1,5/);
  assert.equal(find(hw(make()), 'HW-04'), undefined);
});

test('HW-05: ganho >= 6 em pico é Atenção; ganho desconhecido ou outro local não dispara', () => {
  const it = find(hw(make({ antena: 'omni-915-8dbi' }, { location: 'pico' })), 'HW-05');
  assert.equal(it.level, 'warn');
  assert.deepEqual(it.fix, { label: 'Trocar por Antena omni 915 MHz 5 dBi', slot: 'antena', partId: 'omni-915-5dbi' });
  assert.equal(find(hw(make({ antena: 'omni-915-8dbi' }, { location: 'telhado' })), 'HW-05'), undefined);
  assert.equal(find(hw(make({ antena: 'antena-915-simples' }, { location: 'pico' })), 'HW-05'), undefined);
  assert.equal(find(hw(make({}, { location: 'pico' })), 'HW-05'), undefined);
  const six = withPart(buildRuleCtx(make({}, { location: 'pico' })), 'antena', { gainDbi: 6 });
  assert.equal(rule('HW-05').evaluate(six).level, 'warn');
});

test('HW-06: RG-58 de 3 m é Atenção; pigtail, LMR-400 e RG-58 de 1 m não disparam', () => {
  const it = find(hw(make({ cabo: 'rg58-3m' })), 'HW-06');
  assert.equal(it.level, 'warn');
  assert.equal(it.fix.partId, 'pigtail-15cm');
  assert.equal(it.fix.slot, 'cabo');
  assert.equal(find(hw(make({ cabo: 'lmr400-3m' })), 'HW-06'), undefined);
  assert.equal(find(hw(make()), 'HW-06'), undefined);
  assert.equal(rule('HW-06').evaluate(withPart(base(), 'cabo', { type: 'RG-58', lengthM: 1 })), null);
});

test('HW-07: ESP32 em repetidor solar é Atenção com troca para nRF52; nRF52 não dispara', () => {
  const it = find(hw(make({ placa: 'xiao-esp32s3-wio' })), 'HW-07');
  assert.equal(it.level, 'warn');
  assert.equal(it.fix.partId, 'xiao-nrf52840-wio');
  assert.equal(find(hw(make()), 'HW-07'), undefined);
  assert.equal(rule('HW-07').evaluate(withProject(withPart(base(), 'placa', { mcu: 'esp32' }), { power: 'mains' })), null);
});

test('HW-08: GPS em nó fixo é Atenção; companion e sem GPS não disparam', () => {
  const ctx = withPart(base(), 'placa', { gps: true });
  assert.equal(rule('HW-08').evaluate(ctx).level, 'warn');
  assert.equal(rule('HW-08').evaluate(withProject(ctx, { role: 'companion' })), null);
  assert.equal(rule('HW-08').evaluate(base()), null);
});

test('HW-09: placa sem suporte oficial é Problema; suportada não dispara', () => {
  const ctx = withPart(base(), 'placa', { supported: false });
  const it = rule('HW-09').evaluate(ctx);
  assert.equal(it.level, 'bad');
  assert.equal(it.fix.partId, 'xiao-nrf52840-wio');
  assert.equal(rule('HW-09').evaluate(base()), null);
});

test('HW-10: XIAO sem o Wio é Problema com correção; com rádio não dispara', () => {
  const items = hw(make({ placa: 'xiao-nrf52840-sem-wio' }));
  const it = find(items, 'HW-10');
  assert.equal(it.level, 'bad');
  assert.equal(it.fix.partId, 'xiao-nrf52840-wio');
  assert.equal(find(hw(make()), 'HW-10'), undefined);
});

test('HW-11 (atributo tbeam): T-Beam em repetidor solar é Atenção; sem o atributo ou fora do solar não dispara', () => {
  const ctx = withPart(base(), 'placa', { tbeam: true, mcu: 'nrf52', gps: false });
  assert.equal(rule('HW-11').evaluate(ctx).level, 'warn');
  assert.equal(rule('HW-11').evaluate(base()), null);
  assert.equal(rule('HW-11').evaluate(withProject(ctx, { power: 'mains' })), null);
});

test('HW-13 (atributos pa.needs5V e supplyV): PA de 5 V com placa de 3,3 V é Problema', () => {
  const pa = { needs5V: true, outDbm: { 22: 30 }, peakMa: { 22: 1000 } };
  assert.equal(rule('HW-13').evaluate(withPart(base(), 'placa', { pa, supplyV: 3.3 })).level, 'bad');
  assert.equal(rule('HW-13').evaluate(withPart(base(), 'placa', { pa, supplyV: 5 })), null);
  assert.equal(rule('HW-13').evaluate(withPart(base(), 'placa', { pa: { ...pa, needs5V: false }, supplyV: 3.3 })), null);
  assert.equal(rule('HW-13').evaluate(base()), null);
});

test('HW-14 (atributo bleWeak): Bluetooth fraco em companion é Atenção informativa; repetidor ou sem atributo não dispara', () => {
  const ctx = withProject(withPart(base(), 'placa', { bleWeak: true }), { role: 'companion' });
  assert.equal(rule('HW-14').evaluate(ctx).level, 'warn');
  assert.equal(rule('HW-14').evaluate(withPart(base(), 'placa', { bleWeak: true })), null);
  assert.equal(rule('HW-14').evaluate(withProject(base(), { role: 'companion' })), null);
});

test('peça no slot aparelho (companion pronto) também é avaliada', () => {
  const ctx = base();
  const { placa, ...rest } = ctx.parts;
  const c2 = withProject({ ...ctx, parts: { ...rest, aparelho: { ...placa, bandMhz: 868 } } }, { role: 'companion' });
  const it = rule('HW-01').evaluate(c2);
  assert.equal(it.level, 'bad');
  assert.equal(it.slot, 'aparelho');
});
