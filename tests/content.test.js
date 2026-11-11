import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { PROJECTS } from '../src/data/projects.js';
import { PARTS } from '../src/data/parts.js';

const dir = new URL('../src/content/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
const mods = {};
for (const f of files) mods[f] = await import(new URL(f, dir));
const { FLASH, firmwareTypeFor } = mods['flash.js'];
const { STEPS } = mods['steps.js'];
const { INSTALL } = mods['install.js'];
const { AFTER } = mods['after.js'];
const { ALERTS } = mods['alerts.js'];
const { CONFIG_NOTES } = mods['config-notes.js'];

const ready = Object.values(PROJECTS).filter((p) => p.status === 'pronto');

// Percorre tudo que os módulos exportam e devolve [caminho, texto].
function* texts(value, path) {
  if (typeof value === 'string') yield [path, value];
  else if (Array.isArray(value)) for (let i = 0; i < value.length; i++) yield* texts(value[i], `${path}[${i}]`);
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) yield* texts(v, `${path}.${k}`);
}
const all = [];
for (const [f, m] of Object.entries(mods)) for (const [k, v] of Object.entries(m)) {
  if (typeof v !== 'function') all.push(...texts(v, `${f}:${k}`));
}

test('os módulos de conteúdo existem e têm texto', () => {
  assert.deepEqual(files.sort(), ['after.js', 'alerts.js', 'config-notes.js', 'flash.js', 'install.js', 'steps.js']);
  assert.ok(all.length > 80);
});

test('toda placa/aparelho padrão ou alternativa de projeto pronto tem FLASH (exceto contraexemplos)', () => {
  for (const p of ready) {
    for (const slot of ['placa', 'aparelho']) {
      const def = p.slots[slot];
      if (!def) continue;
      for (const id of [def.default, ...def.alternatives]) {
        if (PARTS[id].counterexample) {
          assert.equal(FLASH[id], undefined, `${id} é contraexemplo e não pode ter passos de gravação`);
          continue;
        }
        const f = FLASH[id];
        assert.ok(f, `falta FLASH para ${id} (projeto ${p.id})`);
        assert.equal(f.firmwareType, firmwareTypeFor(p.role), `tipo de firmware de ${id}`);
        assert.ok(f.steps.length >= 5 && f.steps.every((s) => s.trim()), `passos de ${id}`);
        assert.ok(f.source.trim(), `source de ${id}`);
      }
    }
  }
});

test('firmwareTypeFor cobre os três papéis', () => {
  assert.equal(firmwareTypeFor('repeater'), 'Repetidor');
  assert.equal(firmwareTypeFor('companion'), 'Companion Bluetooth');
  assert.equal(firmwareTypeFor('observer'), 'Observer');
});

test('todo projeto pronto tem STEPS (montagem e teste de bancada)', () => {
  for (const p of ready) {
    assert.ok(Array.isArray(STEPS[p.id]) && STEPS[p.id].length >= 6, `STEPS do projeto ${p.id}`);
    assert.ok(STEPS[p.id].every((s) => typeof s === 'string' && s.trim()));
  }
});

test('todo bloco de texto tem source não vazio e items', () => {
  for (const [name, list] of Object.entries({ INSTALL, AFTER, ALERTS, CONFIG_NOTES })) {
    assert.ok(Array.isArray(list) && list.length > 0, name);
    for (const b of list) {
      assert.ok(b.title.trim(), `${name}: título`);
      assert.ok(b.items.length > 0 && b.items.every((s) => s.trim()), `${name}/${b.title}: items`);
      assert.ok(b.source.trim(), `${name}/${b.title}: source`);
    }
  }
  for (const [id, f] of Object.entries(FLASH)) assert.ok(f.source.trim(), `FLASH ${id}`);
});

test('as notas de configuração cobrem CFG-07 a CFG-11', () => {
  const t = CONFIG_NOTES.map((b) => `${b.title} ${b.items.join(' ')}`).join('\n');
  for (const needle of ['CIDADE-REGIONAL-XXXX', '23 bytes', 'meshcore.com.br/gerador-de-nomes-para-repetidores-meshcore',
    'meshsorocaba.org/ferramentas/nomes-repetidores', 'USB', 'um comando por vez', 'set radio', 'Repeat Mode',
    'Owner Info', 'get prv.key', 'get advert.interval']) {
    assert.ok(t.includes(needle), `falta "${needle}" em CONFIG_NOTES`);
  }
});

test('os alertas cobrem HW-03, HW-15, polaridade, EN-09 e EN-14', () => {
  const t = ALERTS.map((b) => `${b.title} ${b.items.join(' ')}`).join('\n').toLowerCase();
  for (const needle of ['sem antena', 'revisão da placa', 'vermelho', 'preto', '0,05 v', '48 h', 'descarga completa']) {
    assert.ok(t.includes(needle), `falta "${needle}" em ALERTS`);
  }
});

test('nenhum texto tem parte legal, loja ou o comando proibido', () => {
  const banned = [/anatel/i, /ilegal/i, /homologad/i, /permitido por lei/i, /set advert\.interval 0/,
    /aliexpress/i, /mercadolivre/i, /amazon/i, /heltec\.org/i, /\blegal\b/i];
  for (const [path, s] of all) for (const re of banned) assert.ok(!re.test(s), `${path} casa ${re}: ${s}`);
});

test('nenhum texto traz conta de energia pronta (30 dias, autonomia, watts do painel)', () => {
  for (const [path, s] of all) {
    assert.ok(!/30 dias/i.test(s), `${path}: 30 dias`);
    assert.ok(!/\d+\s*dias? sem sol/i.test(s), `${path}: dias sem sol`);
    assert.ok(!/\d\s*mAh/i.test(s), `${path}: mAh`);
  }
  const energyTexts = [...STEPS[4], ...INSTALL.flatMap((b) => b.items)].join(' ');
  assert.ok(!/\d+\s*W\b/.test(energyTexts), 'sem potência de painel nos textos do projeto 4');
});

test('o comando de intervalo só aparece como conferência (get)', () => {
  assert.ok(all.some(([, s]) => s.includes('get advert.interval')));
  assert.ok(!all.some(([, s]) => /set advert\.interval/.test(s)));
});
