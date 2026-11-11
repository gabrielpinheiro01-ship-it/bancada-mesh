// Passo 3: tela do PDF e o download. Nada roda no topo do módulo: o DOM e a rede só são tocados
// dentro das funções. Tudo acontece no navegador: o pdfmake e as fontes são arquivos do próprio site.
import { runAudit, summarize } from '../core/audit.js';
import { buildPdfDoc, pdfPageTitles, pdfFileName, drawingIdFor, auditSummaryText } from '../core/pdfdoc.js';
import { el } from './shell.js';

const ROOT = new URL('../../', import.meta.url);
const PDFMAKE_URL = new URL('vendor/pdfmake/pdfmake.min.js', ROOT).href;

const FONT_FILES = Object.freeze({
  atkRegular: 'AtkinsonHyperlegible-Regular.ttf',
  atkBold: 'AtkinsonHyperlegible-Bold.ttf',
  monoRegular: 'JetBrainsMono-Regular.ttf',
  monoBold: 'JetBrainsMono-SemiBold.ttf',
});

const FONTS = Object.freeze({
  Atkinson: {
    normal: FONT_FILES.atkRegular, bold: FONT_FILES.atkBold,
    italics: FONT_FILES.atkRegular, bolditalics: FONT_FILES.atkBold,
  },
  Mono: {
    normal: FONT_FILES.monoRegular, bold: FONT_FILES.monoBold,
    italics: FONT_FILES.monoRegular, bolditalics: FONT_FILES.monoBold,
  },
});

const MSG_ERRO = 'Não deu para gerar o PDF. Tente de novo. Se o erro continuar, recarregue a página (suas escolhas serão perdidas, porque nada fica guardado).';

const PDF_TIMEOUT_MS = 30000;

/** Rejeita se a promessa não resolver em `ms`. Pura (sem DOM): testável no Node. */
export function withTimeout(promise, ms, message = 'tempo esgotado') {
  let timer;
  const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

let pdfMakePromise = null;

/** Carrega o pdfmake uma vez, sob demanda, por um <script src> do próprio site (permitido pela CSP). */
function loadPdfMake() {
  if (globalThis.pdfMake) return Promise.resolve(globalThis.pdfMake);
  if (!pdfMakePromise) {
    pdfMakePromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PDFMAKE_URL;
      s.onload = () => (globalThis.pdfMake ? resolve(globalThis.pdfMake) : reject(new Error('pdfmake não iniciou')));
      s.onerror = () => reject(new Error('não carregou o pdfmake'));
      document.head.append(s);
    }).catch((e) => { pdfMakePromise = null; throw e; });
  }
  return pdfMakePromise;
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function loadVfs() {
  const vfs = {};
  await Promise.all(Object.values(FONT_FILES).map(async (name) => {
    const res = await fetch(new URL(`assets/fonts/${name}`, ROOT));
    if (!res.ok) throw new Error(`fonte ${name}: ${res.status}`);
    vfs[name] = toBase64(await res.arrayBuffer());
  }));
  return vfs;
}

/**
 * Gera o PDF no navegador e baixa. Resolve quando o download foi entregue ao navegador.
 * @param {object} docDefinition de buildPdfDoc
 * @param {string} fileName
 */
export async function downloadPdf(docDefinition, fileName) {
  const [pdfMake, vfs] = await Promise.all([loadPdfMake(), loadVfs()]);
  // Gera primeiro o blob, com rejeição explícita e tempo-limite: erro assíncrono do pdfmake não prende o botão.
  const blob = await withTimeout(new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition, null, FONTS, vfs).getBlob(resolve);
    } catch (e) {
      reject(e);
    }
  }), PDF_TIMEOUT_MS, 'tempo esgotado ao gerar o PDF');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** dd/mm/aaaa da data local de hoje. */
function todayBR() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Texto do SVG do desenho da ligação, ou undefined se não achar (o PDF sai sem desenho). */
async function fetchDrawing(state) {
  try {
    const id = drawingIdFor(state);
    if (!id) return undefined;
    const res = await fetch(new URL(`assets/svg/drawings/${id}.svg`, ROOT));
    if (!res.ok) return undefined;
    const text = await res.text();
    return text.includes('<svg') ? text : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Escreve o passo 3 dentro de `root`.
 * @param {HTMLElement} root
 * @param {{name:string}} _route
 * @param {object} state
 */
export function renderPdfStep(root, _route, state) {
  const sums = summarize(runAudit(state));
  const hasBad = sums.bad > 0;

  const resumo = el('p', { class: hasBad ? 'pdf-resumo pdf-resumo-problema' : 'pdf-resumo' },
    el('strong', {}, auditSummaryText(sums)));
  const aviso = hasBad
    ? el('p', { class: 'texto pdf-aviso' }, 'O PDF vai sair com o aviso "Problemas que ainda não foram resolvidos" na capa. Volte à bancada para resolver, ou leve o PDF sabendo disso.')
    : null;

  const previa = el('ol', { class: 'pdf-previa' }, ...pdfPageTitles(state).map((t) => el('li', {}, t)));

  const botao = el('button', { class: 'botao', type: 'button' }, 'Baixar PDF');
  const status = el('p', { class: 'pdf-status', role: 'status' });
  const erro = el('p', { class: 'pdf-erro', role: 'alert' });

  botao.addEventListener('click', async () => {
    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');
    botao.textContent = 'Gerando o PDF…';
    status.textContent = 'Gerando o PDF…';
    erro.textContent = '';
    try {
      const svgText = await fetchDrawing(state);
      const dd = buildPdfDoc({ state, svgText, generatedAt: todayBR() });
      await downloadPdf(dd, pdfFileName(state.projectId));
      status.textContent = 'PDF gerado. Veja a pasta de downloads do seu navegador.';
    } catch {
      status.textContent = '';
      erro.textContent = MSG_ERRO;
    } finally {
      botao.disabled = false;
      botao.removeAttribute('aria-busy');
      botao.textContent = 'Baixar PDF';
    }
  });

  root.replaceChildren(
    el('h1', { class: 'titulo', tabindex: '-1' }, 'Baixe o PDF'),
    el('p', { class: 'texto' }, 'O PDF é o que você leva para a bancada: lista de compras, desenho, comandos e passos. Ele é gerado aqui no seu navegador; nada que você escolheu sai do seu computador.'),
    resumo,
    ...(aviso ? [aviso] : []),
    el('h2', { class: 'pdf-sub' }, 'O que vem no PDF'),
    previa,
    el('p', { class: 'pdf-acoes' }, botao),
    status,
    erro,
    el('p', { class: 'texto' }, el('a', { href: `#/bancada/${state.projectId}` }, 'Voltar para a bancada')),
  );
}
