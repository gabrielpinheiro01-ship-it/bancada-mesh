// Projetos. Só o projeto 4 está completo; os outros entram na Task 7.
export const LOCATION_LABELS = Object.freeze({
  telhado: 'telhado ou poste',
  predio: 'prédio ou morro baixo',
  pico: 'serra, pico ou torre',
  dentro: 'dentro de casa',
});

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

export const PROJECTS = deepFreeze({
  4: {
    id: 4,
    name: 'Repetidor solar XIAO',
    what: 'Um repetidor pequeno que fica do lado de fora, vive de painel solar e ajuda o sinal da sua região a chegar mais longe.',
    difficulty: 3,
    solder: true,
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
      antena: {
        label: 'Antena', default: 'omni-915-5dbi',
        alternatives: ['antena-915-simples', 'antena-868', 'colinear-caseira', 'omni-915-8dbi'],
      },
      cabo: { label: 'Cabo da antena', default: 'pigtail-15cm', alternatives: ['rg58-3m', 'lmr400-3m'] },
      caixa: { label: 'Caixa', default: 'caixa-clara-respiro', alternatives: ['caixa-sem-respiro', 'caixa-escura'] },
    },
    locations: ['telhado', 'predio', 'pico', 'dentro'],
    drawings: [],
    defaultDrawing: null,
  },
});
