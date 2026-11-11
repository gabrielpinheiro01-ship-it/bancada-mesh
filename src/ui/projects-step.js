// Passo 1: cartões dos projetos. Nada roda no topo do módulo; o DOM só é tocado em renderProjectsStep.
import { PROJECTS, BLOCKER_REASONS } from '../data/projects.js';
import { PARTS } from '../data/parts.js';
import { isOpenable } from '../core/drawing.js';
import { formatBR } from '../core/numbers.js';
import { el, formatDateBR } from './shell.js';

const SEM_PRECO = 'sem preço de referência';
const MAIN_SLOTS = ['placa', 'aparelho'];

const money = (n) => formatBR(n, Number.isInteger(n) ? 0 : 2);
const range = (min, max) => (min === max ? `R$ ${money(min)}` : `R$ ${money(min)}–${money(max)}`);

function tail(prices) {
  const oldest = prices.map((p) => p.date).sort()[0];
  const sources = [...new Set(prices.map((p) => p.source))].join('; ');
  return ` · em ${formatDateBR(oldest)} · fonte: ${sources}`;
}

/** Nome da peça padrão do slot principal (placa ou aparelho). */
export function mainPartName(project, parts = PARTS) {
  const slot = MAIN_SLOTS.find((s) => project.slots?.[s]);
  return slot ? parts[project.slots[slot].default]?.name ?? '' : '';
}

/**
 * Preço de referência, sem inventar nada:
 * 1) todas as peças padrão com preço -> soma como faixa; 2) só a peça principal -> "placa ~R$ X";
 * 3) nenhuma -> "sem preço de referência". Sempre com a data mais antiga e a fonte.
 */
export function priceLabel(project, parts = PARTS) {
  const defaults = Object.values(project.slots ?? {}).map((s) => parts[s.default]);
  const priced = defaults.filter((p) => p?.price);
  if (defaults.length > 0 && priced.length === defaults.length) {
    const prices = priced.map((p) => p.price);
    const min = prices.reduce((a, p) => a + p.min, 0);
    const max = prices.reduce((a, p) => a + p.max, 0);
    return range(min, max) + tail(prices);
  }
  const slot = MAIN_SLOTS.find((s) => project.slots?.[s]);
  const main = slot ? parts[project.slots[slot].default] : null;
  if (main?.price) return `${slot} ~${range(main.price.min, main.price.max)}${tail([main.price])}`;
  return SEM_PRECO;
}

/** Motivo do "Em breve" em linguagem simples (um ou mais códigos de lacuna). */
export function blockerText(project) {
  return (project.blockedBy ?? []).map((c) => BLOCKER_REASONS[c]).filter(Boolean).join('; ');
}

function dots(level) {
  const wrap = el('span', { class: 'pontos', 'aria-hidden': 'true' });
  for (let i = 1; i <= 5; i++) wrap.append(el('span', { class: i <= level ? 'ponto ponto-cheio' : 'ponto' }));
  return wrap;
}

function fact(label, ...value) {
  return [el('dt', { class: 'fato-rotulo' }, label), el('dd', { class: 'fato-valor' }, ...value)];
}

function card(project, onPick) {
  const open = isOpenable(project.id);
  const titleId = `proj-${project.id}-nome`;
  const facts = el('dl', { class: 'fatos' },
    ...fact('Dificuldade', dots(project.difficulty), el('span', {}, ` dificuldade ${project.difficulty} de 5`)),
    ...fact('Solda', project.solderLabel),
    ...fact(project.slots?.aparelho ? 'Aparelho' : 'Placa', mainPartName(project)),
    ...fact('Custo de referência', priceLabel(project)),
  );
  const parts = [el('h2', { class: 'cartao-nome', id: titleId }, project.name), el('p', { class: 'cartao-para' }, project.what), facts];
  if (open) {
    const link = el('a', { class: 'botao cartao-acao', href: `#/bancada/${project.id}` }, 'Montar este', el('span', { class: 'so-leitor' }, `: ${project.name}`));
    link.addEventListener('click', () => onPick?.(project.id));
    parts.push(link);
  } else {
    parts.push(
      el('button', { class: 'botao cartao-acao', type: 'button', disabled: true }, 'Em breve', el('span', { class: 'so-leitor' }, `: ${project.name}`)),
      el('p', { class: 'cartao-motivo' }, `Ainda não está pronto: ${blockerText(project)}.`),
    );
  }
  return el('li', { class: open ? 'cartao' : 'cartao cartao-breve' }, el('article', { 'aria-labelledby': titleId }, ...parts));
}

/** Escreve o passo 1 dentro de `root`. `onPick` é só um aviso: a navegação é o link `#/bancada/<id>`. */
export function renderProjectsStep(root, onPick) {
  const projects = Object.values(PROJECTS).sort((a, b) => a.id - b.id);
  root.replaceChildren(
    el('h1', { class: 'titulo', tabindex: '-1' }, 'Escolha um projeto'),
    el('p', { class: 'texto' }, 'Do mais simples ao mais trabalhoso. Escolha o que você quer montar.'),
    el('ul', { class: 'cartoes' }, ...projects.map((p) => card(p, onPick))),
  );
}
