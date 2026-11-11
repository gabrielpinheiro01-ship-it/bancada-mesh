// Regras de instalação IN-01…IN-04, IN-06, IN-07 (spec §8.4). IN-05 é texto do PDF.
// Princípio: na dúvida, Atenção (o pior erro é o falso OK).
import { item, META_RULE, swapFix } from './common.js';

/** Slots dos itens que não são peça (a interface liga cada um ao seu campo). */
export const FIELD_SLOTS = Object.freeze({ local: 'local', regiao: 'regiao', wifi: 'wifi' });

const FIXED_ROLES = ['repeater', 'observer'];

const SRC = {
  inside: 'meshcore-hubreal/SKILL.md, seção "Diagnóstico rápido"; meshcore-hubreal/references/hardware-energia.md, seção "Recomendações comuns na internet" (repetidor em casa); https://github.com/meshcore-dev/MeshCore',
  vent: 'meshcore-hubreal/references/hardware-energia.md, seção "Armadilhas físicas" (condensação na caixa); https://www.meshsorocaba.org',
  heat: 'meshcore-hubreal/SKILL.md, seção "Armadilhas que esta skill deve sempre apontar"; meshcore-hubreal/references/hardware-energia.md, seção "Armadilhas físicas" (Li-ion acima de 45 °C degrada); https://www.meshsorocaba.org',
  mains: 'Decisão de desenho da Bancada Mesh (spec §8.4, IN-04), deduzida do propósito da rede; meshcore-hubreal/SKILL.md; https://meshcore.com.br',
  observer: 'meshcore-hubreal/references/padroes-comunidade-br.md, seção 7 (Observer, MQTT, "Observer móvel não serve"); https://wiki.meshmapper.net',
};

const IN01 = {
  id: 'IN-01', source: SRC.inside, ...META_RULE,
  evaluate(ctx) {
    if (!FIXED_ROLES.includes(ctx.project?.role) || ctx.state.location !== 'dentro') return null;
    return item(this, 'bad', FIELD_SLOTS.local, 'Rádio dentro de casa não alcança a rede',
      'Concreto e metal bloqueiam o sinal de 923 MHz. Repetidor só funciona do lado de fora: laje, mastro ou telhado.');
  },
};

const IN02 = {
  id: 'IN-02', source: SRC.vent, ...META_RULE,
  evaluate(ctx) {
    const c = ctx.parts.caixa;
    if (!c || c.vent !== false) return null;
    return item(this, 'warn', 'caixa', 'Caixa sem respiro junta água por dentro',
      'Caixa totalmente fechada forma gotas de condensação lá dentro. Use um respiro IP67 e um pouco de sílica.',
      swapFix(ctx, 'caixa', (x) => x.vent === true && x.light === true) ?? swapFix(ctx, 'caixa', (x) => x.vent === true));
  },
};

const IN03 = {
  id: 'IN-03', source: SRC.heat, ...META_RULE,
  evaluate(ctx) {
    const c = ctx.parts.caixa;
    if (!c || c.light !== false) return null;
    return item(this, 'warn', 'caixa', 'Caixa escura esquenta demais',
      'Ao sol, uma caixa escura passa de 60 °C, e a bateria de lítio perde vida carregando acima de 45 °C. Use caixa clara e, se der, à sombra.',
      swapFix(ctx, 'caixa', (x) => x.light === true && x.vent === true) ?? swapFix(ctx, 'caixa', (x) => x.light === true));
  },
};

const IN04 = {
  id: 'IN-04', source: SRC.mains, ...META_RULE,
  evaluate(ctx) {
    if (ctx.project?.role !== 'repeater' || ctx.project?.power !== 'mains') return null;
    return item(this, 'warn', FIELD_SLOTS.local, 'Na falta de luz o repetidor desliga',
      'Ligado só na tomada, na falta de luz ele desliga junto com a energia da rua, justo quando a rede mais faz falta. Para aguentar apagão, use bateria ou o projeto solar.');
  },
};

const IN06 = {
  id: 'IN-06', source: SRC.observer, ...META_RULE,
  evaluate(ctx) {
    if (ctx.project?.role !== 'observer' || ctx.state.location !== 'movel') return null;
    return item(this, 'bad', FIELD_SLOTS.local, 'Observer precisa ficar fixo',
      'O observer móvel gera dados enganosos nos mapas da rede. Instale em um lugar fixo.');
  },
};

const IN07 = {
  id: 'IN-07', source: SRC.observer, ...META_RULE,
  evaluate(ctx) {
    if (ctx.project?.role !== 'observer') return null;
    const wifi = ctx.state.hasWifi;
    if (wifi === true) return null;
    if (wifi === false) {
      return item(this, 'bad', FIELD_SLOTS.wifi, 'Observer precisa de Wi-Fi no local',
        'O observer manda os pacotes para a internet (MQTT). Sem Wi-Fi no local ele não serve.');
    }
    return item(this, 'warn', FIELD_SLOTS.wifi, 'Confirme se há Wi-Fi no local',
      'O observer manda os pacotes para a internet (MQTT), então precisa de Wi-Fi no lugar onde ele vai ficar: confirme se há Wi-Fi no local.');
  },
};

export const INSTALL_RULES = [IN01, IN02, IN03, IN04, IN06, IN07];
