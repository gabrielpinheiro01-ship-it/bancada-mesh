import test from 'node:test';
import assert from 'node:assert/strict';
import { runAudit, buildRuleCtx } from '../src/core/audit.js';
import { INSTALL_RULES, FIELD_SLOTS } from '../src/rules/install.js';
import { createState, swapPart, setField } from '../src/core/state.js';

function make(parts = {}, fields = {}) {
  let s = createState(4);
  for (const [slot, id] of Object.entries(parts)) s = swapPart(s, slot, id);
  for (const [f, v] of Object.entries(fields)) s = setField(s, f, v).state;
  return s;
}
const inst = (s) => runAudit(s, [INSTALL_RULES]);
const find = (items, id) => items.find((i) => i.id === id);
const rule = (id) => INSTALL_RULES.find((r) => r.id === id);
const withProject = (ctx, extra) => ({ ...ctx, project: { ...ctx.project, ...extra } });
const withState = (ctx, extra) => ({ ...ctx, state: { ...ctx.state, ...extra } });
const base = () => buildRuleCtx(make());

test('toda regra de instalação tem fonte com link, data e firmware', () => {
  const ids = INSTALL_RULES.map((r) => r.id);
  for (const id of ['IN-01', 'IN-02', 'IN-03', 'IN-04', 'IN-06', 'IN-07']) assert.ok(ids.includes(id), `falta ${id}`);
  for (const r of INSTALL_RULES) {
    assert.match(r.source, /meshcore-hubreal\//);
    assert.match(r.source, /https:\/\//);
    assert.equal(r.checkedAt, '2026-11-10');
    assert.equal(r.firmware, '1.18.0');
  }
});

test('slots de campo exportados', () => {
  assert.deepEqual(FIELD_SLOTS, { local: 'local', regiao: 'regiao', wifi: 'wifi' });
});

test('padrão do projeto 4 (telhado, solar, caixa clara com respiro): nada de instalação', () => {
  assert.deepEqual(inst(make()).map((i) => i.id), []);
});

test('IN-01: repetidor dentro de casa é Problema no slot local; fora não dispara', () => {
  const it = find(inst(make({}, { location: 'dentro' })), 'IN-01');
  assert.equal(it.level, 'bad');
  assert.equal(it.slot, 'local');
  assert.equal(find(inst(make({}, { location: 'telhado' })), 'IN-01'), undefined);
  const dentro = withState(base(), { location: 'dentro' });
  assert.equal(rule('IN-01').evaluate(withProject(dentro, { role: 'observer' })).level, 'bad');
  assert.equal(rule('IN-01').evaluate(withProject(dentro, { role: 'companion' })), null);
});

test('IN-02: caixa sem respiro é Atenção com troca; com respiro não dispara', () => {
  const it = find(inst(make({ caixa: 'caixa-sem-respiro' })), 'IN-02');
  assert.equal(it.level, 'warn');
  assert.equal(it.slot, 'caixa');
  assert.deepEqual(it.fix, { label: 'Trocar por Caixa clara com respiro', slot: 'caixa', partId: 'caixa-clara-respiro' });
  assert.equal(find(inst(make()), 'IN-02'), undefined);
});

test('IN-03: caixa escura é Atenção com troca; clara não dispara', () => {
  const it = find(inst(make({ caixa: 'caixa-escura' })), 'IN-03');
  assert.equal(it.level, 'warn');
  assert.equal(it.fix.partId, 'caixa-clara-respiro');
  assert.equal(find(inst(make()), 'IN-03'), undefined);
  assert.equal(find(inst(make({ caixa: 'caixa-sem-respiro' })), 'IN-03'), undefined);
});

test('IN-04: repetidor na tomada é Atenção informativa; solar não dispara', () => {
  const it = rule('IN-04').evaluate(withProject(base(), { power: 'mains' }));
  assert.equal(it.level, 'warn');
  assert.match(it.why, /luz/);
  assert.equal(rule('IN-04').evaluate(base()), null);
  assert.equal(rule('IN-04').evaluate(withProject(base(), { power: 'mains', role: 'observer' })), null);
});

test('IN-06: observer móvel é Problema; observer fixo ou repetidor móvel não dispara', () => {
  const mov = (role, location) => withProject(withState(base(), { location }), { role });
  const it = rule('IN-06').evaluate(mov('observer', 'movel'));
  assert.equal(it.level, 'bad');
  assert.equal(it.slot, 'local');
  assert.equal(rule('IN-06').evaluate(mov('observer', 'predio')), null);
  assert.equal(rule('IN-06').evaluate(mov('repeater', 'movel')), null);
});

test('IN-07: observer sem Wi-Fi é Problema; sem resposta é Atenção; com Wi-Fi ou outro papel não dispara', () => {
  const obs = (hasWifi, role = 'observer') => withProject(withState(base(), { hasWifi }), { role });
  const no = rule('IN-07').evaluate(obs(false));
  assert.equal(no.level, 'bad');
  assert.equal(no.slot, 'wifi');
  const unk = rule('IN-07').evaluate(obs(null));
  assert.equal(unk.level, 'warn');
  assert.match(unk.why + unk.title, /confirme se há Wi-Fi no local/);
  assert.equal(rule('IN-07').evaluate(obs(true)), null);
  assert.equal(rule('IN-07').evaluate(obs(false, 'repeater')), null);
});
