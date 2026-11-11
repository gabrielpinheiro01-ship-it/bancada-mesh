# Bibliotecas de terceiros (vendorizadas)

Nada aqui é carregado de uma CDN: o site serve estes arquivos por conta própria.

## pdfmake

- Arquivo: `vendor/pdfmake/pdfmake.min.js` (e a licença em `vendor/pdfmake/LICENSE`).
- Origem: pacote `pdfmake@0.2.23` do registro npm (https://www.npmjs.com/package/pdfmake), arquivo `build/pdfmake.min.js`, copiado sem alteração.
- Versão: 0.2.23 (a última da série 0.2.x na data da cópia).
- Data da cópia: 11/11/2026.
- Licença: MIT (copyright de bpampuch e liborm85). Texto completo em `vendor/pdfmake/LICENSE`.
- sha256 de `pdfmake.min.js`: `4410187c36ed6dd8cbfbaeea5b6fab6244238b3479c6de1cfe125d2c61fc2ba0`
- Uso: carregado sob demanda por `src/ui/pdf-step.js` (um `<script src>` criado por JavaScript, permitido pela política `script-src 'self'`). As fontes do PDF (Atkinson Hyperlegible e JetBrains Mono, em `assets/fonts/`) são lidas por `fetch` e entregues ao pdfmake em memória. Nada é enviado para fora do navegador.
- Para conferir: `sha256sum vendor/pdfmake/pdfmake.min.js`.
