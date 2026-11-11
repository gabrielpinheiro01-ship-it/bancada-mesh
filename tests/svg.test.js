// Ilustrações (Task 12): desenhos de montagem e ícones das peças dos projetos `pronto`.
// O mesmo SVG vai para a tela (markSvg + clique) e para o PDF (pdfmake): só atributos de apresentação.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { PROJECTS } from '../src/data/projects.js';
import { PARTS } from '../src/data/parts.js';
import { markSvg } from '../src/core/drawing.js';

const root = new URL('../', import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), 'utf8');
const ready = Object.values(PROJECTS).filter((p) => p.status === 'pronto');

const RED = '#C0262D';
const BLACK = '#0F172A';
const FORBIDDEN = [/<style/i, /\bclass=/i, /\bstyle=/i, /<script/i, /<image/i, /href="http/i, /<foreignObject/i];

/** Parser mínimo de XML: devolve a árvore e falha em tag sem par, atributo repetido ou `&` solto. */
function parseXml(text) {
  const body = text.replace(/<\?xml[^>]*\?>/, '').replace(/<!--[\s\S]*?-->/g, '');
  const rootNode = { name: '#root', attrs: {}, children: [], text: '' };
  const stack = [rootNode];
  const re = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*"[^"]*")*)\s*(\/?)>|([^<]+)|(<)/g;
  let m;
  while ((m = re.exec(body))) {
    if (m[6]) throw new Error(`"<" fora de tag perto de: ${body.slice(m.index, m.index + 40)}`);
    if (m[5] !== undefined) {
      if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(m[5])) throw new Error(`& solto: ${m[5].trim().slice(0, 40)}`);
      stack.at(-1).text += m[5];
      continue;
    }
    const [, close, name, rawAttrs, selfClose] = m;
    if (close) {
      const top = stack.pop();
      if (!top || top.name !== name) throw new Error(`</${name}> fecha <${top?.name}>`);
      continue;
    }
    const attrs = {};
    for (const a of rawAttrs.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) {
      if (a[1] in attrs) throw new Error(`atributo repetido ${a[1]} em <${name}>`);
      if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(a[2])) throw new Error(`& solto em ${a[1]}`);
      attrs[a[1]] = a[2];
    }
    const node = { name, attrs, children: [], text: '' };
    stack.at(-1).children.push(node);
    if (!selfClose) stack.push(node);
  }
  if (stack.length !== 1) throw new Error(`tag sem fechar: <${stack.at(-1).name}>`);
  const svgs = rootNode.children.filter((n) => n.name === 'svg');
  if (svgs.length !== 1 || rootNode.children.length !== 1) throw new Error('o arquivo precisa ter um único <svg> na raiz');
  return svgs[0];
}

function* walk(node) {
  yield node;
  for (const c of node.children) yield* walk(c);
}
const allText = (node) => [...walk(node)].map((n) => n.text).join(' ').replace(/\s+/g, ' ');

const drawings = [];
for (const p of ready) for (const d of p.drawings) drawings.push({ project: p, id: d.id, path: `assets/svg/drawings/${d.id}.svg` });

const partIds = new Set();
for (const p of ready) for (const def of Object.values(p.slots)) for (const id of [def.default, ...def.alternatives]) partIds.add(id);

test('há desenho para todo projeto pronto', () => {
  for (const p of ready) assert.ok(p.drawings.length > 0, `projeto ${p.id} sem desenho`);
  assert.ok(drawings.length >= 5);
});

for (const { project, id, path } of drawings) {
  test(`desenho ${id}: arquivo, título, descrição e regras de apresentação`, () => {
    assert.ok(existsSync(new URL(path, root)), `falta ${path}`);
    const text = read(path);
    for (const re of FORBIDDEN) assert.doesNotMatch(text, re, `${id} contém ${re}`);
    const svg = parseXml(text);
    assert.equal(svg.attrs.xmlns, 'http://www.w3.org/2000/svg');
    assert.match(svg.attrs.viewBox ?? '', /^0 0 \d+ \d+$/, `${id} viewBox`);
    assert.match(svg.attrs['font-family'] ?? '', /^Atkinson Hyperlegible, Atkinson, sans-serif$/);
    const title = svg.children.find((n) => n.name === 'title');
    const desc = svg.children.find((n) => n.name === 'desc');
    assert.ok(title && title.text.trim().length > 5, `${id} sem <title>`);
    assert.ok(desc && desc.text.trim().length > 10, `${id} sem <desc>`);
    for (const n of walk(svg)) {
      if (n.attrs['font-size'] !== undefined) assert.ok(Number(n.attrs['font-size']) >= 12, `${id}: fonte ${n.attrs['font-size']} < 12`);
      assert.ok(!('href' in n.attrs) && !('xlink:href' in n.attrs), `${id}: href em <${n.name}>`);
      assert.ok(!/gradient/i.test(n.name), `${id}: degradê`);
    }
    assert.match(allText(svg), /Nunca ligue sem a antena/, `${id}: falta o alerta da antena`);
  });

  test(`desenho ${id}: um grupo focável por slot, com o rect de destaque sem stroke nem fill`, () => {
    const svg = parseXml(read(path));
    const nodes = [...walk(svg)];
    const ids = nodes.map((n) => n.attrs.id).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, `${id}: id repetido`);
    for (const [slot, def] of Object.entries(project.slots)) {
      const groups = nodes.filter((n) => n.name === 'g' && n.attrs['data-slot'] === slot);
      assert.equal(groups.length, 1, `${id}: grupo do slot ${slot}`);
      const g = groups[0];
      assert.equal(g.attrs.tabindex, '0', `${id}/${slot} tabindex`);
      assert.equal(g.attrs.role, 'button', `${id}/${slot} role`);
      assert.equal(g.attrs['aria-label'], def.label, `${id}/${slot} aria-label`);
      const inner = [...walk(g)];
      assert.ok(!inner.slice(1).some((n) => n.attrs['data-slot']), `${id}/${slot}: grupo de slot dentro de outro`);
      const hl = inner.filter((n) => n.name === 'rect' && n.attrs.id === `hl-${slot}`);
      assert.equal(hl.length, 1, `${id}/${slot}: rect hl-${slot}`);
      const a = hl[0].attrs;
      assert.ok(!('stroke' in a) && !('fill' in a), `${id}/${slot}: hl com stroke ou fill`);
      assert.equal(a['fill-opacity'], '0', `${id}/${slot}: hl invisível`);
      for (const k of ['x', 'y', 'width', 'height']) assert.ok(Number.isFinite(Number(a[k])), `${id}/${slot} ${k}`);
    }
    const slotGroups = nodes.filter((n) => n.attrs['data-slot']);
    for (const g of slotGroups) assert.ok(project.slots[g.attrs['data-slot']], `${id}: slot desconhecido ${g.attrs['data-slot']}`);
  });

  test(`desenho ${id}: markSvg marca todo slot sem duplicar atributo`, () => {
    const text = read(path);
    const levels = Object.fromEntries(Object.keys(project.slots).map((s) => [s, 'bad']));
    const marked = markSvg(text, levels);
    const svg = parseXml(marked); // falha se algum atributo saiu repetido
    for (const slot of Object.keys(project.slots)) {
      const rect = [...walk(svg)].find((n) => n.attrs.id === `hl-${slot}`);
      assert.equal(rect.attrs.stroke, '#B91C1C', `${id}/${slot} stroke`);
      assert.equal(rect.attrs['stroke-dasharray'], '7 5', `${id}/${slot} tracejado`);
      assert.equal(rect.attrs.fill, 'none');
    }
  });
}

test('desenhos com fiação: fio vermelho e fio preto, cada um com rótulo', () => {
  for (const { project, id, path } of drawings) {
    // Só o solar tem fios soltos de + e −; na tomada (projeto 3) a energia vem pelo cabo USB, e o companion não tem fio.
    if (project.power !== 'solar') continue;
    const svg = parseXml(read(path));
    const strokes = [...walk(svg)].map((n) => n.attrs.stroke);
    assert.ok(strokes.includes(RED), `${id}: sem fio vermelho`);
    assert.ok(strokes.includes(BLACK), `${id}: sem fio preto`);
    const t = allText(svg);
    assert.match(t, /\+/, `${id}: sem rótulo +`);
    assert.match(t, /−/, `${id}: sem rótulo −`);
  }
});

test('fiação do projeto 4: pontos de cada carregador', () => {
  const t1 = allText(parseXml(read('assets/svg/drawings/p4-tp4056.svg')));
  for (const pad of ['IN+', 'IN−', 'B+', 'B−', 'OUT+', 'OUT−', 'BAT+', 'BAT−']) assert.ok(t1.includes(pad), `p4-tp4056 sem ${pad}`);
  assert.match(t1, /embaixo/i);
  const t2 = allText(parseXml(read('assets/svg/drawings/p4-cn3791-bms.svg')));
  for (const pad of ['IN+', 'IN−', 'B+', 'B−', 'P+', 'P−', 'BAT+', 'BAT−', 'BMS']) assert.ok(t2.includes(pad), `p4-cn3791-bms sem ${pad}`);
  assert.match(t2, /embaixo/i);
});

test('projeto 3: fonte USB 5 V na porta USB-C e antena pelo conector IPEX', () => {
  for (const [id, board] of [['p3-t114', 'Heltec T114'], ['p3-v3', 'Heltec V3']]) {
    const t = allText(parseXml(read(`assets/svg/drawings/${id}.svg`)));
    for (const s of ['Fonte USB 5 V', 'USB-C', 'IPEX', 'SMA', 'prensa-cabo', board]) assert.ok(t.includes(s), `${id} sem "${s}"`);
    assert.doesNotMatch(t, /bateria|BAT\+/i, `${id}: projeto na tomada não tem bateria`);
  }
});

test('projeto 1: aparelho ligado ao celular por Bluetooth, sem fiação', () => {
  const svg = parseXml(read('assets/svg/drawings/p1-aparelho.svg'));
  const t = allText(svg);
  assert.match(t, /Bluetooth/);
  assert.match(t, /celular/i);
  const strokes = [...walk(svg)].map((n) => n.attrs.stroke);
  assert.ok(!strokes.includes(RED), 'p1 não tem fio');
});

test('rótulos genéricos: o desenho não nomeia uma alternativa de slot que não muda a fiação', () => {
  for (const { project, id, path } of drawings) {
    const t = allText(parseXml(read(path)));
    const fixed = new Set(Object.keys(project.drawings.find((d) => d.id === id).match));
    for (const [slot, def] of Object.entries(project.slots)) {
      if (fixed.has(slot)) continue;
      if (def.alternatives.length === 0) continue; // slot de uma peça só: pode nomear
      for (const pid of [def.default, ...def.alternatives]) {
        assert.ok(!t.includes(PARTS[pid].name), `${id}: cita "${PARTS[pid].name}"`);
      }
    }
  }
});

test('toda peça de projeto pronto tem ícone no mesmo padrão', () => {
  for (const id of partIds) {
    const path = `assets/svg/parts/${id}.svg`;
    assert.ok(existsSync(new URL(path, root)), `falta ${path}`);
    const text = read(path);
    for (const re of FORBIDDEN) assert.doesNotMatch(text, re, `${id} contém ${re}`);
    const svg = parseXml(text);
    assert.equal(svg.attrs.viewBox, '0 0 64 64', `${id} viewBox`);
    const title = svg.children.find((n) => n.name === 'title');
    assert.ok(title && title.text.trim(), `${id} sem <title>`);
    for (const n of walk(svg)) assert.ok(!/gradient/i.test(n.name), `${id}: degradê`);
  }
});

// Largura de um WebP (VP8, VP8L ou VP8X), lida do cabeçalho.
function webpWidth(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') return buf.readUInt16LE(26) & 0x3fff;
  if (chunk === 'VP8L') return 1 + (((buf[22] & 0x3f) << 8) | buf[21]);
  if (chunk === 'VP8X') return 1 + buf.readUIntLE(24, 3);
  throw new Error(`chunk WebP desconhecido: ${chunk}`);
}

test('fotos: arquivo WebP local, até 800 px, com crédito e licença', () => {
  for (const [id, p] of Object.entries(PARTS)) {
    if (!p.photo) continue;
    assert.match(p.photo.file, /^assets\/photos\/[a-z0-9-]+\.webp$/, `${id} file`);
    const url = new URL(p.photo.file, root);
    assert.ok(existsSync(url), `${id}: falta ${p.photo.file}`);
    const buf = readFileSync(url);
    assert.ok(webpWidth(buf) <= 800, `${id}: largura > 800`);
    assert.doesNotMatch(buf.toString('latin1'), /EXIF|XMP |exif/, `${id}: metadados`);
    assert.ok(p.photo.credit && p.photo.credit.trim().length > 2, `${id} credit`);
    assert.ok(/^https:\/\/(wiki\.seeedstudio\.com|commons\.wikimedia\.org)\//.test(p.photo.sourceUrl), `${id} sourceUrl`);
    // sourceUrl é a página (wiki da Seeed ou página "File:" do Commons), nunca o arquivo da imagem
    assert.doesNotMatch(p.photo.sourceUrl, /upload\.wikimedia\.org|files\.seeedstudio\.com|media-cdn/i, `${id}: sourceUrl é o arquivo`);
    if (p.photo.sourceUrl.includes('commons.wikimedia.org')) assert.match(p.photo.sourceUrl, /\/wiki\/File:/, `${id}: página do arquivo no Commons`);
    else assert.doesNotMatch(p.photo.sourceUrl, /\.(jpe?g|png|webp|gif)$/i, `${id}: sourceUrl é a página, não o arquivo`);
  }
});
