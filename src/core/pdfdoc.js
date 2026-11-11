// Documento do PDF (passo 3), como docDefinition do pdfmake. Função pura: sem DOM, sem rede, sem relógio.
// A data (`generatedAt`, já formatada) e o texto do desenho (`svgText`) vêm de quem chama.
// O PDF é o que a pessoa leva para a bancada: se a auditoria tem Problema, a capa avisa em destaque
// (caixa com contorno grosso TRACEJADO, ícone e texto, para continuar identificável impresso em preto e branco).
import { META } from '../data/meta.js';
import { PARTS } from '../data/parts.js';
import { PROJECTS } from '../data/projects.js';
import { runAudit, summarize, buildRuleCtx } from './audit.js';
import { repeaterCommands, companionSteps } from './commands.js';
import { drawingFor, markSvg } from './drawing.js';
import { formatBR } from './numbers.js';
import { FLASH, firmwareTypeFor, FLASH_REPROVADA } from '../content/flash.js';
import { STEPS } from '../content/steps.js';
import { INSTALL } from '../content/install.js';
import { AFTER } from '../content/after.js';
import { ALERTS } from '../content/alerts.js';
import { CONFIG_NOTES } from '../content/config-notes.js';
import { SHOPPING_TIPS, SHOPPING_ACCESSORIES, SHOPPING_SOURCE } from '../content/shopping.js';

const INK = '#0F172A';
const GRAY = '#475569';
const LINE = '#8A94A3';
const RED = '#B91C1C';
const GREEN = '#15803D';

const PAGE = Object.freeze({ width: 595.28, height: 841.89 });
const MARGINS = Object.freeze([40, 48, 40, 52]);
const CONTENT_W = 515; // 595,28 - 40 - 40, arredondado para baixo
const DRAWING_MAX_H = 400;

const LEVEL_WORD = Object.freeze({ bad: 'PROBLEMA', warn: 'ATENÇÃO', ok: 'OK' });
const NO_PRICE = 'sem preço de referência';

// ---------- utilidades puras ----------

const f0 = (n) => formatBR(Math.round(n), 0);
const f1 = (n) => formatBR(n, 1);
const f2 = (n) => formatBR(n, 2);
const fn = (n) => (Number.isInteger(n) ? formatBR(n, 0) : formatBR(n, 1));
const plural = (n, one, many) => (n === 1 ? one : many);
const money = (n) => formatBR(n, Number.isInteger(n) ? 0 : 2);

/** '2026-11-10' -> '10/11/2026' (sem Date, para não depender de fuso). */
function dateBR(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Texto do resumo da auditoria; é o mesmo da tela do passo 3. */
export function auditSummaryText({ bad, warn }) {
  const atencao = `${warn} ${plural(warn, 'ponto de atenção', 'pontos de atenção')}`;
  if (bad === 0) return `Auditoria sem problemas · ${atencao}`;
  return `${bad} ${plural(bad, 'problema', 'problemas')} · ${atencao}`;
}

/** Nome do arquivo: bancada-mesh-<projeto-em-slug>.pdf */
export function pdfFileName(projectId) {
  const name = PROJECTS[projectId]?.name ?? 'projeto';
  const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `bancada-mesh-${slug}.pdf`;
}

/** Id do desenho da ligação para este estado (ou null), para quem busca o SVG. */
export function drawingIdFor(state) {
  return drawingFor(state, runAudit(state));
}

// Atkinson não tem a seta nem os três pontinhos verticais: trocar por texto, senão sai um quadradinho.
const clean = (s) => s.replaceAll('→', '>').replaceAll('⋮', '"três pontinhos"');

/** Texto com `trechos de código` entre crases: o código vai em fonte Mono. */
function rich(raw) {
  const s = clean(raw);
  if (!s.includes('`')) return s;
  return { text: s.split('`').map((p, i) => (i % 2 ? { text: p, font: 'Mono' } : p)).filter((p) => p !== '') };
}

const h1 = (text) => ({ text, style: 'h1' });
const h2 = (text) => ({ text, style: 'h2' });
const h3 = (text) => ({ text: clean(text), style: 'h3' });
const small = (text) => ({ text, style: 'small' });
const bullets = (items) => ({ ul: items.map(rich), margin: [0, 0, 0, 4] });
const numbered = (items) => ({ ol: items.map(rich), margin: [0, 0, 0, 4] });

/** Caixinha de marcar desenhada com `canvas` (não é glifo, então não depende da fonte). */
const checkbox = () => ({
  canvas: [{ type: 'rect', x: 1, y: 1, w: 10, h: 10, lineWidth: 1.2, lineColor: INK }],
  width: 16,
});

function blocks(list) {
  // Título e lista andam juntos: o título nunca fica sozinho no pé da página.
  return list.map((b) => ({ stack: [h3(b.title), b.ordered ? numbered(b.items) : bullets(b.items)], unbreakable: !b.ordered }));
}

// ---------- auditoria e peças ----------

function levelsBySlot(items, state) {
  const out = {};
  for (const it of items) {
    if (!Object.hasOwn(state.parts, it.slot)) continue;
    if (it.level === 'bad') out[it.slot] = 'bad';
    else if (it.level === 'warn' && out[it.slot] !== 'bad') out[it.slot] = 'warn';
  }
  return out;
}

function priceText(price) {
  if (!price) return NO_PRICE;
  const range = price.min === price.max ? `R$ ${money(price.min)}` : `R$ ${money(price.min)}–${money(price.max)}`;
  return `${range} · em ${dateBR(price.date)} · fonte: ${price.source}`;
}

/**
 * Uma linha por peça do estado (mais os acessórios do projeto).
 * @returns {Array<{slot:string, slotLabel:string, partId:string|null, name:string, qty:number, tip:string, price:string, reprovada:boolean}>}
 */
export function shoppingRows(state, items) {
  const project = PROJECTS[state.projectId];
  const bad = new Set(items.filter((i) => i.level === 'bad').map((i) => i.slot));
  const rows = [];
  for (const [slot, def] of Object.entries(project.slots)) {
    const partId = state.parts[slot];
    const part = PARTS[partId];
    if (!part) continue;
    rows.push({
      slot, slotLabel: def.label, partId, name: part.name,
      qty: part.attrs?.cells ?? 1,
      tip: SHOPPING_TIPS[partId] ?? '',
      price: priceText(part.price),
      reprovada: bad.has(slot),
    });
  }
  for (const a of SHOPPING_ACCESSORIES[state.projectId] ?? []) {
    rows.push({
      slot: 'acessorio', slotLabel: 'Acessório', partId: null, name: a.name, qty: a.qty,
      tip: a.tip ?? '', price: NO_PRICE, reprovada: false,
    });
  }
  return rows;
}

// ---------- páginas ----------

function alertsFor(state, project) {
  const hasBattery = Boolean(state.parts.bateria);
  const cells = PARTS[state.parts.bateria]?.attrs?.cells ?? 0;
  return ALERTS.filter((a) => {
    if (a.id === 'polaridade') return hasBattery || project.solder;
    if (a.id === 'EN-09') return cells > 1;
    if (a.id === 'EN-14') return hasBattery;
    return true;
  });
}

const BAD_LAYOUT = Object.freeze({
  hLineWidth: () => 3,
  vLineWidth: () => 3,
  hLineColor: () => RED,
  vLineColor: () => RED,
  hLineStyle: () => ({ dash: { length: 9, space: 4 } }),
  vLineStyle: () => ({ dash: { length: 9, space: 4 } }),
  paddingLeft: () => 9,
  paddingRight: () => 9,
  paddingTop: () => 7,
  paddingBottom: () => 7,
});

const OK_LAYOUT = Object.freeze({
  hLineWidth: () => 2, vLineWidth: () => 2, hLineColor: () => GREEN, vLineColor: () => GREEN,
  paddingLeft: () => 9, paddingRight: () => 9, paddingTop: () => 7, paddingBottom: () => 7,
});

// Triângulo de alerta com "!" (branco sobre o vermelho; em preto e branco vira branco sobre cinza escuro).
const alertIcon = () => ({
  canvas: [
    { type: 'polyline', closePath: true, color: '#FFFFFF', lineColor: '#FFFFFF', lineWidth: 1,
      points: [{ x: 12, y: 1 }, { x: 23, y: 21 }, { x: 1, y: 21 }] },
    { type: 'line', x1: 12, y1: 8, x2: 12, y2: 14, lineWidth: 2.6, lineColor: RED },
    { type: 'ellipse', x: 12, y: 17.6, r1: 1.4, r2: 1.4, color: RED },
  ],
  width: 26,
});

const checkIcon = () => ({
  canvas: [{ type: 'polyline', closePath: false, lineColor: GREEN, lineWidth: 3,
    points: [{ x: 2, y: 11 }, { x: 8, y: 17 }, { x: 20, y: 3 }] }],
  width: 26,
});

function issueBlock(it) {
  const out = [{ text: it.title, bold: true, fontSize: 11.5, margin: [0, 4, 0, 1] }, { text: it.why }];
  if (it.fix) out.push({ text: `Como resolver: ${it.fix.label}`, margin: [0, 1, 0, 0] });
  return out;
}

function coverPage(ctx) {
  const { state, project, items, sums, generatedAt } = ctx;
  const bad = items.filter((i) => i.level === 'bad');
  const warn = items.filter((i) => i.level === 'warn');

  const result = bad.length
    ? {
      table: {
        widths: ['*'],
        body: [
          [{
            fillColor: RED,
            columns: [alertIcon(), { text: 'Problemas que ainda não foram resolvidos', bold: true, color: '#FFFFFF', fontSize: 14, margin: [0, 3, 0, 0] }],
            columnGap: 8,
          }],
          [{
            stack: [
              { text: `${sums.bad} ${plural(sums.bad, 'problema impede', 'problemas impedem')} esta montagem de ficar certa. Resolva antes de comprar ou ligar.`, bold: true },
              ...bad.flatMap(issueBlock),
            ],
          }],
        ],
      },
      layout: BAD_LAYOUT,
      margin: [0, 6, 0, 10],
    }
    : {
      table: {
        widths: ['*'],
        body: [[{
          columns: [checkIcon(), {
            stack: [
              { text: 'Auditoria sem problemas', bold: true, fontSize: 15, color: GREEN },
              { text: 'As regras do site não acharam problema nas peças escolhidas. Isso não é garantia: confira cada ponto de atenção, meça com o multímetro e siga a ordem das páginas.', margin: [0, 2, 0, 0] },
            ],
          }],
          columnGap: 8,
        }]],
      },
      layout: OK_LAYOUT,
      margin: [0, 6, 0, 10],
    };

  const attention = [
    h2('Pontos de atenção'),
    ...(warn.length
      ? warn.flatMap((it) => [
        { text: [{ text: 'ATENÇÃO · ', bold: true }, { text: it.title, bold: true }], margin: [0, 4, 0, 1] },
        { text: it.why },
        ...(it.fix ? [{ text: `Como resolver: ${it.fix.label}` }] : []),
      ])
      : [{ text: 'Nenhum ponto de atenção.' }]),
  ];

  return {
    title: 'Capa',
    content: [
      { text: 'Bancada Mesh', style: 'marca' },
      { text: 'monte seu rádio MeshCore sem errar', style: 'small', margin: [0, 0, 0, 18] },
      { text: project.name, style: 'capaTitulo' },
      { text: project.what, margin: [0, 0, 0, 6] },
      { text: `Gerado em ${generatedAt}`, bold: true },
      { text: `regras conferidas em ${dateBR(META.rulesCheckedAt)} · firmware ${META.firmware}`, font: 'Mono', fontSize: 9.5, margin: [0, 2, 0, 0] },
      { text: auditSummaryText(sums), bold: true, margin: [0, 12, 0, 0] },
      result,
      ...attention,
      { text: 'Projeto comunitário e independente. Não é oficial do MeshCore nem do MeshCore Brasil.', style: 'small', margin: [0, 18, 0, 0] },
    ],
  };
}

function shoppingPage(ctx) {
  const rows = shoppingRows(ctx.state, ctx.items);
  const head = (t, extra = {}) => ({ text: t, bold: true, fontSize: 9, color: GRAY, ...extra });
  const body = [[head(''), head('Peça'), head('Qtd', { alignment: 'center' }), head('Detalhe que evita erro e preço de referência')]];
  for (const r of rows) {
    const piece = [
      { text: r.slotLabel.toUpperCase(), fontSize: 8, color: GRAY },
      { text: r.name, bold: true },
    ];
    if (r.reprovada) piece.push({ text: 'REPROVADA na auditoria', bold: true, color: RED, decoration: 'underline', margin: [0, 2, 0, 0] });
    const detail = [];
    if (r.tip) detail.push({ text: r.tip });
    detail.push({ text: r.price, fontSize: 8.5, color: GRAY, margin: [0, r.tip ? 2 : 0, 0, 0] });
    body.push([checkbox(), { stack: piece }, { text: String(r.qty), font: 'Mono', bold: true, alignment: 'center' }, { stack: detail }]);
  }
  return {
    title: 'Lista de compras',
    content: [
      h1('Lista de compras'),
      { text: 'Marque cada item na caixinha quando comprar. Peça marcada como REPROVADA não deve ser comprada do jeito que está.', margin: [0, 0, 0, 6] },
      {
        table: { headerRows: 1, dontBreakRows: true, widths: [16, 130, 26, '*'], body },
        layout: {
          hLineWidth: (i) => (i === 1 ? 1 : 0.5), vLineWidth: () => 0, hLineColor: () => LINE,
          paddingTop: () => 4, paddingBottom: () => 4, paddingLeft: () => 3, paddingRight: () => 3,
        },
      },
      { text: 'Preço é só uma referência (faixa, com a data e a fonte). Confira antes de comprar. Onde está "sem preço de referência", pesquise você mesmo.', style: 'small', margin: [0, 8, 0, 0] },
      { text: `Detalhes de compra: ${SHOPPING_SOURCE}`, style: 'small', margin: [0, 3, 0, 0] },
    ],
  };
}

function drawingNode(svgText, levels) {
  const marked = markSvg(svgText, levels);
  let width = CONTENT_W;
  const vb = /viewBox\s*=\s*"\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)\s*"/.exec(svgText);
  if (vb && Number(vb[1]) > 0 && Number(vb[2]) > 0) {
    width = Math.min(CONTENT_W, (DRAWING_MAX_H * Number(vb[1])) / Number(vb[2]));
  }
  return { svg: marked, width, font: 'Atkinson', alignment: 'center' };
}

function drawingPage(ctx) {
  const { state, project, items, svgText } = ctx;
  const levels = levelsBySlot(items, state);
  const marked = Object.entries(levels).map(([slot, lv]) => `${project.slots[slot].label} (${lv === 'bad' ? 'problema' : 'atenção'})`);
  const draw = svgText
    ? [
      drawingNode(svgText, levels),
      { text: 'Legenda: tracejado = peça com problema ou atenção.', style: 'small', margin: [0, 4, 0, 0] },
      ...(marked.length ? [{ text: `Peças marcadas: ${marked.join(', ')}.`, bold: true }] : []),
    ]
    : [{ text: 'Desenho indisponível. Não foi possível incluir o desenho da ligação neste PDF. Abra o desenho na bancada, no site.', bold: true, margin: [0, 4, 0, 4] }];
  return {
    title: 'Ligação',
    content: [h1('Ligação'), ...draw, h2('Alertas'), ...blocks(alertsFor(state, project))],
  };
}

function flashPage(ctx) {
  const { state, project } = ctx;
  const boardId = state.parts.placa ?? state.parts.aparelho;
  const board = PARTS[boardId];
  const type = firmwareTypeFor(project.role);
  const flash = FLASH[boardId];
  const content = [h1('Gravar o firmware')];
  if (!flash) {
    content.push(
      { text: board ? board.name : 'Peça', bold: true },
      { text: board?.counterexample ? FLASH_REPROVADA : 'Ainda não há passo a passo de gravação para esta peça.', bold: true, margin: [0, 2, 0, 0] },
    );
  } else {
    content.push(
      { text: board.name, bold: true },
      { text: `Tipo de firmware no flasher: ${type}`, bold: true, margin: [0, 2, 0, 2] },
      { text: `Firmware de referência: ${META.firmware}`, font: 'Mono', fontSize: 9.5, margin: [0, 0, 0, 4] },
      numbered(flash.steps),
    );
  }
  return { title: 'Gravar o firmware', content };
}

const NOTE_ORDER = ['CFG-08', 'CFG-07', 'CFG-09', 'CFG-10', 'CFG-05-advert', 'CFG-11'];
const HINTS = Object.freeze({
  'set name ________': '(preencha à mão)',
  'password ________': '(preencha à mão)',
  'set lat ________': '(preencha à mão)',
  'set lon ________': '(preencha à mão)',
  'get advert.interval': '(a resposta tem que ser 0)',
});

function commandsPage(ctx) {
  const { state, project, items } = ctx;
  const content = [h1('Comandos')];
  if (project.role !== 'repeater') {
    content.push(
      { text: 'Estes passos são feitos no app MeshCore, no celular.', margin: [0, 0, 0, 4] },
      numbered(companionSteps(state)),
    );
    return { title: 'Comandos', content };
  }
  const cmds = repeaterCommands(state);
  content.push(
    { text: 'Um comando por vez, pelo cabo USB. Digite, espere a resposta e só então marque a caixinha. Não cole várias linhas de uma vez.', bold: true, margin: [0, 0, 0, 6] },
  );
  for (const c of cmds) {
    const blankRegion = c.startsWith('region def') && c.includes('____');
    const hint = blankRegion ? '(falta estado e DDD)' : HINTS[c] ?? '';
    content.push({
      columns: [checkbox(), { text: c, font: 'Mono', fontSize: 10, width: 255 }, { text: hint, fontSize: 8.5, color: GRAY, width: '*', margin: [0, 2, 0, 0] }],
      columnGap: 4,
      margin: [0, 2, 0, 2],
    });
  }
  const regionItem = items.find((i) => i.id === 'CFG-04');
  if (cmds.some((c) => c.startsWith('region def') && c.includes('____'))) {
    content.push({
      text: `${regionItem ? regionItem.title : 'Falta a região do seu rádio'}: escolha o estado e o DDD no site, ou preencha à mão com a grafia exata do grupo da sua região, antes de digitar a linha region def.`,
      bold: true, margin: [0, 8, 0, 0],
    });
  }
  content.push(h2('As linhas em branco e o que conferir'));
  const byId = new Map(CONFIG_NOTES.map((b) => [b.id, b]));
  content.push(...blocks(NOTE_ORDER.map((id) => byId.get(id)).filter(Boolean)));
  return { title: 'Comandos', content };
}

function energyPage(ctx) {
  const { state, energy: e, items } = ctx;
  const row = (label, value) => [{ text: label }, { text: value, font: 'Mono', bold: true }];
  const body = [
    row('Consumo médio da placa', `${fn(e.currentMa)} mA`),
    row('Dias sem sol considerados', fn(state.daysNoSun)),
    row('Dias de sol para recarregar', fn(state.daysRecharge)),
    row('Horas de sol pleno por dia', fn(state.hsp)),
    row('Energia gasta nos dias sem sol', `${f0(e.E)} mAh`),
    row('Bateria necessária', `${f0(e.Cnec)} mAh`),
    row('Bateria instalada', `${f0(e.batteryMah)} mAh`),
    row('Autonomia sem sol', `${f1(e.autonomyDays)} dias`),
    row('Painel mínimo', `${f2(e.Pmin)} W`),
    row('Painel recomendado', `${f2(e.Prec)} W`),
    row('Painel escolhido', e.panelW ? `${fn(e.panelW)} W` : 'nenhum'),
  ];
  const content = [
    h1('Energia'),
    {
      table: { widths: ['*', 'auto'], body },
      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => LINE, paddingTop: () => 3, paddingBottom: () => 3 },
    },
    h2('Como a conta é feita'),
    bullets([
      'Energia dos dias sem sol = consumo × 24 horas × dias sem sol.',
      `Bateria necessária = essa energia ÷ ${formatBR(META.usefulFraction, 2)}, porque só essa fração da carga da bateria é aproveitável.`,
      'Painel mínimo = energia a repor nos dias de recarga ÷ (horas de sol pleno × dias de recarga), na tensão do painel de 6 V. O recomendado soma uma margem de 25 %.',
    ]),
  ];
  if (ctx.lessConservative) {
    const d = e.atDefaults;
    content.push({
      text: `Você mudou valores para menos conservadores que o padrão da comunidade (${fn(META.defaults.daysNoSun)} dias sem sol, ${fn(META.defaults.daysRecharge)} dias para recarregar, ${fn(META.defaults.hsp)} horas de sol). Com o padrão, a bateria necessária seria ${f0(d.Cnec)} mAh e o painel mínimo ${f2(d.Pmin)} W.`,
      bold: true, margin: [0, 4, 0, 0],
    });
  }
  const energyItems = items.filter((i) => i.id.startsWith('EN-'));
  if (energyItems.length) {
    content.push(h2('O que a auditoria diz sobre a energia'));
    for (const it of energyItems) {
      content.push(
        { text: [{ text: `${LEVEL_WORD[it.level]} · `, bold: true }, { text: it.title, bold: true }], margin: [0, 4, 0, 1] },
        { text: it.why },
      );
    }
  }
  return { title: 'Energia', content };
}

function buildPage(ctx) {
  const { state, project } = ctx;
  const repeater = project.role === 'repeater';
  const content = [h1(repeater ? 'Montagem, instalação e manutenção' : 'Montagem e teste de bancada'), h2('Montagem e teste de bancada'), numbered(STEPS[state.projectId] ?? [])];
  if (repeater) {
    const blocksFor = INSTALL.filter((b) => {
      if (b.id === 'IN-05-painel') return Boolean(state.parts.painel);
      if (b.id === 'IN-05-bateria') return Boolean(state.parts.bateria);
      return true;
    });
    content.push(h2('Instalação e manutenção'), ...blocks(blocksFor));
  }
  return { title: repeater ? 'Montagem, instalação e manutenção' : 'Montagem e teste de bancada', content };
}

function afterPage() {
  return { title: 'Depois de ligar', content: [h1('Depois de ligar'), ...blocks(AFTER)] };
}

/**
 * Páginas do PDF, na ordem da spec §7.6. A de energia só existe com bateria e painel calculáveis.
 * @returns {Array<{title:string, content:Array<object>}>}
 */
export function buildPdfPages({ state, svgText, generatedAt = '' }) {
  const project = PROJECTS[state.projectId];
  const items = runAudit(state);
  const ctx = {
    state, project, items, svgText, generatedAt,
    sums: summarize(items),
    ...(() => { const c = buildRuleCtx(state); return { energy: c.energy, lessConservative: c.lessConservative }; })(),
  };
  return [
    coverPage(ctx),
    shoppingPage(ctx),
    drawingPage(ctx),
    flashPage(ctx),
    commandsPage(ctx),
    ...(ctx.energy ? [energyPage(ctx)] : []),
    buildPage(ctx),
    afterPage(),
  ];
}

/** Títulos das páginas, para a prévia da tela. */
export function pdfPageTitles(state) {
  return buildPdfPages({ state }).map((p) => p.title);
}

/**
 * docDefinition do pdfmake. Fontes esperadas: `Atkinson` (padrão) e `Mono`.
 * @param {{state:object, svgText?:string, generatedAt:string}} input
 */
export function buildPdfDoc({ state, svgText, generatedAt }) {
  const project = PROJECTS[state.projectId];
  const pages = buildPdfPages({ state, svgText, generatedAt });
  const content = pages.flatMap((p, i) => {
    const nodes = p.content.map((n) => (typeof n === 'string' ? { text: n } : { ...n }));
    if (i > 0) nodes[0] = { ...nodes[0], pageBreak: 'before' };
    return nodes;
  });
  return {
    info: {
      title: `Bancada Mesh · ${project.name}`,
      author: 'Bancada Mesh',
      subject: `Lista de compras, ligação, gravação e comandos · regras conferidas em ${dateBR(META.rulesCheckedAt)} · firmware ${META.firmware}`,
      creator: 'Bancada Mesh',
    },
    pageSize: { width: PAGE.width, height: PAGE.height },
    pageMargins: [...MARGINS],
    defaultStyle: { font: 'Atkinson', fontSize: 10.5, lineHeight: 1.2, color: INK },
    styles: {
      marca: { fontSize: 13, bold: true, color: '#1E3A8A' },
      capaTitulo: { fontSize: 24, bold: true, margin: [0, 0, 0, 4] },
      h1: { fontSize: 20, bold: true, margin: [0, 0, 0, 8] },
      h2: { fontSize: 13.5, bold: true, margin: [0, 12, 0, 4] },
      h3: { fontSize: 11.5, bold: true, margin: [0, 8, 0, 3] },
      small: { fontSize: 8.5, color: GRAY },
    },
    content,
    footer: (current, count) => ({
      margin: [MARGINS[0], 12, MARGINS[2], 0],
      columns: [
        { text: `Bancada Mesh · ${project.name}`, fontSize: 8, color: GRAY },
        { text: `Página ${current} de ${count}`, fontSize: 8, color: GRAY, alignment: 'right' },
      ],
    }),
  };
}
