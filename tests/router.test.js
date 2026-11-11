import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routeGuard } from '../src/ui/router.js';
import { createState } from '../src/core/state.js';

test('hash vazio, "#" e "#/" vão para projetos', () => {
  for (const h of ['', '#', '#/']) assert.deepEqual(parseRoute(h), { name: 'projetos' });
});

test('bancada de projeto pronto abre', () => {
  assert.deepEqual(parseRoute('#/bancada/4'), { name: 'bancada', projectId: 4 });
});

test('projeto em breve vira aviso em-breve', () => {
  assert.deepEqual(parseRoute('#/bancada/6'), { name: 'aviso', reason: 'em-breve', projectId: 6 });
});

test('projeto inexistente ou id não numérico vira aviso inexistente', () => {
  assert.deepEqual(parseRoute('#/bancada/99'), { name: 'aviso', reason: 'inexistente', projectId: 99 });
  const r = parseRoute('#/bancada/abc');
  assert.equal(r.name, 'aviso');
  assert.equal(r.reason, 'inexistente');
});

test('#/pdf é rota pdf; rota desconhecida volta a projetos', () => {
  assert.deepEqual(parseRoute('#/pdf'), { name: 'pdf' });
  assert.deepEqual(parseRoute('#/qualquer-coisa'), { name: 'projetos' });
});

test('routeGuard: pdf sem estado volta a projetos; com estado mantém', () => {
  assert.equal(routeGuard({ name: 'pdf' }, null).name, 'projetos');
  assert.equal(routeGuard({ name: 'pdf' }, createState(4)).name, 'pdf');
  assert.deepEqual(routeGuard({ name: 'projetos' }, null), { name: 'projetos' });
});
