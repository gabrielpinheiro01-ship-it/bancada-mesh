// Cálculo de energia pelo método da Mesh Sorocaba (spec §8.2; skill hardware-energia.md).
// Todas as contas usam mA, mAh, horas, dias, V e W. Os resultados são crus (sem arredondar).
import { META } from '../data/meta.js';

const HOURS_PER_DAY = 24;

/**
 * @param {{currentMa:number, batteryMah:number|null, daysNoSun:number, daysRecharge:number,
 *   hsp:number, panelW:number}} input
 *   currentMa = I (mA); batteryMah = C_instalada (mAh) ou null; daysNoSun = N;
 *   daysRecharge = D; hsp = HSP (h de sol pleno); panelW = potência do painel (W).
 * @returns {{E:number, Cnec:number, autonomyDays:number|null, Erec:number, Isol:number,
 *   Pmin:number, Prec:number, coversDay:boolean}}
 */
export function calcEnergy({ currentMa, batteryMah, daysNoSun, daysRecharge, hsp, panelW }) {
  const frac = META.usefulFraction;
  const I = currentMa;
  const N = daysNoSun;
  const D = daysRecharge;

  // E = I × 24 × N                       (mAh gastos nos dias sem sol)
  const E = I * HOURS_PER_DAY * N;
  // C_nec = E ÷ frac                     (bateria necessária, mAh)
  const Cnec = E / frac;
  // autonomia = C_instalada × frac ÷ (I × 24)   (dias); sem bateria informada, não há autonomia
  const autonomyDays = batteryMah == null ? null : (batteryMah * frac) / (I * HOURS_PER_DAY);
  // E_rec = C_nec × frac + I × 24 × D    (mAh a repor em D dias de sol)
  const Erec = Cnec * frac + I * HOURS_PER_DAY * D;
  // I_sol = E_rec ÷ (HSP × D)            (mA de painel)
  const Isol = Erec / (hsp * D);
  // P_min = I_sol × V_painel ÷ 1000      (W)
  const Pmin = (Isol * META.panelVolts) / 1000;
  // P_rec = P_min × margem               (W)
  const Prec = Pmin * META.margin;
  // Um dia de sol cobre o consumo do dia: (W ÷ V × 1000) × HSP >= I × 24, tudo em mAh.
  const coversDay = (panelW / META.panelVolts) * 1000 * hsp >= I * HOURS_PER_DAY;

  return { E, Cnec, autonomyDays, Erec, Isol, Pmin, Prec, coversDay };
}
