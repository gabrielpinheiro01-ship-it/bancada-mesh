// Auditoria ao vivo: barras de energia e lista de itens (Problema → Atenção → OK).
// Também guarda os ícones de nível e o link "achei um erro", usados pelo catálogo e pelo desenho.
// Nada roda no topo do módulo; o DOM só é tocado dentro das funções.
import { suggestLinks } from '../core/suggest.js';
import { el } from './shell.js';
import { LEVEL_WORD, itemActionLabel } from './bench-model.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Elemento SVG com atributos (nunca `style`). Filhos nulos são ignorados. */
export function svgNode(tag, attrs = {}, ...children) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    n.setAttribute(k, String(v));
  }
  for (const c of children) if (c != null) n.append(c);
  return n;
}

/** Pontos de um octógono (forma de "pare") centrado em (cx, cy). */
export function octagon(cx, cy, r) {
  const a = r * 0.414;
  return [[-a, -r], [a, -r], [r, -a], [r, a], [a, r], [-a, r], [-r, a], [-r, -a]]
    .map(([x, y]) => `${(cx + x).toFixed(2)},${(cy + y).toFixed(2)}`).join(' ');
}

/**
 * Ícone do nível, cada um com forma própria (não só cor): Problema = octógono com "!",
 * Atenção = triângulo com "!", OK = círculo com visto. A cor vem do CSS (currentColor).
 */
export function levelIcon(level, size = 20) {
  const svg = svgNode('svg', {
    viewBox: '0 0 20 20', width: size, height: size, class: `icone icone-${level}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const white = '#FFFFFF';
  if (level === 'bad') {
    svg.append(
      svgNode('polygon', { points: octagon(10, 10, 9.5), fill: 'currentColor' }),
      svgNode('path', { d: 'M10 5v6', stroke: white, 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
      svgNode('circle', { cx: 10, cy: 14.6, r: 1.4, fill: white }),
    );
  } else if (level === 'warn') {
    svg.append(
      svgNode('path', { d: 'M10 1.5 19 18H1Z', fill: 'currentColor', stroke: 'currentColor', 'stroke-linejoin': 'round' }),
      svgNode('path', { d: 'M10 7.5v5', stroke: white, 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
      svgNode('circle', { cx: 10, cy: 15.4, r: 1.3, fill: white }),
    );
  } else {
    svg.append(
      svgNode('circle', { cx: 10, cy: 10, r: 9, fill: 'currentColor' }),
      svgNode('path', { d: 'M5.5 10.5l3 3 6-6.5', stroke: white, 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    );
  }
  return svg;
}

/** Ícone neutro de aviso (erro de digitação: não é resultado de auditoria, então não usa cor de nível). */
export function noticeIcon(size = 20) {
  return svgNode('svg', { viewBox: '0 0 20 20', width: size, height: size, class: 'icone', 'aria-hidden': 'true', focusable: 'false' },
    svgNode('circle', { cx: 10, cy: 10, r: 9, fill: 'currentColor' }),
    svgNode('path', { d: 'M10 5v6', stroke: '#FFFFFF', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    svgNode('circle', { cx: 10, cy: 14.6, r: 1.4, fill: '#FFFFFF' }));
}

/** Ícone + palavra do nível ("Problema", "Atenção", "OK"). */
export function levelTag(level) {
  return el('span', { class: `nivel nivel-${level}` }, levelIcon(level), el('span', {}, LEVEL_WORD[level]));
}

/** Link "Achei um erro" (abre o formulário ou o GitHub); null quando o canal não está configurado. */
export function suggestLink(kind, id) {
  let links;
  try {
    links = suggestLinks({ kind, id });
  } catch {
    return null;
  }
  const href = links.form ?? links.github;
  return href ? el('a', { class: 'link-erro', href, target: '_blank', rel: 'noopener noreferrer' }, 'Achei um erro') : null;
}

/** Item curto (nível + título + por que importa), usado no detalhe da peça. */
export function compactItem(item) {
  return el('li', { class: `item item-${item.level} item-curto` },
    el('p', { class: 'item-cabeca' }, levelTag(item.level), el('strong', { class: 'item-titulo' }, item.title)),
    el('p', { class: 'item-porque' }, item.why));
}

// ---------- barras de energia ----------

function bar(b) {
  const svg = svgNode('svg', {
    class: 'barra', viewBox: '0 0 100 12', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false',
  }, svgNode('rect', { x: 0, y: 2, width: 100, height: 8, class: 'barra-trilho' }));
  if (b.pct > 0) svg.append(svgNode('rect', { x: 0, y: 2, width: b.pct.toFixed(2), height: 8, class: `barra-cheia barra-${b.level}` }));
  for (const m of b.marks) {
    const x = Math.max(0, Math.min(98.8, m.pct - 0.6));
    svg.append(svgNode('rect', { x: x.toFixed(2), y: 0, width: 1.2, height: 12, class: 'barra-marca' }));
  }
  return svg;
}

function barBlock(b) {
  const kids = [
    el('p', { class: 'barra-cabeca' },
      el('span', { class: 'barra-nome' }, b.title),
      el('span', { class: 'barra-valor mono' }, b.valueText),
      levelTag(b.level)),
    bar(b),
  ];
  if (b.marks.length) kids.push(el('p', { class: 'barra-marcas mono' }, b.marks.map((m) => m.text).join(' · ')));
  if (b.note) kids.push(el('p', { class: 'barra-nota' }, b.note));
  return el('div', { class: `barra-bloco barra-bloco-${b.level}` }, ...kids);
}

function energyBlock(bars) {
  const blocks = [barBlock(bars.autonomy)];
  if (bars.panel) blocks.push(barBlock(bars.panel));
  return el('div', { class: 'energia' },
    el('h3', { class: 'energia-titulo' }, 'Energia'),
    ...blocks,
    el('p', { class: 'barra-nota' }, 'O traço na barra marca a meta. É uma estimativa: meça o consumo real da sua placa.'));
}

// ---------- lista ----------

function itemLi(item, act) {
  const actions = [];
  if (item.fix) {
    const fix = el('button', { type: 'button', class: 'botao botao-acao', 'data-focus-key': `fix:${item.id}` }, item.fix.label);
    fix.addEventListener('click', () => act.fix(item.fix));
    actions.push(fix);
  }
  const show = el('button', { type: 'button', class: 'botao-sec', 'data-focus-key': `ver:${item.id}:${item.slot}` }, itemActionLabel(item.slot));
  show.addEventListener('click', () => act.showItem(item));
  actions.push(show);
  const link = suggestLink('regra', item.id);
  if (link) actions.push(link);

  const li = el('li', { class: `item item-${item.level}` },
    el('p', { class: 'item-cabeca' }, levelTag(item.level), el('strong', { class: 'item-titulo' }, item.title)),
    el('p', { class: 'item-porque' }, item.why),
    el('p', { class: 'item-fonte' }, `Fonte: ${item.source}`),
    el('div', { class: 'item-acoes' }, ...actions));
  // Clique em qualquer parte do item também leva à peça (o teclado usa o botão).
  li.addEventListener('click', (e) => {
    if (e.target.closest('button, a')) return;
    if (String(globalThis.getSelection?.() ?? '') !== '') return; // estava selecionando texto
    act.showItem(item);
  });
  return li;
}

/**
 * Conteúdo do painel "Auditoria ao vivo".
 * @param {{items:Array<object>, bars:object|null, act:object}} opts
 * @returns {HTMLElement[]}
 */
export function renderAuditPanel({ items, bars, act }) {
  const out = [
    el('h2', { class: 'painel-titulo', id: 'titulo-auditoria', tabindex: '-1', 'data-focus-key': 'titulo-auditoria' }, 'Auditoria ao vivo'),
    el('p', { class: 'painel-dica' }, 'A conta é refeita a cada troca. Toque num item para ver onde ele está.'),
  ];
  if (bars) out.push(energyBlock(bars));
  out.push(el('ul', { class: 'itens', 'aria-label': 'Itens da auditoria' }, ...items.map((i) => itemLi(i, act))));
  return out;
}
