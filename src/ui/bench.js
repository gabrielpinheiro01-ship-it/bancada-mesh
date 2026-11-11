// Passo 2: a bancada. Monta as três áreas (Trocar peça · Montagem · Auditoria ao vivo), guarda só o estado
// da tela (aba, peça selecionada, erros de campo) e redesenha tudo a cada mudança, devolvendo o foco ao mesmo
// controle. O estado da montagem é imutável e vive no app.js. Nada roda no topo do módulo.
import { runAudit, summarize, buildRuleCtx } from '../core/audit.js';
import { swapPart, setField, applyFix } from '../core/state.js';
import { drawingFor } from '../core/drawing.js';
import { PROJECTS } from '../data/projects.js';
import { el } from './shell.js';
import {
  TABS, nextTabIndex, summaryText, summaryLevel, summaryWithDrawing, energyBars, slotLevels, worstBySlot, fieldTarget,
  visibleFields, catalogGroups, detailModel,
} from './bench-model.js';
import { renderCatalog } from './catalog.js';
import { renderAssembly, renderDetail, prefetchDrawings } from './assembly.js';
import { renderAuditPanel, levelIcon } from './audit-panel.js';
import { renderFields } from './fields.js';

function freshUi(projectId = null) {
  return {
    projectId,
    tab: 'montagem',
    selected: null, // slot de peça aberto no detalhe
    photoOpen: false,
    customOpen: false,
    errors: {}, // campo -> {raw, message}: o valor errado continua no campo
    alertField: null, // erro novo: anuncia uma vez (role="alert")
    pendingFocus: null, // chave de foco pedida pela ação
    scroll: null, // 'nearest' | 'center': rolar até o foco depois de redesenhar
    prevMarks: null, // níveis da pintura anterior (para o pulso só no que piorou)
    defer: false,
  };
}

let ui = freshUi();
/** @type {{root:HTMLElement, state:object, onChange:(s:object)=>void}|null} */
let current = null;
let pending = false;
let timer = null;
let mouseHeld = false;
let listening = false;

const benchOf = (root) => root.firstElementChild?.classList.contains('bancada') ? root.firstElementChild : null;
const isBenchOf = (root, state) => benchOf(root)?.getAttribute('data-bench-project') === String(state.projectId);

function fieldFocusKey(field, state) {
  if (field === 'location') return `campo:location:${state.location}`;
  if (field === 'hasWifi') return `campo:hasWifi:${String(state.hasWifi)}`;
  return `campo:${field}`;
}

// ---------- ciclo: mudança -> onChange -> app guarda -> renderBench -> pintura ----------

/**
 * Pinta agora, ou depois do clique em andamento. Campo aplicado ao sair (blur) dispara `change` no meio de um
 * clique: redesenhar ali tiraria do DOM o botão clicado e o clique se perderia. Por isso espera o mouseup.
 */
function requestPaint(defer) {
  pending = true;
  if (mouseHeld) {
    if (timer == null) timer = setTimeout(flush, 1500); // rede de segurança se o mouseup não chegar
    return;
  }
  if (defer) {
    if (timer == null) timer = setTimeout(flush, 0);
    return;
  }
  flush();
}

function flush() {
  if (timer != null) {
    clearTimeout(timer);
    timer = null;
  }
  if (!pending || !current) return;
  pending = false;
  if (!isBenchOf(current.root, current.state)) return; // já saiu da bancada
  paint(true);
}

function listen() {
  if (listening) return;
  listening = true;
  document.addEventListener('mousedown', () => { mouseHeld = true; }, true);
  const release = () => {
    mouseHeld = false;
    if (pending) {
      clearTimeout(timer);
      timer = setTimeout(flush, 0); // depois do click que vem logo após o mouseup
    }
  };
  document.addEventListener('mouseup', release, true);
  window.addEventListener('blur', release);
}

function emit(next, defer = false) {
  ui.defer = defer;
  current.state = next;
  current.onChange(next);
}

// ---------- ações (sempre sobre current.state: um clique num DOM antigo não perde mudança) ----------

const act = {
  swap(slot, partId) {
    if (ui.selected !== slot) ui.photoOpen = false;
    ui.selected = slot;
    if (current.state.parts[slot] === partId) {
      requestPaint(false);
      return;
    }
    emit(swapPart(current.state, slot, partId));
  },
  select(slot) {
    if (ui.selected !== slot) ui.photoOpen = false;
    ui.selected = slot;
    ui.pendingFocus = 'detalhe';
    ui.scroll = 'nearest';
    requestPaint(false);
  },
  closeDetail() {
    const slot = ui.selected;
    ui.selected = null;
    ui.photoOpen = false;
    ui.pendingFocus = slot ? `peca:${slot}` : null;
    ui.scroll = 'center';
    requestPaint(false);
  },
  togglePhoto() {
    ui.photoOpen = !ui.photoOpen;
    requestPaint(false);
  },
  fix(fix) {
    if (ui.selected !== fix.slot) ui.photoOpen = false;
    ui.selected = fix.slot;
    ui.pendingFocus = 'titulo-auditoria';
    emit(applyFix(current.state, fix));
  },
  showItem(item) {
    const field = fieldTarget(item.slot, current.state);
    ui.tab = 'montagem';
    if (field) {
      ui.pendingFocus = fieldFocusKey(field, current.state);
    } else {
      if (ui.selected !== item.slot) ui.photoOpen = false;
      ui.selected = item.slot;
      ui.pendingFocus = `peca:${item.slot}`;
    }
    ui.scroll = 'center';
    requestPaint(false);
  },
  /** Troca de aba sem redesenhar (só atributos). */
  tab(id, focus = false) {
    ui.tab = id;
    const bench = benchOf(current.root);
    if (!bench) return;
    bench.setAttribute('data-aba', id);
    for (const b of bench.querySelectorAll('[role="tab"]')) {
      const on = b.getAttribute('data-aba') === id;
      b.setAttribute('aria-selected', String(on));
      b.setAttribute('tabindex', on ? '0' : '-1');
      if (on && focus) b.focus();
    }
  },
  /** Campo de escolha (lista, opção). */
  field(field, value) {
    const r = setField(current.state, field, value);
    if (r.error) {
      ui.errors[field] = { raw: String(value ?? ''), message: r.error };
      ui.alertField = field;
      requestPaint(true);
      return;
    }
    delete ui.errors[field];
    emit(r.state, true);
  },
  /** Campo digitado: erro fica ao lado, com o valor errado; valor igual ao atual não redesenha. */
  text(field, raw) {
    const value = field === 'customRegion' ? raw.trim() : raw;
    const r = setField(current.state, field, value);
    const had = ui.errors[field];
    if (r.error) {
      if (had && had.raw === raw) return;
      ui.errors[field] = { raw, message: r.error };
      ui.alertField = field;
      requestPaint(true);
      return;
    }
    delete ui.errors[field];
    if (!had && r.state[field] === current.state[field]) return;
    emit(r.state, true);
  },
  toggleCustom(on) {
    ui.customOpen = on;
    if (!on) {
      delete ui.errors.customRegion;
      if (current.state.customRegion != null) {
        emit(setField(current.state, 'customRegion', null).state, true);
        return;
      }
    }
    requestPaint(true);
  },
};

// ---------- montagem da tela ----------

function liveText(sums, items, hasDrawing) {
  const bad = items.filter((i) => i.level === 'bad').map((i) => i.title);
  const semDesenho = hasDrawing ? '' : ' Atenção: sem desenho conferido para esta combinação.';
  return `Auditoria: ${summaryText(sums)}.${bad.length ? ` Problema: ${bad.join('; ')}.` : ''}${semDesenho}`;
}

function writeLive(text) {
  const live = document.getElementById('resumo-auditoria');
  if (live && live.textContent !== text) live.textContent = text;
}

function header(project, sums) {
  const level = summaryLevel(sums);
  return el('div', { class: 'bancada-topo' },
    el('h1', { class: 'titulo', tabindex: '-1', 'data-focus-key': 'titulo' }, 'Monte na bancada'),
    el('p', { class: 'bancada-projeto' }, 'Projeto: ', el('strong', {}, project.name)),
    el('p', { class: 'texto bancada-intro' }, 'A lista inicial já vem sem problemas. Troque uma peça só se for usar outra: a auditoria confere na hora.'),
    el('div', { class: `bancada-resumo resumo-${level}` },
      el('p', { class: 'resumo-texto', tabindex: '-1', 'data-focus-key': 'resumo' },
        levelIcon(level, 24),
        el('span', {}, el('span', { class: 'so-leitor' }, 'Auditoria: '), summaryText(sums))),
      el('p', { class: 'bancada-acoes' },
        el('a', { class: 'botao', href: '#/pdf', 'data-focus-key': 'proximo-pdf' }, 'Próximo: baixar o PDF'),
        el('a', { class: 'link-trocar', href: '#/', 'data-focus-key': 'trocar-projeto' }, 'Trocar de projeto'))));
}

function tabs() {
  const list = el('div', { class: 'abas', role: 'tablist', 'aria-label': 'Partes da bancada' });
  for (const t of TABS) {
    const on = ui.tab === t.id;
    const b = el('button', {
      type: 'button', role: 'tab', class: 'aba', id: `aba-${t.id}`, 'aria-controls': `painel-${t.id}`,
      'aria-selected': String(on), tabindex: on ? '0' : '-1', 'data-aba': t.id, 'data-focus-key': `aba:${t.id}`,
    }, t.label);
    b.addEventListener('click', () => act.tab(t.id));
    list.append(b);
  }
  list.addEventListener('keydown', (e) => {
    const i = TABS.findIndex((t) => t.id === ui.tab);
    const n = nextTabIndex(i, e.key, TABS.length);
    if (n == null) return;
    e.preventDefault();
    act.tab(TABS[n].id, true);
  });
  return list;
}

function panel(id, ...kids) {
  return el('section', { class: `painel painel-${id}`, id: `painel-${id}`, role: 'tabpanel', 'aria-labelledby': `aba-${id}` }, ...kids);
}

function buildView(state, items, sums, energy, newly, drawingId) {
  const project = PROJECTS[state.projectId];
  const detail = renderDetail(ui.selected ? detailModel(state, ui.selected, items) : null, ui, act);
  const montagem = [
    el('h2', { class: 'painel-titulo' }, 'Montagem'),
    el('p', { class: 'painel-dica' }, 'Toque numa peça do desenho para ver o detalhe dela.'),
    renderAssembly({ state, drawingId, levels: slotLevels(items, ui.selected), selected: ui.selected, newly, act }),
  ];
  if (detail) montagem.push(detail);
  montagem.push(renderFields({
    state, vis: visibleFields(state, energy), errors: ui.errors, alertField: ui.alertField, customOpen: ui.customOpen, act,
  }));

  return el('div', { class: 'bancada', 'data-bench-project': String(state.projectId), 'data-aba': ui.tab },
    header(project, sums),
    tabs(),
    el('div', { class: 'bancada-grade' },
      panel('pecas',
        el('h2', { class: 'painel-titulo' }, 'Trocar peça'),
        el('p', { class: 'painel-dica' }, 'A peça marcada "em uso" é a que está na montagem.'),
        renderCatalog(catalogGroups(state, items), act)),
      panel('montagem', ...montagem),
      panel('auditoria', ...renderAuditPanel({ items, bars: energyBars(energy, items, state), act }))));
}

function paint(rerender) {
  const { root, state } = current;
  const project = PROJECTS[state.projectId];
  if (ui.selected && !project.slots[ui.selected]) ui.selected = null;
  const items = runAudit(state);
  const drawingId = drawingFor(state, items);
  const sums = summaryWithDrawing(summarize(items), drawingId != null);
  const energy = buildRuleCtx(state).energy;

  let wanted = ui.pendingFocus;
  if (rerender && !wanted) {
    const a = document.activeElement;
    if (a && a !== document.body && root.contains(a)) wanted = a.closest('[data-focus-key]')?.getAttribute('data-focus-key') ?? 'resumo';
  }
  const scroll = ui.scroll;
  ui.pendingFocus = null;
  ui.scroll = null;
  const sx = window.scrollX;
  const sy = window.scrollY;

  // Pulso só nas peças que acabaram de ganhar (ou piorar) o destaque, não a cada redesenho.
  const marks = worstBySlot(items);
  const prev = ui.prevMarks;
  const newly = new Set(prev ? Object.keys(marks).filter((s) => !prev[s] || (prev[s] === 'warn' && marks[s] === 'bad')) : []);
  ui.prevMarks = marks;

  root.replaceChildren(buildView(state, items, sums, energy, newly, drawingId));
  writeLive(liveText(sums, items, drawingId != null));
  ui.alertField = null;
  if (!rerender) return; // a primeira pintura é da rota: o app.js põe o foco no título

  window.scrollTo(sx, sy);
  if (!wanted) return;
  const visible = (n) => n.getClientRects().length > 0;
  const find = (key) => [...root.querySelectorAll('[data-focus-key]')].find((n) => n.getAttribute('data-focus-key') === key && visible(n));
  const target = find(wanted) ?? find('resumo') ?? find('titulo') ?? root.querySelector('h1');
  if (!target) return;
  target.focus({ preventScroll: true });
  if (target instanceof HTMLInputElement && target.type === 'text') {
    const end = target.value.length;
    target.setSelectionRange(end, end);
  }
  if (scroll) target.scrollIntoView({ block: scroll });
}

/**
 * Escreve o passo 2 dentro de `root`. Chamado pela rota e de novo a cada `onChange` (o app guarda o estado
 * novo e chama de volta). Na rota, a tela começa do zero (aba Montagem, nada selecionado).
 * @param {HTMLElement} root
 * @param {object} state estado imutável da montagem
 * @param {(state:object)=>void} onChange
 */
export function renderBench(root, state, onChange) {
  listen();
  const again = Boolean(current) && current.root === root && isBenchOf(root, state) && ui.projectId === state.projectId;
  current = { root, state, onChange };
  if (!again) {
    ui = freshUi(state.projectId);
    pending = false;
    clearTimeout(timer);
    timer = null;
    prefetchDrawings(PROJECTS[state.projectId]);
    paint(false);
    return;
  }
  const defer = ui.defer;
  ui.defer = false;
  requestPaint(defer);
}
