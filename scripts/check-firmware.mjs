// Compara a última versão do firmware MeshCore com a versão de referência do site (META.firmware).
// Uso: node scripts/check-firmware.mjs v1.19.0  ->  imprime "review=true" ou "review=false".
import { pathToFileURL } from 'node:url';
import { META } from '../src/data/meta.js';

/** Converte "v1.2.3" ou "1.2.3" em [1, 2, 3]. Lança erro se não for versão semântica. */
function parseVersion(text) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(text));
  if (!match) throw new Error(`Versão inválida: "${text}" (esperado major.minor.patch)`);
  return match.slice(1).map(Number);
}

/**
 * true se a tag mais nova do firmware é maior que a versão de referência do site.
 * @param {string} latestTag  ex.: 'v1.19.0'
 * @param {string} metaFirmware  ex.: '1.18.0'
 * @returns {boolean}
 */
export function needsReview(latestTag, metaFirmware) {
  const latest = parseVersion(latestTag);
  const reference = parseVersion(metaFirmware);
  for (let i = 0; i < 3; i += 1) {
    if (latest[i] !== reference[i]) return latest[i] > reference[i];
  }
  return false;
}

// Executado direto (node scripts/check-firmware.mjs <tag>), e não importado pelos testes.
const isMain = process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  try {
    const tag = process.argv[2];
    if (!tag) throw new Error('Informe a tag do firmware como argumento.');
    const review = needsReview(tag, META.firmware);
    console.log(`review=${review}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
