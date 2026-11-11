// Catálogo de peças. Atributos só onde a skill meshcore-hubreal sustenta.
// Preço: só com fonte e data; sem fonte = sem campo `price`. Fotos entram depois.
// Fontes na skill (meshcore-hubreal/references/): hardware-energia.md e guia-repeater-xiao-solar.md.

const wio = (extra) => ({
  mcu: 'nrf52', currentMa: 10, bandMhz: 915, hasLoRa: true, bootlock: false, gps: false,
  supported: true, wifi: false, wiring: 'xiao-bat-pads', pa: null, ...extra,
});

const SOROCABA = (n) => ({ min: n, max: n, source: 'Mesh Sorocaba (hardware-energia.md)', date: '2026-04-27' });

// Aparelho pronto (companion de bolso): nRF52840, bateria e GPS embutidos.
// Fonte: hardware-energia.md, "Escolha de placa" (Companion bolso: nRF52840, bateria, GPS).
const pocket = (extra) => ({
  mcu: 'nrf52', currentMa: 10, bandMhz: 915, hasLoRa: true, bootlock: false, gps: true,
  supported: true, wifi: false, pa: null, ...extra,
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
  // --- Aparelhos prontos (projeto 1). Fonte: hardware-energia.md, "Escolha de placa" e "Recomendações comuns" ---
  'wio-l1-pro': {
    slot: 'aparelho', name: 'Seeed Wio Tracker L1 Pro', short: 'Wio Tracker L1 Pro',
    attrs: pocket({}), price: SOROCABA(380),
  },
  't1000e': {
    slot: 'aparelho', name: 'Seeed SenseCAP T1000-E', short: 'T1000-E',
    // a skill não traz preço do T1000-E
    attrs: pocket({}),
  },
  'wismesh-tag': {
    slot: 'aparelho', name: 'RAK WisMesh Tag', short: 'WisMesh Tag',
    attrs: pocket({}), price: SOROCABA(345),
  },
  'wio-l2-pro': {
    // hardware-energia.md: em 10/11/2026 não há variante no repo oficial MeshCore
    slot: 'aparelho', name: 'Seeed Wio Tracker L2 Pro', short: 'Wio Tracker L2 Pro',
    counterexample: true,
    attrs: pocket({ supported: false }),
  },

  // --- Placas de outros projetos (hardware-energia.md: "Escolha de placa", PA, "Consumo de referência") ---
  'heltec-v3': {
    slot: 'placa', name: 'Heltec WiFi LoRa 32 V3 (versão 915 MHz)', short: 'Heltec V3',
    // ESP32 ~45 mA (fw >= 1.16); Bluetooth fraco: FAQ 6.6
    attrs: { mcu: 'esp32', currentMa: 45, bandMhz: 915, hasLoRa: true, bootlock: false, gps: false,
      supported: true, wifi: true, bleWeak: true, pa: null },
    price: SOROCABA(290),
  },
  'heltec-v4': {
    slot: 'placa', name: 'Heltec V4 (versão 915 MHz)', short: 'Heltec V4',
    // PA da tabela FAQ 7.7; a skill não dá o pico de corrente do V4
    attrs: { mcu: 'esp32', currentMa: 45, bandMhz: 915, hasLoRa: true, bootlock: false, gps: false,
      supported: true, wifi: true, pa: { outDbm: { 22: 28, 10: 22 }, peakMa: {}, needs5V: false } },
  },
  't114': {
    slot: 'placa', name: 'Heltec Mesh Node T114 (sem tela)', short: 'Heltec T114',
    attrs: { mcu: 'nrf52', currentMa: 10, bandMhz: 915, hasLoRa: true, bootlock: false, gps: false,
      supported: true, wifi: false, pa: null },
    price: SOROCABA(230),
  },
  'rak3401-rak13302': {
    slot: 'placa', name: 'RAK3401 + RAK13302 (1 W) em base WisBlock', short: 'RAK3401 + 1 W',
    // currentMa null: consumo médio não está na skill (lacuna R3). PA: datasheet VD do RAK13302.
    attrs: { mcu: 'nrf52', currentMa: null, bandMhz: 915, hasLoRa: true, bootlock: false, gps: false,
      supported: true, wifi: false, supplyV: 5,
      pa: { outDbm: { 22: 30, 19: 27, 16: 24 }, peakMa: { 22: 1000, 19: 740, 16: 560 }, needs5V: true } },
  },

  // --- Fonte na tomada (projetos 3 e 7) ---
  'fonte-usb-5v': {
    slot: 'fonte', name: 'Fonte USB 5 V na tomada', short: 'Fonte USB 5 V',
    attrs: { kind: 'usb-5v' },
  },

  // --- Baterias com BMS (projeto 5; o BMS protege a descarga) ---
  'bat-3x3200-bms': {
    slot: 'bateria', name: '3 baterias 18650 de marca (3200 mAh cada) com BMS', short: '3× 18650 + BMS',
    attrs: { cells: 3, mahPerCell: 3200, branded: true, protectedCells: true },
  },
  'bat-2x3200-bms': {
    slot: 'bateria', name: '2 baterias 18650 de marca (3200 mAh cada) com BMS', short: '2× 18650 + BMS',
    attrs: { cells: 2, mahPerCell: 3200, branded: true, protectedCells: true },
  },
  'bat-1x3200-bms': {
    slot: 'bateria', name: '1 bateria 18650 de marca (3200 mAh) com BMS', short: '1× 18650 + BMS',
    attrs: { cells: 1, mahPerCell: 3200, branded: true, protectedCells: true },
  },
  'cn3065': {
    slot: 'carregador', name: 'Carregador solar CN3065', short: 'CN3065',
    attrs: { dischargeProtection: false, mppt: false },
  },
  'painel-6v-9w': { slot: 'painel', name: 'Painel solar 6 V 9 W', short: '6 V 9 W', attrs: { watts: 9, volts: 6 } },
  'pigtail-ipex-n-10cm': {
    slot: 'cabo', name: 'Pigtail IPEX→N de 10 cm', short: 'Pigtail 10 cm',
    attrs: { type: 'pigtail', lengthM: 0.1 },
  },
  'caixa-abs-ip65-respiro': {
    slot: 'caixa', name: 'Caixa ABS IP65 150×100×70 com respiro', short: 'Caixa ABS IP65',
    attrs: { vent: true, light: true },
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
