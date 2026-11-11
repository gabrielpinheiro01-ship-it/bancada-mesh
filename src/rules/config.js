// Regras de configuração: CFG-02 (potência com amplificador; é o antigo HW-12) e CFG-04 (região).
// Princípio: na dúvida, Atenção. CFG-04 NUNCA sai OK: a grafia da região só quem é do grupo local confirma.
import { regionDef } from '../core/region.js';
import { formatBR } from '../core/numbers.js';
import { item, META_RULE, boardOf } from './common.js';
import { FIELD_SLOTS } from './install.js';

const SRC_PA = 'meshcore-hubreal/references/hardware-energia.md, seção "Potência com amplificador (PA) — tabela oficial (FAQ 7.7)"; ' +
  'https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md; ' +
  'https://docs.rakwireless.com/product-categories/wisblock/rak13302/datasheet-vd/';
const SRC_REGION = 'meshcore-hubreal/references/padroes-comunidade-br.md, seção 4 (Regiões); meshcore-hubreal/SKILL.md, seção "Regiões em 30 segundos"; ' +
  'https://blog.meshcore.io (post "Region Filtering"); https://meshcore.com.br';

const CFG02 = {
  id: 'CFG-02', source: SRC_PA, ...META_RULE,
  evaluate(ctx) {
    const b = boardOf(ctx);
    const pa = b?.board.pa;
    if (!pa) return null;
    const tx = ctx.state.txDbm;
    const out = pa.outDbm?.[tx];
    const peak = pa.peakMa?.[tx];
    const known = typeof out === 'number'
      ? `Com "set tx ${tx}", a saída real é cerca de ${formatBR(out, 1)} dBm${typeof peak === 'number' ? `, com pico de corrente de ${formatBR(peak, 0)} mA` : ''}. `
      : `Para "set tx ${tx}" não há saída real conhecida na tabela desta placa: use um valor que conste na tabela. `;
    return item(this, 'warn', b.slot, 'Placa com amplificador: o número do set tx não é a potência real',
      `O número do "set tx" não inclui o ganho do amplificador. ${known}` +
      'Errar a potência pode danificar o rádio. O consumo médio depende do tráfego: meça o seu consumo antes de confiar na conta de energia.');
  },
};

const CFG04 = {
  id: 'CFG-04', source: SRC_REGION, ...META_RULE,
  evaluate(ctx) {
    const { uf, ddd, customRegion } = ctx.state;
    const cmd = regionDef(uf, ddd, customRegion);
    if (cmd.includes('____')) {
      return item(this, 'warn', FIELD_SLOTS.regiao, 'Falta a região do seu rádio',
        'Preencha estado e DDD para gerar a região. Sem a região certa, o repetidor descarta o tráfego da sua área sem avisar.');
    }
    return item(this, 'warn', FIELD_SLOTS.regiao, 'Confira a grafia da região',
      `O comando é "${cmd}", seguido de "region save". Atenção: confira a grafia exata com o grupo local ou em Descobrir Regiões no app; ` +
      'uma letra diferente faz o repetidor descartar o tráfego sem avisar.');
  },
};

export const CONFIG_RULES = [CFG02, CFG04];
