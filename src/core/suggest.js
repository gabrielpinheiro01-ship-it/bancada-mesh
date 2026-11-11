// Links de "achei um erro". Só o identificador sai do site: nunca o estado do usuário (spec §7.7).
import { META } from '../data/meta.js';

const KINDS = ['regra', 'peca', 'comando'];
const ID_RE = /^[A-Za-z0-9._-]+$/;

/**
 * @param {{kind:'regra'|'peca'|'comando', id:string}} item
 * @param {{githubRepo:?string, formPrefillUrl:?string}} [meta]
 * @returns {{form:?string, github:?string}} null quando o canal não está configurado (link fica escondido)
 */
export function suggestLinks({ kind, id }, meta = META) {
  if (!KINDS.includes(kind)) throw new Error(`kind inválido: ${kind}`);
  if (typeof id !== 'string' || !ID_RE.test(id)) throw new Error(`id inválido: ${id}`);

  const github = meta.githubRepo
    ? `https://github.com/${meta.githubRepo}/issues/new?template=sugestao.yml&title=${encodeURIComponent(`[${id}] `)}`
    : null;
  const form = meta.formPrefillUrl
    ? meta.formPrefillUrl.replaceAll('{id}', encodeURIComponent(id))
    : null;
  return { form, github };
}
