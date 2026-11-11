// Campos abaixo do desenho: onde vai ficar, sol e bateria, estado + DDD, região própria, potência e Wi-Fi.
// Sempre com <label> visível. Campo digitado aplica no `change` (Enter ou sair do campo), sem roubar o cursor;
// o erro aparece ao lado do campo e o valor errado continua lá para a pessoa corrigir. Nada roda no topo.
import { META } from '../data/meta.js';
import { PROJECTS, LOCATION_LABELS } from '../data/projects.js';
import { txOptions } from '../core/commands.js';
import { el } from './shell.js';
import { numText, ufOptions, dddOptions } from './bench-model.js';
import { noticeIcon } from './audit-panel.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Grupo de botões de opção (radio). `value` pode ser string, boolean ou null. */
function radioGroup({ name, legend, help, options, checked, onPick }) {
  const helpId = help ? `ajuda-${name}` : null;
  const group = el('div', { class: 'opcoes' });
  options.forEach((o, i) => {
    const id = `campo-${name}-${i}`;
    const input = el('input', {
      type: 'radio', name: `bancada-${name}`, id, value: String(o.value), checked: o.value === checked,
      'data-focus-key': `campo:${name}:${String(o.value)}`,
    });
    input.addEventListener('change', () => { if (input.checked) onPick(o.value); });
    group.append(el('label', { class: 'opcao', for: id }, input, el('span', {}, o.label)));
  });
  return el('fieldset', { class: 'campo', 'aria-describedby': helpId ?? false },
    el('legend', { class: 'campo-rotulo' }, legend),
    ...(help ? [el('p', { class: 'campo-ajuda', id: helpId }, help)] : []),
    group);
}

/** Campo digitado (número ou texto): aplica no change e no Enter; erro ao lado, com o valor errado mantido. */
function typedField({ field, label, help, value, error, alert, decimal, act }) {
  const id = `campo-${field}`;
  const helpId = `ajuda-${field}`;
  const errId = `erro-${field}`;
  const input = el('input', {
    id, type: 'text', inputmode: decimal ? 'decimal' : false, autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false',
    class: decimal ? 'campo-entrada campo-numero mono' : 'campo-entrada mono',
    value: error ? error.raw : value,
    'aria-describedby': error ? `${errId} ${helpId}` : helpId,
    'aria-invalid': error ? 'true' : false,
    'data-focus-key': `campo:${field}`,
  });
  const commit = () => act.text(field, input.value);
  input.addEventListener('change', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  });
  const row = el('div', { class: 'campo-linha' }, input);
  if (error) {
    row.append(el('p', { class: 'campo-erro', id: errId, role: alert ? 'alert' : false }, noticeIcon(), el('span', {}, error.message)));
  }
  return el('div', { class: 'campo' },
    el('label', { class: 'campo-rotulo', for: id }, label),
    el('p', { class: 'campo-ajuda', id: helpId }, help),
    row);
}

function locationField(state, act) {
  const project = PROJECTS[state.projectId];
  return radioGroup({
    name: 'location',
    legend: 'Onde vai ficar?',
    help: 'Isso muda o atraso de repetição (txdelay) nos comandos do PDF. Dentro de casa o sinal não passa pelas paredes.',
    options: project.locations.map((l) => ({ value: l, label: cap(LOCATION_LABELS[l] ?? l) })),
    checked: state.location,
    onPick: (v) => act.field('location', v),
  });
}

function energyFields(state, errors, alertField, act) {
  const d = META.defaults;
  const lim = META.limits;
  const range = (f) => `de ${numText(lim[f][0])} a ${numText(lim[f][1])}`;
  const f = (field, label, help) => typedField({
    field, label, help, value: numText(state[field]), error: errors[field], alert: alertField === field, decimal: true, act,
  });
  return el('fieldset', { class: 'campo-grupo' },
    el('legend', { class: 'campo-grupo-titulo' }, 'Sol e bateria'),
    el('p', { class: 'campo-ajuda' }, 'Pode usar vírgula. Se você usar números menos exigentes que o padrão da comunidade, a auditoria mostra no máximo Atenção.'),
    f('daysNoSun', 'Dias sem sol',
      `Quantos dias seguidos de céu fechado o rádio aguenta só com a bateria. Padrão da comunidade: ${numText(d.daysNoSun)} (${range('daysNoSun')}).`),
    f('daysRecharge', 'Dias para recarregar',
      `Em quantos dias de sol a bateria enche de novo depois disso. Padrão da comunidade: ${numText(d.daysRecharge)} (${range('daysRecharge')}).`),
    f('hsp', 'Horas de sol pleno por dia',
      `Horas por dia de sol forte, como se fosse sol a pino. Padrão da comunidade: ${numText(d.hsp)} (${range('hsp')}).`));
}

function regionFields(state, errors, alertField, customOpen, act) {
  const uf = el('select', { id: 'campo-uf', class: 'campo-entrada', 'data-focus-key': 'campo:uf', 'aria-describedby': 'ajuda-regiao' },
    el('option', { value: '' }, 'Escolha o estado'),
    ...ufOptions().map((u) => el('option', { value: u, selected: state.uf === u }, u)));
  uf.addEventListener('change', () => act.field('uf', uf.value || null));

  const ddd = el('select', { id: 'campo-ddd', class: 'campo-entrada', disabled: !state.uf, 'data-focus-key': 'campo:ddd', 'aria-describedby': 'ajuda-regiao' },
    el('option', { value: '' }, state.uf ? 'Escolha o DDD' : 'Escolha antes o estado'),
    ...dddOptions(state.uf).map((x) => el('option', { value: x, selected: state.ddd === x }, x)));
  ddd.addEventListener('change', () => act.field('ddd', ddd.value || null));

  const open = customOpen || state.customRegion != null || Boolean(errors.customRegion);
  const box = el('input', { type: 'checkbox', id: 'campo-outra-regiao', checked: open, 'data-focus-key': 'campo:outraRegiao' });
  box.addEventListener('change', () => act.toggleCustom(box.checked));

  const kids = [
    el('legend', { class: 'campo-grupo-titulo' }, 'Estado e DDD'),
    el('p', { class: 'campo-ajuda', id: 'ajuda-regiao' }, 'Servem para montar o nome da região do rádio (por exemplo br-mg-31), que vai nos comandos do PDF.'),
    el('div', { class: 'campo-par' },
      el('div', { class: 'campo' }, el('label', { class: 'campo-rotulo', for: 'campo-uf' }, 'Estado'), uf),
      el('div', { class: 'campo' }, el('label', { class: 'campo-rotulo', for: 'campo-ddd' }, 'DDD'), ddd)),
    el('div', { class: 'campo campo-marcar' }, el('label', { class: 'opcao', for: 'campo-outra-regiao' }, box, el('span', {}, 'Minha área usa outro nome de região'))),
  ];
  if (open) {
    const prefix = state.uf ? `br-${state.uf.toLowerCase()}-` : 'br-uf-';
    kids.push(typedField({
      field: 'customRegion',
      label: 'Nome da região (opcional)',
      help: `Escreva exatamente como o grupo da sua área usa, começando com ${prefix} (por exemplo ${prefix}valeparaiba). Só letras minúsculas sem acento, números e hífen.`,
      value: state.customRegion ?? '', error: errors.customRegion, alert: alertField === 'customRegion', decimal: false, act,
    }));
  }
  return el('fieldset', { class: 'campo-grupo' }, ...kids);
}

function txField(state, act) {
  const sel = el('select', { id: 'campo-txDbm', class: 'campo-entrada mono', 'data-focus-key': 'campo:txDbm', 'aria-describedby': 'ajuda-txDbm' },
    ...txOptions(state).map((n) => el('option', { value: String(n), selected: state.txDbm === n }, String(n))));
  sel.addEventListener('change', () => act.field('txDbm', Number(sel.value)));
  return el('div', { class: 'campo' },
    el('label', { class: 'campo-rotulo', for: 'campo-txDbm' }, 'Potência (número do set tx)'),
    el('p', { class: 'campo-ajuda', id: 'ajuda-txDbm' }, 'Esta placa tem amplificador: o número do set tx não é a potência real. Veja o item da auditoria.'),
    sel);
}

function wifiField(state, act) {
  return radioGroup({
    name: 'hasWifi',
    legend: 'Tem Wi-Fi no local?',
    help: 'O observer manda o que ouve pela internet: precisa de Wi-Fi onde ele vai ficar.',
    options: [{ value: true, label: 'Sim' }, { value: false, label: 'Não' }, { value: null, label: 'Ainda não sei' }],
    checked: state.hasWifi,
    onPick: (v) => act.field('hasWifi', v),
  });
}

/**
 * Campos do projeto atual.
 * @param {{state:object, vis:object, errors:Record<string,{raw:string,message:string}>, alertField:string|null,
 *   customOpen:boolean, act:object}} opts
 */
export function renderFields({ state, vis, errors, alertField, customOpen, act }) {
  const blocks = [];
  if (vis.location) blocks.push(locationField(state, act));
  if (vis.energy) blocks.push(energyFields(state, errors, alertField, act));
  if (vis.region) blocks.push(regionFields(state, errors, alertField, customOpen, act));
  if (vis.tx) blocks.push(txField(state, act));
  if (vis.wifi) blocks.push(wifiField(state, act));
  return el('section', { class: 'campos', 'aria-labelledby': 'titulo-campos' },
    el('h3', { class: 'campos-titulo', id: 'titulo-campos' }, 'Onde e como vai funcionar'),
    ...blocks);
}
