// Ponto de entrada do navegador. O estado vive só em memória: fechou a página, começa de novo.
import { parseRoute, routeGuard } from './router.js';
import { createState } from '../core/state.js';
import { PROJECTS } from '../data/projects.js';
import { mountShell, stepOf, el } from './shell.js';

let state = null;
let shell = null;

/** Estado do projeto da rota: cria novo se não há ou se o projeto mudou (sem vazamento entre projetos). */
function stateFor(route) {
  if (route.name === 'bancada' && (!state || state.projectId !== route.projectId)) {
    state = createState(route.projectId);
  }
  return state;
}

function marcador(title, text) {
  return [el('h1', { class: 'titulo', tabindex: '-1' }, title), el('p', { class: 'texto' }, text)];
}

// Os passos 1, 2 e 3 são preenchidos pelas Tasks 11, 13 e 14: cada uma troca o renderizador abaixo.
// Cada renderizador recebe (root, route, state) e escreve dentro de `root`.
export const renderers = {
  projetos(root) {
    root.replaceChildren(...marcador('Escolha um projeto', 'Passo 1 em construção.'));
  },
  bancada(root, route) {
    root.replaceChildren(...marcador('Monte na bancada', `Passo 2 em construção (projeto ${route.projectId}).`));
  },
  pdf(root) {
    root.replaceChildren(...marcador('Baixe o PDF', 'Passo 3 em construção.'));
  },
  aviso(root, route) {
    const emBreve = route.reason === 'em-breve';
    const nome = PROJECTS[route.projectId]?.name;
    const texto = emBreve
      ? `${nome ? `O projeto "${nome}"` : 'Este projeto'} ainda não está pronto. Estamos conferindo as regras dele antes de liberar.`
      : 'Não existe projeto com esse número.';
    root.replaceChildren(
      el('h1', { class: 'titulo', tabindex: '-1' }, emBreve ? 'Em breve' : 'Projeto não encontrado'),
      el('p', { class: 'texto' }, texto),
      el('a', { class: 'botao', href: '#/' }, 'Voltar para a escolha de projeto'),
    );
  },
};

export function renderStep(root, route, st) {
  (renderers[route.name] ?? renderers.projetos)(root, route, st);
}

function render() {
  const route = parseRoute(location.hash);
  const st = stateFor(route);
  if (routeGuard(route, st) !== route) {
    location.replace('#/'); // o hashchange seguinte renderiza o passo 1
    return;
  }
  shell.live.replaceChildren();
  shell.setStep(stepOf(route));
  renderStep(shell.main, route, st);
  const h1 = shell.main.querySelector('h1');
  document.title = `${h1 ? `${h1.textContent} · ` : ''}Bancada Mesh`;
  window.scrollTo(0, 0);
  (h1 ?? shell.main).focus({ preventScroll: true });
}

shell = mountShell(document.getElementById('app'));
window.addEventListener('hashchange', render);
render();
