import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, swapPart, setField, applyFix } from '../src/core/state.js';
import { PARTS } from '../src/data/parts.js';
import { PROJECTS, LOCATION_LABELS } from '../src/data/projects.js';

test('createState(4) traz as peças padrão e os padrões de META', () => {
  const s = createState(4);
  assert.equal(s.projectId, 4);
  assert.equal(s.parts.carregador, 'tp4056-dw01');
  assert.equal(s.parts.placa, 'xiao-nrf52840-wio');
  assert.equal(s.daysNoSun, 9);
  assert.equal(s.daysRecharge, 2);
  assert.equal(s.hsp, 4.2);
  assert.equal(s.txDbm, 22);
  assert.equal(s.location, 'telhado');
  assert.equal(s.uf, null);
  assert.equal(s.ddd, null);
  assert.equal(s.customRegion, null);
  assert.equal(s.hasWifi, null);
});

test('todas as peças do projeto 4 existem no catálogo e batem com o slot', () => {
  const p = PROJECTS[4];
  for (const [slot, def] of Object.entries(p.slots)) {
    for (const id of [def.default, ...def.alternatives]) {
      assert.ok(PARTS[id], `peça ausente: ${id}`);
      assert.equal(PARTS[id].slot, slot, `slot errado em ${id}`);
    }
  }
  for (const loc of p.locations) assert.ok(LOCATION_LABELS[loc]);
});

test('swapPart devolve objeto novo e não altera o original', () => {
  const s = createState(4);
  const t = swapPart(s, 'antena', 'antena-868');
  assert.notEqual(t, s);
  assert.notEqual(t.parts, s.parts);
  assert.equal(t.parts.antena, 'antena-868');
  assert.equal(s.parts.antena, 'omni-915-5dbi');
});

test('swapPart lança erro para peça fora do slot', () => {
  const s = createState(4);
  assert.throws(() => swapPart(s, 'antena', 'rak13302'));
  assert.throws(() => swapPart(s, 'antena', 'tp4056-dw01'));
  assert.throws(() => swapPart(s, 'slot-inexistente', 'omni-915-5dbi'));
});

test('setField numérico: aceita vírgula e rejeita lixo sem NaN', () => {
  const s = createState(4);
  assert.equal(setField(s, 'hsp', '4,5').state.hsp, 4.5);
  assert.equal(setField(s, 'hsp', '4,5').error, null);
  const bad = setField(s, 'hsp', 'abc');
  assert.equal(bad.state.hsp, 4.2);
  assert.equal(bad.error, 'Digite um número, por exemplo 4,2');
  assert.ok(setField(s, 'daysNoSun', '-3').error);
  assert.equal(setField(s, 'daysNoSun', '-3').state.daysNoSun, 9);
  assert.equal(setField(s, 'daysNoSun', '21').error, 'Use um número entre 1 e 20');
  assert.equal(setField(s, 'daysRecharge', '8').error, 'Use um número entre 1 e 7');
  assert.equal(setField(s, 'hsp', '1,9').error, 'Use um número entre 2 e 7');
  assert.equal(setField(s, 'daysNoSun', '20').state.daysNoSun, 20);
  for (const txt of ['', ' ', 'NaN', 'Infinity', '1e3', '4,2,1']) {
    for (const f of ['daysNoSun', 'daysRecharge', 'hsp']) {
      const r = setField(s, f, txt);
      assert.ok(Number.isFinite(r.state[f]));
      assert.ok(r.error);
    }
  }
});

test('setField sucessivo mantém o último valor válido', () => {
  let r = setField(createState(4), 'hsp', '5');
  r = setField(r.state, 'hsp', 'xyz');
  assert.equal(r.state.hsp, 5);
  assert.ok(r.error);
});

test('setField não muta o estado recebido', () => {
  const s = createState(4);
  const r = setField(s, 'hsp', '5');
  assert.notEqual(r.state, s);
  assert.equal(s.hsp, 4.2);
  assert.notEqual(r.state.parts, s.parts);
});

test('setField: location, hasWifi, txDbm, uf/ddd/customRegion', () => {
  const s = createState(4);
  assert.equal(setField(s, 'location', 'pico').state.location, 'pico');
  assert.ok(setField(s, 'location', 'lua').error);
  assert.equal(setField(s, 'location', 'lua').state.location, 'telhado');
  assert.equal(setField(s, 'hasWifi', true).state.hasWifi, true);
  assert.equal(setField(s, 'hasWifi', null).state.hasWifi, null);
  assert.ok(setField(s, 'hasWifi', 'sim').error);
  assert.equal(setField(s, 'txDbm', 22).state.txDbm, 22);
  assert.ok(setField(s, 'txDbm', 20).error); // placa sem PA só aceita 22 (regra da Task 4)
  assert.ok(setField(s, 'txDbm', 'x').error);
  assert.ok(setField(s, 'txDbm', 20.5).error);
  assert.equal(setField(s, 'uf', 'MG').state.uf, 'MG');
  assert.ok(setField(s, 'ddd', '31').error); // sem UF (regra da Task 4)
  assert.ok(setField(s, 'customRegion', 'Sul de Minas').error); // formato inválido (regra da Task 4)
  assert.equal(setField(setField(s, 'uf', 'MG').state, 'uf', null).state.uf, null);
  assert.ok(setField(s, 'uf', 5).error);
});

test('setField com campo desconhecido lança erro', () => {
  assert.throws(() => setField(createState(4), 'parts', 'x'));
  assert.throws(() => setField(createState(4), 'projectId', '3'));
});

test('applyFix troca a peça como swapPart', () => {
  const s = swapPart(createState(4), 'carregador', 'tp4056-sem-protecao');
  const t = applyFix(s, { slot: 'carregador', partId: 'tp4056-dw01' });
  assert.equal(t.parts.carregador, 'tp4056-dw01');
  assert.equal(s.parts.carregador, 'tp4056-sem-protecao');
});

test('sem vazamento: recriar o estado volta tudo ao padrão', () => {
  let s = createState(4);
  s = swapPart(s, 'antena', 'antena-868');
  s = swapPart(s, 'placa', 'xiao-esp32s3-wio');
  s = setField(s, 'hsp', '6').state;
  const novo = createState(4);
  assert.equal(novo.parts.antena, 'omni-915-5dbi');
  assert.equal(novo.parts.placa, 'xiao-nrf52840-wio');
  assert.equal(novo.hsp, 4.2);
  assert.deepEqual(Object.keys(novo.parts).sort(), Object.keys(PROJECTS[4].slots).sort());
});

test('createState com projeto inexistente lança erro', () => {
  assert.throws(() => createState(99));
});

// ---- Task 4: UF, DDD, região própria e potência ----
import { txOptions } from '../src/core/commands.js';

test('setField uf: aceita sigla maiúscula ou null; senão erro', () => {
  const s = createState(4);
  assert.equal(setField(s, 'uf', 'MG').state.uf, 'MG');
  for (const bad of ['mg', 'XX', 'Minas', 7]) {
    const r = setField(s, 'uf', bad);
    assert.equal(r.error, 'Escolha um estado da lista');
    assert.equal(r.state.uf, null);
  }
  assert.equal(setField(setField(s, 'uf', 'MG').state, 'uf', null).state.uf, null);
});

test('trocar de UF zera DDD de outra UF e região própria de outra UF', () => {
  let s = createState(4);
  s = setField(s, 'uf', 'SP').state;
  s = setField(s, 'ddd', '12').state;
  s = setField(s, 'customRegion', 'br-sp-valeparaiba').state;
  const same = setField(s, 'uf', 'SP').state;
  assert.equal(same.ddd, '12');
  assert.equal(same.customRegion, 'br-sp-valeparaiba');
  const mg = setField(s, 'uf', 'MG').state;
  assert.equal(mg.ddd, null);
  assert.equal(mg.customRegion, null);
});

test('setField ddd: exige UF e DDD da UF', () => {
  const s0 = createState(4);
  const a = setField(s0, 'ddd', '31');
  assert.equal(a.error, 'Escolha primeiro o estado');
  assert.equal(a.state.ddd, null);
  const s = setField(s0, 'uf', 'SP').state;
  const b = setField(s, 'ddd', '31');
  assert.equal(b.error, 'Esse DDD não é de SP');
  assert.equal(b.state.ddd, null);
  const c = setField(s, 'ddd', '15');
  assert.equal(c.error, null);
  assert.equal(c.state.ddd, '15');
  assert.equal(setField(c.state, 'ddd', null).state.ddd, null);
});

test('setField customRegion', () => {
  const s = setField(createState(4), 'uf', 'SP').state;
  const ok = setField(s, 'customRegion', 'br-sp-valeparaiba');
  assert.equal(ok.error, null);
  assert.equal(ok.state.customRegion, 'br-sp-valeparaiba');
  const bad = setField(ok.state, 'customRegion', 'BR-SP-Vale');
  assert.match(bad.error, /minúsculas/);
  assert.equal(bad.state.customRegion, 'br-sp-valeparaiba');
  assert.equal(setField(ok.state, 'customRegion', '').state.customRegion, null);
  assert.equal(setField(ok.state, 'customRegion', null).state.customRegion, null);
  assert.ok(setField(createState(4), 'customRegion', 'br-sp-x').error);
});

test('setField txDbm: só valores de txOptions', () => {
  const s = createState(4);
  assert.deepEqual(txOptions(s), [22]);
  assert.equal(setField(s, 'txDbm', 22).error, null);
  const r = setField(s, 'txDbm', 19);
  assert.ok(r.error);
  assert.equal(r.state.txDbm, 22);
  assert.ok(setField(s, 'txDbm', 'x').error);
});
