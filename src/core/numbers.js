// Números em pt-BR: entrada tolerante (vírgula ou ponto) e saída com vírgula.
// Sem DOM e sem depender do ICU do Node: a formatação é feita à mão.

const DECIMAL_RE = /^[+-]?(\d+([.,]\d+)?|[.,]\d+)$/;

/**
 * Lê um número digitado. Aceita "4,2" e "4.2", espaços nas pontas e sinal opcional.
 * Qualquer outra coisa (vazio, texto, "4,2,1", "1e3", "Infinity") devolve null.
 * @param {string} text
 * @returns {number|null}
 */
export function parseNumberBR(text) {
  if (typeof text !== 'string') return null;
  const s = text.trim();
  if (!DECIMAL_RE.test(s)) return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Formata com vírgula decimal e sem separador de milhar: 19.833 -> "19,8".
 * @param {number} n
 * @param {number} decimals
 * @returns {string}
 */
export function formatBR(n, decimals) {
  if (!Number.isFinite(n)) throw new TypeError('formatBR: número finito esperado');
  return n.toFixed(decimals).replace('.', ',');
}
