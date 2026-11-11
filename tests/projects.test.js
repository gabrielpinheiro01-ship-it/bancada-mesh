import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, swapPart, setField } from '../src/core/state.js';
import { runAudit, summarize } from '../src/core/audit.js';
import { drawingFor } from '../src/core/drawing.js';
import { PROJECTS } from '../src/data/projects.js';
import { PARTS } from '../src/data/parts.js';
import { txOptions } from '../src/core/commands.js';

const ids = Object.keys(PROJECTS).map(Number);
const ready = ids.filter((id) => PROJECTS[id].status === 'pronto');

function filled(id) {
  let s = createState(id);
  s = setField(s, 'uf', 'MG').state;
  s = setField(s, 'ddd', '31').state;
  return s;
}

test('há 7 projetos; prontos = 1, 3 e 4; os demais em breve com lacuna', () => {
  assert.deepEqual(ids, [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(ready, [1, 3, 4]);
  const lacunas = { 2: 'R2', 5: 'R4', 6: 'R3', 7: 'R5' };
  for (const [id, r] of Object.entries(lacunas)) {
    assert.equal(PROJECTS[id].status, 'em-breve');
    assert.deepEqual(PROJECTS[id].blockedBy, [r]);
    assert.deepEqual(PROJECTS[id].drawings, []);
    assert.equal(PROJECTS[id].defaultDrawing, null);
  }
});

test('projeto 1 pronto: sem lacuna, desenho genérico', () => {
  assert.deepEqual(PROJECTS[1].blockedBy, []);
  assert.deepEqual(PROJECTS[1].drawings, [{ id: 'p1-aparelho', match: {} }]);
  assert.equal(PROJECTS[1].defaultDrawing, 'p1-aparelho');
});

test('projetos prontos com peças padrão e UF/DDD: nenhum problema', () => {
  for (const id of ready) {
    const items = runAudit(filled(id));
    assert.equal(summarize(items).bad, 0, `projeto ${id}: ${items.filter((i) => i.level === 'bad').map((i) => i.id)}`);
  }
});

test('papéis e fontes de energia dos projetos', () => {
  assert.equal(PROJECTS[1].role, 'companion');
  assert.deepEqual(PROJECTS[1].locations, []);
  assert.equal(PROJECTS[3].role, 'repeater');
  assert.equal(PROJECTS[3].power, 'mains');
  assert.equal(PROJECTS[7].role, 'observer');
  assert.deepEqual(PROJECTS[7].locations, ['telhado', 'predio', 'pico', 'dentro', 'movel']);
  assert.equal(PROJECTS[6].slots.carregador, undefined);
});

function* combos(project) {
  const slots = Object.entries(project.slots).map(([slot, d]) => [slot, [d.default, ...d.alternatives]]);
  const idx = new Array(slots.length).fill(0);
  while (true) {
    yield Object.fromEntries(slots.map(([slot, opts], i) => [slot, opts[idx[i]]]));
    let k = slots.length - 1;
    while (k >= 0 && ++idx[k] === slots[k][1].length) idx[k--] = 0;
    if (k < 0) return;
  }
}

test('todas as combinações dos projetos prontos: sem problema => há desenho; fix aponta para opção do slot', () => {
  for (const id of ready) {
    const project = PROJECTS[id];
    const base = filled(id);
    let n = 0;
    let okCount = 0;
    for (const parts of combos(project)) {
      const s = { ...base, parts, txDbm: txOptions({ parts }).includes(22) ? 22 : txOptions({ parts })[0] };
      const items = runAudit(s);
      const { bad } = summarize(items);
      if (bad === 0) {
        okCount++;
        assert.notEqual(drawingFor(s, items), null, `projeto ${id} sem desenho: ${JSON.stringify(parts)}`);
      }
      for (const it of items) {
        if (!it.fix) continue;
        const def = project.slots[it.fix.slot];
        assert.ok(def, `fix com slot inexistente ${it.id}`);
        assert.ok([def.default, ...def.alternatives].includes(it.fix.partId), `fix ${it.id} fora do slot`);
      }
      n++;
    }
    assert.ok(n > 0 && okCount > 0, `projeto ${id}: ${n} combinações, ${okCount} sem problema`);
  }
});

test('vazamento: trocar peças no projeto 4 não contamina createState(3)', () => {
  let s4 = createState(4);
  s4 = swapPart(s4, 'placa', 'xiao-esp32s3-wio');
  s4 = swapPart(s4, 'antena', 'antena-868');
  const s3 = createState(3);
  assert.deepEqual(Object.keys(s3.parts).sort(), Object.keys(PROJECTS[3].slots).sort());
  for (const [slot, def] of Object.entries(PROJECTS[3].slots)) assert.equal(s3.parts[slot], def.default);
  assert.equal(s3.parts.placa, 't114');
  assert.equal(s3.parts.bateria, undefined);
  assert.equal(PARTS['t114'].slot, 'placa');
});

test('swapPart volta txDbm para 22 quando o valor não vale na nova placa', () => {
  // projeto 7: heltec-v4 aceita 22 e 10; heltec-v3 só 22
  let s = createState(7);
  s = swapPart(s, 'placa', 'heltec-v4');
  s = setField(s, 'txDbm', 10).state;
  assert.equal(s.txDbm, 10);
  const t = swapPart(s, 'placa', 'heltec-v3');
  assert.equal(t.txDbm, 22);
  // valor ainda válido é mantido
  const u = swapPart(s, 'placa', 'heltec-v4');
  assert.equal(u.txDbm, 10);
});

test('txOptions com as peças reais (PA em attrs.pa)', () => {
  const st = (projectId, placa) => ({ ...createState(projectId), parts: { placa } });
  assert.deepEqual(txOptions(st(7, 'heltec-v4')), [22, 10]);
  assert.deepEqual(txOptions(st(7, 'heltec-v3')), [22]);
  assert.deepEqual(txOptions(st(6, 'rak3401-rak13302')), [22, 19, 16]);
});

// Lacuna R3: o consumo médio do RAK3401+RAK13302 não está na skill (currentMa null); a auditoria
// do projeto 6 ainda lança. Só os projetos `pronto` precisam passar; os outros devem auditar sem erro.
const KNOWN_THROW = [6];
test('projetos em breve: auditoria não lança erro (exceto lacuna conhecida)', () => {
  for (const id of ids.filter((i) => !ready.includes(i))) {
    if (KNOWN_THROW.includes(id)) {
      assert.throws(() => runAudit(filled(id)), /formatBR/, `projeto ${id}: se parou de lançar, tire da lista`);
    } else {
      assert.doesNotThrow(() => runAudit(filled(id)), `projeto ${id}`);
    }
  }
});
