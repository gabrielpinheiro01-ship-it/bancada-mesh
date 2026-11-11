// Regras de peças HW-01…HW-14 (spec §8.3). HW-03 e HW-15 são alertas fixos do desenho/PDF (outra tarefa);
// HW-12 virou o item CFG-02 (config.js). Princípio: na dúvida, Atenção (o pior erro é o falso OK).
//
// Atributos de peça que a v1 ainda não preenche (a Task 7 vai marcá-los nas peças novas):
//   placa.tbeam    boolean   true = T-Beam (ESP32 + GPS)                       -> HW-11
//   placa.supplyV  number    tensão que alimenta a placa/módulo (3.3 ou 5)     -> HW-13
//   placa.pa       object    {needs5V:boolean, outDbm:{txDbm:dBm}, peakMa:{txDbm:mA}} (já existe; needs5V é novo)
//   placa.bleWeak  boolean   true = Bluetooth fraco/queda conhecida (Heltec V3) -> HW-14
// Sem o atributo, a regra não dispara; o teste usa contexto sintético.
import { item, META_RULE, swapFix, boardOf } from './common.js';

const BAND_HZ = 923.125;
const HW_MD = 'meshcore-hubreal/references/hardware-energia.md';
const ANT_SRC = `${HW_MD}, seção "Antenas"; https://github.com/meshcore-dev/MeshCore`;
const DATASHEETS = 'https://wiki.seeedstudio.com/wio_sx1262/';

const SRC = {
  band: `${HW_MD}, seção "Escolha de placa" (sempre a versão 915 MHz); meshcore-hubreal/SKILL.md, seção "Padrão nacional"; ${DATASHEETS}`,
  antBand: `meshcore-hubreal/SKILL.md, seção "Padrão nacional" (923,125 MHz); ${HW_MD}, seção "Antenas"; https://meshcore.com.br`,
  homemade: `${HW_MD}, seção "Antenas" (medir ROE com NanoVNA, alvo < 1,5 em 923 MHz); https://www.meshsorocaba.org`,
  gain: `${HW_MD}, seção "Antenas" (ganho alto achata o lóbulo); https://www.meshsorocaba.org`,
  cable: `${HW_MD}, seção "Antenas" (RG-58 perde ~0,5 dB/m em 900 MHz); https://www.meshsorocaba.org`,
  esp32: `${HW_MD}, seção "Recomendações comuns na internet" (ESP32 gasta 4 a 8 vezes mais); meshcore-hubreal/SKILL.md; https://meshcore.com.br`,
  gps: `${HW_MD}, seção "Recomendações comuns na internet" (GPS ajuda na rede: falso); https://meshcore.com.br`,
  unsupported: 'meshcore-hubreal/references/manuais-e-datasheets.md (Wio Tracker L2 Pro sem variante); meshcore-hubreal/SKILL.md, seção "Versões de firmware" (sem variante no repositório oficial, conferido em 10/11/2026); https://github.com/meshcore-dev/MeshCore',
  noLora: `${HW_MD}, seção "Recomendações comuns na internet" (XIAO sozinha não tem rádio LoRa); https://wiki.seeedstudio.com/xiao_nrf52840&_wio_SX1262_kit_for_meshtastic/`,
  tbeam: `${HW_MD}, seção "Recomendações comuns na internet" (T-Beam como repetidor); https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series`,
  rak: 'meshcore-hubreal/references/manuais-e-datasheets.md (RAK13302 datasheet VD); https://docs.rakwireless.com/product-categories/wisblock/rak13302/datasheet-vd/',
  ble: `${HW_MD}, seção "Recomendações comuns na internet" (Heltec V3, FAQ 6.6); https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md`,
};

const isRepeaterSolar = (ctx) => ctx.project?.role === 'repeater' && ctx.project?.power === 'solar';
const coversBand = (a) => a.bandMinMhz <= BAND_HZ && BAND_HZ <= a.bandMaxMhz;
const goodBoard = (a) => a.hasLoRa === true && a.supported === true && a.bandMhz === 915;

const HW01 = {
  id: 'HW-01', source: SRC.band, ...META_RULE,
  evaluate(ctx) {
    const b = boardOf(ctx);
    if (!b || b.board.bandMhz === 915) return null;
    if (typeof b.board.bandMhz !== 'number' || !Number.isFinite(b.board.bandMhz)) {
      return item(this, 'warn', b.slot, 'Faixa da placa não confirmada',
        'Não sei em qual faixa esta placa opera: confira que é a versão 915 MHz. Uma placa 868 ou 433 MHz não conversa com a rede.');
    }
    return item(this, 'bad', b.slot, `Placa na versão de ${b.board.bandMhz} MHz`,
      'A rede brasileira usa 915 MHz (923,125 MHz na prática). Uma placa 868 ou 433 MHz não conversa com a rede. Compre sempre a versão 915 MHz.',
      swapFix(ctx, b.slot, goodBoard));
  },
};

const HW02 = {
  id: 'HW-02', source: SRC.antBand, ...META_RULE,
  evaluate(ctx) {
    const a = ctx.parts.antena;
    if (!a) return null;
    if (!Number.isFinite(a.bandMinMhz) || !Number.isFinite(a.bandMaxMhz) || typeof a.bandMinMhz !== 'number' || typeof a.bandMaxMhz !== 'number') {
      return item(this, 'warn', 'antena', 'Faixa da antena não confirmada',
        'Não sei em qual faixa esta antena opera: confira que é a versão 915 MHz (a rede usa 923,125 MHz). Uma antena de 868 MHz atende muito mal.');
    }
    if (coversBand(a)) return null;
    return item(this, 'bad', 'antena', 'Antena fora da faixa da rede',
      'A rede usa 923,125 MHz e esta antena não cobre essa frequência. Com ela o sinal fica fraco e o rádio pode se danificar. Use uma antena de 915 MHz.',
      swapFix(ctx, 'antena', (x) => x.bandMinMhz <= BAND_HZ && BAND_HZ <= x.bandMaxMhz && !x.homemade));
  },
};

const HW04 = {
  id: 'HW-04', source: SRC.homemade, ...META_RULE,
  evaluate(ctx) {
    const a = ctx.parts.antena;
    if (!a || a.homemade !== true) return null;
    return item(this, 'warn', 'antena', 'Antena caseira precisa ser medida',
      'Antena feita em casa só vale com ROE medida em NanoVNA (abaixo de 1,5 em 923 MHz). Sem o aparelho, uma antena omni comercial de 5 a 6 dBi é mais previsível.',
      swapFix(ctx, 'antena', (x) => !x.homemade && coversBand(x)));
  },
};

const HW05 = {
  id: 'HW-05', source: SRC.gain, ...META_RULE,
  evaluate(ctx) {
    const a = ctx.parts.antena;
    if (!a || typeof a.gainDbi !== 'number' || a.gainDbi < 6 || ctx.state.location !== 'pico') return null;
    return item(this, 'warn', 'antena', 'Antena de ganho alto em lugar alto',
      'Antena de ganho alto (6 dBi ou mais) deixa o sinal achatado, mirando o horizonte. Numa serra ou torre olhando para a cidade lá embaixo, ela atende pior que uma de 3 a 5 dBi.',
      swapFix(ctx, 'antena', (x) => typeof x.gainDbi === 'number' && x.gainDbi < 6 && !x.homemade && coversBand(x)));
  },
};

const HW06 = {
  id: 'HW-06', source: SRC.cable, ...META_RULE,
  evaluate(ctx) {
    const c = ctx.parts.cabo;
    if (!c || c.type !== 'RG-58') return null;
    if (typeof c.lengthM !== 'number' || !Number.isFinite(c.lengthM)) {
      return item(this, 'warn', 'cabo', 'Comprimento do cabo RG-58 desconhecido',
        'O RG-58 perde cerca de 0,5 dB por metro em 900 MHz e não sei o comprimento deste cabo. Confira: acima de 1 m, prefira rádio perto da antena ou um cabo melhor (LMR-400 ou RG-213).');
    }
    if (!(c.lengthM > 1)) return null;
    return item(this, 'warn', 'cabo', 'Cabo RG-58 longo perde sinal',
      'O RG-58 perde cerca de 0,5 dB por metro em 900 MHz. É melhor deixar o rádio perto da antena com um cabo curto, ou usar um cabo melhor (LMR-400 ou RG-213).',
      swapFix(ctx, 'cabo', (x) => x.type !== 'RG-58' || x.lengthM <= 1));
  },
};

const HW07 = {
  id: 'HW-07', source: SRC.esp32, ...META_RULE,
  evaluate(ctx) {
    const b = boardOf(ctx);
    if (!b || b.board.mcu !== 'esp32' || ctx.project?.power !== 'solar') return null;
    return item(this, 'warn', b.slot, 'Placa ESP32 em repetidor solar',
      'A placa ESP32 gasta de 4 a 8 vezes mais energia que a nRF52840, então a bateria e o painel precisam ser bem maiores. ESP32 faz mais sentido na tomada ou como observer.',
      swapFix(ctx, b.slot, (x) => x.mcu === 'nrf52' && goodBoard(x)));
  },
};

const HW08 = {
  id: 'HW-08', source: SRC.gps, ...META_RULE,
  evaluate(ctx) {
    const b = boardOf(ctx);
    if (!b || b.board.gps !== true || ctx.project?.role === 'companion') return null;
    return item(this, 'warn', b.slot, 'GPS ligado em nó fixo',
      'Num rádio que fica parado, a posição é digitada à mão. O GPS só gasta de 30 a 60 mA a mais, sem benefício.',
      swapFix(ctx, b.slot, (x) => x.gps !== true && goodBoard(x)));
  },
};

const HW09 = {
  id: 'HW-09', source: SRC.unsupported, ...META_RULE,
  evaluate(ctx) {
    const b = boardOf(ctx);
    if (!b || b.board.supported !== false) return null;
    return item(this, 'bad', b.slot, 'Placa sem suporte oficial do MeshCore',
      'Não existe versão do firmware oficial para esta placa (conferido em 10/11/2026). Escolha uma placa que o MeshCore suporta.',
      swapFix(ctx, b.slot, goodBoard));
  },
};

const HW10 = {
  id: 'HW-10', source: SRC.noLora, ...META_RULE,
  evaluate(ctx) {
    const b = boardOf(ctx);
    if (!b || b.board.hasLoRa !== false) return null;
    return item(this, 'bad', b.slot, 'Placa sem rádio LoRa',
      'A XIAO nRF52840 sozinha não tem rádio LoRa. Falta o módulo Wio-SX1262: sem ele não existe rede.',
      swapFix(ctx, b.slot, goodBoard));
  },
};

const HW11 = {
  id: 'HW-11', source: SRC.tbeam, ...META_RULE,
  evaluate(ctx) {
    const b = boardOf(ctx);
    if (!b || b.board.tbeam !== true || !isRepeaterSolar(ctx)) return null;
    return item(this, 'warn', b.slot, 'T-Beam como repetidor solar',
      'A T-Beam tem ESP32 e GPS, que gastam muita bateria. Nenhuma comunidade brasileira indica para repetidor; prefira uma placa nRF52840.',
      swapFix(ctx, b.slot, (x) => x.tbeam !== true && x.mcu === 'nrf52' && goodBoard(x)));
  },
};

const HW13 = {
  id: 'HW-13', source: SRC.rak, ...META_RULE,
  evaluate(ctx) {
    const b = boardOf(ctx);
    if (!b || !b.board.pa || b.board.pa.needs5V !== true || b.board.supplyV === 5) return null;
    if (b.board.supplyV !== 3.3) {
      return item(this, 'warn', b.slot, 'Confirme a alimentação do amplificador',
        'Este amplificador precisa de 5 V: confirme que a alimentação é de 5 V. Em 3,3 V o estágio de 1 W não funciona bem.');
    }
    return item(this, 'bad', b.slot, 'Amplificador de 1 W alimentado em 3,3 V',
      'O estágio de 1 W do amplificador não funciona bem em 3,3 V. Use a alimentação de 5 V indicada pelo fabricante.');
  },
};

const HW14 = {
  id: 'HW-14', source: SRC.ble, ...META_RULE,
  evaluate(ctx) {
    const b = boardOf(ctx);
    if (!b || b.board.bleWeak !== true || ctx.project?.role !== 'companion') return null;
    return item(this, 'warn', b.slot, 'Bluetooth desta placa é fraco',
      'Esta placa tem Bluetooth de alcance curto e queda de conexão conhecida, e gasta mais bateria. Funciona, mas o celular precisa ficar perto.');
  },
};

export const HARDWARE_RULES = [HW01, HW02, HW04, HW05, HW06, HW07, HW08, HW09, HW10, HW11, HW13, HW14];
