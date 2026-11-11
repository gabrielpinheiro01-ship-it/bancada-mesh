// Casca da página: cabeçalho, indicador de 3 passos, rodapé e região viva da auditoria.
// Nada roda no topo do módulo: tudo acontece dentro de funções chamadas pelo app.js.
import { META } from '../data/meta.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export const STEPS = Object.freeze([
  { n: 1, label: 'Escolha um projeto' },
  { n: 2, label: 'Monte na bancada' },
  { n: 3, label: 'Baixe o PDF' },
]);

/** '2026-11-10' -> '10/11/2026' (sem Date, para não depender de fuso). */
export function formatDateBR(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function footerText(meta = META) {
  return `regras conferidas em ${formatDateBR(meta.rulesCheckedAt)} · firmware ${meta.firmware}`;
}

/** Passo atual (1 a 3) de cada rota. */
export function stepOf(route) {
  if (route.name === 'bancada') return 2;
  if (route.name === 'pdf') return 3;
  return 1;
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children) node.append(c);
  return node;
}

function brandMark() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const set = (n, a) => { for (const [k, v] of Object.entries(a)) n.setAttribute(k, v); return n; };
  set(svg, { viewBox: '0 0 40 40', width: '40', height: '40', class: 'marca', 'aria-hidden': 'true', focusable: 'false' });
  const mk = (tag, a) => set(document.createElementNS(SVG_NS, tag), a);
  svg.append(
    mk('path', { d: 'M20 7 L6 33 L34 33 Z', class: 'marca-fio', fill: 'none' }),
    mk('circle', { cx: 20, cy: 7, r: 5, class: 'marca-no' }),
    mk('circle', { cx: 6, cy: 33, r: 5, class: 'marca-no' }),
    mk('circle', { cx: 34, cy: 33, r: 5, class: 'marca-no' }),
  );
  return svg;
}

/**
 * Monta a casca dentro de `container` e devolve os ganchos para o app e as tarefas seguintes.
 * @returns {{main:HTMLElement, live:HTMLElement, setStep:(n:number)=>void}}
 */
export function mountShell(container) {
  const skip = el('a', { class: 'pular', href: '#conteudo' }, 'Pular para o conteúdo');

  // Não deixa o link mexer no hash (isso trocaria de rota): só move o foco.
  skip.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); });

  const header = el('header', { class: 'cabecalho' },
    el('a', { class: 'marca-link', href: '#/', 'aria-label': 'Bancada Mesh, voltar ao início' },
      brandMark(),
      el('span', { class: 'marca-textos' },
        el('span', { class: 'marca-nome' }, 'Bancada Mesh'),
        el('span', { class: 'marca-sub' }, 'monte seu rádio MeshCore sem errar'),
      ),
    ),
  );

  const list = el('ol', { class: 'passos' });
  const items = STEPS.map((s) => {
    const li = el('li', { class: 'passo' });
    li.append(el('span', { class: 'passo-n' }, String(s.n)), el('span', { class: 'passo-rotulo' }, s.label));
    list.append(li);
    return li;
  });
  const nav = el('nav', { class: 'passos-nav', 'aria-label': 'Passos' }, list);

  const main = el('main', { id: 'conteudo', class: 'conteudo', tabindex: '-1' });
  const live = el('div', { id: 'resumo-auditoria', class: 'resumo-auditoria', 'aria-live': 'polite', 'aria-atomic': 'true' });

  const footer = el('footer', { class: 'rodape' },
    el('p', { class: 'rodape-regras' }, footerText()),
    el('p', { class: 'rodape-aviso' }, 'Projeto comunitário e independente. Não é oficial do MeshCore nem do MeshCore Brasil.'),
  );

  container.replaceChildren(skip, header, nav, main, live, footer);

  function setStep(n) {
    items.forEach((li, i) => {
      if (STEPS[i].n === n) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      li.classList.toggle('passo-feito', STEPS[i].n < n);
    });
  }
  return { main, live, setStep };
}
