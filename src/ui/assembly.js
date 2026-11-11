// Montagem: o desenho da ligação (SVG do próprio site) com os destaques da auditoria, e o detalhe da peça.
// O SVG entra por DOMParser + importNode (nada de innerHTML e nada de style=""); o contorno vem de markSvg
// e o selo ("Problema"/"Atenção" com ícone) é criado aqui. Nada roda no topo do módulo.
import { markSvg } from '../core/drawing.js';
import { PARTS } from '../data/parts.js';
import { PROJECTS } from '../data/projects.js';
import { el } from './shell.js';
import { LEVEL_WORD, pickBadgeBox, textBox } from './bench-model.js';
import { svgNode, octagon, levelIcon, compactItem, suggestLink } from './audit-panel.js';

const ROOT = new URL('../../', import.meta.url);
const BADGE_COLORS = Object.freeze({
  bad: { fg: '#B91C1C', bg: '#FDECEC' },
  warn: { fg: '#A35400', bg: '#FDF1DF' },
});

/** Texto dos desenhos já baixados (id -> string) ou a promessa em andamento. Só em memória. */
const cache = new Map();

export function loadDrawing(id) {
  const hit = cache.get(id);
  if (typeof hit === 'string') return Promise.resolve(hit);
  if (hit) return hit;
  const p = fetch(new URL(`assets/svg/drawings/${id}.svg`, ROOT))
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`desenho ${id}: ${r.status}`))))
    .then((t) => {
      if (!t.includes('<svg')) throw new Error(`desenho ${id} inválido`);
      cache.set(id, t);
      return t;
    })
    .catch((e) => {
      cache.delete(id);
      throw e;
    });
  cache.set(id, p);
  return p;
}

/** Baixa de antemão os desenhos do projeto: a troca de peça redesenha sem esperar a rede. */
export function prefetchDrawings(project) {
  for (const d of project?.drawings ?? []) loadDrawing(d.id).catch(() => {});
}

function rectGeom(rect) {
  const n = (k) => Number(rect.getAttribute(k)) || 0;
  return { x: n('x'), y: n('y'), width: n('width'), height: n('height') };
}

function viewBoxOf(svg) {
  const v = (svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
  return { width: v[2] > 0 ? v[2] : 640, height: v[3] > 0 ? v[3] : 640 };
}

/** Caixas aproximadas dos textos do desenho (só atributos: vale mesmo com a aba escondida). */
function textObstacles(svg) {
  const out = [];
  for (const t of svg.querySelectorAll('text')) {
    const x = Number(t.getAttribute('x'));
    const y = Number(t.getAttribute('y'));
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const fontSize = Number(t.closest('[font-size]')?.getAttribute('font-size')) || 16;
    const anchor = t.closest('[text-anchor]')?.getAttribute('text-anchor') ?? 'start';
    const box = textBox({ x, y, fontSize, anchor, length: (t.textContent ?? '').trim().length });
    // Texto girado (ex.: "cabo USB" na vertical): a caixa fica em pé, centrada no ponto.
    out.push(/rotate\(/.test(t.getAttribute('transform') ?? '') ? { x: x - fontSize * 0.8, y: y - box.w / 2, w: fontSize, h: box.w } : box);
  }
  return out;
}

/** Selo do desenho: retângulo com ícone (octógono ou triângulo com "!") e a palavra do nível. */
function badge(slot, level, box) {
  const c = BADGE_COLORS[level];
  const cx = box.x + 17;
  const cy = box.y + box.h / 2;
  const white = '#FFFFFF';
  const mark = level === 'bad'
    ? [svgNode('polygon', { points: octagon(cx, cy, 10.5), fill: c.fg }),
      svgNode('rect', { x: cx - 1.3, y: cy - 6, width: 2.6, height: 7.5, rx: 1.3, fill: white }),
      svgNode('circle', { cx, cy: cy + 5, r: 1.6, fill: white })]
    : [svgNode('path', { d: `M${cx} ${cy - 11}L${cx + 11.5} ${cy + 9}H${cx - 11.5}Z`, fill: c.fg, stroke: c.fg, 'stroke-linejoin': 'round' }),
      svgNode('rect', { x: cx - 1.3, y: cy - 4, width: 2.6, height: 7, rx: 1.3, fill: white }),
      svgNode('circle', { cx, cy: cy + 6, r: 1.5, fill: white })];
  return svgNode('g', { class: 'selo', 'data-selo-de': slot, 'aria-hidden': 'true' },
    svgNode('rect', { x: box.x, y: box.y, width: box.w, height: box.h, rx: 6, fill: c.bg, stroke: c.fg, 'stroke-width': 2 }),
    ...mark,
    svgNode('text', { x: box.x + 34, y: cy + 6, 'font-size': 17, 'font-weight': 700, fill: c.fg }, LEVEL_WORD[level]));
}

function message(level, strong, text) {
  return el('p', { class: `desenho-aviso desenho-aviso-${level}` }, levelIcon(level), el('span', {}, el('strong', {}, strong), ' ', text));
}

const LOAD_ERROR = () => el('p', { class: 'desenho-carregando' },
  'Não deu para carregar o desenho. Confira a conexão e recarregue a página (suas escolhas serão perdidas, porque nada fica guardado).');

function mount(box, text, opts) {
  const { state, levels, selected, newly, act } = opts;
  const doc = new DOMParser().parseFromString(markSvg(text, levels), 'image/svg+xml');
  const src = doc.documentElement;
  if (!src || src.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) {
    box.replaceChildren(LOAD_ERROR());
    return;
  }
  const svg = document.importNode(src, true);
  const view = viewBoxOf(svg);
  const title = svg.querySelector('title')?.textContent?.trim();
  svg.setAttribute('class', 'desenho-svg');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', title ? `Desenho: ${title}` : 'Desenho da montagem');

  const project = PROJECTS[state.projectId];
  const badges = [];
  const obstacles = textObstacles(svg); // o selo escolhe o canto que cobre menos rótulo (e menos selo)
  for (const g of svg.querySelectorAll('g[data-slot]')) {
    const slot = g.getAttribute('data-slot');
    const level = levels[slot];
    const slotLabel = project.slots[slot]?.label ?? g.getAttribute('aria-label') ?? slot;
    const name = PARTS[state.parts[slot]]?.name;
    let label = name ? `${slotLabel}: ${name}` : slotLabel;
    if (level === 'bad' || level === 'warn') label += `. ${LEVEL_WORD[level]}`;
    g.setAttribute('aria-label', label);
    g.setAttribute('data-focus-key', `peca:${slot}`);
    g.setAttribute('aria-expanded', String(slot === selected));
    if (slot === selected) g.setAttribute('aria-controls', 'detalhe-peca');
    const rect = g.querySelector(`rect[id="hl-${slot}"]`);
    if (rect && (level === 'bad' || level === 'warn')) {
      // O selo vai por cima de tudo (fim do SVG); o clique nele também seleciona a peça.
      const box = pickBadgeBox(rectGeom(rect), view, level, obstacles);
      obstacles.push(box);
      badges.push(badge(slot, level, box));
      if (newly.has(slot)) rect.setAttribute('class', 'pulsa');
    }
  }
  svg.append(...badges);

  svg.addEventListener('click', (e) => {
    const t = e.target.closest?.('g[data-slot], g[data-selo-de]');
    if (t) act.select(t.getAttribute('data-slot') ?? t.getAttribute('data-selo-de'));
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest?.('g[data-slot]');
    if (!t) return;
    e.preventDefault(); // Espaço não rola a página
    act.select(t.getAttribute('data-slot'));
  });
  box.replaceChildren(svg);
}

/**
 * Área do desenho. Desenho já baixado entra na hora (sem pular a rolagem); senão, entra quando chegar.
 * @param {{state:object, drawingId:string|null, levels:Record<string,string>, selected:string|null,
 *   newly:Set<string>, act:{select:(slot:string)=>void}}} opts
 */
export function renderAssembly(opts) {
  const box = el('div', { class: 'desenho' });
  if (!opts.drawingId) {
    // Sem desenho correto, nada de OK (spec §7.4): avisa em vez de desenhar errado.
    box.append(message('warn', 'Atenção:', 'ainda não há desenho conferido para esta combinação de peças. Sem o desenho certo, a montagem não pode ser dada como certa. Escolha outra peça em "Trocar peça".'));
    return box;
  }
  const hit = cache.get(opts.drawingId);
  if (typeof hit === 'string') {
    mount(box, hit, opts);
    return box;
  }
  box.append(el('p', { class: 'desenho-carregando', role: 'status' }, 'Carregando o desenho…'));
  loadDrawing(opts.drawingId)
    .then((t) => { if (box.isConnected) mount(box, t, opts); })
    .catch(() => { if (box.isConnected) box.replaceChildren(LOAD_ERROR()); });
  return box;
}

/**
 * Painel de detalhe da peça selecionada: por que está aqui, itens da auditoria, foto real (ou aviso) e "achei um erro".
 * @param {object|null} model de `detailModel`
 * @param {{photoOpen:boolean}} view
 * @param {{togglePhoto:()=>void, closeDetail:()=>void}} act
 */
export function renderDetail(model, { photoOpen }, act) {
  if (!model) return null;
  const kids = [
    el('h3', { class: 'detalhe-titulo', id: 'detalhe-titulo' }, `${model.slotLabel}: ${model.name}`),
    el('h4', { class: 'detalhe-sub' }, 'Por que está aqui'),
  ];
  if (model.tip) kids.push(el('p', { class: 'detalhe-dica' }, model.tip));
  kids.push(model.items.length
    ? el('ul', { class: 'itens itens-curtos', 'aria-label': 'O que a auditoria diz desta peça' }, ...model.items.map(compactItem))
    : el('p', { class: 'detalhe-dica' }, 'A auditoria não aponta nada nesta peça.'));

  if (model.photo) {
    const btn = el('button', {
      type: 'button', class: 'botao-sec', 'aria-expanded': String(photoOpen), 'data-focus-key': 'foto',
      'aria-controls': photoOpen ? 'foto-peca' : false,
    }, photoOpen ? 'Esconder a foto' : 'Ver foto real');
    btn.addEventListener('click', () => act.togglePhoto());
    kids.push(el('p', { class: 'detalhe-acao' }, btn));
    if (photoOpen) {
      kids.push(el('figure', { class: 'foto', id: 'foto-peca' },
        el('img', { src: new URL(model.photo.file, ROOT).href, alt: `Foto real: ${model.name}`, decoding: 'async' }),
        el('figcaption', {},
          `Foto: ${model.photo.credit}. Licença ${model.photo.license}. `,
          el('a', { href: model.photo.sourceUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Página de origem da foto'))));
    }
  } else {
    kids.push(el('p', { class: 'detalhe-semfoto' }, 'Sem foto de licença livre: só a ilustração.'));
  }

  const close = el('button', { type: 'button', class: 'botao-sec', 'data-focus-key': 'fechar-detalhe' }, 'Fechar o detalhe');
  close.addEventListener('click', () => act.closeDetail());
  const link = suggestLink('peca', model.partId);
  kids.push(el('p', { class: 'detalhe-acoes' }, close, ...(link ? [link] : [])));

  return el('section', {
    class: 'detalhe', id: 'detalhe-peca', tabindex: '-1', 'data-focus-key': 'detalhe', 'aria-labelledby': 'detalhe-titulo',
  }, ...kids);
}
