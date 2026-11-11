// Gravação do firmware, uma entrada por placa/aparelho de projeto `pronto` (exceto contraexemplos).
// Textos em palavras próprias. Fonte: skill meshcore-hubreal (SKILL.md "Reset de fábrica"; references/hardware-energia.md
// "Modo de gravação por placa" e "Atualização de firmware"; references/guia-repeater-xiao-solar.md §3;
// references/padroes-comunidade-br.md §11); docs/research/2026-11-lacunas.md (R1).

const TYPES = Object.freeze({
  repeater: 'Repetidor',
  companion: 'Companion Bluetooth',
  observer: 'Observer',
});

/** Tipo de firmware que se escolhe no flasher para cada papel do projeto. */
export function firmwareTypeFor(role) {
  const t = TYPES[role];
  if (!t) throw new Error(`Papel desconhecido: ${role}`);
  return t;
}

/** Frase do PDF para peça reprovada (contraexemplo): não há passos de gravação para ela. */
export const FLASH_REPROVADA = 'Esta peça foi reprovada na auditoria. Troque antes de gravar.';

const FLASHER = 'flasher.meshcore.io';
const FLASHER_BR = 'meshcore.com.br/flasher';

// Passos que valem para qualquer placa; a parte própria de cada uma entra no meio.
function steps({ type, listName, manual, signal, extra = [], after, antenna }) {
  const eng = type === 'Repetidor'
    ? ' (no flasher, que é em inglês, aparece como "Repeater")'
    : ' (no flasher, que é em inglês, aparece como "Companion" com Bluetooth, BLE)';
  return [
    antenna || 'Antes de ligar a placa no cabo, rosqueie ou encaixe a antena. Nunca ligue o rádio sem antena: pode queimar o chip de rádio.',
    'Use um computador com Chrome ou Edge. O flasher (um site que grava o programa, o firmware, dentro da placa) não funciona no celular nem no Firefox.',
    `Abra ${FLASHER} (ou o espelho brasileiro, ${FLASHER_BR}).`,
    'Use um cabo USB de dados. Cabo que só carrega não serve: o flasher não enxerga a placa.',
    `Ligue a placa no computador. Na lista do flasher, escolha ${listName}. Se o nome for um pouco diferente, procure pelo modelo.`,
    `Em "tipo de firmware", escolha ${type}${eng}.`,
    'Se o seu flasher mostrar o botão "Enter DFU Mode", clique nele. Na maioria das vezes isso basta e a placa já fica pronta para receber o firmware.',
    `Viu o sinal de que entrou no modo de gravação? Então siga. O sinal é: ${signal}`,
    `Não viu o sinal? Entre no modo de gravação na mão: ${manual}`,
    ...extra,
    'Clique em gravar (Flash) e espere terminar. O flasher grava sozinho pelo cabo. Se ele pedir, ou se você baixou o arquivo .uf2, arraste esse arquivo para o disco USB que apareceu no computador. Não tire o cabo no meio.',
    'Deu erro? Tente de novo. Costuma dar certo na segunda vez.',
    after,
  ];
}

const AFTER_REPEATER = 'Terminou: a placa reinicia sozinha como repetidor. O próximo passo é configurar por USB (veja a página de comandos).';
const AFTER_COMPANION = 'Terminou: o aparelho reinicia. O próximo passo é parear com o app MeshCore pelo Bluetooth e configurar o rádio por lá.';

const NRF_DOUBLE_TAP = 'dê dois toques rápidos no botão de reset (RESET) da placa, como um duplo clique.';
const ESP_BOOT = 'segure o botão PRG (na Heltec) ou BOOT (na XIAO), mantenha apertado e só então plugue o cabo USB. Outro jeito: segure PRG/BOOT e dê um toque no RST.';

export const FLASH = Object.freeze({
  // --- Projeto 1: aparelhos prontos (Companion Bluetooth) ---
  'wio-l1-pro': {
    firmwareType: 'Companion Bluetooth',
    steps: steps({
      type: 'Companion Bluetooth',
      listName: 'o Seeed Wio Tracker L1 Pro (se a lista só tiver "Wio Tracker L1", procure por esse nome)',
      manual: 'com o cabo USB de dados ligado, dê um duplo toque no botão Reset. Para sair do modo, um toque só no Reset.',
      signal: 'o LED fica amarelo e fixo, e o computador mostra uma porta serial e um disco USB novos. O nome do disco muda conforme a versão do bootloader, então não use o nome como prova.',
      extra: ['Atualize esse aparelho pelo cabo, como nestes passos.'],
      antenna: 'Se o seu aparelho tem antena que rosqueia ou encaixa, ponha a antena antes de ligar o cabo. Nunca ligue o rádio sem antena: pode queimar o chip de rádio.',
      after: AFTER_COMPANION,
    }),
    source: 'references/hardware-energia.md, "Modo de gravação por placa" (Wio Tracker L1 / L1 Pro) · https://wiki.seeedstudio.com/get_started_with_meshtastic_wio_tracker_l1/ (FAQ; a página é de Meshtastic, o procedimento é do bootloader da placa e vale para MeshCore) · docs/research/2026-11-lacunas.md R1',
  },
  't1000e': {
    firmwareType: 'Companion Bluetooth',
    steps: steps({
      type: 'Companion Bluetooth',
      listName: 'o SenseCAP T1000-E',
      manual: 'segure o botão do aparelho e plugue o cabo magnético de carga duas vezes, rápido. Pode precisar de várias tentativas.',
      signal: 'o LED fica verde e fixo, e aparece no computador um disco chamado T1000-E (leva uns 10 a 15 segundos). Ficou preso nesse modo? Segure o botão e plugue o cabo uma vez só para reiniciar.',
      extra: ['Não atualize o T1000-E pelo app nRF (atualização OTA, pelo ar). A Seeed avisa que isso pode travar o aparelho. Atualize só pelo cabo, como nestes passos.'],
      antenna: 'Se o seu aparelho tem antena que rosqueia ou encaixa, ponha a antena antes de ligar o cabo. Nunca ligue o rádio sem antena: pode queimar o chip de rádio.',
      after: AFTER_COMPANION,
    }),
    source: 'references/hardware-energia.md, "Modo de gravação por placa" (SenseCAP T1000-E) · references/manuais-e-datasheets.md (alerta da Seeed sobre OTA) · https://wiki.seeedstudio.com/sensecap_t1000_e_meshcore/ (Firmware Flashing e Troubleshooting) · docs/research/2026-11-lacunas.md R1',
  },
  'wismesh-tag': {
    firmwareType: 'Companion Bluetooth',
    steps: steps({
      type: 'Companion Bluetooth',
      listName: 'o RAK WisMesh Tag',
      manual: 'dê dois toques rápidos no botão de trás (o do topo, que também reinicia o aparelho; um toque só apenas reinicia). O botão da frente não serve. A USB desse aparelho é o conector magnético de 4 pinos, com o cabo que vem no kit.',
      signal: 'o LED verde fica "respirando" (acende e apaga devagar).',
      antenna: 'Se o seu aparelho tem antena que rosqueia ou encaixa, ponha a antena antes de ligar o cabo. Nunca ligue o rádio sem antena: pode queimar o chip de rádio.',
      after: AFTER_COMPANION,
    }),
    source: 'references/hardware-energia.md, "Modo de gravação por placa" (RAK WisMesh Tag) · https://docs.rakwireless.com/product-categories/meshtastic/wismesh-tag/quickstart (guia de Meshtastic; o modo de gravação vale para MeshCore) · docs/research/2026-11-lacunas.md R1',
  },

  // --- Projeto 3: repetidor na tomada ---
  't114': {
    firmwareType: 'Repetidor',
    steps: steps({
      type: 'Repetidor',
      listName: 'a Heltec Mesh Node T114',
      manual: NRF_DOUBLE_TAP,
      signal: 'a placa aparece no computador como um disco USB novo (modo UF2/DFU). Este é o procedimento padrão das placas com o chip nRF52840. Se nada aparecer, volte ao botão "Enter DFU Mode" do flasher.',
      after: AFTER_REPEATER,
    }),
    source: 'references/hardware-energia.md, "Atualização de firmware" (regra genérica de nRF52: duplo toque no reset) · docs/research/2026-11-lacunas.md R1 (T114 = regra genérica, sem página própria do fabricante)',
  },
  'heltec-v3': {
    firmwareType: 'Repetidor',
    steps: steps({
      type: 'Repetidor',
      listName: 'a Heltec WiFi LoRa 32 V3',
      manual: ESP_BOOT,
      signal: 'a placa aparece na lista de portas do flasher. Depois de gravar, pode ser preciso apertar o botão RST para a placa reiniciar.',
      extra: ['Confira a revisão impressa na placa (V3, V3.1 ou V3.2) e a versão de 915 MHz antes de gravar.'],
      after: AFTER_REPEATER,
    }),
    source: 'SKILL.md, "Reset de fábrica / placa travada" (ESP32-S3: PRG/BOOT + plugar o USB) · references/manuais-e-datasheets.md (revisões V3/V3.1/V3.2) · docs/research/2026-11-lacunas.md R1',
  },

  // --- Projeto 4: repetidor solar XIAO ---
  'xiao-nrf52840-wio': {
    firmwareType: 'Repetidor',
    steps: steps({
      type: 'Repetidor',
      listName: 'a Seeed XIAO nRF52840 (Wio-SX1262)',
      manual: NRF_DOUBLE_TAP,
      signal: 'aparece um disco USB novo (nome parecido com XIAO-SENSE) e o LED pulsa.',
      after: AFTER_REPEATER,
    }),
    source: 'references/guia-repeater-xiao-solar.md §3, passo 4 · SKILL.md, "Diagnóstico rápido" (nRF52840: duplo toque no reset) · docs/research/2026-11-lacunas.md R1',
  },
  'xiao-esp32s3-wio': {
    firmwareType: 'Repetidor',
    steps: steps({
      type: 'Repetidor',
      listName: 'a Seeed XIAO ESP32-S3 (Wio-SX1262)',
      manual: ESP_BOOT,
      signal: 'a placa aparece na lista de portas do flasher. Depois de gravar, pode ser preciso apertar o botão RST para a placa reiniciar.',
      after: AFTER_REPEATER,
    }),
    source: 'SKILL.md, "Reset de fábrica / placa travada" (ESP32-S3: PRG/BOOT + plugar o USB, ou PRG + toque em RST) · docs/research/2026-11-lacunas.md R1',
  },
});
