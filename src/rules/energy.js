// Regras de energia EN-01…EN-13 (spec §8.2). EN-09 e EN-14 são instruções do PDF; EN-15 fica fora da v1
// (ver docs/pendencias.md). Princípio: na dúvida, Atenção (o pior erro é o falso OK).
import { META } from '../data/meta.js';
import { PARTS } from '../data/parts.js';
import { formatBR } from '../core/numbers.js';

const CALC_SRC = 'meshcore-hubreal/references/hardware-energia.md, seção "Dimensionamento bateria + painel (método Mesh Sorocaba)"; ' +
  'https://www.meshsorocaba.org/ferramentas/calculadora-bateria-e-placa-solar';
const FAKE_SRC = 'meshcore-hubreal/references/hardware-energia.md, seção "Armadilhas físicas" (18650 "6800/9900 mAh" é falsa); ' +
  'calculadora da Mesh Sorocaba https://www.meshsorocaba.org/ferramentas/calculadora-bateria-e-placa-solar';
const PROT_SRC = 'meshcore-hubreal/references/hardware-energia.md, seção "Proteção de bateria (nRF52)"; ' +
  'https://github.com/meshcore-dev/MeshCore (issues 1572 e 1629; PR 2377, firmware 1.18.0)';
const CARGA_SRC = 'meshcore-hubreal/references/hardware-energia.md, seção "Armadilhas físicas" (TP4056 com DW01; CN3791 sem proteção de descarga; ' +
  'painel direto no USB do XIAO); ' + 'https://github.com/meshcore-dev/MeshCore (issues 1572 e 1629)';
const LDO_SRC = 'meshcore-hubreal/references/hardware-energia.md, seção "Diagrama Solar-Powered Chat Network (Iffy Books)"; ' +
  'datasheet do MCP1700 (250 mA); https://github.com/meshcore-dev/MeshCore';

const META_RULE = { checkedAt: META.rulesCheckedAt, firmware: META.firmware };
const WORD = { bad: 'Problema', warn: 'Atenção', ok: 'OK' };
const f1 = (n) => formatBR(n, 1);
const fn = (n) => (Number.isInteger(n) ? formatBR(n, 0) : formatBR(n, 1));
const f0 = (n) => formatBR(Math.round(n), 0);
const D = META.defaults;
const DEFAULTS_TEXT = `${formatBR(D.daysNoSun, 0)} dias sem sol, ${formatBR(D.daysRecharge, 0)} dias para recarregar, ${formatBR(D.hsp, 1)} horas de sol`;

function item(rule, ctx, level, slot, title, why, fix) {
  const out = { id: rule.id, level, slot, title, why, source: rule.source };
  if (fix) out.fix = fix;
  return out;
}

const optionsOf = (ctx, slot) => {
  const def = ctx.project?.slots?.[slot];
  return def ? [def.default, ...def.alternatives] : [];
};
const attrsOf = (id) => PARTS[id]?.attrs ?? {};
const nameOf = (id) => PARTS[id]?.name ?? id;
const currentOfAttrs = (a) => a.currentMa + (a.gps ? META.gpsExtraMa : 0);
const mahOf = (a) => a.cells * a.mahPerCell;
const autonomyOf = (mah, ma) => (mah * META.usefulFraction) / (ma * 24);

function autonomyLevel(autonomy, N) {
  if (autonomy >= N) return 'ok';
  if (autonomy >= 0.6 * N) return 'warn';
  return 'bad';
}
function panelLevel(r, panelW) {
  if (!r.coversDay) return 'bad';
  if (panelW < r.Pmin) return 'warn';
  if (panelW < r.Prec) return 'warn';
  return 'ok';
}

const isFakeBattery = (b) => !b.branded && b.mahPerCell > 3500;
const hasBatteryPower = (ctx) => ctx.project?.power === 'battery' || ctx.project?.power === 'solar';

/**
 * Teto de Atenção: item calculado que seria OK vira Atenção quando os números digitados são menos
 * conservadores que os padrões da comunidade, ou quando a placa tem amplificador (consumo incerto).
 */
function ceiling(ctx, it, defaultsText) {
  if (it.level !== 'ok') return it;
  let { level, why } = it;
  if (ctx.lessConservative) {
    level = 'warn';
    why += ` Com os valores padrão da comunidade (${DEFAULTS_TEXT}) daria ${defaultsText}.`;
  }
  if (ctx.parts.placa?.pa) {
    level = 'warn';
    why += ' Esta placa tem amplificador (PA) e gasta mais ao transmitir: meça o seu consumo antes de confiar na conta.';
  }
  return { ...it, level, why };
}

// ---------- correções genéricas (sempre do próprio projeto) ----------

function batteryFix(ctx, N, baselineMah) {
  const ma = ctx.energy.currentMa;
  const cands = optionsOf(ctx, 'bateria')
    .map((id) => ({ id, a: attrsOf(id) }))
    .filter((c) => c.a.branded && !isFakeBattery(c.a));
  const enough = cands
    .filter((c) => autonomyOf(mahOf(c.a), ma) >= N)
    .sort((x, y) => mahOf(x.a) - mahOf(y.a));
  // Se a peça padrão do slot já atende, ela é a correção (o leigo volta ao que o projeto recomenda).
  let pick = enough.find((c) => c.id === ctx.project.slots.bateria.default) ?? enough[0];
  if (!pick) {
    const biggest = [...cands].sort((x, y) => mahOf(y.a) - mahOf(x.a))[0];
    if (biggest && mahOf(biggest.a) > baselineMah) pick = biggest;
  }
  return pick ? { label: `Trocar por ${nameOf(pick.id)}`, slot: 'bateria', partId: pick.id } : undefined;
}

function boardSwapFix(ctx, N) {
  const mah = ctx.energy.batteryMah;
  const pick = optionsOf(ctx, 'placa')
    .map((id) => ({ id, a: attrsOf(id) }))
    .find((c) => c.a.mcu === 'nrf52' && c.a.supported && c.a.hasLoRa && autonomyOf(mah, currentOfAttrs(c.a)) >= N);
  return pick ? { label: `Trocar a placa por ${nameOf(pick.id)}`, slot: 'placa', partId: pick.id } : undefined;
}

function panelFix(ctx, needW) {
  const pick = optionsOf(ctx, 'painel')
    .map((id) => ({ id, a: attrsOf(id) }))
    .filter((c) => c.a.volts === META.panelVolts && c.a.watts >= needW)
    .sort((x, y) => x.a.watts - y.a.watts)[0];
  return pick ? { label: `Trocar por ${nameOf(pick.id)}`, slot: 'painel', partId: pick.id } : undefined;
}

function chargerFix(ctx, wantMppt) {
  const pick = optionsOf(ctx, 'carregador')
    .map((id) => ({ id, a: attrsOf(id) }))
    .find((c) => c.a.dischargeProtection && !c.a.directUsb && (!wantMppt || c.a.mppt));
  return pick ? { label: `Trocar por ${nameOf(pick.id)}`, slot: 'carregador', partId: pick.id } : undefined;
}

// ---------- regras de bateria / autonomia ----------

const EN01 = {
  id: 'EN-01', source: FAKE_SRC, ...META_RULE,
  evaluate(ctx) {
    const b = ctx.parts.bateria;
    if (!b || !hasBatteryPower(ctx) || !isFakeBattery(b)) return null;
    const fix = ctx.energy ? batteryFix(ctx, ctx.state.daysNoSun, 0) : undefined;
    return item(this, ctx, 'bad', 'bateria',
      `Capacidade de ${formatBR(b.mahPerCell, 0)} mAh por bateria não existe`,
      `Uma bateria 18650 de verdade tem no máximo uns ${formatBR(3500, 0)} mAh; a de "${formatBR(b.mahPerCell, 0)} mAh" é propaganda falsa, então a conta de autonomia não é confiável e não foi feita. ` +
      'Use bateria de marca conhecida (Samsung 35E, LG MJ1, Molicel).', fix);
  },
};

function autonomyRule(id, own) {
  return {
    id, source: CALC_SRC, ...META_RULE,
    evaluate(ctx) {
      const e = ctx.energy;
      const b = ctx.parts.bateria;
      if (!e || e.autonomyDays == null || !b || isFakeBattery(b)) return null;
      const N = ctx.state.daysNoSun;
      const level = autonomyLevel(e.autonomyDays, N);
      if (level !== own) return null;
      const detail = `Com consumo de ${fn(e.currentMa)} mA e bateria de ${f0(e.batteryMah)} mAh, a conta dá cerca de ${f1(e.autonomyDays)} dias sem sol (você pediu ${fn(N)}).`;
      if (level === 'ok') {
        const atDef = autonomyLevel(e.atDefaults.autonomyDays, D.daysNoSun);
        const defText = `${WORD[atDef]} (para ${formatBR(D.daysNoSun, 0)} dias sem sol a bateria precisaria de cerca de ${f0(e.atDefaults.Cnec)} mAh e a sua tem ${f0(e.batteryMah)} mAh)`;
        return ceiling(ctx, item(this, ctx, 'ok', 'bateria', `Aguenta ~${f1(e.autonomyDays)} dias sem sol`,
          `${detail} É uma estimativa: meça o consumo real da sua placa antes de confiar.`), defText);
      }
      let fix;
      if (level === 'warn') {
        const swap = ctx.parts.placa?.mcu === 'esp32' ? boardSwapFix(ctx, N) : undefined;
        fix = swap ?? batteryFix(ctx, N, e.batteryMah);
        return item(this, ctx, 'warn', 'bateria', `Bateria no limite: ~${f1(e.autonomyDays)} dias sem sol`,
          `${detail} Fica abaixo do que você precisa; é melhor pôr mais uma bateria em paralelo (as duas precisam estar com a mesma tensão, com diferença de até 0,05 V).`, fix);
      }
      const swap = ctx.parts.placa?.mcu === 'esp32' ? boardSwapFix(ctx, N) : undefined;
      fix = swap ?? batteryFix(ctx, N, e.batteryMah);
      const why = ctx.parts.placa?.mcu === 'esp32'
        ? `${detail} Falta bateria: placa ESP32 gasta de 4 a 8 vezes mais que a nRF52840, e por isso a bateria acaba rápido. A placa nRF52840 resolve com a mesma bateria.`
        : `${detail} Falta bateria para passar os dias sem sol.`;
      return item(this, ctx, 'bad', 'bateria', `Falta bateria: só ~${f1(e.autonomyDays)} dias sem sol`, why, fix);
    },
  };
}

// ---------- regras de painel ----------

function panelRule(id, own) {
  return {
    id, source: CALC_SRC, ...META_RULE,
    evaluate(ctx) {
      const e = ctx.energy;
      if (!e || !ctx.parts.painel) return null;
      const level = panelLevel(e, e.panelW);
      const kind = !e.coversDay ? 'EN-05' : e.panelW < e.Pmin ? 'EN-06' : e.panelW < e.Prec ? 'EN-07' : 'EN-08';
      if (kind !== id) return null;
      const w = `${fn(e.panelW)} W`;
      const nums = `Para ${fn(ctx.state.daysNoSun)} dias sem sol, o mínimo é ${formatBR(e.Pmin, 2)} W e o recomendado é ${formatBR(e.Prec, 2)} W.`;
      if (id === 'EN-08') {
        const atDef = panelLevel(e.atDefaults, e.panelW);
        const defText = `${WORD[atDef]} (o painel mínimo seria ${formatBR(e.atDefaults.Pmin, 2)} W e o recomendado ${formatBR(e.atDefaults.Prec, 2)} W)`;
        return ceiling(ctx, item(this, ctx, 'ok', 'painel', 'Painel dá conta',
          `O painel de ${w} atende a conta. ${nums}`), defText);
      }
      const fix = panelFix(ctx, e.Prec);
      if (id === 'EN-05') {
        return item(this, ctx, level, 'painel', 'Painel fraco demais',
          `O painel de ${w} não repõe nem o que a placa gasta em um dia de sol. A bateria só vai descarregar. ${nums}`, fix);
      }
      if (id === 'EN-06') {
        return item(this, ctx, level, 'painel', 'Painel recarrega devagar',
          `O painel de ${w} cobre o dia de sol, mas fica abaixo do mínimo. Depois de dias nublados, a bateria demora para voltar. ${nums}`, fix);
      }
      return item(this, ctx, level, 'painel', 'Painel sem margem',
        `O painel de ${w} passa do mínimo, mas fica sem a margem de segurança de 20 a 30 %. ${nums}`, fix);
    },
  };
}

// ---------- regras de proteção da bateria ----------

function isProtected(ctx) {
  return Boolean(ctx.parts.carregador?.dischargeProtection || ctx.parts.bateria?.protectedCells);
}
const skipsProtection = (ctx) => !hasBatteryPower(ctx) || ctx.parts.placa?.bootlock === true || ctx.parts.carregador?.directUsb === true;

const EN10 = {
  id: 'EN-10', source: PROT_SRC, ...META_RULE,
  evaluate(ctx) {
    if (skipsProtection(ctx) || isProtected(ctx) || ctx.parts.carregador?.mppt) return null;
    return item(this, ctx, 'bad', 'carregador', 'Bateria sem proteção de descarga',
      'Sem BMS (placa que protege a bateria), sem DW01 e sem células protegidas, a bateria pode descarregar até o fim. ' +
      'Desde o firmware 1.18 a maioria das placas nRF52 e todas as ESP32 não se desligam sozinhas com bateria fraca: a placa pode travar e não voltar.',
      chargerFix(ctx, false));
  },
};

const EN11 = {
  id: 'EN-11', source: PROT_SRC, ...META_RULE,
  evaluate(ctx) {
    if (skipsProtection(ctx) || !ctx.parts.carregador?.mppt) return null;
    if (isProtected(ctx)) {
      return item(this, ctx, 'ok', 'carregador', 'Carregador solar CN3791 com proteção',
        'O CN3791 é um bom carregador solar, mas não protege a descarga sozinho; aqui a bateria tem BMS (placa que protege a bateria), então está certo.');
    }
    return item(this, ctx, 'bad', 'carregador', 'CN3791 sem BMS: falta a proteção da bateria',
      'O CN3791 é um bom carregador solar, mas ele não protege a bateria contra descarga total. Falta acrescentar um BMS 1S (placa que protege a bateria) ou usar células protegidas. ' +
      'Sem isso, a placa pode travar com bateria fraca e não voltar.',
      chargerFix(ctx, true));
  },
};

const EN12 = {
  id: 'EN-12', source: CARGA_SRC, ...META_RULE,
  evaluate(ctx) {
    if (!ctx.parts.carregador?.directUsb) return null;
    return item(this, ctx, 'bad', 'carregador', 'Painel ligado direto na USB da placa',
      'Um painel de "6 V" passa de 7 V quando está sem carga, e o carregador interno da placa é fraco: pode queimar a placa ou carregar mal. ' +
      'Ligue o painel num carregador próprio (com proteção da bateria).',
      chargerFix(ctx, false));
  },
};

const EN13 = {
  id: 'EN-13', source: LDO_SRC, ...META_RULE,
  evaluate(ctx) {
    if (ctx.parts.placa?.mcu !== 'esp32') return null;
    const slot = Object.keys(ctx.parts).find((s) => s !== 'placa' && ctx.parts[s]?.ldoMaxMa != null && ctx.parts[s].ldoMaxMa <= 250);
    if (!slot) return null;
    return item(this, ctx, 'warn', slot, 'Regulador de 250 mA pode reiniciar a placa',
      'Um regulador de tensão (LDO) de 250 mA, como o MCP1700, alimenta pouco para uma placa ESP32 transmitindo forte: ela pode reiniciar no pico de transmissão. ' +
      'Além disso, ligada assim a bateria fica invisível para o firmware e a telemetria da bateria sai errada. Use um regulador de 500 mA ou mais.');
  },
};

export const ENERGY_RULES = [
  EN01,
  autonomyRule('EN-02', 'ok'),
  autonomyRule('EN-03', 'warn'),
  autonomyRule('EN-04', 'bad'),
  panelRule('EN-05'),
  panelRule('EN-06'),
  panelRule('EN-07'),
  panelRule('EN-08'),
  EN10,
  EN11,
  EN12,
  EN13,
];
