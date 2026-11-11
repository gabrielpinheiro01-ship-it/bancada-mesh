// Comandos do repetidor e passos do companion. Vão para o PDF digitado no console do rádio:
// qualquer caractere errado isola o nó da rede. Nada aqui inventa valor: tudo vem da skill.
import { PARTS } from '../data/parts.js';
import { regionDef } from './region.js';

const TXDELAY = Object.freeze({ telhado: '0.5', predio: '1.0', pico: '2.0', dentro: '0.5', movel: '0.5' });

/**
 * txdelay por local, sempre string com uma casa. Local nulo/desconhecido -> 0.5.
 * Fonte: padroes-comunidade-br.md §3 e SKILL.md "Checklist de repetidor" (0.5 / 1.0 / 2.0).
 */
export function txdelayFor(location) {
  return Object.hasOwn(TXDELAY, location) ? TXDELAY[location] : '0.5';
}

/**
 * Comandos do repetidor, um por linha, na ordem do checklist. Sem `set advert.interval 0`
 * (CFG-05 do spec): no lugar, `get advert.interval` no fim.
 * Fonte: SKILL.md "Checklist de repetidor (padrão BR)"; padroes-comunidade-br.md §2.
 * @returns {string[]}
 */
export function repeaterCommands(state) {
  return [
    'set radio 923.125,62.5,8,8',
    `set tx ${state.txDbm}`,
    'set name ________',
    'password ________',
    'set lat ________',
    'set lon ________',
    'set flood.advert.interval 23',
    `set txdelay ${txdelayFor(state.location)}`,
    'set rxdelay 3',
    'set loop.detect moderate',
    'set multi.acks 1',
    'set agc.reset.interval 300',
    'set radio.rxgain on',
    'get radio.rxgain',
    'set path.hash.mode 1',
    regionDef(state.uf, state.ddd, state.customRegion),
    'region save',
    'get advert.interval',
  ];
}

/**
 * Passos do app MeshCore (companion), em linguagem simples.
 * Fonte: SKILL.md "Checklist de companion"; spec §8.1 CFG-01 e CFG-03; padroes-comunidade-br.md §4
 * (âmbito do canal: começar pelo menor, br-UF-DDD).
 * @returns {string[]}
 */
export function companionSteps(state) {
  const scope = regionDef(state.uf, state.ddd, state.customRegion).split(' ').pop();
  return [
    'Ligue o rádio só com a antena já conectada. Sem antena, o rádio pode se danificar.',
    'Abra o app MeshCore e toque na engrenagem (Configurações).',
    'Em Informação Pública, escreva o nome do rádio e a posição aproximada (não use o endereço exato da sua casa).',
    'Em Definições de Rádio, escolha o preset "Australia: SA, WA". Se o seu app tiver o preset "Brazil", pode usar esse.',
    'Não use "Australia" sozinho nem "Australia (Narrow)": são frequências diferentes e você não vai ouvir ninguém.',
    'Confira os números, dígito a dígito: frequência 923.125, largura 62.5, SF 8, CR 8 e potência 22.',
    'Em Definições Experimentais, ponha o hash de caminho em 2 bytes.',
    'Toque no visto para salvar.',
    'Toque em Send Advert para o rádio se apresentar à rede.',
    'Mande "olá" no canal Public e veja se alguém responde.',
    `Âmbito sugerido para o canal: ${scope}. Comece pelo menor e confira a grafia exata com o grupo da sua região.`,
  ];
}

/**
 * Potências de TX que a placa aceita, em ordem decrescente, nunca acima de 22.
 * Sem PA: [22]. Com PA: chaves de pa.outDbm <= 22. Fonte: SKILL.md (set tx 22; atenção a placas com PA)
 * e hardware-energia.md (tabela PA). `parts` existe para teste com peça sintética.
 */
export function txOptions(state, parts = PARTS) {
  const board = parts[state.parts.placa ?? state.parts.aparelho];
  // Peças reais guardam o PA em `attrs.pa`; o objeto direto (`pa`) é aceito para peça sintética de teste.
  const out = (board?.attrs?.pa ?? board?.pa)?.outDbm;
  if (!out) return [22];
  const list = Object.keys(out).map(Number).filter((n) => Number.isFinite(n) && n <= 22);
  return list.length ? list.sort((a, b) => b - a) : [22];
}
