// Motor de auditoria: monta o contexto das regras, roda os conjuntos e ordena o resultado.
import { META } from '../data/meta.js';
import { PARTS } from '../data/parts.js';
import { PROJECTS } from '../data/projects.js';
import { calcEnergy } from './energy.js';
import { ENERGY_RULES } from '../rules/energy.js';
import { HARDWARE_RULES } from '../rules/hardware.js';
import { INSTALL_RULES } from '../rules/install.js';
import { CONFIG_RULES } from '../rules/config.js';

/** Conjuntos de regras padrão. */
export const DEFAULT_RULE_SETS = [ENERGY_RULES, HARDWARE_RULES, INSTALL_RULES, CONFIG_RULES];

const ORDER = { bad: 0, warn: 1, ok: 2 };

/**
 * @param {object} state
 * @returns {object} RuleCtx. `parts[slot]` = atributos da peça + `id` e `name`.
 */
export function buildRuleCtx(state) {
  const project = PROJECTS[state.projectId];
  const parts = {};
  for (const [slot, id] of Object.entries(state.parts)) {
    const p = PARTS[id];
    parts[slot] = { id, name: p?.name, ...(p?.attrs ?? {}) };
  }
  const d = META.defaults;
  const lessConservative = state.daysNoSun < d.daysNoSun || state.daysRecharge > d.daysRecharge || state.hsp > d.hsp;

  let energy = null;
  const solarOrBattery = project.power === 'battery' || project.power === 'solar';
  if (solarOrBattery && project.role !== 'companion' && parts.bateria && parts.placa) {
    const currentMa = parts.placa.currentMa + (parts.placa.gps ? META.gpsExtraMa : 0);
    const batteryMah = parts.bateria.cells * parts.bateria.mahPerCell;
    const panelW = parts.painel ? parts.painel.watts : 0;
    const input = { currentMa, batteryMah, daysNoSun: state.daysNoSun, daysRecharge: state.daysRecharge, hsp: state.hsp, panelW };
    energy = {
      currentMa, batteryMah, panelW,
      ...calcEnergy(input),
      atDefaults: calcEnergy({ ...input, ...d }),
    };
  }
  return { state, project, parts, energy, lessConservative };
}

/**
 * @param {object} state
 * @param {Array<Array<object>>} [ruleSets]
 */
export function runAudit(state, ruleSets = DEFAULT_RULE_SETS) {
  const ctx = buildRuleCtx(state);
  const items = [];
  for (const set of ruleSets) {
    for (const rule of set) {
      const out = rule.evaluate(ctx);
      if (!out) continue;
      for (const it of Array.isArray(out) ? out : [out]) {
        if (it) items.push({ ...it, source: it.source ?? rule.source });
      }
    }
  }
  return items.sort((a, b) => ORDER[a.level] - ORDER[b.level] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** @returns {{bad:number, warn:number}} */
export function summarize(items) {
  let bad = 0;
  let warn = 0;
  for (const it of items) {
    if (it.level === 'bad') bad++;
    else if (it.level === 'warn') warn++;
  }
  return { bad, warn };
}
