// Os 7 projetos (spec §9). Só os `pronto` abrem na bancada; os `em-breve` esperam a lacuna de `blockedBy` (spec §12).
export const LOCATION_LABELS = Object.freeze({
  telhado: 'telhado ou poste',
  predio: 'prédio ou morro baixo',
  pico: 'serra, pico ou torre',
  dentro: 'dentro de casa',
  movel: 'em movimento (carro ou mochila)',
});

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

// Opções compartilhadas pelos projetos de repetidor.
const ANTENA = {
  label: 'Antena', default: 'omni-915-5dbi',
  alternatives: ['antena-915-simples', 'antena-868', 'colinear-caseira', 'omni-915-8dbi'],
};
const CABO = { label: 'Cabo da antena', default: 'pigtail-15cm', alternatives: ['rg58-3m', 'lmr400-3m'] };
const CAIXA = { label: 'Caixa', default: 'caixa-clara-respiro', alternatives: ['caixa-sem-respiro', 'caixa-escura'] };
const LOCAIS = ['telhado', 'predio', 'pico', 'dentro'];

export const PROJECTS = deepFreeze({
  1: {
    id: 1,
    name: 'Companion de bolso pronto',
    what: 'Um rádio de bolso já montado, que você liga ao celular por Bluetooth para mandar mensagens pela rede.',
    difficulty: 1,
    solder: false,
    solderLabel: 'sem solda',
    role: 'companion',
    // Bateria embutida no aparelho (sem carregador nem BMS escolhidos pela pessoa): as regras de proteção e de energia não se aplicam.
    power: 'integrated',
    status: 'pronto',
    blockedBy: [],
    slots: {
      aparelho: { label: 'Aparelho', default: 'wio-l1-pro', alternatives: ['t1000e', 'wismesh-tag', 'wio-l2-pro'] },
    },
    locations: [],
    // Sem fiação: um desenho genérico (aparelho pronto + celular por Bluetooth) serve para os três aparelhos.
    drawings: [{ id: 'p1-aparelho', match: {} }],
    defaultDrawing: 'p1-aparelho',
  },
  2: {
    id: 2,
    name: 'Companion DIY Heltec V3',
    what: 'Um rádio de bolso montado por você com uma Heltec V3, para usar com o celular por Bluetooth.',
    difficulty: 2,
    solder: true,
    solderLabel: 'solda leve',
    role: 'companion',
    power: 'battery',
    status: 'em-breve',
    blockedBy: ['R2'],
    slots: {
      placa: { label: 'Placa', default: 'heltec-v3', alternatives: ['heltec-v4'] },
      antena: { ...ANTENA },
      caixa: { ...CAIXA },
    },
    locations: [],
    drawings: [],
    defaultDrawing: null,
  },
  3: {
    id: 3,
    name: 'Repetidor de varanda na tomada',
    what: 'Um repetidor ligado na tomada, do lado de fora (varanda, laje ou telhado), que ajuda o sinal da sua região a chegar mais longe.',
    difficulty: 2,
    solder: true,
    solderLabel: 'pouca solda',
    role: 'repeater',
    power: 'mains',
    status: 'pronto',
    blockedBy: [],
    slots: {
      placa: { label: 'Placa', default: 't114', alternatives: ['heltec-v3'] },
      fonte: { label: 'Fonte', default: 'fonte-usb-5v', alternatives: [] },
      antena: { ...ANTENA },
      cabo: { ...CABO },
      caixa: { ...CAIXA },
    },
    locations: LOCAIS,
    // Só a placa muda a fiação.
    drawings: [
      { id: 'p3-t114', match: { placa: ['t114'] } },
      { id: 'p3-v3', match: { placa: ['heltec-v3'] } },
    ],
    defaultDrawing: 'p3-t114',
  },
  4: {
    id: 4,
    name: 'Repetidor solar XIAO',
    what: 'Um repetidor pequeno que fica do lado de fora, vive de painel solar e ajuda o sinal da sua região a chegar mais longe.',
    difficulty: 3,
    solder: true,
    solderLabel: 'solda (pads BAT embaixo da XIAO)',
    role: 'repeater',
    power: 'solar',
    status: 'pronto',
    blockedBy: [],
    slots: {
      placa: { label: 'Placa', default: 'xiao-nrf52840-wio', alternatives: ['xiao-esp32s3-wio', 'xiao-nrf52840-sem-wio'] },
      bateria: { label: 'Bateria', default: 'bat-2x3500', alternatives: ['bat-1x3500', 'bat-2x9900-generica'] },
      carregador: {
        label: 'Carregador solar', default: 'tp4056-dw01',
        alternatives: ['cn3791-bms', 'tp4056-sem-protecao', 'cn3791-sem-bms', 'painel-direto-usb'],
      },
      painel: { label: 'Painel solar', default: 'painel-6v-3w', alternatives: ['painel-6v-1w', 'painel-6v-2w', 'painel-6v-5w'] },
      antena: { ...ANTENA },
      cabo: { ...CABO },
      caixa: { ...CAIXA },
    },
    locations: LOCAIS,
    // Só o carregador muda a fiação (a bateria é um pack 1S; painel, antena, cabo e caixa não mexem no esquema).
    drawings: [
      { id: 'p4-tp4056', match: { carregador: ['tp4056-dw01'] } },
      { id: 'p4-cn3791-bms', match: { carregador: ['cn3791-bms'] } },
    ],
    defaultDrawing: 'p4-tp4056',
  },
  5: {
    id: 5,
    name: 'Repetidor solar T114',
    what: 'Um repetidor com a placa T114, bateria grande e painel de 9 W, para ficar do lado de fora vivendo do sol.',
    difficulty: 3,
    solder: true,
    solderLabel: 'solda básica (1 a 2 h)',
    role: 'repeater',
    power: 'solar',
    status: 'em-breve',
    blockedBy: ['R4'],
    slots: {
      placa: { label: 'Placa', default: 't114', alternatives: [] },
      bateria: { label: 'Bateria', default: 'bat-3x3200-bms', alternatives: ['bat-2x3200-bms', 'bat-1x3200-bms'] },
      carregador: { label: 'Carregador solar', default: 'cn3065', alternatives: [] },
      painel: { label: 'Painel solar', default: 'painel-6v-9w', alternatives: ['painel-6v-5w', 'painel-6v-3w'] },
      antena: { ...ANTENA },
      cabo: { label: 'Cabo da antena', default: 'pigtail-ipex-n-10cm', alternatives: [] },
      caixa: { label: 'Caixa', default: 'caixa-abs-ip65-respiro', alternatives: ['caixa-sem-respiro'] },
    },
    locations: LOCAIS,
    drawings: [],
    defaultDrawing: null,
  },
  6: {
    id: 6,
    name: 'Repetidor 1 W RAK solar',
    what: 'Um repetidor modular com amplificador de 1 W, para quem quer mais potência e aceita uma montagem mais trabalhosa.',
    difficulty: 4,
    solder: false,
    solderLabel: 'montagem modular',
    role: 'repeater',
    power: 'solar',
    status: 'em-breve',
    blockedBy: ['R3'],
    slots: {
      placa: { label: 'Placa', default: 'rak3401-rak13302', alternatives: [] },
      bateria: { label: 'Bateria', default: 'bat-2x3500', alternatives: ['bat-1x3500', 'bat-2x9900-generica'] },
      painel: { label: 'Painel solar', default: 'painel-6v-5w', alternatives: ['painel-6v-3w'] },
      antena: { ...ANTENA },
      cabo: { ...CABO },
      caixa: { ...CAIXA },
    },
    locations: LOCAIS,
    drawings: [],
    defaultDrawing: null,
  },
  7: {
    id: 7,
    name: 'Observer Wi-Fi',
    what: 'Um rádio fixo na tomada, com Wi-Fi, que escuta a rede e manda o que ouve para os mapas da comunidade.',
    difficulty: 4,
    solder: false,
    solderLabel: 'sem solda, mais configuração',
    role: 'observer',
    power: 'mains',
    status: 'em-breve',
    blockedBy: ['R5'],
    slots: {
      placa: { label: 'Placa', default: 'heltec-v3', alternatives: ['heltec-v4'] },
      fonte: { label: 'Fonte', default: 'fonte-usb-5v', alternatives: [] },
    },
    locations: ['telhado', 'predio', 'pico', 'dentro', 'movel'],
    drawings: [],
    defaultDrawing: null,
  },
});
