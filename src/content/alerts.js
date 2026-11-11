// Alertas fixos do desenho e do PDF. Lista de blocos: { id, title, items, source }.
// HW-03, HW-15, polaridade (fio vermelho = +, preto = −), EN-09 e EN-14 (spec §8.2 e §8.3).
// EN-09 e EN-14 só valem para projeto com bateria; o PDF filtra por projeto.

export const ALERTS = Object.freeze([
  {
    id: 'HW-03',
    title: 'Nunca ligue o rádio sem antena',
    items: [
      'Ligue a antena antes de dar energia. Rádio transmitindo sem antena pode queimar o chip de rádio (SX1262).',
    ],
    source: 'SKILL.md ("Armadilhas"; "Sem antena = pode queimar o SX1262") · references/guia-repeater-xiao-solar.md §2',
  },
  {
    id: 'HW-15',
    title: 'Confira a revisão da placa',
    items: [
      'A mesma placa existe em revisões diferentes: Heltec V3, V3.1 e V3.2; V4.2, V4.3 e V4-R8; T114 v1 e v2; RAK13302 VC e VD.',
      'Pinagem (qual pino faz o quê) e circuito de energia mudam de uma revisão para outra. Leia a revisão impressa na placa e use o esquema daquela revisão.',
    ],
    source: 'references/manuais-e-datasheets.md ("Regra de ouro": conferir a revisão da placa)',
  },
  {
    id: 'polaridade',
    title: 'Polaridade: vermelho é +, preto é −',
    items: [
      'Fio vermelho é positivo (+). Fio preto é negativo (−).',
      'Confira três vezes com o multímetro antes de ligar. Inverter os fios mata a placa.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §2 ("Solda nos pads BAT do XIAO")',
  },
  {
    id: 'EN-09',
    title: 'Baterias em paralelo: meça antes de juntar',
    items: [
      'Meça cada bateria com o multímetro antes de ligá-las em paralelo. A tensão das duas tem que ser igual, com diferença de no máximo 0,05 V.',
      'Estão diferentes? Carregue cada uma cheia, separadamente, e meça de novo.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §2 (esquema de ligação) · references/hardware-energia.md ("Armadilhas físicas")',
  },
  {
    id: 'EN-14',
    title: 'Teste a bateria antes de instalar',
    items: [
      'Faça o teste de descarga completa na bancada: deixe o repetidor na bateria até desligar e veja se ele volta sozinho quando a energia voltar.',
      'No solar, deixe também 48 h funcionando só no painel antes de subir.',
      'Desde o firmware 1.18, a maioria das placas nRF52 não se desliga sozinha com a bateria fraca e pode travar. É melhor descobrir isso na mesa do que em cima do telhado.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §5 · references/hardware-energia.md ("Proteção de bateria (nRF52)") · SKILL.md ("Versões de firmware": 1.18.0)',
  },
]);
