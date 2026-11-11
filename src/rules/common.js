// Auxiliares comuns às regras de peças, instalação e configuração.
import { META } from '../data/meta.js';
import { PARTS } from '../data/parts.js';

export const META_RULE = { checkedAt: META.rulesCheckedAt, firmware: META.firmware };

export function item(rule, level, slot, title, why, fix) {
  const out = { id: rule.id, level, slot, title, why, source: rule.source };
  if (fix) out.fix = fix;
  return out;
}

/** Opções do slot no projeto: a padrão primeiro, depois as alternativas. */
export const optionsOf = (ctx, slot) => {
  const def = ctx.project?.slots?.[slot];
  return def ? [def.default, ...def.alternatives] : [];
};

export const attrsOf = (id) => PARTS[id]?.attrs ?? {};
export const nameOf = (id) => PARTS[id]?.name ?? id;

/**
 * Primeira opção do slot (padrão antes das alternativas) que atende ao teste.
 * Correção só existe se houver troca de peça que resolve.
 */
export function swapFix(ctx, slot, test) {
  const id = optionsOf(ctx, slot).find((o) => test(attrsOf(o)));
  return id ? { label: `Trocar por ${nameOf(id)}`, slot, partId: id } : undefined;
}

/** Slot e atributos da placa (projeto montado) ou do aparelho pronto (companion). */
export function boardOf(ctx) {
  if (ctx.parts.placa) return { slot: 'placa', board: ctx.parts.placa };
  if (ctx.parts.aparelho) return { slot: 'aparelho', board: ctx.parts.aparelho };
  return null;
}
