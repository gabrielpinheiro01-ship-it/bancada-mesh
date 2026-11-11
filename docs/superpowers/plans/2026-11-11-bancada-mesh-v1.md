# Bancada Mesh v1 — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar o site estático Bancada Mesh: ① projeto pronto → ② bancada com auditoria ao vivo → ③ PDF, com
regras fixas tiradas da skill `meshcore-hubreal`.

**Architecture:** Núcleo puro em JavaScript (ES modules, sem DOM): dados de peças e projetos, cálculo de energia,
regras de auditoria, comandos e montagem do documento do PDF. Tudo isso é testado em Node. A interface é HTML/CSS/JS
sem etapa de build, servida pelo GitHub Pages, e só monta telas a partir do núcleo. O PDF é gerado no navegador
com pdfmake a partir de uma definição pura, que também é testada.

**Tech Stack:** HTML + CSS + JS (ES modules nativos, sem bundler) · Node ≥ 20 com `node:test` e `node:assert/strict`
(sem dependências de teste) · pdfmake 0.2.x vendorizado (MIT) · fontes Atkinson Hyperlegible e JetBrains Mono (OFL),
servidas pelo próprio site · GitHub Actions (testes, deploy no Pages, aviso de firmware novo).

**Spec:** `docs/superpowers/specs/2026-11-11-bancada-mesh-design.md` (aprovado em 11/11/2026). Esboço visual
descartável: `docs/superpowers/specs/esboco-bancada-mesh.html`. Base de conhecimento:
a skill privada `meshcore-hubreal` do mantenedor (fonte de toda regra; citar o arquivo em cada regra).

## Global Constraints

- Site estático no GitHub Pages, numa organização própria do GitHub (não na conta pessoal). Sem servidor, **sem IA**, sem custo por visita.
- Nenhum dado digitado sai do navegador. Sem cookies, sem rastreamento de terceiros, sem `localStorage`/`sessionStorage`. "Fechou a página, começa de novo."
- Fontes servidas pelo próprio site (nada de Google Fonts em produção).
- Celular de 375 px com toque; contraste ≥ 4,5:1; problema **nunca** indicado só pela cor (ícone + texto + contorno tracejado); teclado funciona em tudo, inclusive nas peças do desenho; respeitar `prefers-reduced-motion`; animações de 150–300 ms.
- Cores: azul-tinta `#1E3A8A` (botões/seleção/links), tinta `#0F172A`, texto secundário `#475569`, papel `#F5F6F8`, linha `#D5DBE3`, OK `#15803D`/`#E8F5EC`, Atenção `#A35400`/`#FDF1DF`, Problema `#B91C1C`/`#FDECEC`, placa `#2B3440`, cobre `#B9822F`. Verde/laranja/vermelho **só** no resultado da auditoria (exceção: fio vermelho/preto = +/−). Tema claro apenas.
- Letras: Atkinson Hyperlegible (texto e títulos); JetBrains Mono (números, comandos, valores).
- Nome **Bancada Mesh**; subtítulo *"monte seu rádio MeshCore sem errar"*; rodapé: "Projeto comunitário e independente. Não é oficial do MeshCore nem do MeshCore Brasil."
- Português do Brasil apenas.
- **Sem parte legal/ANATEL**: nunca afirmar que algo é legal ou ilegal. Sem links de loja; preço só como faixa com data e fonte.
- Fotos só da wiki da Seeed (CC BY-SA 4.0) e do Wikimedia Commons, com crédito; nunca de loja ou fabricante (Heltec, RAK…). Textos em palavras próprias; Mesh Sorocaba só resumo + link.
- Toda regra tem fonte (arquivo da skill + link original), data de conferência e firmware de referência. Regra sem fonte não entra.
- O pior erro é o **falso OK**: na dúvida, Atenção.
- Padrão BR fixo: `set radio 923.125,62.5,8,8`; preset do app "Australia: SA, WA"; `set tx 22`; hash 2 bytes (`set path.hash.mode 1`).
- Licenças: código MIT; textos e ilustrações próprios CC BY-SA 4.0; fotos de terceiros com a licença original.

## Execução sem o usuário (decidido em 11/11/2026)

O usuário mandou executar este plano numa sessão nova, enquanto não está disponível. Ficou assim:
- **Pode fazer sem perguntar:** `git init` nesta pasta e commits locais; baixar o pdfmake 0.2.x (registro npm ou
  GitHub oficial) e as fontes Atkinson Hyperlegible e JetBrains Mono (repositórios oficiais/Google Fonts), sempre
  registrando origem, versão e licença em `vendor/README.md` e `assets/fonts/README.md`; buscar fotos livres na
  wiki da Seeed e no Wikimedia Commons; ler as páginas públicas citadas na Task 8.
- **Não pode fazer:** `git push`, criar organização/repositório no GitHub, criar o formulário, publicar o site,
  qualquer ação externa ou gasto. Esses passos ficam numa lista **"Pendências do usuário"** no fim do relatório.
- **Não bloqueia:** onde o plano diz "perguntar ao usuário", siga com a opção mais conservadora, registre a
  decisão e acrescente o item à lista de pendências. A medição do RAK de 1 W (R3) fica aberta, e o projeto 6
  continua "em breve".

## Review Focus

1. **Número digitado em português** ("4,2", "", "-3", "abc") nos campos de dias e horas de sol: deve aceitar vírgula, recusar lixo com mensagem ao lado do campo e nunca levar `NaN` para a conta. → teste em Task 3.
2. **Trocar de projeto no meio, ou usar voltar/avançar do navegador**: o estado do projeto anterior não pode vazar (peça de um projeto em outro); `#/pdf` sem projeto montado volta para `#/`. → testes em Task 3 e Task 10.
3. **Link direto para projeto "em breve" ou inexistente** (`#/bancada/6`, `#/bancada/99`): mostra aviso com volta ao passo 1, sem quebrar. → teste em Task 10.
4. **Gerar o PDF sem estado/DDD preenchidos**: o PDF sai, com a região em branco para preencher e a Atenção de região na capa. → testes em Task 4 e Task 14.
5. **Celular pequeno com texto ampliado a 200 %**: abas da bancada usáveis, sem rolagem horizontal; no iPhone, o PDF abre no visualizador. → verificação manual em Task 13 e Task 17.

---

## Estrutura de arquivos

```
index.html                     casca da página, carrega src/ui/app.js
styles/tokens.css              variáveis de cor, fonte, espaço (fonte única dos tokens)
styles/app.css                 layout, componentes, bancada, impressão
assets/fonts/                  woff2 (web) + ttf (PDF), com OFL.txt
assets/svg/parts/<partId>.svg  ícone pequeno de cada peça
assets/svg/drawings/<id>.svg   desenho de montagem por projeto/variante de fiação
assets/photos/                 fotos livres (crédito em src/data/parts.js)
vendor/pdfmake/                pdfmake.min.js 0.2.x + LICENSE
src/data/meta.js               versão das regras, firmware, padrões, limites, links
src/data/parts.js              catálogo de peças (atributos, preço, foto)
src/data/projects.js           os 7 projetos (slots, padrões, alternativas, desenhos, status)
src/data/ddd.js                DDDs por UF
src/core/numbers.js            parseNumberBR, formatBR
src/core/energy.js             calcEnergy
src/core/state.js              createState, swapPart, setField, applyFix
src/core/region.js             regionDef, validateCustomRegion
src/core/commands.js           repeaterCommands, companionSteps
src/core/audit.js              runAudit, summarize
src/core/drawing.js            drawingFor, markSvg
src/core/pdfdoc.js             buildPdfDoc
src/core/suggest.js            suggestLinks
src/rules/energy.js            EN-01…EN-14
src/rules/hardware.js          HW-01…HW-15
src/rules/install.js           IN-01…IN-07
src/rules/config.js            CFG-02, CFG-04 (itens de auditoria; o resto vira comando)
src/content/*.js               textos do PDF e da bancada (gravação, passo a passo, instalação, depois de ligar)
src/ui/*.js                    router, telas dos 3 passos, bancada, PDF
scripts/check-firmware.mjs     compara release do MeshCore com meta.firmware
tests/*.test.js                testes node:test
.github/workflows/pages.yml    testes + deploy
.github/workflows/firmware-watch.yml
.github/ISSUE_TEMPLATE/sugestao.yml
CONTRIBUTING.md                como sugerir + checklist de manutenção
LICENSE (MIT) · LICENSE-CONTENT (CC BY-SA 4.0) · README.md
```

## Tipos compartilhados (JSDoc, em `src/core/types.js`)

```js
/** @typedef {'bad'|'warn'|'ok'} Level */
/** @typedef {{id:string, level:Level, slot:string, title:string, why:string,
 *   fix?:{label:string, slot:string, partId:string}, source:string}} AuditItem */
/** @typedef {{projectId:number, parts:Record<string,string>, location:string|null,
 *   uf:string|null, ddd:string|null, customRegion:string|null,
 *   daysNoSun:number, daysRecharge:number, hsp:number, txDbm:number, hasWifi:boolean|null}} State */
/** @typedef {{id:string, source:string, checkedAt:string, firmware:string,
 *   evaluate:(ctx:RuleCtx)=>AuditItem|AuditItem[]|null}} Rule */
/** @typedef {{state:State, project:object, parts:Record<string,object>, energy:object|null,
 *   lessConservative:boolean}} RuleCtx */
```

---

## Fase 0 — Base

### Task 1: Repositório, esqueleto e sensores

**Files:**
- Create: `package.json`, `.gitignore` (já existe: acrescentar `node_modules/`), `README.md`, `LICENSE`, `LICENSE-CONTENT`, `src/core/types.js`, `tests/smoke.test.js`

**Interfaces:**
- Produces: `npm test` = `node --test tests/`; `"type": "module"`; servidor local `python -m http.server 8000`.

- [ ] **Step 1:** `git init` (autorizado, ver "Execução sem o usuário") e primeiro commit só do que já existe em `docs/` e `.gitignore`. Os arquivos `diagramas-meshcore-preview.html` e `repeater-solar-meshcore-xiao-nrf52840.md` da raiz vieram de outra sessão: **não** commitar; mover para `docs/referencia/` e anotar nas pendências se o usuário quer mantê-los.
- [ ] **Step 2: Write the failing test** `tests/smoke.test.js`: `test('tipos carregam', async () => { const m = await import('../src/core/types.js'); assert.ok(m); })`
- [ ] **Step 3:** Run `npm test` → Expected: FAIL (arquivo não existe).
- [ ] **Step 4:** Criar `package.json` (`"type":"module"`, `"scripts":{"test":"node --test tests/"}`, `"engines":{"node":">=20"}`, sem dependências), `src/core/types.js` (só os typedefs acima + `export {}`), README (o que é, como rodar, link para o spec), LICENSE MIT, LICENSE-CONTENT CC BY-SA 4.0.
- [ ] **Step 5:** Run `npm test` → Expected: PASS.
- [ ] **Step 6:** Commit `chore: esqueleto do Bancada Mesh e sensores`.

---

## Fase 1 — Núcleo (puro, testado)

### Task 2: Números, metadados e cálculo de energia

**Files:**
- Create: `src/core/numbers.js`, `src/data/meta.js`, `src/core/energy.js`
- Test: `tests/numbers.test.js`, `tests/energy.test.js`

**Interfaces:**
- Produces:
  - `parseNumberBR(text: string) -> number|null` (aceita "4,2" e "4.2"; vazio/lixo → `null`)
  - `formatBR(n: number, decimals: number) -> string` ("19,8")
  - `META = { rulesCheckedAt:'2026-11-10', firmware:'1.18.0', defaults:{daysNoSun:9, daysRecharge:2, hsp:4.2}, limits:{daysNoSun:[1,20], daysRecharge:[1,7], hsp:[2,7]}, usefulFraction:0.68, panelVolts:6, margin:1.25, gpsExtraMa:60, githubRepo:null, formPrefillUrl:null }`. O `gpsExtraMa` é 60, o limite alto da faixa 30–60 da skill, por ser o valor conservador.
  - `calcEnergy({currentMa, batteryMah, daysNoSun, daysRecharge, hsp, panelW}) -> {E, Cnec, autonomyDays, Erec, Isol, Pmin, Prec, coversDay}`. `batteryMah = null` → `autonomyDays = null`.

- [ ] **Step 1: Write the failing tests**
  - `parseNumberBR`: `'4,2'→4.2`, `'4.2'→4.2`, `' 9 '→9`, `''→null`, `'abc'→null`, `'-3'→-3` (o limite fica com `setField`).
  - `formatBR(19.833,1) === '19,8'`.
  - `calcEnergy({currentMa:10, batteryMah:7000, daysNoSun:9, daysRecharge:2, hsp:4.2, panelW:3})`: `E===2160`; `Cnec≈3176.5` (±1); `Isol≈314.3` (±1); `Pmin≈1.886` (±0.01); `Prec≈2.357` (±0.01); `autonomyDays≈19.83` (±0.01); `coversDay===true`.
  - `coversDay` com `panelW:0.3, currentMa:45` é `false`. A conta é `(W/6*1000)*hsp < I*24`, com tudo em mAh.
- [ ] **Step 2:** Run `npm test` → FAIL.
- [ ] **Step 3:** Implementar as três funções com as fórmulas do spec §8.2 (`E=I*24*N`; `Cnec=E/0.68`; `autonomy=C*0.68/(I*24)`; `Erec=Cnec*0.68+I*24*D`; `Isol=Erec/(HSP*D)`; `Pmin=Isol*6/1000`; `Prec=Pmin*1.25`).
- [ ] **Step 4:** Run `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: cálculo de energia pelo método da skill`.

### Task 3: Catálogo, projetos (esqueleto) e estado

**Files:**
- Create: `src/data/parts.js`, `src/data/projects.js` (só o projeto 4 completo; os outros entram na Task 7), `src/core/state.js`
- Test: `tests/state.test.js`

**Interfaces:**
- Consumes: `META`, `parseNumberBR`.
- Produces:
  - `PARTS: Record<partId, {slot, name, short, attrs, price?:{min,max,source,date}, photo?:{file,credit,license,sourceUrl}, counterexample?:true}>`
  - Atributos por slot: placa `{mcu:'nrf52'|'esp32', currentMa, bandMhz, hasLoRa, bootlock, gps, supported, wifi, wiring, pa:null|{outDbm:Record<number,number>, peakMa:Record<number,number>, needs5V:boolean}}`; bateria `{cells, mahPerCell, branded, protectedCells}`; carregador `{dischargeProtection, mppt, wiring}`; painel `{watts, volts}`; antena `{bandMinMhz, bandMaxMhz, gainDbi, homemade}`; cabo `{type:'pigtail'|'RG-58'|'LMR-400', lengthM}`; caixa `{vent, light}`; fonte `{kind:'usb-5v'}`; aparelho (companion pronto) = atributos de placa.
  - `PROJECTS: Record<number, {id, name, what, difficulty, solder, role:'companion'|'repeater'|'observer', power:'battery'|'solar'|'mains', status:'pronto'|'em-breve', blockedBy:string[], slots:Record<slot,{label, default, alternatives:string[]}>, locations:string[], drawings:{id, match:Record<slot,string[]>}[], defaultDrawing:string|null}>`
  - `createState(projectId) -> State` (peças padrão, `location` = 1º de `locations` ou `null`, padrões de `META`, `txDbm:22`, `uf/ddd/customRegion/hasWifi = null`)
  - `swapPart(state, slot, partId) -> State` (novo objeto; lança erro se `partId` não for padrão nem alternativa do slot)
  - `setField(state, field, text) -> {state, error:string|null}` para `daysNoSun|daysRecharge|hsp` (usa `parseNumberBR`; fora dos `META.limits` → mantém o valor anterior e devolve o erro "Use um número entre 1 e 20"), e para `location|uf|ddd|customRegion|hasWifi|txDbm`
  - `applyFix(state, fix) -> State` (= `swapPart(state, fix.slot, fix.partId)`)
- Projeto 4 (do spec §9 e do guia da skill): placa `xiao-nrf52840-wio` (alt `xiao-esp32s3-wio`, `xiao-nrf52840-sem-wio`); bateria `bat-2x3500` (alt `bat-1x3500`, `bat-2x9900-generica`); carregador `tp4056-dw01` (alt `cn3791-bms`, `tp4056-sem-protecao`, `cn3791-sem-bms`, `painel-direto-usb`); painel `painel-6v-3w` (alt `painel-6v-1w`, `painel-6v-2w`, `painel-6v-5w`); antena `omni-915-5dbi` (alt `antena-915-simples`, `antena-868`, `colinear-caseira`, `omni-915-8dbi`); cabo `pigtail-15cm` (alt `rg58-3m`, `lmr400-3m`); caixa `caixa-clara-respiro` (alt `caixa-sem-respiro`, `caixa-escura`); locations `['telhado','predio','pico','dentro']`. As baterias desenham um bloco "pack 1S (N células em paralelo)": a fiação não muda com N.

- [ ] **Step 1: Write the failing tests**
  - `createState(4).parts.carregador === 'tp4056-dw01'` e `.daysNoSun === 9`.
  - `swapPart(s,'antena','antena-868')` devolve objeto novo e não altera `s`.
  - `swapPart(s,'antena','rak13302')` lança erro.
  - `setField(s,'hsp','4,5').state.hsp === 4.5`; `setField(s,'hsp','abc')` → `state.hsp === 4.2` e `error` não nulo; `setField(s,'daysNoSun','-3').error` não nulo; nunca `NaN` (Review Focus 1).
  - Sem vazamento entre projetos: depois de trocar peças no projeto 4, `createState(3)` só tem chaves de slot do projeto 3 (Review Focus 2).
- [ ] **Step 2:** Run `npm test` → FAIL.
- [ ] **Step 3:** Implementar `parts.js` (peças do projeto 4 com atributos da skill: XIAO nRF52840 10 mA e `bootlock:false`; XIAO ESP32-S3 45 mA; bateria genérica com `mahPerCell:9900, branded:false`; preços só onde a skill traz fonte e data, "Mesh Sorocaba, 27/04/2026", e o resto sem preço), `projects.js` (projeto 4) e `state.js`.
- [ ] **Step 4:** Run `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: catálogo, projeto 4 e estado imutável`.

### Task 4: Região e comandos

**Files:**
- Create: `src/data/ddd.js`, `src/core/region.js`, `src/core/commands.js`
- Test: `tests/region.test.js`, `tests/commands.test.js`

**Interfaces:**
- Consumes: `State`, `PARTS`, `PROJECTS`.
- Produces:
  - `DDD_BY_UF: Record<uf, string[]>`. Valores (conferir com o plano de numeração da Anatel antes do merge e citar a fonte no arquivo): AC 68 · AL 82 · AM 92 97 · AP 96 · BA 71 73 74 75 77 · CE 85 88 · DF 61 · ES 27 28 · GO 62 64 · MA 98 99 · MG 31 32 33 34 35 37 38 · MS 67 · MT 65 66 · PA 91 93 94 · PB 83 · PE 81 87 · PI 86 89 · PR 41 42 43 44 45 46 · RJ 21 22 24 · RN 84 · RO 69 · RR 95 · RS 51 53 54 55 · SC 47 48 49 · SE 79 · SP 11 12 13 14 15 16 17 18 19 · TO 63
  - `regionDef(uf, ddd, customRegion) -> string`. Exemplo: `('MG','31',null)` → `'region def br br-mg br-mg-31'`; com `customRegion:'br-sp-valeparaiba'` → `'region def br br-sp br-sp-valeparaiba'`; com UF ou DDD faltando → `'region def br br-____ br-____-____'`.
  - `validateCustomRegion(text, uf) -> {ok:boolean, reason:string|null}`: só `[a-z0-9-]`, sem acento, começa com `br-<uf>-`.
  - `repeaterCommands(state) -> string[]`, nesta ordem: `set radio 923.125,62.5,8,8`, `set tx <txDbm>`, `set name ________`, `password ________`, `set lat ________`, `set lon ________`, `set flood.advert.interval 23`, `set txdelay <0.5|1.0|2.0>`, `set rxdelay 3`, `set loop.detect moderate`, `set multi.acks 1`, `set agc.reset.interval 300`, `set radio.rxgain on`, `get radio.rxgain`, `set path.hash.mode 1`, `<regionDef>`, `region save`, `get advert.interval`. O `txdelay` vem do local: telhado → `0.5`, predio → `1.0`, pico → `2.0`, dentro → `0.5`.
  - `companionSteps(state) -> string[]`: passos do app (spec §8.1 CFG-01/03; checklist de companion da skill).
  - `txOptions(state) -> number[]`: `[22]` se a placa não tem PA; senão as chaves de `pa.outDbm` que são ≤ 22, em ordem decrescente. O RAK13302 tem `{22:30, 19:27, 16:24}` e o Heltec V4 tem `{22:28, 10:22}`: só entram valores que a skill traz.

- [ ] **Step 1: Write the failing tests**
  - `repeaterCommands` de (MG, 31, telhado) contém exatamente `'region def br br-mg br-mg-31'` e `'set txdelay 0.5'`.
  - Nenhum comando é `set advert.interval 0`; o primeiro é `'set radio 923.125,62.5,8,8'`; todos minúsculos onde a região aparece.
  - Sem UF/DDD → contém `'region def br br-____ br-____-____'` (Review Focus 4).
  - `validateCustomRegion('BR-SP-Vale','SP').ok === false`; `('br-sp-valeparaíba','SP').ok === false`; `('br-sp-valeparaiba','SP').ok === true`; `('br-mg-31','SP').ok === false`.
  - `DDD_BY_UF.MG` inclui `'31'` e não inclui `'36'`; total de DDDs = 67.
  - `txOptions` de placa sem PA = `[22]`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: região BR e comandos do repetidor`.

### Task 5: Motor de auditoria e regras de energia

**Files:**
- Create: `src/core/audit.js`, `src/rules/energy.js`
- Test: `tests/audit.test.js`, `tests/rules-energy.test.js`

**Interfaces:**
- Consumes: `calcEnergy`, `State`, `PARTS`, `PROJECTS`, `META`.
- Produces:
  - `runAudit(state, ruleSets?: Rule[][]) -> AuditItem[]`. Monta o `RuleCtx`: `energy` só se `project.power` ∈ {battery, solar}, com corrente = placa `currentMa` + `META.gpsExtraMa` se `gps`; `lessConservative = daysNoSun < 9 || daysRecharge > 2 || hsp > 4.2`. Ordena bad → warn → ok e, dentro do nível, pelo `id`.
  - `summarize(items) -> {bad:number, warn:number}`.
  - `ENERGY_RULES: Rule[]` com EN-01…EN-14 do spec §8.2 (fonte e data em cada uma). EN-15 **não** é implementada na v1: nenhum projeto da v1 tem Heltec V4 a bateria (anotar em `docs/` como pendência).
  - Regras de nível: autonomia ≥ N → ok · ≥ 0,6·N → warn · < 0,6·N → bad · bateria falsa (`!branded && mahPerCell > 3500`) → bad, sem autonomia; painel: `!coversDay` → bad · `< Pmin` → warn · `< Prec` → warn · senão ok; EN-10: nenhuma proteção (`!carregador.dischargeProtection && !bateria.protectedCells`) e placa sem `bootlock` → bad; EN-11: CN3791 sem BMS cai no EN-10 (fix → `cn3791-bms`); EN-12 (`painel-direto-usb`) → bad.
  - **Teto de Atenção:** com `lessConservative`, todo item de energia que seria `ok` vira `warn`, com o texto "com os valores padrão da comunidade daria X". Placa com `pa` → itens de energia no máximo `warn`, com "meça o seu consumo".
  - Correções: EN-01 → `bat-2x3500`; EN-03/EN-04 → mais células (ou `xiao-nrf52840-wio` se a placa for ESP32); EN-05/06/07 → menor painel que dá OK; EN-10 → `tp4056-dw01`; EN-11 → `cn3791-bms`; EN-12 → `tp4056-dw01`. **Toda correção aponta para uma alternativa do próprio slot no projeto** (teste na Task 7).

- [ ] **Step 1: Write the failing tests** (um `test()` por regra, com estado mínimo do projeto 4):
  - padrão do projeto 4 → nenhum item `bad` de energia; o item de autonomia diz "~20 dias" (texto contém `'19,8'`).
  - `bat-2x9900-generica` → EN-01 `bad` e nenhum item de autonomia.
  - `bat-1x3500` com `xiao-esp32s3-wio` → EN-04 `bad`, fix `xiao-nrf52840-wio`.
  - `painel-6v-1w` → EN-06 `warn` (cobre o dia, abaixo de Pmin).
  - `tp4056-sem-protecao` → EN-10 `bad`; `cn3791-sem-bms` → `bad` com fix `cn3791-bms`; `cn3791-bms` → sem EN-10/EN-11 `bad`.
  - `painel-direto-usb` → EN-12 `bad`.
  - Falso OK por digitação: ESP32 + `bat-1x3500` com `daysNoSun:2` → nenhum item de energia `ok` (no máximo `warn`); idem com `hsp:6`.
  - `runAudit` ordena `bad` antes de `warn` antes de `ok`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: motor de auditoria e regras de energia`.

### Task 6: Regras de peças, instalação e configuração

**Files:**
- Create: `src/rules/hardware.js`, `src/rules/install.js`, `src/rules/config.js`
- Modify: `src/core/audit.js` (registrar os três conjuntos)
- Test: `tests/rules-hardware.test.js`, `tests/rules-install.test.js`, `tests/rules-config.test.js`

**Interfaces:**
- Produces: `HARDWARE_RULES` (HW-01…HW-14; HW-03 e HW-15 são alertas fixos do desenho/PDF, ver Task 9), `INSTALL_RULES` (IN-01…IN-04, IN-06, IN-07; IN-05 é texto do PDF), `CONFIG_RULES` (CFG-02: placa com PA → `warn` informativo com a saída real e o pico de `txDbm`; CFG-04: **sempre** `warn`, nunca `ok`, com "confira a grafia exata com o grupo local ou em Descobrir Regiões no app"; sem UF/DDD → `warn` "preencha estado e DDD").
- Gatilhos (spec §8.3/§8.4): banda ≠ 915 → bad; antena fora de 915–928 → bad; antena `homemade` → warn; `gainDbi ≥ 6` e local `pico` → warn; `RG-58` com `lengthM > 1` → warn; `mcu==='esp32'` em projeto `solar` → warn; `gps` em projeto não-companion → warn; `!supported` → bad; `!hasLoRa` → bad; `pa` → (CFG-02); `pa.needs5V` com alimentação 3,3 V → bad; Heltec V3 como companion → warn; `dentro` em repetidor/observer → bad; `!vent` → warn; `!light` → warn; `power==='mains'` → warn informativo (falta de luz); observer `movel` → bad; observer `hasWifi===false` → bad, `null` → warn "confirme se há Wi-Fi no local".

- [ ] **Step 1: Write the failing tests:** um caso que dispara e um que não dispara para cada ID acima, mais: com o padrão do projeto 4 e UF/DDD preenchidos, o único `warn` de config é CFG-04 e não há `ok` com `id === 'CFG-04'`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: regras de peças, instalação e configuração`.

### Task 7: Os 7 projetos, desenho por combinação e validação dos dados

**Files:**
- Modify: `src/data/projects.js`, `src/data/parts.js`
- Create: `src/core/drawing.js`
- Test: `tests/projects.test.js`, `tests/data-validation.test.js`, `tests/drawing.test.js`

**Interfaces:**
- Consumes: `runAudit`, `summarize`, `PARTS`, `PROJECTS`.
- Produces:
  - `drawingFor(state, items) -> string|null`: primeiro `drawings[i]` cujo `match` cobre as peças atuais; senão, se `summarize(items).bad > 0`, `defaultDrawing` (contraexemplo); senão `null`.
  - `markSvg(svgText, levelsBySlot: Record<slot,'bad'|'warn'|'sel'>) -> string`: acrescenta `stroke`, `stroke-width="3"`, `fill="none"` e `stroke-dasharray="7 5"` (bad/warn) ao `<rect id="hl-<slot>" …>`, com as cores dos tokens. Contrato do SVG: cada peça é `<g data-slot="<slot>" …>` com um `<rect id="hl-<slot>">` sem `stroke`.
  - `isOpenable(projectId) -> boolean` (`status === 'pronto'`).
- Dados dos projetos (spec §9): 1 aparelho `wio-l1-pro` (alt `t1000e`, `wismesh-tag`, `wio-l2-pro` contraexemplo), `status:'em-breve'`, `blockedBy:['R1']`; 2 `heltec-v3` (alt `heltec-v4`), `status:'em-breve'`, `blockedBy:['R2']`; 3 `t114` (alt `heltec-v3`) + `fonte-usb-5v` + antena/cabo/caixa como no 4, `power:'mains'`, `pronto`; 4 como na Task 3, `pronto`; 5 `t114` + `bat-3x3200-bms` (alt `bat-2x3200-bms`, `bat-1x3200-bms`) + `cn3065` + `painel-6v-9w` (alt `painel-6v-5w`, `painel-6v-3w`) + `pigtail-ipex-n-10cm` + `caixa-abs-ip65-respiro` (alt `caixa-sem-respiro`), `em-breve` com `blockedBy:['R4']`; 6 `rak3401-rak13302`, `em-breve`, `blockedBy:['R3']`; 7 `heltec-v3` (alt `heltec-v4`) + `fonte-usb-5v`, locations `['telhado','predio','pico','dentro','movel']`, `power:'mains'`, `em-breve`, `blockedBy:['R5']`. Desenhos da v1: `p3-t114`, `p3-v3`, `p4-tp4056`, `p4-cn3791-bms` (`defaultDrawing:'p4-tp4056'`).

- [ ] **Step 1: Write the failing tests**
  - Para cada projeto `pronto`: `createState(id)` com UF/DDD preenchidos → `summarize(runAudit(s)).bad === 0`.
  - Para cada projeto `pronto`, enumerando **todas** as combinações de alternativas: se `bad === 0`, então `drawingFor(...) !== null` (não existe "fiação ilustrativa").
  - Para cada item com `fix` em qualquer combinação: `fix.partId` é padrão ou alternativa do `fix.slot` no projeto.
  - `drawingFor` com `antena-868` no projeto 4 → `'p4-tp4056'` (contraexemplo reaproveita o padrão).
  - `markSvg('<rect id="hl-placa" x="1"/>', {placa:'bad'})` contém `stroke="#B91C1C"` e `stroke-dasharray="7 5"`.
  - `isOpenable(6) === false`; `isOpenable(4) === true`.
  - Validação de dados: toda regra de todos os conjuntos tem `source`, `checkedAt` no formato `AAAA-MM-DD` e `firmware`; todo `price` tem `source` e `date`; toda `photo.license` ∈ {`CC BY-SA 4.0`, `CC BY 4.0`, `CC0`, `Domínio público`} e `sourceUrl` contém `wiki.seeedstudio.com` ou `commons.wikimedia.org`; nenhum `sourceUrl`/texto contém `heltec.org`, `rakwireless.com/store`, `aliexpress`, `mercadolivre`, `amazon`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Preencher os dados e `drawing.js`. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: sete projetos, desenho por combinação e validação dos dados`.

---

## Fase 2 — Conteúdo

### Task 8: Pesquisa das lacunas (bloqueia só o projeto afetado)

**Files:**
- Create: `docs/research/2026-11-lacunas.md` (fonte, data e conclusão de cada lacuna)
- Modify: `src/data/projects.js` (`status`/`blockedBy`), `src/data/parts.js`

Itens (spec §12):
- **R1 Modo de gravação** de T1000-E, Wio Tracker L1 Pro, WisMesh Tag e RAK3401 → libera o projeto 1. Usar a skill atualizada pela sessão "Corrigir 3 divergências na skill meshcore-hubreal" (ela está acrescentando esses modos). Se a skill ainda não tiver, ler os guias citados em `references/manuais-e-datasheets.md`.
- **R2 Bateria do companion Heltec V3** (tipo, conector, polaridade) no datasheet da Heltec → libera o projeto 2.
- **R3 RAK 1 W:** consumo médio medido (PPK2 ou medidor USB) + base WisBlock e carregamento solar com picos de 1 A. **Depende de medição física do usuário**: perguntar. Sem medição, o projeto 6 fica "em breve".
- **R4 Tensão do painel para o CN3065** (o repetidor de referência de PT usa painel de 9 W, sem tensão declarada na skill) → libera o projeto 5. *(Lacuna nova, achada no planejamento.)*
- **R5 Firmware de observer:** passo a passo atual em observer.gessaman.com e analyzer.letsmesh.net/observer/onboard → libera o projeto 7.
- **R6 `set advert.interval 0`:** usar a conclusão da sessão de correção da skill. Se `0` for aceito, **não** volta para os comandos: o spec já trocou por `get advert.interval`.

- [ ] **Step 1:** Para cada item, registrar no arquivo a fonte (link + data) e a conclusão; o que não tiver fonte fica "aberto".
- [ ] **Step 2:** Atualizar `status`/`blockedBy` só dos projetos cujas lacunas fecharam; acrescentar as peças e desenhos novos que a pesquisa exigir (com os testes da Task 7 passando).
- [ ] **Step 3:** Run `npm test` → PASS.
- [ ] **Step 4:** Commit `docs: pesquisa das lacunas e status dos projetos`.

### Task 9: Textos da bancada e do PDF

**Files:**
- Create: `src/content/config-notes.js` (CFG-07 formato do nome `CIDADE-REGIONAL-XXXX`, máx. 23 bytes, sem acento, XXXX só depois de gravar, links dos geradores do meshcore.com.br e do meshsorocaba.org; CFG-08 configurar por USB, um comando por vez, `set radio` na bancada; CFG-09 senha de admin forte, convidado vazio, Owner Info sem dado sensível, Repeat Mode ligado; CFG-10 posição manual e aproximada; CFG-11 `get prv.key` é segredo, guardar offline antes de apagar), `src/content/flash.js` (gravação por placa), `src/content/steps.js` (montagem e teste de bancada por projeto), `src/content/install.js` (IN-05: água, painel para o norte com inclinação ≈ latitude, calor, segurança; manutenção a cada 3–6 meses), `src/content/after.js` (Send Advert, mapa, CoreScope, etiqueta, cópia offline do app, "ninguém me ouve, e agora?"), `src/content/alerts.js` (HW-03 "nunca ligue sem antena", HW-15 "confira a revisão da placa", polaridade, vermelho = +, preto = −, EN-09, EN-14)
- Test: `tests/content.test.js`

**Interfaces:**
- Produces: `FLASH: Record<partId(placa/aparelho), {firmwareType:'Repetidor'|'Companion Bluetooth'|'Observer', steps:string[], source:string}>`; `STEPS: Record<projectId, string[]>`; `INSTALL`, `AFTER`, `ALERTS` como `{title, items:string[], source}`.

- [ ] **Step 1: Write the failing tests:** toda placa padrão/alternativa de projeto `pronto` tem `FLASH`; todo projeto `pronto` tem `STEPS`; nenhum texto contém `ANATEL`, `ilegal`, `homologad`, `permitido por lei` (sem parte legal); nenhum texto contém `set advert.interval 0`; o texto de energia do projeto 4 **não** contém `30 dias` (a conta de exemplo do guia está proibida).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Escrever os textos **em palavras próprias** a partir da skill (`guia-repeater-xiao-solar.md` sem a §5 "Conta de energia (exemplo)", `SKILL.md`, `padroes-comunidade-br.md` §7–§9, `portugal-e-plano333.md` só o hardware), em linguagem de leigo, frases curtas, cada bloco com `source`.
- [ ] **Step 4:** Run → PASS. Revisão do tom por um subagente revisor (leigo, frases curtas, sem jargão sem explicação) e item "ler os textos" na lista de pendências do usuário. Não bloqueia.
- [ ] **Step 5:** Commit `feat: textos de montagem, gravação e instalação`.

---

## Fase 3 — Interface

### Task 10: Casca, tokens, fontes e rotas

**Files:**
- Create: `index.html`, `styles/tokens.css`, `styles/app.css`, `assets/fonts/*` (+ `OFL.txt`), `src/ui/router.js`, `src/ui/app.js`, `src/ui/shell.js`
- Test: `tests/router.test.js`, `tests/contrast.test.js`

**Interfaces:**
- Consumes: `META`, `isOpenable`, `createState`.
- Produces:
  - `parseRoute(hash: string) -> {name:'projetos'} | {name:'bancada', projectId:number} | {name:'pdf'} | {name:'aviso', reason:'em-breve'|'inexistente', projectId:number}`
  - `routeGuard(route, state|null) -> route` (`pdf` sem estado → `projetos`)
  - `contrast(hexA, hexB) -> number` (WCAG) em `src/ui/contrast.js`
  - Casca: cabeçalho com marca + nome + subtítulo; indicador de 3 passos (Escolha um projeto · Monte na bancada · Baixe o PDF) com `aria-current="step"`; rodapé com "regras conferidas em 10/11/2026 · firmware 1.18.0" (de `META`, formatado em pt-BR) e o aviso de independência; região `aria-live="polite"` para o resumo da auditoria.

- [ ] **Step 1: Write the failing tests:** `parseRoute('#/bancada/6')` → `aviso`/`em-breve`; `parseRoute('#/bancada/99')` → `aviso`/`inexistente`; `parseRoute('')` → `projetos`; `routeGuard({name:'pdf'}, null).name === 'projetos'` (Review Focus 2 e 3); `contrast` ≥ 4,5 para tinta/papel, branco/azul-tinta, cada cor de nível sobre o próprio fundo e `#475569`/papel (lendo os valores de `styles/tokens.css`).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implementar. Fontes: baixar Atkinson Hyperlegible (Regular/Bold) e JetBrains Mono (Regular/SemiBold) da fonte oficial (Google Fonts/GitHub dos projetos), guardar woff2 + ttf + `OFL.txt`, `@font-face` com `font-display: swap`; registrar origem e versão em `assets/fonts/README.md`.
- [ ] **Step 4:** Run → PASS. Verificar no navegador (`python -m http.server 8000`): rotas, voltar/avançar, rodapé, foco visível.
- [ ] **Step 5:** Commit `feat: casca, tokens, fontes e rotas`.

### Task 11: Passo 1 — cartões dos projetos

**Files:**
- Create: `src/ui/projects-step.js`; Modify: `styles/app.css`

**Interfaces:**
- Consumes: `PROJECTS`, `isOpenable`, `formatBR`.
- Produces: `renderProjectsStep(root: HTMLElement, onPick:(id:number)=>void) -> void`.

- [ ] **Step 1:** Implementar cartões em grade (do mais simples ao mais trabalhoso): nome, frase "para que serve", dificuldade em 5 pontos (com texto "dificuldade 3 de 5" para leitor de tela), solda, placa principal, faixa de custo com data (ou "sem preço de referência"). Projeto `em-breve`: cartão visível, botão desativado com "Em breve" e o motivo em linguagem simples. Clique → `#/bancada/<id>`.
- [ ] **Step 2:** Verificar no navegador em 375 px e 1280 px; teclado (Tab/Enter) abre o projeto.
- [ ] **Step 3:** Commit `feat: passo 1, escolha do projeto`.

### Task 12: Ilustrações SVG (ícones e desenhos de montagem)

**Files:**
- Create: `assets/svg/parts/<partId>.svg` (todas as peças dos projetos `pronto`), `assets/svg/drawings/p3-t114.svg`, `p3-v3.svg`, `p4-tp4056.svg`, `p4-cn3791-bms.svg` (+ as que a Task 8 liberar)
- Test: `tests/svg.test.js`

**Interfaces:**
- Contrato (consumido por `markSvg` e pela bancada): cada desenho tem `viewBox`, `<title>`, e para **cada slot do projeto** um `<g data-slot="<slot>" tabindex="0" role="button" aria-label="<nome do slot>">` contendo `<rect id="hl-<slot>">` sem `stroke`. Só atributos de apresentação inline (nada de `<style>` nem classes, para o pdfmake desenhar igual). Fios: vermelho `#C0262D` (+) e preto `#0F172A` (−).

- [ ] **Step 1: Write the failing test:** para cada projeto `pronto` e cada `drawings[i].id`, o arquivo existe, tem `<title>`, não tem `<style`, e tem `data-slot="<slot>"` + `id="hl-<slot>"` para todos os slots; toda peça em alternativas de projeto `pronto` tem `assets/svg/parts/<partId>.svg`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Desenhar no estilo do spec §7.4 (contorno 2 px, cores chapadas, placa `#2B3440`, cobre `#B9822F`, sem degradê), usando como referência de **conteúdo** os SVGs da skill (`assets/diagramas/fiacao-repetidor-solar-xiao.svg` etc.), redesenhados. Desenho com CN3791 inclui o BMS 1S; desenho do T114 mostra a alimentação USB 5 V da fonte.
- [ ] **Step 4:** Run → PASS; abrir cada SVG no navegador e conferir a fiação contra a skill.
- [ ] **Step 5:** Fotos reais: para cada peça de projeto `pronto`, procurar foto na wiki da Seeed (CC BY-SA 4.0) ou no Wikimedia Commons (categoria Meshtastic e afins). Salvar em `assets/photos/` (WebP, largura ≤ 800 px) e preencher `photo` em `parts.js` com `credit`, `license` e `sourceUrl`. Sem foto livre → sem `photo`. Os testes de validação da Task 7 têm que continuar passando.
- [ ] **Step 6:** Commit `feat: ilustrações e fotos dos projetos prontos`.

### Task 13: Passo 2 — a bancada

**Files:**
- Create: `src/ui/bench.js`, `src/ui/catalog.js`, `src/ui/assembly.js`, `src/ui/audit-panel.js`, `src/ui/fields.js`; Modify: `styles/app.css`

**Interfaces:**
- Consumes: `createState`, `swapPart`, `setField`, `applyFix`, `runAudit`, `summarize`, `calcEnergy`, `drawingFor`, `markSvg`, `txOptions`, `validateCustomRegion`, `DDD_BY_UF`, `suggestLinks` (Task 15; até lá, link desativado).
- Produces: `renderBench(root, state, onChange:(state)=>void) -> void`.

- [ ] **Step 1:** Layout do spec §7.2: **Trocar peça** (esquerda; peça em uso marcada; `aria-pressed`), **Montagem** (centro; SVG inline vindo de `drawingFor` + `markSvg`; clique ou Enter numa peça → painel de detalhe com "por que está aqui", "ver foto real" com crédito/licença/link ou "Sem foto de licença livre: só a ilustração."), **Auditoria ao vivo** (direita; barras de autonomia e painel com a meta marcada e o valor em texto; lista bad → warn → ok; clique num item acende a peça; botão "Trocar por…" chama `applyFix`). Campos abaixo do desenho: onde vai ficar, dias sem sol, dias para recarregar, horas de sol, estado + DDD (select dependente), "minha área usa outro nome de região" (com `validateCustomRegion`), potência (`txOptions`, só se houver mais de uma), "tem Wi-Fi no local?" (só observer). Erros de campo **ao lado do campo**.
- [ ] **Step 2:** Comportamentos: cada mudança recalcula tudo (estado imutável → re-render); o resumo "N problemas · M atenção" vai para a região `aria-live`; ≤ 760 px vira abas **Peças · Montagem · Auditoria** (padrão: Montagem); entre 761 e 1100 px, colunas mais estreitas; animação de pulso do contorno só sem `prefers-reduced-motion`.
- [ ] **Step 3:** Verificar no navegador (projeto 4): trocar para `tp4056-sem-protecao` → item EN-10 vermelho + carregador com contorno tracejado e selo; "Trocar por TP4056 com DW01" volta a zero problemas; "4,5" em horas de sol funciona; "abc" mostra erro ao lado e não muda a conta; teclado alcança todas as peças do desenho; **375 px com texto a 200 %: abas usáveis e sem rolagem horizontal** (Review Focus 5); trocar de projeto pelo passo 1 não traz peças do anterior (Review Focus 2).
- [ ] **Step 4:** Run `npm test` → PASS (nada do núcleo quebrou).
- [ ] **Step 5:** Commit `feat: passo 2, bancada com auditoria ao vivo`.

### Task 14: Passo 3 — o PDF

**Files:**
- Create: `src/core/pdfdoc.js`, `src/ui/pdf-step.js`, `vendor/pdfmake/pdfmake.min.js` + `LICENSE`
- Test: `tests/pdfdoc.test.js`

**Interfaces:**
- Consumes: `runAudit`, `summarize`, `calcEnergy`, `repeaterCommands`, `companionSteps`, `drawingFor`, `markSvg`, `FLASH`, `STEPS`, `INSTALL`, `AFTER`, `ALERTS`, `META`, `formatBR`.
- Produces:
  - `buildPdfDoc({state, svgText}) -> object` (docDefinition do pdfmake, **pura**; fontes `Atkinson` e `Mono`).
  - `downloadPdf(docDefinition, fileName) -> Promise<void>` (browser: carrega os TTF por `fetch`, monta `vfs` em base64, `pdfMake.createPdf(dd, null, fonts, vfs).download(fileName)`).
- Páginas (spec §7.6): 1 capa (nome do projeto, data, "regras conferidas em … · firmware …", resultado: "Auditoria sem problemas" **ou** caixa vermelha listando os `bad` pendentes; os `warn` listados em seguida); 2 lista de compras (caixinha desenhada com `canvas`, não glifo; quantidade; detalhe que evita erro; faixa de preço com data e fonte; **sem link de loja**); 3 desenho (`svg` com `markSvg`) + `ALERTS`; 4 gravação (`FLASH` da placa); 5 comandos (um por linha, fonte `Mono`, caixinha; linhas de nome/senha/lat/lon em branco com explicação) ou passos do app (companion); 6 energia (números do projeto em pt-BR; omitida para `power:'mains'` e companion); 7 montagem + teste de bancada + instalação + manutenção; 8 depois de ligar + "ninguém me ouve".

- [ ] **Step 1: Write the failing tests** (projeto 4, MG/31/telhado):
  - com tudo certo, a capa contém `'Auditoria sem problemas'`; com `tp4056-sem-protecao`, contém o título do EN-10 e não contém `'Auditoria sem problemas'`.
  - o conteúdo achatado (`JSON.stringify`) contém `'set radio 923.125,62.5,8,8'` e `'region def br br-mg br-mg-31'`, e **não** contém `'set advert.interval 0'`, `'ANATEL'`, `'http'` de loja (`aliexpress`, `mercadolivre`, `amazon`).
  - sem UF/DDD → contém `'br-____'` e o aviso de região (Review Focus 4).
  - contém `'19,8'` (autonomia) e não contém `'30 dias'`.
  - projeto 3 (`mains`) não tem a página de energia.
  - o estado não tem campos de senha, nome do nó ou coordenadas (só em branco no documento).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar `buildPdfDoc`; vendorizar pdfmake 0.2.x (origem, versão e licença em `vendor/README.md`); `pdf-step.js` com prévia das páginas (lista de títulos) e botão "Baixar PDF" com estado de carregamento. **Step 4:** Run → PASS.
- [ ] **Step 5:** Verificar: baixar o PDF do projeto 4 e do 3 no Chrome desktop e no celular; acentos certos; desenho nítido; imprimir em preto e branco e conferir que o problema continua identificável (tracejado + texto).
- [ ] **Step 6:** Commit `feat: passo 3, PDF gerado no navegador`.

---

## Fase 4 — Comunidade e publicação

### Task 15: Sugestões e orientação sobre IA

**Files:**
- Create: `src/core/suggest.js`, `.github/ISSUE_TEMPLATE/sugestao.yml`, `.github/ISSUE_TEMPLATE/config.yml`, `CONTRIBUTING.md`
- Modify: `src/data/meta.js` (`githubRepo`, `formPrefillUrl`), `src/ui/bench.js`, `src/ui/audit-panel.js`
- Test: `tests/suggest.test.js`

**Interfaces:**
- Produces: `suggestLinks({kind:'regra'|'peca'|'comando', id:string}) -> {form:string|null, github:string|null}`. GitHub: `https://github.com/<repo>/issues/new?template=sugestao.yml&title=` + `encodeURIComponent('[<id>] ')`. Formulário: `formPrefillUrl` com `{id}` substituído. Sem `META.githubRepo`/`formPrefillUrl` → `null` (o link fica escondido).

- [ ] **Step 1: Write the failing tests:** `suggestLinks({kind:'regra', id:'EN-05'}).github` termina com `title=%5BEN-05%5D%20`; não há nenhum dado do estado do usuário na URL (só `kind` e `id`); sem configuração → `{form:null, github:null}`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar; ligar o link "achei um erro" em cada peça, item de auditoria e comando. **Step 4:** Run → PASS.
- [ ] **Step 5:** Modelo do GitHub (`sugestao.yml`), com campos: o que está errado (obrigatório), ID (preenchido pelo título), **"Você usou IA (ChatGPT, Gemini…) para escrever isto?"** (obrigatório: sim/não), **fonte** (link da documentação, nota de versão ou medição; obrigatória para quem marcar "sim" e explicada como necessária para virar regra) e o aviso: *"Usou IA para escrever? Tudo bem, mas IA costuma inventar comandos do MeshCore. Confira na documentação antes de mandar."*
- [ ] **Step 6:** Formulário sem cadastro: **tarefa do usuário** (precisa da conta dele). Entregar a ele o roteiro com os mesmos campos e o aviso; ele cria e devolve o link de preenchimento com o campo de ID; gravar em `META.formPrefillUrl`.
- [ ] **Step 7:** `CONTRIBUTING.md`: como sugerir; "sugestão só vira mudança com fonte"; "se usarem IA para conferir, a decisão final é de uma pessoa olhando a fonte original"; **checklist de revisão** (reconferir fontes de `references/fontes.md`, atualizar regra + `checkedAt` + `META.rulesCheckedAt`/`firmware`, `npm test`, **atualizar também a skill privada**).
- [ ] **Step 8:** Commit `feat: sugestões com orientação sobre IA`.

### Task 16: Automação no GitHub (testes, deploy, aviso de firmware)

**Files:**
- Create: `scripts/check-firmware.mjs`, `.github/workflows/pages.yml`, `.github/workflows/firmware-watch.yml`
- Test: `tests/check-firmware.test.js`

**Interfaces:**
- Produces: `needsReview(latestTag: string, metaFirmware: string) -> boolean` (`'v1.18.0'` × `'1.18.0'` → `false`; `'v1.19.0'` × `'1.18.0'` → `true`; ignora o prefixo `v`).

- [ ] **Step 1: Write the failing test** com os dois casos acima e `'v1.18.1'` → `true`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar o script (lê `META.firmware`; recebe a tag por argumento). **Step 4:** Run → PASS.
- [ ] **Step 5:** `pages.yml`: em push na branch principal, roda `npm test` e, se passar, publica a raiz no GitHub Pages (`actions/upload-pages-artifact` + `actions/deploy-pages`).
- [ ] **Step 6:** `firmware-watch.yml`: agendado (semanal) + manual; `gh release view --repo meshcore-dev/MeshCore --json tagName`; se `needsReview` e não existir issue aberta com o título "Firmware MeshCore <tag> saiu: revisar regras", cria a issue com o checklist do `CONTRIBUTING.md`. Permissão `issues: write`. Não muda nenhum arquivo.
- [ ] **Step 7:** Commit `ci: testes, deploy no Pages e aviso de firmware novo`.

### Task 17: Verificação final e publicação (com o usuário)

- [ ] **Step 1:** `npm test` → tudo PASS.
- [ ] **Step 2:** Verificação manual: os 3 passos em 375 px (texto a 200 %), 768 px e 1280 px; teclado do início ao fim; leitor de tela lê o resumo da auditoria; PDF no Android e no iPhone (no iPhone abre no visualizador, Review Focus 5); impressão em preto e branco; nenhum pedido de rede para fora do domínio (aba Rede do navegador); todas as fotos com crédito.
- [ ] **Step 3:** Conferir se "Bancada Mesh" está livre como organização no GitHub e se não há outro projeto com o mesmo nome. **O usuário cria a organização** e o repositório público.
- [ ] **Step 4:** Com o ok explícito do usuário: `git remote add`, `git push`, ativar o Pages (fonte: GitHub Actions), configurar `META.githubRepo` e conferir o site publicado.
- [ ] **Step 5:** Commit final `docs: README com link do site publicado` (push só com ok do usuário).
