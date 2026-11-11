import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, swapPart } from '../src/core/state.js';
import { runAudit } from '../src/core/audit.js';
import { drawingFor, markSvg, isOpenable } from '../src/core/drawing.js';

const draw = (s) => drawingFor(s, runAudit(s));

test('projeto 4: carregador define o desenho', () => {
  const s = createState(4);
  assert.equal(draw(s), 'p4-tp4056');
  assert.equal(draw(swapPart(s, 'carregador', 'cn3791-bms')), 'p4-cn3791-bms');
});

test('contraexemplo reaproveita o desenho padrão do projeto 4', () => {
  const s = swapPart(createState(4), 'antena', 'antena-868');
  assert.equal(draw(s), 'p4-tp4056');
  const t = swapPart(createState(4), 'carregador', 'tp4056-sem-protecao');
  assert.equal(draw(t), 'p4-tp4056');
});

test('projeto 3: placa define o desenho', () => {
  const s = createState(3);
  assert.equal(draw(s), 'p3-t114');
  assert.equal(draw(swapPart(s, 'placa', 'heltec-v3')), 'p3-v3');
});

test('sem desenho e sem problema -> null; com problema -> desenho padrão', () => {
  const s = createState(4);
  assert.equal(drawingFor(s, []), 'p4-tp4056');
  const em = createState(5);
  assert.equal(drawingFor(em, []), null);
  assert.equal(drawingFor(em, [{ level: 'bad' }]), null); // defaultDrawing null
});

test('markSvg: bad e warn levam tracejado, sel não', () => {
  const bad = markSvg('<rect id="hl-placa" x="1"/>', { placa: 'bad' });
  assert.ok(bad.includes('stroke="#B91C1C"'));
  assert.ok(bad.includes('stroke-dasharray="7 5"'));
  assert.ok(bad.includes('stroke-width="3"') && bad.includes('fill="none"'));
  assert.ok(bad.endsWith('/>'));
  const warn = markSvg('<rect id="hl-placa" x="1"></rect>', { placa: 'warn' });
  assert.ok(warn.includes('stroke="#A35400"') && warn.includes('stroke-dasharray="7 5"'));
  assert.ok(warn.endsWith('</rect>'));
  const sel = markSvg('<rect id="hl-placa" x="1"/>', { placa: 'sel' });
  assert.ok(sel.includes('stroke="#1E3A8A"'));
  assert.ok(!sel.includes('stroke-dasharray'));
});

test('markSvg: não mexe em outros rects nem em slot sem rect', () => {
  const svg = '<rect id="hl-placa" x="1"/><rect id="hl-bateria" x="2"/><rect id="bg"/>';
  const out = markSvg(svg, { placa: 'bad', antena: 'bad' });
  assert.ok(out.includes('<rect id="hl-bateria" x="2"/>'));
  assert.ok(out.includes('<rect id="bg"/>'));
  assert.equal(markSvg(svg, {}), svg);
});

test('isOpenable', () => {
  assert.equal(isOpenable(6), false);
  assert.equal(isOpenable(4), true);
  assert.equal(isOpenable(3), true);
  assert.equal(isOpenable(99), false);
});
