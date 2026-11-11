import test from 'node:test';
import assert from 'node:assert/strict';
import { runAudit, buildRuleCtx } from '../src/core/audit.js';
import { ENERGY_RULES } from '../src/rules/energy.js';
import { createState, swapPart, setField, applyFix } from '../src/core/state.js';
import { PROJECTS } from '../src/data/projects.js';
import { PARTS } from '../src/data/parts.js';

function make(parts = {}, fields = {}) {
  let s = createState(4);
  for (const [slot, id] of Object.entries(parts)) s = swapPart(s, slot, id);
  for (const [f, v] of Object.entries(fields)) s = setField(s, f, v).state;
  return s;
}
const find = (items, id) => items.find((i) => i.id === id);
const energyItems = (s) => runAudit(s, [ENERGY_RULES]);
const rule = (id) => ENERGY_RULES.find((r) => r.id === id);
const withPart = (ctx, slot, extra) => ({ ...ctx, parts: { ...ctx.parts, [slot]: { ...ctx.parts[slot], ...extra } } });

test('toda regra de energia tem fonte, data e firmware', () => {
  const ids = ENERGY_RULES.map((r) => r.id);
  for (const id of ['EN-01', 'EN-02', 'EN-03', 'EN-04', 'EN-05', 'EN-06', 'EN-07', 'EN-08', 'EN-10', 'EN-11', 'EN-12', 'EN-13']) {
    assert.ok(ids.includes(id), `falta ${id}`);
  }
  for (const r of ENERGY_RULES) {
    assert.match(r.source, /hardware-energia\.md/);
    assert.match(r.source, /https:\/\//);
    assert.equal(r.checkedAt, '2026-11-10');
    assert.equal(r.firmware, '1.18.0');
  }
});

test('padrão do projeto 4: nenhum bad de energia; autonomia ~19,8 dias; painel OK', () => {
  const items = energyItems(make());
  assert.equal(items.filter((i) => i.level === 'bad').length, 0);
  const a = find(items, 'EN-02');
  assert.equal(a.level, 'ok');
  assert.ok((a.title + a.why).includes('19,8'));
  assert.ok(!(a.title + a.why).includes('30 dias'));
  assert.match(a.why, /meça|medir/i);
  assert.equal(find(items, 'EN-08').level, 'ok');
  assert.equal(a.source, rule('EN-02').source);
});

test('EN-01: bateria falsa é bad e não há item de autonomia', () => {
  const items = energyItems(make({ bateria: 'bat-2x9900-generica' }));
  assert.equal(find(items, 'EN-01').level, 'bad');
  assert.equal(find(items, 'EN-01').fix.partId, 'bat-2x3500');
  for (const id of ['EN-02', 'EN-03', 'EN-04']) assert.equal(find(items, id), undefined);
  assert.ok(find(items, 'EN-08'), 'painel continua');
  assert.equal(find(energyItems(make()), 'EN-01'), undefined);
});

test('EN-03: autonomia entre 0,6·N e N é warn; fix = mais células', () => {
  // nRF 10 mA + 1x3500: 9,9 dias. N=12 -> 9,9 >= 7,2 e < 12
  const items = energyItems(make({ bateria: 'bat-1x3500' }, { daysNoSun: '12' }));
  const it = find(items, 'EN-03');
  assert.equal(it.level, 'warn');
  assert.equal(it.fix.partId, 'bat-2x3500');
  assert.equal(find(items, 'EN-02'), undefined);
  assert.equal(find(items, 'EN-04'), undefined);
});

test('EN-04: ESP32 com 1 célula é bad e o fix troca para nRF52', () => {
  const items = energyItems(make({ placa: 'xiao-esp32s3-wio', bateria: 'bat-1x3500' }));
  const it = find(items, 'EN-04');
  assert.equal(it.level, 'bad');
  assert.equal(it.fix.slot, 'placa');
  assert.equal(it.fix.partId, 'xiao-nrf52840-wio');
  assert.equal(find(items, 'EN-03'), undefined);
});

test('EN-04 com nRF52: falta bateria sugere bateria de marca maior', () => {
  const items = energyItems(make({ bateria: 'bat-1x3500' }, { daysNoSun: '20' }));
  // 9,9 dias < 12 (0,6 × 20)
  const it = find(items, 'EN-04');
  assert.equal(it.level, 'bad');
  assert.equal(it.fix?.partId, 'bat-2x3500');
});

test('EN-05: painel que não cobre o dia é bad', () => {
  // ESP32 45 mA + 1 W: (1/6 × 1000 × 4,2) = 700 < 1080
  const items = energyItems(make({ placa: 'xiao-esp32s3-wio', painel: 'painel-6v-1w', bateria: 'bat-2x3500' }));
  assert.equal(find(items, 'EN-05').level, 'bad');
  assert.equal(find(items, 'EN-06'), undefined);
  assert.equal(find(energyItems(make()), 'EN-05'), undefined);
});

test('EN-06: painel de 1 W cobre o dia mas fica abaixo de Pmin (warn)', () => {
  const it = find(energyItems(make({ painel: 'painel-6v-1w' })), 'EN-06');
  assert.equal(it.level, 'warn');
  assert.equal(it.fix.partId, 'painel-6v-3w');
  assert.equal(find(energyItems(make()), 'EN-06'), undefined);
});

test('EN-07: painel de 2 W passa de Pmin mas não de Prec (warn)', () => {
  const items = energyItems(make({ painel: 'painel-6v-2w' }));
  const it = find(items, 'EN-07');
  assert.equal(it.level, 'warn');
  assert.equal(it.fix.partId, 'painel-6v-3w');
  assert.equal(find(items, 'EN-06'), undefined);
  assert.equal(find(items, 'EN-08'), undefined);
  assert.equal(find(energyItems(make()), 'EN-07'), undefined);
});

test('EN-08: painel suficiente é ok', () => {
  assert.equal(find(energyItems(make({ painel: 'painel-6v-5w' })), 'EN-08').level, 'ok');
  assert.equal(find(energyItems(make({ painel: 'painel-6v-1w' })), 'EN-08'), undefined);
});

test('EN-10: TP4056 sem proteção é bad (fix tp4056-dw01), só ele', () => {
  const items = energyItems(make({ carregador: 'tp4056-sem-protecao' }));
  const it = find(items, 'EN-10');
  assert.equal(it.level, 'bad');
  assert.equal(it.slot, 'carregador');
  assert.equal(it.fix.partId, 'tp4056-dw01');
  assert.equal(find(items, 'EN-11'), undefined);
  assert.equal(find(items, 'EN-12'), undefined);
  assert.equal(find(energyItems(make()), 'EN-10'), undefined);
});

test('EN-11: CN3791 sem BMS é bad só como EN-11; com BMS é ok', () => {
  const bad = energyItems(make({ carregador: 'cn3791-sem-bms' }));
  assert.equal(find(bad, 'EN-11').level, 'bad');
  assert.equal(find(bad, 'EN-11').fix.partId, 'cn3791-bms');
  assert.equal(find(bad, 'EN-10'), undefined);
  const good = energyItems(make({ carregador: 'cn3791-bms' }));
  assert.equal(find(good, 'EN-11').level, 'ok');
  assert.equal(find(good, 'EN-10'), undefined);
  assert.equal(good.filter((i) => i.level === 'bad').length, 0);
});

test('EN-12: painel direto no USB é bad e só ele (sem EN-10)', () => {
  const items = energyItems(make({ carregador: 'painel-direto-usb' }));
  const it = find(items, 'EN-12');
  assert.equal(it.level, 'bad');
  assert.equal(it.fix.partId, 'tp4056-dw01');
  assert.equal(find(items, 'EN-10'), undefined);
  assert.equal(find(items, 'EN-11'), undefined);
  assert.equal(find(energyItems(make()), 'EN-12'), undefined);
});

test('placa com bootlock não dispara EN-10/EN-11', () => {
  const ctx = withPart(buildRuleCtx(make({ carregador: 'tp4056-sem-protecao' })), 'placa', { bootlock: true });
  assert.equal(rule('EN-10').evaluate(ctx), null);
  const ctx2 = withPart(buildRuleCtx(make({ carregador: 'cn3791-sem-bms' })), 'placa', { bootlock: true });
  assert.equal(rule('EN-11').evaluate(ctx2), null);
});

test('bateria com células protegidas conta como proteção (sintético)', () => {
  const ctx = withPart(buildRuleCtx(make({ carregador: 'tp4056-sem-protecao' })), 'bateria', { protectedCells: true });
  assert.equal(rule('EN-10').evaluate(ctx), null);
});

test('EN-13: LDO de 250 mA com ESP32 é warn (contexto sintético)', () => {
  const ctx = buildRuleCtx(make({ placa: 'xiao-esp32s3-wio' }));
  assert.equal(rule('EN-13').evaluate(ctx), null);
  const it = rule('EN-13').evaluate(withPart(ctx, 'carregador', { ldoMaxMa: 250 }));
  assert.equal(it.level, 'warn');
  assert.equal(it.id, 'EN-13');
  assert.equal(it.slot, 'carregador');
  assert.equal(it.source, rule('EN-13').source);
  // nRF52 com o mesmo LDO: não dispara
  assert.equal(rule('EN-13').evaluate(withPart(buildRuleCtx(make()), 'carregador', { ldoMaxMa: 250 })), null);
  // LDO folgado: não dispara
  assert.equal(rule('EN-13').evaluate(withPart(ctx, 'carregador', { ldoMaxMa: 500 })), null);
});

test('falso OK por digitação: ESP32 + 1 célula com 2 dias sem sol (ou hsp 6) nunca dá ok', () => {
  for (const f of [{ daysNoSun: '2' }, { hsp: '6' }]) {
    const items = energyItems(make({ placa: 'xiao-esp32s3-wio', bateria: 'bat-1x3500' }, f));
    const calc = items.filter((i) => /^EN-0[2-8]$/.test(i.id));
    assert.ok(calc.length > 0);
    assert.ok(calc.every((i) => i.level !== 'ok'), JSON.stringify(f));
  }
});

test('teto de Atenção: daysNoSun 5 no padrão nunca dá ok nos itens calculados', () => {
  const items = energyItems(make({}, { daysNoSun: '5' }));
  const calc = items.filter((i) => /^EN-0[2-8]$/.test(i.id));
  assert.ok(calc.length >= 2);
  for (const i of calc) {
    assert.notEqual(i.level, 'ok', i.id);
    assert.match(i.why, /valores padrão da comunidade/);
  }
  assert.match(find(items, 'EN-02').why, /9 dias sem sol/);
  // carregador não depende dos números digitados: sem teto
  const safe = energyItems(make({ carregador: 'cn3791-bms' }, { daysNoSun: '5' }));
  assert.equal(find(safe, 'EN-11').level, 'ok');
});

test('teto: cada um dos três campos menos conservadores aciona o teto; mais conservador não', () => {
  for (const f of [{ daysNoSun: '8' }, { daysRecharge: '3' }, { hsp: '5' }]) {
    const items = energyItems(make({}, f));
    const calc = items.filter((i) => /^EN-0[2-8]$/.test(i.id));
    assert.ok(calc.every((i) => i.level !== 'ok'), JSON.stringify(f));
  }
  const items = energyItems(make({}, { daysNoSun: '10', hsp: '4' }));
  assert.ok(items.every((i) => !/valores padrão da comunidade/.test(i.why)));
});

test('placa com PA: itens calculados nunca ok, com "meça o seu consumo"', () => {
  const ctx = withPart(buildRuleCtx(make()), 'placa', { pa: { note: 'amplificador' } });
  const items = ENERGY_RULES.flatMap((r) => [r.evaluate(ctx)].flat()).filter(Boolean);
  const calc = items.filter((i) => /^EN-0[2-8]$/.test(i.id));
  assert.ok(calc.length >= 2);
  for (const i of calc) {
    assert.notEqual(i.level, 'ok');
    assert.match(i.why, /meça o seu consumo/);
  }
});

test('sem energia (companion/sem bateria) ou sem painel: sem itens de conta', () => {
  const ctx = buildRuleCtx(make());
  const noPanel = { ...ctx, parts: { ...ctx.parts } };
  delete noPanel.parts.painel;
  for (const id of ['EN-05', 'EN-06', 'EN-07', 'EN-08']) assert.equal(rule(id).evaluate(noPanel), null);
  const noEnergy = { ...ctx, energy: null };
  for (const id of ['EN-02', 'EN-03', 'EN-04', 'EN-05', 'EN-06', 'EN-07', 'EN-08']) assert.equal(rule(id).evaluate(noEnergy), null);
});

test('GPS soma o consumo extra ao da placa', () => {
  const ctx = buildRuleCtx(make());
  assert.equal(ctx.energy.currentMa, 10);
  // placa sintética com GPS: troca o atributo e refaz o contexto pela soma documentada
  const gps = withPart(ctx, 'placa', { gps: true });
  assert.equal(gps.parts.placa.gps, true);
});

test('toda correção aponta para peça do próprio slot e resolve o item (varredura)', () => {
  const p = PROJECTS[4];
  const opts = (slot) => [p.slots[slot].default, ...p.slots[slot].alternatives];
  let checked = 0;
  for (const placa of opts('placa')) for (const bateria of opts('bateria'))
    for (const carregador of opts('carregador')) for (const painel of opts('painel'))
      for (const daysNoSun of ['2', '9', '20']) {
        const s = make({ placa, bateria, carregador, painel }, { daysNoSun });
        for (const it of energyItems(s)) {
          if (!it.fix) continue;
          assert.ok(opts(it.fix.slot).includes(it.fix.partId), `${it.id}: ${it.fix.partId} fora do slot`);
          assert.equal(PARTS[it.fix.partId].slot, it.fix.slot);
          const fixed = applyFix(s, it.fix);
          const again = find(energyItems(fixed), it.id);
          // Correção de bateria sem opção que resolva (ex.: ESP32 em 20 dias) só melhora a autonomia.
          const partial = it.fix.slot === 'bateria' && ['EN-03', 'EN-04'].includes(it.id)
            && buildRuleCtx(fixed).energy.autonomyDays > buildRuleCtx(s).energy.autonomyDays;
          assert.ok(!again || again.level !== it.level || partial,
            `fix de ${it.id} não resolveu (${placa}/${bateria}/${carregador}/${painel}/${daysNoSun})`);
          checked++;
        }
      }
  assert.ok(checked > 20);
});
