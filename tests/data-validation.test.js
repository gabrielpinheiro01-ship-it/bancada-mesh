import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTS } from '../src/data/parts.js';
import { PROJECTS, LOCATION_LABELS } from '../src/data/projects.js';
import { DEFAULT_RULE_SETS } from '../src/core/audit.js';

const LICENSES = ['CC BY-SA 4.0', 'CC BY 4.0', 'CC0', 'Domínio público'];
const FORBIDDEN = /heltec\.org|rakwireless\.com\/store|aliexpress|mercadolivre|amazon/i;

test('toda regra tem source, checkedAt AAAA-MM-DD e firmware', () => {
  for (const set of DEFAULT_RULE_SETS) {
    for (const r of set) {
      assert.ok(r.source && r.source.length > 5, `${r.id} sem source`);
      assert.match(r.checkedAt ?? '', /^\d{4}-\d{2}-\d{2}$/, `${r.id} checkedAt`);
      assert.ok(r.firmware, `${r.id} sem firmware`);
    }
  }
});

test('todo preço tem faixa, source e date', () => {
  for (const [id, p] of Object.entries(PARTS)) {
    if (!p.price) continue;
    assert.ok(Number.isFinite(p.price.min) && Number.isFinite(p.price.max) && p.price.min <= p.price.max, `${id} faixa`);
    assert.ok(p.price.source, `${id} price.source`);
    assert.match(p.price.date ?? '', /^\d{4}-\d{2}-\d{2}$/, `${id} price.date`);
  }
});

test('fotos: licença permitida e origem Seeed ou Wikimedia Commons', () => {
  for (const [id, p] of Object.entries(PARTS)) {
    if (!p.photo) continue;
    assert.ok(LICENSES.includes(p.photo.license), `${id} licença`);
    assert.ok(/wiki\.seeedstudio\.com|commons\.wikimedia\.org/.test(p.photo.sourceUrl ?? ''), `${id} sourceUrl`);
  }
});

test('nenhum texto dos dados cita loja ou fabricante proibido', () => {
  const blob = JSON.stringify({ PARTS, PROJECTS });
  assert.doesNotMatch(blob, FORBIDDEN);
});

test('placa/aparelho tem bandMhz, hasLoRa, supported e mcu (senão as regras de banda não disparam)', () => {
  for (const [id, p] of Object.entries(PARTS)) {
    if (p.slot !== 'placa' && p.slot !== 'aparelho') continue;
    assert.ok(Number.isFinite(p.attrs.bandMhz), `${id} bandMhz`);
    assert.equal(typeof p.attrs.hasLoRa, 'boolean', `${id} hasLoRa`);
    assert.equal(typeof p.attrs.supported, 'boolean', `${id} supported`);
    assert.ok(['nrf52', 'esp32'].includes(p.attrs.mcu), `${id} mcu`);
  }
});

test('toda antena tem bandMinMhz e bandMaxMhz numéricos', () => {
  for (const [id, p] of Object.entries(PARTS)) {
    if (p.slot !== 'antena') continue;
    assert.equal(typeof p.attrs.bandMinMhz, 'number', `${id} bandMinMhz`);
    assert.equal(typeof p.attrs.bandMaxMhz, 'number', `${id} bandMaxMhz`);
  }
});

test('todo slot de todo projeto aponta para peças existentes do slot certo', () => {
  for (const project of Object.values(PROJECTS)) {
    for (const [slot, def] of Object.entries(project.slots)) {
      for (const id of [def.default, ...def.alternatives]) {
        assert.ok(PARTS[id], `projeto ${project.id}: peça ausente ${id}`);
        assert.equal(PARTS[id].slot, slot, `projeto ${project.id}: ${id} não é do slot ${slot}`);
      }
    }
    for (const loc of project.locations) assert.ok(LOCATION_LABELS[loc], `local sem rótulo: ${loc}`);
    for (const d of project.drawings) {
      for (const [slot, list] of Object.entries(d.match)) {
        const def = project.slots[slot];
        assert.ok(def, `desenho ${d.id}: slot ${slot}`);
        for (const id of list) assert.ok([def.default, ...def.alternatives].includes(id), `desenho ${d.id}: ${id}`);
      }
    }
    if (project.drawings.length) assert.ok(project.drawings.some((d) => d.id === project.defaultDrawing));
  }
});

test('power só aceita battery, solar, mains ou integrated; integrated exige companion', () => {
  for (const [id, p] of Object.entries(PROJECTS)) {
    assert.ok(['battery', 'solar', 'mains', 'integrated'].includes(p.power), `${id} power`);
    if (p.power === 'integrated') assert.equal(p.role, 'companion', `${id} integrated só em companion`);
  }
});
