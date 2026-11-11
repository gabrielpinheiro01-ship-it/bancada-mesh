// Passo 2 (bancada): funções puras, sem DOM, testadas no Node (tests/bench-model.test.js).
// Princípio: o pior erro é o falso OK. O nível que aparece na tela vem sempre da auditoria, nunca de conta própria.
import { PROJECTS } from '../data/projects.js';
import { PARTS } from '../data/parts.js';
import { DDD_BY_UF } from '../data/ddd.js';
import { SHOPPING_TIPS } from '../content/shopping.js';
import { txOptions } from '../core/commands.js';
import { formatBR } from '../core/numbers.js';
import { FIELD_SLOTS } from '../rules/install.js';

/** Palavra de cada nível: o problema nunca aparece só pela cor. */
export const LEVEL_WORD = Object.freeze({ bad: 'Problema', warn: 'Atenção', ok: 'OK' });

/** Abas da bancada no celular (padrão: Montagem). */
export const TABS = Object.freeze([
  Object.freeze({ id: 'pecas', label: 'Peças' }),
  Object.freeze({ id: 'montagem', label: 'Montagem' }),
  Object.freeze({ id: 'auditoria', label: 'Auditoria' }),
]);

const RANK = { bad: 2, warn: 1 };

/** Pior nível (bad ou warn) de cada slot. Itens OK não marcam nada. */
export function worstBySlot(items) {
  const out = {};
  for (const it of items) {
    if (!RANK[it.level]) continue;
    if (!out[it.slot] || RANK[it.level] > RANK[out[it.slot]]) out[it.slot] = it.level;
  }
  return out;
}

/** Níveis para `markSvg`: bad > warn > sel (o slot selecionado só fica azul se não tiver problema). */
export function slotLevels(items, selectedSlot = null) {
  const out = worstBySlot(items);
  if (selectedSlot && !out[selectedSlot]) out[selectedSlot] = 'sel';
  return out;
}

const plural = (n, one, many) => (n === 1 ? one : many);

/** "2 problemas · 1 ponto de atenção" ou "Nenhum problema · nenhum ponto de atenção". */
export function summaryText({ bad, warn }) {
  const p = bad === 0 ? 'Nenhum problema' : `${bad} ${plural(bad, 'problema', 'problemas')}`;
  const a = warn === 0 ? 'nenhum ponto de atenção' : `${warn} ${plural(warn, 'ponto de atenção', 'pontos de atenção')}`;
  return `${p} · ${a}`;
}

/** Nível do resumo inteiro. */
export function summaryLevel({ bad, warn }) {
  if (bad > 0) return 'bad';
  if (warn > 0) return 'warn';
  return 'ok';
}

/**
 * Sem desenho conferido para a combinação, a montagem não pode ser dada como certa: o resumo ganha
 * 1 ponto de atenção (e nunca fica OK). Devolve um objeto novo.
 */
export function summaryWithDrawing({ bad, warn }, hasDrawing) {
  return { bad, warn: hasDrawing ? warn : warn + 1 };
}

/** Número digitado de volta para o campo: 4.2 -> "4,2"; 9 -> "9". */
export function numText(n) {
  return String(n).replace('.', ',');
}

export function ufOptions() {
  return Object.keys(DDD_BY_UF).sort();
}

/** DDDs do estado (cópia), ou lista vazia se o estado não vale. */
export function dddOptions(uf) {
  return typeof uf === 'string' && Object.hasOwn(DDD_BY_UF, uf) ? [...DDD_BY_UF[uf]] : [];
}

// ---------- barras de energia ----------

const AUTONOMY_IDS = ['EN-02', 'EN-03', 'EN-04'];
const PANEL_IDS = ['EN-05', 'EN-06', 'EN-07', 'EN-08'];

/** Escala da barra: folga acima do maior valor de referência, mas a meta nunca fica espremida no canto. */
function scaleMax(value, refs) {
  const top = Math.max(...refs);
  const v = Number.isFinite(value) ? value : 0;
  return Math.min(Math.max(top * 1.5, v * 1.1), top * 3);
}
const pctOf = (v, max) => (Number.isFinite(v) && max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0);

function barText(b) {
  const marks = b.marks.map((m) => `; ${m.text}`).join('');
  return `${b.title}: ${b.valueText}${marks}. ${b.levelWord}.`;
}

function autonomyBar(energy, items, N) {
  const item = items.find((i) => AUTONOMY_IDS.includes(i.id));
  const fake = items.some((i) => i.id === 'EN-01');
  const a = energy.autonomyDays;
  const goal = { value: N, text: `meta: ${numText(N)} dias` };
  let b;
  if (fake || !item || !Number.isFinite(a)) {
    const max = scaleMax(0, [N]);
    b = {
      title: 'Autonomia sem sol', value: null, valueText: 'não calculada', pct: 0,
      level: fake ? 'bad' : 'warn',
      note: fake ? 'A capacidade anunciada da bateria não é real, então a conta não foi feita.' : 'Faltam dados para fazer a conta.',
      marks: [{ ...goal, pct: pctOf(N, max) }],
    };
  } else {
    const max = scaleMax(a, [N]);
    b = {
      title: 'Autonomia sem sol', value: a, valueText: `${formatBR(a, 1)} dias`, pct: pctOf(a, max),
      level: item.level, note: null, marks: [{ ...goal, pct: pctOf(N, max) }],
    };
  }
  b.levelWord = LEVEL_WORD[b.level];
  b.text = barText(b);
  return b;
}

function panelBar(energy, items) {
  const W = energy.panelW;
  if (!(W > 0)) return null;
  const item = items.find((i) => PANEL_IDS.includes(i.id));
  const known = item && Number.isFinite(energy.Pmin) && Number.isFinite(energy.Prec);
  const max = known ? scaleMax(W, [energy.Prec]) : W * 1.5;
  const b = {
    title: 'Painel solar', value: W, valueText: `${numText(W)} W`, pct: pctOf(W, max),
    level: known ? item.level : 'warn',
    note: known ? null : 'Faltam dados para calcular o painel necessário.',
    marks: known ? [
      { value: energy.Pmin, text: `mínimo ${formatBR(energy.Pmin, 2)} W`, pct: pctOf(energy.Pmin, max) },
      { value: energy.Prec, text: `recomendado ${formatBR(energy.Prec, 2)} W`, pct: pctOf(energy.Prec, max) },
    ] : [],
  };
  b.levelWord = LEVEL_WORD[b.level];
  b.text = barText(b);
  return b;
}

/**
 * Dados das barras de autonomia e de painel. O nível de cada barra é o do item da auditoria (que já
 * aplica o teto de Atenção); sem item, a barra fica em Atenção e sem número (na dúvida, Atenção).
 * @param {object|null} energy `buildRuleCtx(state).energy`
 * @param {Array<object>} items `runAudit(state)`
 * @param {{daysNoSun:number}} state
 */
export function energyBars(energy, items, state) {
  if (!energy) return null;
  return { autonomy: autonomyBar(energy, items, state.daysNoSun), panel: panelBar(energy, items) };
}

// ---------- selo no desenho ----------

const BADGE = Object.freeze({ h: 30, w: { bad: 128, warn: 118 } });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Cantos possíveis do selo, sobre a linha do contorno: cima-direita, baixo-direita, cima-esquerda, baixo-esquerda. */
function badgeCandidates(rect, viewBox, level) {
  const w = BADGE.w[level] ?? BADGE.w.bad;
  const h = BADGE.h;
  const fit = (x, y) => ({
    x: clamp(x, 0, Math.max(0, viewBox.width - w)),
    y: clamp(y, 0, Math.max(0, viewBox.height - h)),
    w,
    h,
  });
  const right = rect.x + rect.width - w;
  const top = rect.y - h / 2;
  const bottom = rect.y + rect.height - h / 2;
  return [fit(right, top), fit(right, bottom), fit(rect.x, top), fit(rect.x, bottom)];
}

/**
 * Caixa do selo (unidades do viewBox): encostada no canto de cima à direita do contorno, sobre a linha,
 * sem sair do desenho.
 */
export function badgeBox(rect, viewBox, level) {
  return badgeCandidates(rect, viewBox, level)[0];
}

const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
  * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/**
 * Canto do contorno onde o selo cobre menos texto do desenho (e menos selos já postos).
 * Empate fica com o primeiro canto (cima-direita).
 * @param {Array<{x:number,y:number,w:number,h:number}>} obstacles
 */
export function pickBadgeBox(rect, viewBox, level, obstacles = []) {
  let best = null;
  let bestCost = Infinity;
  for (const c of badgeCandidates(rect, viewBox, level)) {
    const cost = obstacles.reduce((sum, o) => sum + overlap(c, o), 0);
    if (cost < bestCost) {
      best = c;
      bestCost = cost;
    }
  }
  return best;
}

/** Caixa aproximada de um <text> do SVG, só pelos atributos (sem medir na tela). */
export function textBox({ x, y, fontSize, anchor, length }) {
  const w = length * fontSize * 0.56;
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return { x: left, y: y - fontSize * 0.8, w, h: fontSize };
}

// ---------- itens que apontam para campos ----------

/** Campo que resolve um item de slot de campo ('local', 'regiao', 'wifi'); null para peça. */
export function fieldTarget(slot, state) {
  if (slot === FIELD_SLOTS.local) return 'location';
  if (slot === FIELD_SLOTS.wifi) return 'hasWifi';
  if (slot === FIELD_SLOTS.regiao) {
    if (!state.uf) return 'uf';
    if (!state.ddd && !state.customRegion) return 'ddd';
    return 'uf';
  }
  return null;
}

// Neutro de propósito: o IN-04 (falta de luz) também fica no slot "local", e trocar o local não o resolve.
const FIELD_ACTION = Object.freeze({
  [FIELD_SLOTS.local]: 'Ir para o campo "Onde vai ficar"',
  [FIELD_SLOTS.regiao]: 'Ir para o campo "Estado e DDD"',
  [FIELD_SLOTS.wifi]: 'Ir para o campo "Tem Wi-Fi no local?"',
});

/** Rótulo do botão que leva do item da auditoria até a peça ou o campo. */
export function itemActionLabel(slot) {
  return FIELD_ACTION[slot] ?? 'Mostrar no desenho';
}

/** Quais campos aparecem para este projeto. */
export function visibleFields(state, energy) {
  const project = PROJECTS[state.projectId];
  return {
    location: (project?.locations?.length ?? 0) > 0,
    energy: energy != null,
    region: true,
    tx: txOptions(state).length > 1,
    wifi: project?.role === 'observer',
  };
}

// ---------- catálogo e detalhe ----------

/** Grupos do "Trocar peça": slots na ordem do projeto, padrão primeiro. Só a peça em uso leva nível. */
export function catalogGroups(state, items) {
  const project = PROJECTS[state.projectId];
  const worst = worstBySlot(items);
  return Object.entries(project.slots).map(([slot, def]) => ({
    slot,
    label: def.label,
    options: [def.default, ...def.alternatives].map((id) => {
      const inUse = state.parts[slot] === id;
      return { id, name: PARTS[id]?.name ?? id, inUse, level: inUse ? (worst[slot] ?? null) : null };
    }),
  }));
}

/** Detalhe da peça em uso num slot: nome, dica, itens da auditoria e foto livre (ou null). */
export function detailModel(state, slot, items, tips = SHOPPING_TIPS) {
  const def = PROJECTS[state.projectId]?.slots?.[slot];
  if (!def) return null;
  const partId = state.parts[slot];
  const part = PARTS[partId];
  return {
    slot,
    slotLabel: def.label,
    partId,
    name: part?.name ?? partId,
    tip: tips[partId] ?? '',
    items: items.filter((i) => i.slot === slot),
    photo: part?.photo ?? null,
  };
}

/** Próxima aba pelo teclado (setas com volta, Home, End); null se a tecla não navega. */
export function nextTabIndex(index, key, count) {
  if (key === 'ArrowRight') return (index + 1) % count;
  if (key === 'ArrowLeft') return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return null;
}
