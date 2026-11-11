// Estado imutável da montagem. Toda função devolve objetos novos.
import { META } from '../data/meta.js';
import { PROJECTS } from '../data/projects.js';
import { parseNumberBR } from './numbers.js';
import { DDD_BY_UF } from '../data/ddd.js';
import { validateCustomRegion } from './region.js';
import { txOptions } from './commands.js';

const NUMERIC = ['daysNoSun', 'daysRecharge', 'hsp'];
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
    if (!txOptions(state).includes(value)) return keep(`Essa placa só aceita: ${txOptions(state).join(', ')}`);
    return ok(value);
  }
  if (field === 'uf') {
    if (value === null) return { state: { ...state, parts: { ...state.parts }, uf: null, ddd: null, customRegion: null }, error: null };
    if (typeof value !== 'string' || !Object.hasOwn(DDD_BY_UF, value)) return keep('Escolha um estado da lista');
    const ddd = state.ddd && DDD_BY_UF[value].includes(state.ddd) ? state.ddd : null;
    const customRegion = state.customRegion && state.customRegion.startsWith(`br-${value.toLowerCase()}-`) ? state.customRegion : null;
    return { state: { ...state, parts: { ...state.parts }, uf: value, ddd, customRegion }, error: null };
  }
  if (field === 'ddd') {
    if (value === null) return ok(null);
    if (!state.uf) return keep('Escolha primeiro o estado');
    if (typeof value !== 'string' || !DDD_BY_UF[state.uf].includes(value)) return keep(`Esse DDD não é de ${state.uf}`);
    return ok(value);
  }
  if (field === 'customRegion') {
    if (value === null || value === '') return ok(null);
    if (typeof value !== 'string') return keep('Digite um texto');
    const v = validateCustomRegion(value, state.uf);
    if (!v.ok) return keep(v.reason);
    return ok(value);
  }
  throw new Error(`Campo desconhecido: ${field}`);
}

export function applyFix(state, fix) {
  return swapPart(state, fix.slot, fix.partId);
}
