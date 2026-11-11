// Instalação e manutenção (spec §8.4, IN-05). Lista de blocos: { title, items, source }.
// Os blocos do painel e da bateria só valem para projetos solares; o PDF mostra os que servem ao projeto.
// Sem números de autonomia nem de painel: isso sai da auditoria de energia.

export const INSTALL = Object.freeze([
  {
    id: 'IN-05-altura',
    title: 'Altura e posição da antena',
    items: [
      'Quanto mais alto, melhor. Telhado, caixa d\'água, mastro ou topo de morro. A antena fica acima dos obstáculos e na vertical.',
      'Repetidor dentro de casa não funciona bem: concreto e metal barram o sinal de 923 MHz. Ele precisa ficar do lado de fora.',
      'Se o cabo da antena for longo, o sinal se perde nele. O melhor é a caixa junto da antena, com um pigtail curto.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §6 · references/hardware-energia.md ("Antenas", "Recomendações comuns") · SKILL.md ("Diagnóstico rápido")',
  },
  {
    id: 'IN-05-agua',
    title: 'Água',
    items: [
      'Aperte bem o prensa-cabo (peça de borracha que veda a entrada do cabo na caixa).',
      'Faça uma pingadeira: deixe o cabo formar uma curva para baixo antes de entrar na caixa. A água da chuva pinga na curva e não escorre para dentro.',
      'Faça um furo de dreno embaixo da caixa e ponha um respiro (membrana que deixa o ar passar e a água não) mais um sachê de sílica gel dentro.',
      'Enrole fita autofusão (borracha que gruda nela mesma) na conexão SMA da antena.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §6 · references/hardware-energia.md ("Armadilhas físicas": água)',
  },
  {
    id: 'IN-05-painel',
    title: 'Painel solar (só nos projetos solares)',
    items: [
      'Vire o painel para o norte.',
      'Incline o painel num ângulo parecido com a latitude da sua cidade. Em Belo Horizonte, por exemplo, é uns 20 graus.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §6',
  },
  {
    id: 'IN-05-calor',
    title: 'Calor',
    items: [
      'Use caixa de cor clara e deixe ela na sombra. Atrás ou embaixo do painel serve como telhado.',
      'Uma caixa no sol forte passa de 60 °C por dentro. Bateria de lítio carregando acima de uns 45 °C se estraga mais rápido.',
      'Prenda tudo por dentro com espuma ou fita dupla-face. Nada solto batendo.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §6 · references/hardware-energia.md ("Armadilhas físicas": calor) · SKILL.md ("Armadilhas")',
  },
  {
    id: 'IN-05-seguranca',
    title: 'Segurança',
    items: [
      'Não suba sozinho. Peça para alguém ficar embaixo com você.',
      'Não suba com chuva nem com vento forte.',
      'Fique longe da rede elétrica. Nunca encoste mastro ou antena em fio.',
      'Em mastro alto e exposto, faça o aterramento (ligação à terra) por causa de raios.',
      'Não instale em para-raios nem em torres sem autorização de quem cuida delas.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §6 · references/hardware-energia.md ("Armadilhas físicas": segurança)',
  },
  {
    id: 'IN-05-manutencao',
    title: 'Manutenção: a cada 3 a 6 meses',
    items: [
      'Veja a tensão da bateria pelo app (se o seu projeto tem bateria).',
      'Limpe o painel (se o seu projeto tem painel).',
      'Abra a caixa e procure umidade.',
      'Troque o sachê de sílica gel.',
      'Veja se o firmware ficou para trás. Quando a comunidade migrar de versão, atualize por USB ou pelo ar.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §7',
  },
  {
    id: 'IN-05-bateria',
    title: 'Troca da bateria (só quem tem bateria)',
    items: [
      'Planeje trocar a bateria a cada 2 a 4 anos, ou antes, se ela passar a durar bem menos.',
    ],
    source: 'references/guia-repeater-xiao-solar.md §7',
  },
]);
