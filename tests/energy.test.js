import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcEnergy } from '../src/core/energy.js';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `esperado ${b} ± ${tol}, veio ${a}`);

const base = { currentMa: 10, batteryMah: 7000, daysNoSun: 9, daysRecharge: 2, hsp: 4.2, panelW: 3 };

test('calcEnergy: exemplo de conferência do spec §8.2 (nRF52840, 10 mA, 9 dias)', () => {
  const r = calcEnergy(base);
  assert.equal(r.E, 2160);
  near(r.Cnec, 3176.5, 1);
  near(r.Isol, 314.3, 1);
  near(r.Pmin, 1.886, 0.01);
  near(r.Prec, 2.357, 0.01);
  near(r.autonomyDays, 19.83, 0.01);
  assert.equal(r.coversDay, true);
});

test('calcEnergy: painel de 0,3 W não cobre 45 mA por dia', () => {
  const r = calcEnergy({ ...base, currentMa: 45, panelW: 0.3 });
  assert.equal(r.coversDay, false);
});

test('calcEnergy: sem bateria informada, autonomia é null e o resto é calculado', () => {
  const r = calcEnergy({ ...base, batteryMah: null });
  assert.equal(r.autonomyDays, null);
  assert.equal(r.E, 2160);
  near(r.Pmin, 1.886, 0.01);
});

test('calcEnergy: devolve números crus, sem arredondar', () => {
  const r = calcEnergy(base);
  assert.equal(r.E, 2160);
  assert.notEqual(r.Cnec, Math.round(r.Cnec));
});
