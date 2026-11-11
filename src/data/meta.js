// Metadados e constantes de referência. Toda regra daqui tem fonte na skill meshcore-hubreal.
export const META = Object.freeze({
  rulesCheckedAt: '2026-11-10',
  firmware: '1.18.0',
  defaults: Object.freeze({ daysNoSun: 9, daysRecharge: 2, hsp: 4.2 }),
  limits: Object.freeze({
    daysNoSun: Object.freeze([1, 20]),
    daysRecharge: Object.freeze([1, 7]),
    hsp: Object.freeze([2, 7]),
  }),
  // Fração útil da Li-ion entre 4,2 V e 3,6 V (spec §8.2, hardware-energia.md).
  usefulFraction: 0.68,
  // Tensão nominal do painel usada na conversão corrente -> potência.
  panelVolts: 6,
  // Margem sobre a potência mínima do painel (20–30 %; usa-se o 25 % do meio).
  margin: 1.25,
  // Consumo extra do GPS em mA: faixa 30–60 da skill; usa-se 60 por ser o conservador.
  gpsExtraMa: 60,
  githubRepo: 'gabrielpinheiro01-ship-it/bancada-mesh',
  formPrefillUrl: null,
});
