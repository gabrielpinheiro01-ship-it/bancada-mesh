// Catálogo de peças. Atributos só onde a skill meshcore-hubreal sustenta.
// Preço: só com fonte e data; sem fonte = sem campo `price`. Fotos entram depois.
// Fontes na skill (meshcore-hubreal/references/): hardware-energia.md e guia-repeater-xiao-solar.md.

const wio = (extra) => ({
  mcu: 'nrf52', currentMa: 10, bandMhz: 915, hasLoRa: true, bootlock: false, gps: false,
  supported: true, wifi: false, wiring: 'xiao-bat-pads', pa: null, ...extra,
});

const parts = {
  // --- Placas (hardware-energia.md: consumo médio e bootlock; guia: pads BAT+/BAT- do XIAO) ---
  'xiao-nrf52840-wio': {
    slot: 'placa', name: 'Kit XIAO nRF52840 + Wio-SX1262', short: 'XIAO nRF52840',
    attrs: wio({}),
    price: { min: 100, max: 100, source: 'Mesh Sorocaba (hardware-energia.md)', date: '2026-04-27' },
  },
  'xiao-esp32s3-wio': {
    slot: 'placa', name: 'Kit XIAO ESP32-S3 + Wio-SX1262', short: 'XIAO ESP32-S3',
    attrs: wio({ mcu: 'esp32', currentMa: 45, wifi: true }),
  },
  'xiao-nrf52840-sem-wio': {
    slot: 'placa', name: 'XIAO nRF52840 sozinha (sem módulo Wio-SX1262)', short: 'XIAO sem Wio',
    counterexample: true,
    attrs: wio({ hasLoRa: false }),
  },

  // --- Baterias (pack 1S, células em paralelo; hardware-energia.md "Armadilhas físicas") ---
  'bat-2x3500': {
    slot: 'bateria', name: '2 baterias 18650 de marca (3500 mAh cada)', short: '2× 18650 de marca',
    attrs: { cells: 2, mahPerCell: 3500, branded: true, protectedCells: false },
  },
  'bat-1x3500': {
    slot: 'bateria', name: '1 bateria 18650 de marca (3500 mAh)', short: '1× 18650 de marca',
    attrs: { cells: 1, mahPerCell: 3500, branded: true, protectedCells: false },
  },
  'bat-2x9900-generica': {
    slot: 'bateria', name: '2 baterias 18650 genéricas "9900 mAh"', short: '2× 18650 genérica',
    counterexample: true,
    attrs: { cells: 2, mahPerCell: 9900, branded: false, protectedCells: false },
  },

  // --- Carregadores (hardware-energia.md: TP4056 com DW01; CN3791 = MPPT sem proteção de descarga) ---
  'tp4056-dw01': {
    slot: 'carregador', name: 'Carregador TP4056 com proteção DW01 (saída OUT+/OUT−)', short: 'TP4056 + DW01',
    attrs: { dischargeProtection: true, mppt: false, wiring: 'tp4056-out' },
  },
  'cn3791-bms': {
    slot: 'carregador', name: 'Carregador solar CN3791 + BMS 1S', short: 'CN3791 + BMS',
    attrs: { dischargeProtection: true, mppt: true, wiring: 'cn3791-bms' },
  },
  'tp4056-sem-protecao': {
    slot: 'carregador', name: 'Carregador TP4056 sem proteção de descarga', short: 'TP4056 sem proteção',
    counterexample: true,
    attrs: { dischargeProtection: false, mppt: false, wiring: 'tp4056-bat' },
  },
  'cn3791-sem-bms': {
    slot: 'carregador', name: 'Carregador solar CN3791 sem BMS', short: 'CN3791 sem BMS',
    counterexample: true,
    attrs: { dischargeProtection: false, mppt: true, wiring: 'cn3791-direct' },
  },
  'painel-direto-usb': {
    slot: 'carregador', name: 'Painel ligado direto na entrada USB da placa', short: 'Painel direto',
    counterexample: true,
    attrs: { dischargeProtection: false, mppt: false, wiring: 'direct-usb', directUsb: true },
  },

  // --- Painéis 6 V (cálculo de potência: hardware-energia.md) ---
  'painel-6v-1w': { slot: 'painel', name: 'Painel solar 6 V 1 W', short: '6 V 1 W', attrs: { watts: 1, volts: 6 } },
  'painel-6v-2w': { slot: 'painel', name: 'Painel solar 6 V 2 W', short: '6 V 2 W', attrs: { watts: 2, volts: 6 } },
  'painel-6v-3w': { slot: 'painel', name: 'Painel solar 6 V 3 W', short: '6 V 3 W', attrs: { watts: 3, volts: 6 } },
  'painel-6v-5w': { slot: 'painel', name: 'Painel solar 6 V 5 W', short: '6 V 5 W', attrs: { watts: 5, volts: 6 } },

  // --- Antenas (hardware-energia.md: ganho alto = lóbulo achatado; colinear caseira 5–7 dBi reais) ---
  'omni-915-5dbi': {
    slot: 'antena', name: 'Antena omni 915 MHz 5 dBi', short: 'Omni 5 dBi',
    attrs: { bandMinMhz: 915, bandMaxMhz: 928, gainDbi: 5, homemade: false },
  },
  'antena-915-simples': {
    slot: 'antena', name: 'Antena 915 MHz simples ("pretinha")', short: 'Pretinha',
    // a skill não informa o ganho
    attrs: { bandMinMhz: 915, bandMaxMhz: 928, gainDbi: null, homemade: false },
  },
  'antena-868': {
    slot: 'antena', name: 'Antena de 868 MHz', short: 'Antena 868',
    counterexample: true,
    // a skill não informa o ganho
    attrs: { bandMinMhz: 863, bandMaxMhz: 870, gainDbi: null, homemade: false },
  },
  'colinear-caseira': {
    slot: 'antena', name: 'Antena colinear caseira 915 MHz', short: 'Colinear caseira',
    attrs: { bandMinMhz: 915, bandMaxMhz: 928, gainDbi: 6, homemade: true },
  },
  'omni-915-8dbi': {
    slot: 'antena', name: 'Antena omni 915 MHz 8 dBi', short: 'Omni 8 dBi',
    attrs: { bandMinMhz: 915, bandMaxMhz: 928, gainDbi: 8, homemade: false },
  },

  // --- Cabos ---
  'pigtail-15cm': {
    slot: 'cabo', name: 'Pigtail curto de 15 cm', short: 'Pigtail 15 cm',
    attrs: { type: 'pigtail', lengthM: 0.15 },
  },
  'rg58-3m': { slot: 'cabo', name: 'Cabo RG-58 de 3 m', short: 'RG-58 3 m', attrs: { type: 'RG-58', lengthM: 3 } },
  'lmr400-3m': { slot: 'cabo', name: 'Cabo LMR-400 de 3 m', short: 'LMR-400 3 m', attrs: { type: 'LMR-400', lengthM: 3 } },

  // --- Caixas (guia-repeater-xiao-solar.md: respiro e cor clara) ---
  'caixa-clara-respiro': {
    slot: 'caixa', name: 'Caixa clara com respiro', short: 'Caixa clara',
    attrs: { vent: true, light: true },
  },
  'caixa-sem-respiro': {
    slot: 'caixa', name: 'Caixa clara sem respiro', short: 'Sem respiro',
    counterexample: true, attrs: { vent: false, light: true },
  },
  'caixa-escura': {
    slot: 'caixa', name: 'Caixa escura com respiro', short: 'Caixa escura',
    counterexample: true, attrs: { vent: true, light: false },
  },
};

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

export const PARTS = deepFreeze(parts);
