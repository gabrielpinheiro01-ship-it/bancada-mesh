// Regiões (âmbitos) do MeshCore BR.
// Fonte: skill meshcore-hubreal, references/padroes-comunidade-br.md §4 e SKILL.md "Regiões em 30 segundos".
import { DDD_BY_UF } from '../data/ddd.js';

const GAP_UF = 'br-____';
const GAP_DDD = 'br-____-____';

/**
 * Valida o nome de região própria (3º nível combinado, ex.: br-sp-valeparaiba).
 * Fonte: padroes-comunidade-br.md §4 (grafia exata, case-sensitive; erro = descarte silencioso).
 * @returns {{ok:boolean, reason:string|null}}
 */
export function validateCustomRegion(text, uf) {
  if (typeof uf !== 'string' || !Object.hasOwn(DDD_BY_UF, uf)) {
    return { ok: false, reason: 'Escolha primeiro o estado' };
  }
  const prefix = `br-${uf.toLowerCase()}-`;
  if (typeof text !== 'string' || text === '') return { ok: false, reason: `Tem que começar com ${prefix}` };
  if (!/^[a-z0-9-]+$/.test(text)) {
    return { ok: false, reason: 'Use só letras minúsculas sem acento, números e hífen' };
  }
  if (!text.startsWith(prefix)) return { ok: false, reason: `Tem que começar com ${prefix}` };
  if (text.length === prefix.length) return { ok: false, reason: `Escreva algo depois de ${prefix}` };
  return { ok: true, reason: null };
}

/**
 * Linha `region def` do repetidor. UF ou DDD ausentes/incoerentes viram lacuna.
 * Fonte: SKILL.md "Checklist de repetidor" (region def br br-UF br-UF-DDD) e padroes-comunidade-br.md §4.
 */
export function regionDef(uf, ddd, customRegion) {
  const ufOk = typeof uf === 'string' && Object.hasOwn(DDD_BY_UF, uf);
  if (!ufOk) return `region def br ${GAP_UF} ${GAP_DDD}`;
  const l = uf.toLowerCase();
  if (customRegion && validateCustomRegion(customRegion, uf).ok) {
    return `region def br br-${l} ${customRegion}`;
  }
  const dddOk = typeof ddd === 'string' && DDD_BY_UF[uf].includes(ddd);
  return `region def br br-${l} ${dddOk ? `br-${l}-${ddd}` : GAP_DDD}`;
}
