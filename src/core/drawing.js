// Escolha do desenho da montagem e marcação dos destaques no SVG.
// Regra de ouro: combinação aprovada sem desenho correto não pode existir (não há "fiação ilustrativa").
import { PROJECTS } from '../data/projects.js';
import { summarize } from './audit.js';

const COLORS = Object.freeze({ bad: '#B91C1C', warn: '#A35400', sel: '#1E3A8A' });

/**
 * Primeiro desenho cujo `match` cobre as peças atuais; senão, havendo problema (bad > 0),
 * o desenho padrão como contraexemplo; senão null (sem desenho correto, nada de OK).
 * @param {object} state
 * @param {Array<object>} items resultado de runAudit
 * @returns {string|null}
 */
export function drawingFor(state, items) {
  const project = PROJECTS[state.projectId];
  if (!project) return null;
  for (const d of project.drawings) {
    const ok = Object.entries(d.match).every(([slot, ids]) => ids.includes(state.parts[slot]));
    if (ok) return d.id;
  }
  return summarize(items).bad > 0 ? project.defaultDrawing : null;
}

/** @param {number} projectId */
export function isOpenable(projectId) {
  return PROJECTS[projectId]?.status === 'pronto';
}

/**
 * Pinta o contorno do `<rect id="hl-<slot>">` de cada slot. bad/warn levam tracejado
 * (problema nunca só pela cor). Outros rects ficam intactos; slot sem rect é ignorado.
 * @param {string} svgText
 * @param {Record<string,'bad'|'warn'|'sel'>} levelsBySlot
 */
export function markSvg(svgText, levelsBySlot) {
  let out = svgText;
  for (const [slot, level] of Object.entries(levelsBySlot ?? {})) {
    const color = COLORS[level];
    if (!color || !/^[a-z0-9_-]+$/i.test(slot)) continue;
    const re = new RegExp(`<rect\\b([^>]*?\\bid="hl-${slot}"[^>]*?)\\s*(/?)>`, 'g');
    const dash = level === 'sel' ? '' : ' stroke-dasharray="7 5"';
    out = out.replace(re, (_m, attrs, slash) =>
      `<rect ${attrs.trim()} stroke="${color}" stroke-width="3" fill="none"${dash}${slash ? ' /' : ''}>`);
  }
  return out;
}
