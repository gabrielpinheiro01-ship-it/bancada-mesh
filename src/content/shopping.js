// Lista de compras do PDF: o "detalhe que evita erro" de cada peça e os acessórios por projeto.
// Textos em palavras próprias. Sem link de loja: o preço, quando existe, vem de PARTS (faixa com data e fonte).
// Fonte geral: references/guia-repeater-xiao-solar.md §1 (BOM) e §6 · references/hardware-energia.md
// ("Escolha de placa", "Antenas", "Proteção de bateria", "Armadilhas físicas") · references/manuais-e-datasheets.md
// ("Regra de ouro": conferir a revisão da placa) · SKILL.md ("Armadilhas").

export const SHOPPING_SOURCE = 'references/guia-repeater-xiao-solar.md §1 (lista de material) e §6 · references/hardware-energia.md ("Escolha de placa", "Antenas", "Proteção de bateria", "Armadilhas físicas") · references/manuais-e-datasheets.md (revisão da placa) · SKILL.md ("Armadilhas")';

const FREQ = 'Compre a versão de 915 MHz.';
const PAINEL = 'Painel de 6 V (não de 12 V nem de 18 V). Confira na página Energia se a potência basta.';
const BAT = '18650 de marca: Samsung 35E, LG MJ1 ou Molicel M35A. Desconfie das que anunciam capacidade gigante: é propaganda falsa.';

/** Detalhe por peça (partId -> frase). Peça reprovada também tem texto: explica por que não comprar. */
export const SHOPPING_TIPS = Object.freeze({
  // Projeto 1: aparelhos prontos
  'wio-l1-pro': `${FREQ} Confira o modelo na caixa: é o L1 Pro, não o L2 Pro.`,
  't1000e': `${FREQ} Vem com cabo magnético de carga: guarde o cabo.`,
  'wismesh-tag': `${FREQ} A USB dele é um conector magnético de 4 pinos: use o cabo que vem no kit.`,
  'wio-l2-pro': 'Não compre: em 10/11/2026 não existe firmware MeshCore oficial para este modelo.',

  // Placas
  'xiao-nrf52840-wio': `Kit já casado: placa XIAO nRF52840 com o módulo Wio-SX1262. ${FREQ} Peça nRF52840, não ESP32-S3.`,
  'xiao-esp32s3-wio': `${FREQ} Versão ESP32-S3: gasta bem mais bateria que a nRF52840; em projeto solar, prefira a nRF52840.`,
  'xiao-nrf52840-sem-wio': 'Não compre sozinha: sem o módulo Wio-SX1262 a placa não tem rádio. Compre o kit com o módulo.',
  't114': `${FREQ} Heltec Mesh Node T114 sem tela. Confira a revisão (v1 ou v2) impressa na placa.`,
  'heltec-v3': `${FREQ} Confira a revisão impressa na placa (V3, V3.1 ou V3.2).`,

  // Baterias
  'bat-2x3500': BAT,
  'bat-1x3500': BAT,
  'bat-2x9900-generica': 'Não compre: essa capacidade anunciada não existe numa 18650 de verdade. É propaganda falsa.',

  // Carregadores
  'tp4056-dw01': 'TP4056 USB-C COM o chip DW01 (a proteção). Ele tem os pontos OUT+ e OUT−; sem o DW01 não protege a bateria.',
  'cn3791-bms': 'CN3791 (carregador solar para painel de 6 V) junto com um BMS 1S, que protege a bateria. O CN3791 sozinho não protege.',
  'tp4056-sem-protecao': 'Não compre: TP4056 sem o DW01 não corta a bateria quando ela esvazia. Procure o módulo com OUT+ e OUT−.',
  'cn3791-sem-bms': 'Não compre assim: o CN3791 não protege a bateria contra descarga. Junte um BMS 1S.',
  'painel-direto-usb': 'Não ligue o painel direto na USB da placa: o painel de 6 V passa de 7 V sem carga. Use um carregador solar.',

  // Painéis
  'painel-6v-1w': PAINEL,
  'painel-6v-2w': PAINEL,
  'painel-6v-3w': PAINEL,
  'painel-6v-5w': PAINEL,

  // Antenas
  'omni-915-5dbi': 'Antena de 915 MHz com conector SMA. Confira a frequência escrita na antena.',
  'antena-915-simples': 'A "pretinha" só serve se for de 915 MHz: confirme a frequência antes de comprar.',
  'antena-868': 'Não compre: 868 MHz é outra faixa e você não vai ouvir ninguém. Precisa ser 915 MHz.',
  'colinear-caseira': 'Feita à mão: o ganho real costuma ficar entre 5 e 7 dBi. Teste antes de subir.',
  'omni-915-8dbi': 'Antena de 915 MHz. Ganho alto achata o sinal: bom em terreno plano, pior em morro.',

  // Cabos
  'pigtail-15cm': 'Pigtail curto U.FL (IPEX) para SMA fêmea de painel. Cabo curto perde pouco sinal.',
  // Cabo longo não entra no U.FL da placa: a saída da caixa é sempre o pigtail (guia §1 item 2; hardware-energia.md "Antenas").
  'rg58-3m': 'Cabo longo perde sinal. Se puder, ponha a caixa junto da antena e use pigtail curto. Com este cabo você também precisa de um pigtail U.FL (IPEX) para SMA de 10 a 15 cm, para sair da caixa.',
  'lmr400-3m': 'Cabo longo e grosso, de baixa perda. Se puder, ponha a caixa junto da antena e use pigtail curto. Com este cabo você também precisa de um pigtail U.FL (IPEX) para SMA de 10 a 15 cm, para sair da caixa.',

  // Caixas
  'caixa-clara-respiro': 'Caixa estanque IP65 de cor clara, com respiro. Cor escura esquenta e estraga a bateria.',
  'caixa-sem-respiro': 'Sem respiro a umidade fica presa dentro. Acrescente um respiro de equalização.',
  'caixa-escura': 'Caixa escura esquenta no sol. Prefira cor clara.',

  // Fonte
  'fonte-usb-5v': 'Fonte USB 5 V de marca. Fonte chaveada barata gera ruído de rádio e piora o seu próprio sinal.',
});

const PRENSA = { id: 'prensa-cabo', name: 'Prensa-cabo PG7 ou PG9', qty: 1 };
const SILICA = { id: 'silica', name: 'Sachê de sílica gel', qty: 1, tip: 'Vai dentro da caixa. Troque a cada 3 a 6 meses.' };
const ESPUMA = { id: 'fita-dupla', name: 'Espuma ou fita dupla-face', qty: 1, tip: 'Para prender tudo por dentro. Nada solto batendo.' };
const AUTOFUSAO = { id: 'autofusao', name: 'Fita autofusão', qty: 1, tip: 'Para enrolar na conexão SMA da antena e vedar contra a chuva.' };

/**
 * Acessórios por projeto: { id, name, qty, tip }. Não têm preço de referência.
 * Fonte: guia-repeater-xiao-solar.md §1 (itens 5, 9, 10, 11), §6 (água) e os passos de STEPS.
 */
export const SHOPPING_ACCESSORIES = Object.freeze({
  3: Object.freeze([
    { ...PRENSA, tip: 'Entrada do cabo da fonte na caixa. Aperte bem e faça a curva para baixo (pingadeira).' },
    SILICA,
    ESPUMA,
    AUTOFUSAO,
  ]),
  4: Object.freeze([
    { id: 'suporte', name: 'Suporte para as baterias 18650, ligadas em paralelo', qty: 1, tip: 'Em paralelo: os polos positivos juntos e os negativos juntos (vale para duas baterias).' },
    { ...PRENSA, tip: 'Entrada do fio do painel na caixa.' },
    { id: 'respiro', name: 'Respiro de equalização (membrana IP67)', qty: 1, tip: 'Evita condensação dentro da caixa.' },
    SILICA,
    { id: 'fio', name: 'Fio de 22 a 24 AWG, vermelho e preto', qty: 1, tip: 'Vermelho é positivo (+), preto é negativo (−).' },
    { id: 'termo', name: 'Tubo termo-retrátil', qty: 1, tip: 'Isola as soldas.' },
    ESPUMA,
    AUTOFUSAO,
    { id: 'multimetro', name: 'Multímetro', qty: 1, tip: 'Para medir a tensão das baterias e conferir a polaridade antes de ligar.' },
  ]),
});
