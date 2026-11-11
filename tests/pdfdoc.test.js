import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, swapPart, setField } from '../src/core/state.js';
import { runAudit } from '../src/core/audit.js';
import {
  buildPdfDoc, buildPdfPages, pdfPageTitles, shoppingRows, pdfFileName, auditSummaryText,
} from '../src/core/pdfdoc.js';
import { SHOPPING_TIPS } from '../src/content/shopping.js';
import { FLASH_REPROVADA } from '../src/content/flash.js';
import { PROJECTS } from '../src/data/projects.js';
import { PARTS } from '../src/data/parts.js';

const DATE = '11/11/2026';
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect id="hl-carregador" x="1" y="1" width="50" height="20" fill="none"/><rect id="hl-placa" x="60" y="1" width="50" height="20" fill="none"/></svg>';

function p4(over = {}) {
  let s = createState(4);
  s = setField(s, 'uf', 'MG').state;
  s = setField(s, 'ddd', '31').state;
  s = setField(s, 'location', 'telhado').state;
  for (const [slot, id] of Object.entries(over)) s = swapPart(s, slot, id);
  return s;
}
const build = (state, svgText) => buildPdfDoc({ state, svgText, generatedAt: DATE });
const flat = (state, svgText) => JSON.stringify(build(state, svgText));
const cover = (state) => JSON.stringify(buildPdfPages({ state, generatedAt: DATE })[0].content);

function* walk(node) {
  yield node;
  if (Array.isArray(node)) for (const n of node) yield* walk(n);
  else if (node && typeof node === 'object') for (const v of Object.values(node)) yield* walk(v);
}

test('capa: tudo certo -> "Auditoria sem problemas"', () => {
  const c = cover(p4());
  assert.ok(c.includes('Auditoria sem problemas'));
  assert.ok(!c.includes('Problemas que ainda não foram resolvidos'));
});

test('capa: nome do projeto, data e versão das regras com o firmware', () => {
  const c = cover(p4());
  assert.ok(c.includes('Repetidor solar XIAO'));
  assert.ok(c.includes(DATE));
  assert.ok(c.includes('regras conferidas em 10/11/2026 · firmware 1.18.0'));
});

test('capa: com tp4056-sem-protecao lista o título do EN-10 e some o "sem problemas"', () => {
  const s = p4({ carregador: 'tp4056-sem-protecao' });
  const item = runAudit(s).find((i) => i.id === 'EN-10');
  assert.ok(item);
  const c = cover(s);
  assert.ok(c.includes(item.title));
  assert.ok(c.includes(item.why.slice(0, 30)));
  assert.ok(c.includes('Problemas que ainda não foram resolvidos'));
  assert.ok(!flat(s).includes('Auditoria sem problemas'));
});

test('capa: o aviso de problema não depende da cor (contorno tracejado, ícone e texto)', () => {
  const content = buildPdfPages({ state: p4({ carregador: 'tp4056-sem-protecao' }), generatedAt: DATE })[0].content;
  const layouts = [...walk(content)].filter((n) => n && typeof n.hLineStyle === 'function');
  assert.ok(layouts.length >= 1, 'caixa com layout próprio');
  const l = layouts[0];
  assert.ok(l.hLineStyle(0, null) && l.hLineStyle(0, null).dash, 'linha horizontal tracejada');
  assert.ok(l.vLineStyle(0, null) && l.vLineStyle(0, null).dash, 'linha vertical tracejada');
  assert.ok(l.hLineWidth(0, null) >= 3, 'contorno grosso');
  assert.ok([...walk(content)].some((n) => n && n.type === 'polyline'), 'ícone de alerta desenhado');
});

test('capa: os pontos de atenção vêm em seguida; sem UF/DDD o item de região aparece', () => {
  const s = createState(4);
  const c = cover(s);
  assert.ok(c.includes('Pontos de atenção'));
  assert.ok(c.includes('Falta a região do seu rádio'));
  assert.ok(c.indexOf('Pontos de atenção') > c.indexOf('Auditoria sem problemas'));
});

test('comandos: padrão BR e região de MG/31; nunca o comando proibido, parte legal ou loja', () => {
  const t = flat(p4());
  assert.ok(t.includes('set radio 923.125,62.5,8,8'));
  assert.ok(t.includes('region def br br-mg br-mg-31'));
  assert.ok(t.includes('set txdelay 0.5'));
  assert.ok(!t.includes('set advert.interval 0'));
  assert.ok(!/anatel/i.test(t));
  assert.ok(!/aliexpress|mercadolivre|amazon/i.test(t));
});

test('comandos: sem UF/DDD ficam as lacunas de região e o aviso', () => {
  const t = flat(createState(4));
  assert.ok(t.includes('br-____'));
  assert.ok(t.includes('Falta a região do seu rádio'));
});

test('comandos usam a fonte Mono, com caixinha desenhada', () => {
  const t = flat(p4());
  assert.ok(t.includes('"font":"Mono"'));
  const dd = build(p4());
  assert.equal(dd.defaultStyle.font, 'Atkinson');
  assert.ok([...walk(dd.content)].some((n) => n && n.type === 'rect' && n.w > 0), 'caixinha em canvas');
});

test('energia: números em pt-BR, autonomia 19,8 e nada de "30 dias"', () => {
  const t = flat(p4());
  assert.ok(t.includes('19,8'));
  assert.ok(t.includes('1,89 W') && t.includes('2,36 W'));
  assert.ok(t.includes('2160 mAh'));
  assert.ok(!t.includes('30 dias'));
});

test('páginas: projeto 3 (tomada) e projeto 1 (companion) não têm a página de energia; o 4 tem', () => {
  assert.ok(!pdfPageTitles(createState(3)).includes('Energia'));
  assert.ok(!pdfPageTitles(createState(1)).includes('Energia'));
  assert.ok(pdfPageTitles(p4()).includes('Energia'));
  assert.ok(!flat(createState(3)).includes('Autonomia'));
});

test('páginas: ordem da spec', () => {
  assert.deepEqual(pdfPageTitles(p4()), [
    'Capa', 'Lista de compras', 'Ligação', 'Gravar o firmware', 'Comandos', 'Energia',
    'Montagem, instalação e manutenção', 'Depois de ligar',
  ]);
  assert.equal(pdfPageTitles(createState(3)).length, 7);
});

test('companion: passos do app em vez dos comandos de repetidor', () => {
  const t = flat(createState(1));
  assert.ok(t.includes('Send Advert'));
  assert.ok(t.includes('Australia: SA, WA'));
  assert.ok(!t.includes('region def'));
  assert.ok(!t.includes('set txdelay'));
  assert.ok(!t.includes('password ________'));
});

test('privacidade: o estado não guarda senha, nome do nó nem coordenadas; o documento só tem lacunas', () => {
  for (const id of [1, 3, 4]) {
    const keys = Object.keys(createState(id)).join(' ').toLowerCase();
    assert.ok(!/pass|senha|nome|name|\blat|\blon|coord/.test(keys), keys);
  }
  const t = flat(p4());
  for (const gap of ['set name ________', 'password ________', 'set lat ________', 'set lon ________']) {
    assert.ok(t.includes(gap), gap);
  }
});

test('desenho: marca peça com problema (tracejado) e inclui os alertas; sem SVG não quebra', () => {
  const s = p4({ carregador: 'tp4056-sem-protecao' });
  const withSvg = flat(s, SVG);
  assert.ok(withSvg.includes('stroke-dasharray'));
  assert.ok(withSvg.includes('tracejado = peça com problema ou atenção'));
  assert.ok(withSvg.includes('Nunca ligue o rádio sem antena'));
  assert.ok(withSvg.includes('Polaridade: vermelho é +, preto é −'));
  const sem = flat(s);
  assert.ok(sem.includes('Desenho indisponível'));
  assert.ok(!sem.includes('"svg"'));
});

test('desenho: largura cabe na página A4 e o alto respeita a proporção', () => {
  const dd = build(p4(), SVG);
  const node = [...walk(dd.content)].find((n) => n && typeof n.svg === 'string');
  assert.ok(node);
  const [mL, , mR] = dd.pageMargins;
  assert.ok(node.width <= dd.pageSize.width - mL - mR + 0.01);
  assert.equal(node.font, 'Atkinson');
});

test('desenho: sozinho na página, grande o bastante para ler os pontos de solda impressos (≥ 8 pt)', async () => {
  const { readFileSync } = await import('node:fs');
  const { DRAWING_MAX_H } = await import('../src/core/pdfdoc.js');
  const cases = [
    [p4(), 'p4-tp4056'],
    [p4({ carregador: 'cn3791-bms' }), 'p4-cn3791-bms'],
    [createState(3), 'p3-t114'],
    [swapPart(createState(3), 'placa', 'heltec-v3'), 'p3-v3'],
  ];
  for (const [state, id] of cases) {
    const text = readFileSync(new URL(`../assets/svg/drawings/${id}.svg`, import.meta.url), 'utf8');
    const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(text).map(Number);
    const dd = build(state, text);
    const node = [...walk(dd.content)].find((n) => n && typeof n.svg === 'string');
    const height = (node.width * h) / w;
    assert.ok(height <= DRAWING_MAX_H + 0.01, `${id}: alto ${height}`);
    assert.ok(height >= DRAWING_MAX_H - 0.01 || node.width >= 514, `${id}: usa o espaço da página`);
    // nomes dos pontos (IN+, OUT−, BAT+, P+…) têm font-size 16 no viewBox
    if (id.startsWith('p4')) assert.ok((16 * node.width) / w >= 8, `${id}: ponto de solda com ${((16 * node.width) / w).toFixed(2)} pt`);
  }
  // Título + desenho + legenda ("Peças marcadas" em até 2 linhas) cabem na mesma A4 (conferido gerando o PDF).
  const dd = build(p4(), SVG);
  const [, top, , bottom] = dd.pageMargins;
  assert.ok(dd.pageSize.height - top - bottom - DRAWING_MAX_H >= 90, 'espaço para o título e a legenda');
  assert.ok(DRAWING_MAX_H >= 600, 'desenho ocupa a página');
});

test('desenho: o título "Alertas" anda junto com o primeiro alerta (desce para a página seguinte se não couber)', () => {
  const page = buildPdfPages({ state: p4(), svgText: SVG, generatedAt: DATE }).find((p) => p.title === 'Ligação');
  const i = page.content.findIndex((n) => n.unbreakable && n.stack?.[0]?.text === 'Alertas');
  assert.ok(i > 0, 'bloco "Alertas" inseparável');
  assert.equal(page.content[i].stack.length, 2, 'título + primeiro alerta');
  assert.ok(page.content.slice(0, i).some((n) => typeof n.svg === 'string'), 'desenho antes dos alertas');
});

test('compras: cabo longo também pede o pigtail U.FL para SMA para sair da caixa', () => {
  // guia-repeater-xiao-solar.md §1 item 2 (pigtail U.FL/IPEX → SMA, 10–15 cm) e hardware-energia.md "Antenas".
  for (const id of ['rg58-3m', 'lmr400-3m']) {
    assert.match(SHOPPING_TIPS[id], /pigtail U\.FL \(IPEX\) para SMA de 10 a 15 cm/, id);
  }
});

test('alertas de bateria só nos projetos com bateria', () => {
  assert.ok(flat(p4(), SVG).includes('Teste a bateria antes de instalar'));
  assert.ok(!flat(createState(3), SVG).includes('Teste a bateria antes de instalar'));
  assert.ok(!flat(createState(3), SVG).includes('Baterias em paralelo: meça antes de juntar'));
  assert.ok(!flat(createState(1), SVG).includes('Teste a bateria antes de instalar'));
  assert.ok(!flat(createState(3)).includes('Troca da bateria'));
  assert.ok(flat(p4()).includes('Troca da bateria'));
});

test('compras: bateria sempre Qtd 1 (o nome diz quantas células); detalhe, preço e "sem preço"', () => {
  const rows = shoppingRows(p4(), runAudit(p4()));
  const bat = rows.find((r) => r.slot === 'bateria');
  assert.equal(bat.qty, 1);
  assert.equal(rows.find((r) => r.slot === 'placa').qty, 1);
  assert.match(bat.tip, /Samsung 35E/);
  assert.match(rows.find((r) => r.slot === 'carregador').tip, /DW01/);
  assert.match(rows.find((r) => r.slot === 'placa').tip, /915 MHz/);
  assert.equal(rows.find((r) => r.slot === 'placa').price, 'R$ 100 · em 27/04/2026 · fonte: Mesh Sorocaba (hardware-energia.md)');
  assert.equal(bat.price, 'sem preço de referência');
  const one = shoppingRows(p4({ bateria: 'bat-1x3500' }), []).find((r) => r.slot === 'bateria');
  assert.equal(one.qty, 1);
});

test('compras: acessórios do projeto e peça reprovada marcada', () => {
  const s = p4({ carregador: 'tp4056-sem-protecao' });
  const rows = shoppingRows(s, runAudit(s));
  assert.ok(rows.some((r) => r.name.includes('Prensa-cabo')));
  assert.ok(rows.some((r) => r.name.includes('termo-retrátil')));
  assert.equal(rows.find((r) => r.slot === 'carregador').reprovada, true);
  assert.equal(rows.find((r) => r.slot === 'placa').reprovada, false);
  assert.ok(flat(s).includes('REPROVADA na auditoria'));
  assert.ok(!flat(p4()).includes('REPROVADA na auditoria'));
});

test('compras: sem link de loja e o texto de preço traz data e fonte', () => {
  const t = flat(p4());
  assert.ok(!/https?:\/\/[^"]*(aliexpress|mercadolivre|amazon|shopee)/i.test(t));
  assert.ok(t.includes('em 27/04/2026'));
  assert.ok(t.includes('fonte: Mesh Sorocaba'));
});

test('todas as peças dos projetos prontos têm detalhe de compra', () => {
  for (const p of Object.values(PROJECTS).filter((x) => x.status === 'pronto')) {
    for (const def of Object.values(p.slots)) {
      for (const id of [def.default, ...def.alternatives]) {
        assert.ok(SHOPPING_TIPS[id], `${p.id}: falta SHOPPING_TIPS para ${id}`);
        assert.ok(PARTS[id], id);
      }
    }
  }
});

test('gravação: tipo de firmware e passos da placa; contraexemplo usa a frase de reprovada', () => {
  const t = flat(p4());
  assert.ok(t.includes('Tipo de firmware no flasher: Repetidor'));
  assert.ok(t.includes('dois toques rápidos'));
  const bad = flat(p4({ placa: 'xiao-nrf52840-sem-wio' }));
  assert.ok(bad.includes(FLASH_REPROVADA));
  assert.ok(flat(createState(1)).includes('Companion Bluetooth'));
});

test('montagem e depois de ligar: passos do projeto e o bloco numerado', () => {
  const t = flat(p4());
  assert.ok(t.includes('Teste de bancada 1'));
  assert.ok(t.includes('Altura e posição da antena'));
  assert.ok(t.includes('Ninguém me ouve, e agora?'));
  assert.ok(t.includes('Avisar a rede que você existe'));
});

test('nome do arquivo e texto do resumo', () => {
  assert.equal(pdfFileName(4), 'bancada-mesh-repetidor-solar-xiao.pdf');
  assert.equal(pdfFileName(3), 'bancada-mesh-repetidor-de-varanda-na-tomada.pdf');
  assert.equal(auditSummaryText({ bad: 0, warn: 1 }), 'Auditoria sem problemas · 1 ponto de atenção');
  assert.equal(auditSummaryText({ bad: 2, warn: 3 }), '2 problemas · 3 pontos de atenção');
  assert.equal(auditSummaryText({ bad: 1, warn: 0 }), '1 problema · 0 pontos de atenção');
});

test('o documento é puro e serializável: duas chamadas iguais dão o mesmo JSON', () => {
  assert.equal(flat(p4(), SVG), flat(p4(), SVG));
  const dd = build(p4(), SVG);
  assert.ok(dd.info.title.includes('Bancada Mesh'));
});

test('ids usados pelos filtros de alertas e de instalação existem no conteúdo', async () => {
  const { ALERT_FILTER_IDS, INSTALL_FILTER_IDS } = await import('../src/core/pdfdoc.js');
  const { ALERTS } = await import('../src/content/alerts.js');
  const { INSTALL } = await import('../src/content/install.js');
  for (const id of Object.values(ALERT_FILTER_IDS)) assert.ok(ALERTS.some((b) => b.id === id), `ALERTS sem ${id}`);
  for (const id of Object.values(INSTALL_FILTER_IDS)) assert.ok(INSTALL.some((b) => b.id === id), `INSTALL sem ${id}`);
});

test('withTimeout: resolve a tempo, rejeita no tempo-limite e propaga erro', async () => {
  const { withTimeout } = await import('../src/ui/pdf-step.js');
  assert.equal(await withTimeout(Promise.resolve(7), 50), 7);
  await assert.rejects(withTimeout(new Promise(() => {}), 20, 'demorou'), /demorou/);
  await assert.rejects(withTimeout(Promise.reject(new Error('falhou')), 50), /falhou/);
});

test('bateria falsa: PDF não imprime autonomia nem capacidade instalada', () => {
  const t = flat(p4({ bateria: 'bat-2x9900-generica' }));
  assert.ok(!t.includes('56,1'));
  assert.ok(!t.includes('19800'));
  assert.ok(t.includes('não calculada'));
});

test('uma célula: montagem e compras sem "duas baterias" nem "em paralelo"', () => {
  const s = p4({ bateria: 'bat-1x3500' });
  const t = flat(s);
  assert.ok(!t.includes('duas baterias'));
  assert.ok(!t.includes('em paralelo'));
  assert.ok(!t.includes('ligadas em paralelo'));
  const rows = shoppingRows(s, []);
  assert.ok(rows.some((r) => r.name === 'Suporte para 1 bateria 18650'));
  assert.ok(!rows.some((r) => /paralelo/.test(r.name + r.tip)));
});

test('duas células: continua mandando medir e ligar em paralelo', () => {
  const t = flat(p4());
  assert.ok(t.includes('duas baterias'));
  assert.ok(t.includes('em paralelo'));
});
