// Funções puras do passo 2 (bancada): níveis por slot, barras de energia, resumo, opções de DDD e catálogo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVEL_WORD, worstBySlot, slotLevels, summaryText, summaryLevel, energyBars, dddOptions, ufOptions,
  numText, badgeBox, pickBadgeBox, textBox, fieldTarget, itemActionLabel, visibleFields, catalogGroups, nextTabIndex, TABS, detailModel,
} from '../src/ui/bench-model.js';
import { createState, swapPart, setField } from '../src/core/state.js';
import { runAudit, buildRuleCtx } from '../src/core/audit.js';
import { DDD_BY_UF } from '../src/data/ddd.js';
import { PARTS } from '../src/data/parts.js';

const it = (id, level, slot, extra = {}) => ({ id, level, slot, title: id, why: '', source: 'x', ...extra });
const bars = (s) => energyBars(buildRuleCtx(s).energy, runAudit(s), s);

test('LEVEL_WORD: palavra de cada nível (problema nunca só pela cor)', () => {
  assert.deepEqual({ ...LEVEL_WORD }, { bad: 'Problema', warn: 'Atenção', ok: 'OK' });
});

test('worstBySlot: bad vence warn, OK não marca', () => {
  const items = [it('A', 'warn', 'placa'), it('B', 'bad', 'placa'), it('C', 'ok', 'bateria'), it('D', 'warn', 'caixa')];
  assert.deepEqual(worstBySlot(items), { placa: 'bad', caixa: 'warn' });
  assert.deepEqual(worstBySlot([]), {});
});

test('slotLevels: bad > warn > sel; slot selecionado sem problema vira sel', () => {
  const items = [it('A', 'bad', 'carregador'), it('B', 'warn', 'caixa'), it('C', 'ok', 'painel')];
  assert.deepEqual(slotLevels(items, 'painel'), { carregador: 'bad', caixa: 'warn', painel: 'sel' });
  assert.deepEqual(slotLevels(items, 'carregador'), { carregador: 'bad', caixa: 'warn' });
  assert.deepEqual(slotLevels(items, 'caixa'), { carregador: 'bad', caixa: 'warn' });
  assert.deepEqual(slotLevels(items, null), { carregador: 'bad', caixa: 'warn' });
  assert.deepEqual(slotLevels([], 'antena'), { antena: 'sel' });
});

test('summaryText: singular, plural e "nenhum"', () => {
  assert.equal(summaryText({ bad: 0, warn: 0 }), 'Nenhum problema · nenhum ponto de atenção');
  assert.equal(summaryText({ bad: 0, warn: 1 }), 'Nenhum problema · 1 ponto de atenção');
  assert.equal(summaryText({ bad: 0, warn: 3 }), 'Nenhum problema · 3 pontos de atenção');
  assert.equal(summaryText({ bad: 1, warn: 0 }), '1 problema · nenhum ponto de atenção');
  assert.equal(summaryText({ bad: 2, warn: 1 }), '2 problemas · 1 ponto de atenção');
});

test('summaryLevel: problema > atenção > ok', () => {
  assert.equal(summaryLevel({ bad: 1, warn: 5 }), 'bad');
  assert.equal(summaryLevel({ bad: 0, warn: 1 }), 'warn');
  assert.equal(summaryLevel({ bad: 0, warn: 0 }), 'ok');
});

test('numText: vírgula decimal, inteiro sem casas', () => {
  assert.equal(numText(9), '9');
  assert.equal(numText(4.2), '4,2');
  assert.equal(numText(4.25), '4,25');
});

test('dddOptions: DDDs do estado (cópia) ou lista vazia', () => {
  assert.deepEqual(dddOptions('MG'), ['31', '32', '33', '34', '35', '37', '38']);
  assert.deepEqual(dddOptions('DF'), ['61']);
  assert.deepEqual(dddOptions(null), []);
  assert.deepEqual(dddOptions('XX'), []);
  const l = dddOptions('SP');
  l.push('00');
  assert.ok(!DDD_BY_UF.SP.includes('00'));
});

test('ufOptions: as 27 siglas em ordem alfabética', () => {
  const ufs = ufOptions();
  assert.equal(ufs.length, 27);
  assert.deepEqual(ufs, [...ufs].sort());
  assert.ok(ufs.includes('MG') && ufs.includes('TO'));
});

test('energyBars: sem energia (projetos 1 e 3) -> null', () => {
  assert.equal(bars(createState(1)), null);
  assert.equal(bars(createState(3)), null);
});

test('energyBars: projeto 4 padrão bate com o exemplo do spec (19,8 dias; 1,89 e 2,36 W) e sai OK', () => {
  const b = bars(createState(4));
  assert.equal(b.autonomy.valueText, '19,8 dias');
  assert.equal(b.autonomy.level, 'ok');
  assert.equal(b.autonomy.levelWord, 'OK');
  assert.equal(b.autonomy.marks.length, 1);
  assert.equal(b.autonomy.marks[0].text, 'meta: 9 dias');
  assert.ok(b.autonomy.pct > b.autonomy.marks[0].pct, 'valor passa da meta');
  assert.ok(b.autonomy.pct <= 100 && b.autonomy.pct > 0);
  assert.equal(b.panel.valueText, '3 W');
  assert.equal(b.panel.level, 'ok');
  assert.deepEqual(b.panel.marks.map((m) => m.text), ['mínimo 1,89 W', 'recomendado 2,36 W']);
  assert.ok(b.panel.marks[0].pct < b.panel.marks[1].pct);
  assert.ok(b.panel.pct > b.panel.marks[1].pct);
  assert.match(b.autonomy.text, /19,8 dias/);
  assert.match(b.autonomy.text, /meta: 9 dias/);
  assert.match(b.autonomy.text, /OK/);
});

test('energyBars: nível vem da auditoria (com valor menos conservador fica no máximo Atenção)', () => {
  const s = setField(createState(4), 'daysNoSun', '5').state; // menos conservador que 9
  const b = bars(s);
  assert.equal(b.autonomy.level, 'warn');
  assert.equal(b.autonomy.marks[0].text, 'meta: 5 dias');
  assert.equal(b.panel.level, 'warn');
});

test('energyBars: painel de 1 W e bateria curta saem Problema', () => {
  let s = swapPart(createState(4), 'painel', 'painel-6v-1w');
  s = swapPart(s, 'placa', 'xiao-esp32s3-wio');
  s = swapPart(s, 'bateria', 'bat-1x3500');
  const b = bars(s);
  assert.equal(b.panel.level, 'bad');
  assert.equal(b.autonomy.level, 'bad');
  assert.equal(b.panel.levelWord, 'Problema');
});

test('energyBars: bateria falsa NÃO mostra autonomia (sem falso OK)', () => {
  const s = swapPart(createState(4), 'bateria', 'bat-2x9900-generica');
  const b = bars(s);
  assert.equal(b.autonomy.value, null);
  assert.equal(b.autonomy.pct, 0);
  assert.equal(b.autonomy.level, 'bad');
  assert.match(b.autonomy.valueText, /não calculada/);
  assert.doesNotMatch(b.autonomy.text, /56/);
});

test('energyBars: sem item de auditoria correspondente -> Atenção e "não calculada" (na dúvida, Atenção)', () => {
  const energy = { currentMa: 0, batteryMah: 7000, panelW: 3, autonomyDays: Infinity, Pmin: NaN, Prec: NaN, coversDay: true };
  const b = energyBars(energy, [], { daysNoSun: 9 });
  assert.equal(b.autonomy.level, 'warn');
  assert.equal(b.autonomy.value, null);
  assert.equal(b.panel.level, 'warn');
  assert.match(b.panel.valueText, /3 W/);
  assert.equal(b.panel.marks.length, 0);
});

test('energyBars: valor enorme não estoura a barra e a meta continua visível', () => {
  const energy = { currentMa: 1, batteryMah: 7000, panelW: 50, autonomyDays: 400, Pmin: 1, Prec: 1.25, coversDay: true };
  const items = [it('EN-02', 'ok', 'bateria'), it('EN-08', 'ok', 'painel')];
  const b = energyBars(energy, items, { daysNoSun: 9 });
  assert.equal(b.autonomy.pct, 100);
  assert.ok(b.autonomy.marks[0].pct >= 25, 'meta não some no canto');
  assert.equal(b.panel.pct, 100);
  assert.ok(b.panel.marks[0].pct >= 20);
});

test('badgeBox: selo fica dentro do desenho, encostado no canto de cima à direita do contorno', () => {
  const vb = { width: 640, height: 1124 };
  const a = badgeBox({ x: 300, y: 600, width: 200, height: 100 }, vb, 'bad');
  assert.ok(a.x + a.w <= 500 + 1 && a.x + a.w >= 500 - 20, 'alinhado à direita do contorno');
  assert.ok(a.y < 600 && a.y + a.h > 600, 'sobre a linha de cima');
  const edge = badgeBox({ x: 555, y: 5, width: 34, height: 240 }, vb, 'warn');
  assert.ok(edge.x >= 0 && edge.x + edge.w <= 640);
  assert.ok(edge.y >= 0);
  const left = badgeBox({ x: 0, y: 300, width: 40, height: 40 }, vb, 'bad');
  assert.ok(left.x >= 0);
  assert.ok(badgeBox({ x: 0, y: 0, width: 300, height: 40 }, vb, 'bad').w > badgeBox({ x: 0, y: 0, width: 300, height: 40 }, vb, 'warn').w - 1);
});

test('textBox: caixa aproximada do texto conforme o alinhamento', () => {
  const s = textBox({ x: 100, y: 50, fontSize: 20, anchor: 'start', length: 10 });
  assert.equal(s.x, 100);
  assert.ok(s.y < 50 && s.y + s.h >= 50, 'a linha de base fica dentro da caixa');
  assert.ok(s.w > 80 && s.w < 140);
  const m = textBox({ x: 100, y: 50, fontSize: 20, anchor: 'middle', length: 10 });
  assert.ok(Math.abs(m.x + m.w / 2 - 100) < 0.01);
  const e = textBox({ x: 100, y: 50, fontSize: 20, anchor: 'end', length: 10 });
  assert.ok(Math.abs(e.x + e.w - 100) < 0.01);
});

test('pickBadgeBox: sem obstáculo fica no canto de cima à direita; foge do texto que cobriria', () => {
  const vb = { width: 640, height: 1124 };
  const rect = { x: 100, y: 300, width: 300, height: 200 };
  const base = badgeBox(rect, vb, 'bad');
  assert.deepEqual(pickBadgeBox(rect, vb, 'bad', []), base);
  // um rótulo em cima, à direita -> vai para baixo, à direita
  const label = { x: base.x, y: base.y, w: base.w, h: base.h };
  const b = pickBadgeBox(rect, vb, 'bad', [label]);
  assert.ok(b.y > rect.y + rect.height / 2, 'desceu');
  assert.ok(Math.abs(b.x + b.w - (rect.x + rect.width)) < 1, 'continua à direita');
  // os dois cantos da direita ocupados -> vai para a esquerda
  const c = pickBadgeBox(rect, vb, 'bad', [label, { ...b }]);
  assert.ok(Math.abs(c.x - rect.x) < 1, 'foi para a esquerda');
  // tudo ocupado: fica onde cobre menos
  const all = [{ x: 0, y: 0, w: 640, h: 1124 }];
  assert.deepEqual(pickBadgeBox(rect, vb, 'bad', all), base);
});

test('fieldTarget: item de campo leva ao campo certo', () => {
  const s = createState(4);
  assert.equal(fieldTarget('local', s), 'location');
  assert.equal(fieldTarget('regiao', s), 'uf');
  assert.equal(fieldTarget('regiao', setField(s, 'uf', 'MG').state), 'ddd');
  assert.equal(fieldTarget('wifi', s), 'hasWifi');
  assert.equal(fieldTarget('placa', s), null);
});

test('itemActionLabel: peça -> "Mostrar no desenho"; campo -> leva ao campo sem prometer correção', () => {
  assert.equal(itemActionLabel('carregador'), 'Mostrar no desenho');
  // IN-04 (falta de luz) também fica no slot "local": o botão só leva ao campo, não diz que trocar o local resolve.
  assert.equal(itemActionLabel('local'), 'Ir para o campo "Onde vai ficar"');
  assert.equal(itemActionLabel('regiao'), 'Ir para o campo "Estado e DDD"');
  assert.equal(itemActionLabel('wifi'), 'Ir para o campo "Tem Wi-Fi no local?"');
});

test('visibleFields: cada projeto mostra só o que vale para ele', () => {
  const v = (s) => visibleFields(s, buildRuleCtx(s).energy);
  assert.deepEqual(v(createState(1)), { location: false, energy: false, region: true, tx: false, wifi: false });
  assert.deepEqual(v(createState(3)), { location: true, energy: false, region: true, tx: false, wifi: false });
  assert.deepEqual(v(createState(4)), { location: true, energy: true, region: true, tx: false, wifi: false });
  const obs = { ...createState(3), projectId: 7, parts: { placa: 'heltec-v4', fonte: 'fonte-usb-5v' } };
  const o = visibleFields(obs, null);
  assert.equal(o.wifi, true);
  assert.equal(o.tx, true, 'Heltec V4 tem mais de uma potência');
});

test('catalogGroups: slots na ordem do projeto, padrão primeiro, em uso marcado, sem nível quando passa', () => {
  const s = createState(4);
  const g = catalogGroups(s, runAudit(s));
  assert.deepEqual(g.map((x) => x.slot), ['placa', 'bateria', 'carregador', 'painel', 'antena', 'cabo', 'caixa']);
  const car = g.find((x) => x.slot === 'carregador');
  assert.equal(car.label, 'Carregador solar');
  assert.deepEqual(car.options.map((o) => o.id), ['tp4056-dw01', 'cn3791-bms', 'tp4056-sem-protecao', 'cn3791-sem-bms', 'painel-direto-usb']);
  assert.deepEqual(car.options.filter((o) => o.inUse).map((o) => o.id), ['tp4056-dw01']);
  assert.ok(car.options.every((o) => o.level === null));
  assert.equal(car.options[0].name, PARTS['tp4056-dw01'].name);
});

test('catalogGroups: peça em uso reprovada leva o nível; as outras não', () => {
  const s = swapPart(createState(4), 'carregador', 'tp4056-sem-protecao');
  const car = catalogGroups(s, runAudit(s)).find((x) => x.slot === 'carregador');
  const used = car.options.find((o) => o.inUse);
  assert.equal(used.id, 'tp4056-sem-protecao');
  assert.equal(used.level, 'bad');
  assert.ok(car.options.filter((o) => !o.inUse).every((o) => o.level === null));
});

test('catalogGroups: trocar de projeto não traz peça do anterior', () => {
  const s4 = swapPart(createState(4), 'carregador', 'tp4056-sem-protecao');
  const s3 = createState(3);
  const g = catalogGroups(s3, runAudit(s3));
  assert.deepEqual(g.map((x) => x.slot), ['placa', 'fonte', 'antena', 'cabo', 'caixa']);
  assert.ok(!g.some((x) => x.options.some((o) => o.id === s4.parts.carregador)));
});

test('TABS e nextTabIndex: setas, Home e End com volta', () => {
  assert.deepEqual(TABS.map((t) => t.label), ['Peças', 'Montagem', 'Auditoria']);
  assert.equal(nextTabIndex(0, 'ArrowRight', 3), 1);
  assert.equal(nextTabIndex(2, 'ArrowRight', 3), 0);
  assert.equal(nextTabIndex(0, 'ArrowLeft', 3), 2);
  assert.equal(nextTabIndex(1, 'Home', 3), 0);
  assert.equal(nextTabIndex(1, 'End', 3), 2);
  assert.equal(nextTabIndex(1, 'a', 3), null);
});

test('detailModel: nome, dica, itens do slot e foto (ou null)', () => {
  const s = swapPart(createState(4), 'carregador', 'tp4056-sem-protecao');
  const d = detailModel(s, 'carregador', runAudit(s));
  assert.equal(d.slotLabel, 'Carregador solar');
  assert.equal(d.partId, 'tp4056-sem-protecao');
  assert.equal(d.name, PARTS['tp4056-sem-protecao'].name);
  assert.ok(d.tip.length > 10);
  assert.deepEqual(d.items.map((x) => x.id), ['EN-10']);
  assert.equal(d.photo, null);
  const p = detailModel(createState(4), 'placa', []);
  assert.equal(p.photo.license, 'CC BY-SA 4.0');
  assert.match(p.photo.file, /^assets\/photos\/.+\.webp$/);
  assert.equal(detailModel(createState(4), 'inexistente', []), null);
});
