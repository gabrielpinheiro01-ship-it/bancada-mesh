// "Trocar peça": as opções de cada posição do projeto, com a peça em uso marcada (aria-pressed + "em uso").
// A peça em uso reprovada na auditoria leva ícone + palavra do nível. Nada roda no topo do módulo.
import { el } from './shell.js';
import { levelTag } from './audit-panel.js';

const ROOT = new URL('../../', import.meta.url);
const iconUrl = (id) => new URL(`assets/svg/parts/${id}.svg`, ROOT).href;

function option(slot, o, act) {
  const tags = [];
  if (o.inUse) tags.push(el('span', { class: 'cat-uso' }, 'em uso'));
  if (o.level) tags.push(levelTag(o.level));
  const body = el('span', { class: 'cat-corpo' }, el('span', { class: 'cat-nome' }, o.name));
  if (tags.length) body.append(el('span', { class: 'cat-tags' }, ...tags));
  const b = el('button', {
    type: 'button', class: 'cat-opcao', 'aria-pressed': String(o.inUse), 'data-focus-key': `cat:${slot}:${o.id}`,
  }, el('img', { class: 'cat-icone', src: iconUrl(o.id), alt: '', width: '40', height: '40', decoding: 'async' }), body);
  b.addEventListener('click', () => act.swap(slot, o.id));
  return el('li', {}, b);
}

/**
 * @param {Array<{slot:string, label:string, options:Array<object>}>} groups de `catalogGroups`
 * @param {{swap:(slot:string, partId:string)=>void}} act
 */
export function renderCatalog(groups, act) {
  return el('div', { class: 'catalogo' }, ...groups.map((g) => {
    const titleId = `cat-${g.slot}`;
    const kids = [
      el('h3', { class: 'cat-titulo', id: titleId }, g.label),
      el('ul', { class: 'cat-opcoes', 'aria-labelledby': titleId }, ...g.options.map((o) => option(g.slot, o, act))),
    ];
    if (g.options.length === 1) kids.push(el('p', { class: 'cat-nota' }, 'Só esta opção neste projeto.'));
    return el('section', { class: 'cat-grupo', 'aria-labelledby': titleId }, ...kids);
  }));
}
