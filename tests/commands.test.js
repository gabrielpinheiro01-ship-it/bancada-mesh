import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, setField } from '../src/core/state.js';
import { repeaterCommands, companionSteps, txOptions, txdelayFor } from '../src/core/commands.js';
import { PARTS } from '../src/data/parts.js';

const ready = (loc = 'telhado') => {
  let s = createState(4);
  s = setField(s, 'uf', 'MG').state;
  s = setField(s, 'ddd', '31').state;
  return setField(s, 'location', loc).state;
};

test('repeaterCommands (MG, 31, telhado): ordem e valores exatos', () => {
  const c = repeaterCommands(ready());
  assert.deepEqual(c, [
    'set radio 923.125,62.5,8,8',
    'set tx 22',
    'set name ________',
    'password ________',
    'set lat ________',
    'set lon ________',
    'set flood.advert.interval 23',
    'set txdelay 0.5',
    'set rxdelay 3',
    'set loop.detect moderate',
    'set multi.acks 1',
    'set agc.reset.interval 300',
    'set radio.rxgain on',
    'get radio.rxgain',
    'set path.hash.mode 1',
    'region def br br-mg br-mg-31',
    'region save',
    'get advert.interval',
  ]);
  assert.ok(!c.includes('set advert.interval 0'));
});

test('txdelay por local', () => {
  const want = { telhado: '0.5', predio: '1.0', pico: '2.0', dentro: '0.5', movel: '0.5' };
  for (const [loc, v] of Object.entries(want)) assert.equal(txdelayFor(loc), v);
  assert.equal(txdelayFor(null), '0.5');
  assert.equal(txdelayFor('xyz'), '0.5');
  assert.ok(repeaterCommands(ready('predio')).includes('set txdelay 1.0'));
  assert.ok(repeaterCommands(ready('pico')).includes('set txdelay 2.0'));
});

test('sem UF/DDD: lacuna na região', () => {
  assert.ok(repeaterCommands(createState(4)).includes('region def br br-____ br-____-____'));
});

test('set tx usa o txDbm do estado', () => {
  const s = { ...ready(), txDbm: 19 };
  assert.ok(repeaterCommands(s).includes('set tx 19'));
});

test('regiões saem em minúsculas', () => {
  const r = repeaterCommands(ready()).find((x) => x.startsWith('region def'));
  assert.equal(r, r.toLowerCase());
});

test('txOptions: sem PA = [22]', () => {
  assert.deepEqual(txOptions(createState(4)), [22]);
});

test('txOptions com placas sintéticas', () => {
  const s = createState(4);
  const mk = (outDbm) => ({ ...PARTS, fake: { pa: { outDbm } } });
  const st = { ...s, parts: { ...s.parts, placa: 'fake' } };
  assert.deepEqual(txOptions(st, mk({ 22: 30, 19: 27, 16: 24 })), [22, 19, 16]);
  assert.deepEqual(txOptions(st, mk({ 22: 28, 10: 22 })), [22, 10]);
  assert.deepEqual(txOptions(st, mk({ 10: 22, 30: 33, 22: 28 })), [22, 10]);
});

test('txOptions usa slot aparelho se não houver placa', () => {
  const s = { ...createState(4), parts: { aparelho: 'fake' } };
  assert.deepEqual(txOptions(s, { fake: { pa: { outDbm: { 22: 30, 19: 27 } } } }), [22, 19]);
});

test('companionSteps: preset, conferência, hash, região sugerida', () => {
  const steps = companionSteps(ready());
  const t = steps.join('\n');
  assert.match(t, /Australia: SA, WA/);
  assert.match(t, /923\.125/);
  assert.match(t, /62\.5/);
  assert.match(t, /2 bytes/);
  assert.match(t, /Send Advert/);
  assert.match(t, /Public/);
  assert.match(t, /br-mg-31/);
  assert.match(t, /antena/i);
  assert.match(t, /aproximada/);
  // "Australia" sozinho ou "(Narrow)" só aparecem em aviso de "não use"
  const warn = steps.find((x) => x.includes('Australia (Narrow)'));
  assert.match(warn, /Não use/);
});

test('companionSteps sem UF/DDD usa lacuna', () => {
  assert.match(companionSteps(createState(4)).join('\n'), /br-____-____/);
});
