// Estado imutável da montagem. Toda função devolve objetos novos.
import { META } from '../data/meta.js';
import { PROJECTS } from '../data/projects.js';
import { parseNumberBR } from './numbers.js';

const NUMERIC = ['daysNoSun', 'daysRecharge', 'hsp'];
const STRING_OR_NULL = ['uf', 'ddd', 'customRegion'];
const MSG_NOT_NUMBER = 'Digite um número, por exemplo 4,2';

function fmtLimit(n) {
  return String(n).replace('.', ',');
}

/** @param {number} projectId */
export function createState(projectId) {
  const project = PROJECTS[projectId];
  if (!project) throw new Error(`Projeto inexistente: ${projectId}`);
  const parts = {};
  for (const [slot, def] of Object.entries(project.slots)) parts[slot] = def.default;
  return {
    projectId,
    parts,
    location: project.locations.length ? project.locations[0] : null,
    uf: null,
    ddd: null,
    customRegion: null,
    daysNoSun: META.defaults.daysNoSun,
    daysRecharge: META.defaults.daysRecharge,
    hsp: META.defaults.hsp,
    txDbm: 22,
    hasWifi: null,
  };
}

export function swapPart(state, slot, partId) {
  const def = PROJECTS[state.projectId]?.slots[slot];
  if (!def) throw new Error(`Slot desconhecido: ${slot}`);
  if (partId !== def.default && !def.alternatives.includes(partId)) {
    throw new Error(`Peça ${partId} não vale para o slot ${slot}`);
  }
  return { ...state, parts: { ...state.parts, [slot]: partId } };
}

/**
 * Altera um campo digitado. Valor inválido mantém o anterior e devolve a mensagem.
 * @returns {{state: object, error: string|null}}
 */
export function setField(state, field, value) {
  const keep = (error) => ({ state: { ...state, parts: { ...state.parts } }, error });
  const ok = (v) => ({ state: { ...state, parts: { ...state.parts }, [field]: v }, error: null });

  if (NUMERIC.includes(field)) {
    const n = parseNumberBR(value);
    if (n === null) return keep(MSG_NOT_NUMBER);
    const [min, max] = META.limits[field];
    if (n < min || n > max) return keep(`Use um número entre ${fmtLimit(min)} e ${fmtLimit(max)}`);
    return ok(n);
  }
  if (field === 'location') {
    if (!PROJECTS[state.projectId].locations.includes(value)) return keep('Escolha um dos locais da lista');
    return ok(value);
  }
  if (field === 'hasWifi') {
    if (value !== true && value !== false && value !== null) return keep('Responda sim ou não');
    return ok(value);
  }
  if (field === 'txDbm') {
    if (!Number.isInteger(value)) return keep('Use um número inteiro, por exemplo 22');
    return ok(value);
  }
  if (STRING_OR_NULL.includes(field)) {
    if (value !== null && typeof value !== 'string') return keep('Digite um texto');
    return ok(value);
  }
  throw new Error(`Campo desconhecido: ${field}`);
}

export function applyFix(state, fix) {
  return swapPart(state, fix.slot, fix.partId);
}
