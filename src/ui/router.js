// Rotas por hash. Funções puras: este módulo não toca window/document (importável no Node).
import { PROJECTS } from '../data/projects.js';
import { isOpenable } from '../core/drawing.js';

/**
 * @param {string} hash ex.: '#/bancada/4'
 * @returns {{name:'projetos'}|{name:'bancada',projectId:number}|{name:'pdf'}|{name:'aviso',reason:'em-breve'|'inexistente',projectId:number}}
 */
export function parseRoute(hash) {
  const path = String(hash ?? '').replace(/^#\/?/, '').replace(/\/+$/, '');
  if (path === 'pdf') return { name: 'pdf' };
  const m = /^bancada\/([^/]*)$/.exec(path);
  if (m) {
    const projectId = /^\d+$/.test(m[1]) ? Number(m[1]) : NaN;
    if (!PROJECTS[projectId]) return { name: 'aviso', reason: 'inexistente', projectId };
    if (!isOpenable(projectId)) return { name: 'aviso', reason: 'em-breve', projectId };
    return { name: 'bancada', projectId };
  }
  return { name: 'projetos' };
}

/** `pdf` sem estado volta ao passo 1. */
export function routeGuard(route, state) {
  if (route.name === 'pdf' && !state) return { name: 'projetos' };
  return route;
}
