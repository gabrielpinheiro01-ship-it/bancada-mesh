import test from 'node:test';
import assert from 'node:assert/strict';
import { runAudit, buildRuleCtx, summarize, DEFAULT_RULE_SETS } from '../src/core/audit.js';
import { CONFIG_RULES } from '../src/rules/config.js';
import { HARDWARE_RULES } from '../src/rules/hardware.js';
import { INSTALL_RULES } from '../src/rules/install.js';
import { createState, setField } from '../src/core/state.js';

const withRegion = (s) => setField(setField(s, 'uf', 'MG').state, 'ddd', '31').state;
const rule = (id) => CONFIG_RULES.find((r) => r.id === id);
const withPart = (ctx, slot, extra) => ({ ...ctx, parts: { ...ctx.parts, [slot]: { ...ctx.parts[slot], ...extra } } });

test('regras de configuração têm fonte com link, data e firmware', () => {
  assert.deepEqual(CONFIG_RULES.map((r) => r.id).sort(), ['CFG-02', 'CFG-04']);
  for (const r of CONFIG_RULES) {
    assert.match(r.source, /meshcore-hubreal\//);
    assert.match(r.source, /https:\/\//);
    assert.equal(r.checkedAt, '2026-11-10');
    assert.equal(r.firmware, '1.18.0');
  }
});

test('CFG-04 com MG/31: Atenção com o comando exato e a grafia; nunca OK', () => {
  const items = runAudit(withRegion(createState(4)), [CONFIG_RULES]);
  const it = items.find((i) => i.id === 'CFG-04');
  assert.equal(it.level, 'warn');
  assert.equal(it.slot, 'regiao');
  assert.match(it.why, /region def br br-mg br-mg-31/);
  assert.match(it.why, /confira a grafia exata com o grupo local ou em Descobrir Regiões no app/);
  assert.match(it.why, /descartar o tráfego sem avisar/);
  assert.equal(items.some((i) => i.id === 'CFG-04' && i.level === 'ok'), false);
  assert.deepEqual(items.filter((i) => i.level === 'warn').map((i) => i.id), ['CFG-04']);
});

test('CFG-04 com região própria válida usa o nome combinado', () => {
  let s = withRegion(createState(4));
  s = setField(s, 'customRegion', 'br-mg-valedoaco').state;
  const it = runAudit(s, [CONFIG_RULES]).find((i) => i.id === 'CFG-04');
  assert.equal(it.level, 'warn');
  assert.match(it.why, /region def br br-mg br-mg-valedoaco/);
});

test('CFG-04 sem estado e DDD: Atenção pedindo para preencher', () => {
  const it = runAudit(createState(4), [CONFIG_RULES]).find((i) => i.id === 'CFG-04');
  assert.equal(it.level, 'warn');
  assert.match(it.why, /Preencha estado e DDD para gerar a região/);
  assert.doesNotMatch(it.why, /region def br br-mg/);
  const half = runAudit(setField(createState(4), 'uf', 'MG').state, [CONFIG_RULES]).find((i) => i.id === 'CFG-04');
  assert.match(half.why, /Preencha estado e DDD/);
});

test('CFG-04 vale também para companion (qualquer papel)', () => {
  const ctx = buildRuleCtx(withRegion(createState(4)));
  const it = rule('CFG-04').evaluate({ ...ctx, project: { ...ctx.project, role: 'companion' } });
  assert.equal(it.level, 'warn');
});

test('CFG-02: sem amplificador não dispara', () => {
  assert.equal(rule('CFG-02').evaluate(buildRuleCtx(createState(4))), null);
});

test('CFG-02: placa com PA gera Atenção com saída real e pico do txDbm', () => {
  const pa = { needs5V: false, outDbm: { 22: 30, 19: 27, 16: 24 }, peakMa: { 22: 1000, 19: 740, 16: 560 } };
  const base = buildRuleCtx(createState(4));
  const it = rule('CFG-02').evaluate(withPart(base, 'placa', { pa }));
  assert.equal(it.level, 'warn');
  assert.equal(it.id, 'CFG-02');
  assert.equal(it.slot, 'placa');
  assert.match(it.why, /30,0 dBm/);
  assert.match(it.why, /1000 mA/);
  assert.match(it.why, /não inclui o ganho do amplificador/);
  assert.match(it.why, /danificar/);
  assert.match(it.why, /meça o seu consumo/);
  assert.doesNotMatch(it.why, /ANATEL|lei|legal/i);
  const at19 = rule('CFG-02').evaluate(withPart({ ...base, state: { ...base.state, txDbm: 19 } }, 'placa', { pa }));
  assert.match(at19.why, /27,0 dBm/);
  assert.match(at19.why, /740 mA/);
  const odd = rule('CFG-02').evaluate(withPart({ ...base, state: { ...base.state, txDbm: 13 } }, 'placa', { pa }));
  assert.equal(odd.level, 'warn');
  assert.doesNotMatch(odd.why, /undefined|NaN/);
});

test('conjuntos padrão incluem peças, instalação e configuração', () => {
  for (const set of [HARDWARE_RULES, INSTALL_RULES, CONFIG_RULES]) assert.ok(DEFAULT_RULE_SETS.includes(set));
});

test('padrão do projeto 4 com MG/31: nenhum Problema na auditoria completa', () => {
  const items = runAudit(withRegion(createState(4)));
  assert.equal(summarize(items).bad, 0);
  assert.equal(items.some((i) => i.id === 'CFG-04' && i.level === 'ok'), false);
  assert.ok(items.some((i) => i.id === 'CFG-04' && i.level === 'warn'));
});
