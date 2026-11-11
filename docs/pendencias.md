# Pendências

## EN-15 (Heltec V4, corte em 3,8 V) — não implementada na v1

A regra pede usar 3,8 V como tensão mínima da Heltec V4 em vez de 3,6 V. A fração útil da bateria para 3,8 V
**não está na skill** `meshcore-hubreal` (ela só dá o valor de 68 % para 3,6 V) e nenhum projeto da v1 tem uma
Heltec V4 a bateria. Quando houver o dado (curva de descarga com fonte), implementar em `src/rules/energy.js`.

## EN-09 e EN-14

São instruções do PDF (medir tensão das células antes de ligar em paralelo; teste de descarga completa e 48 h só
no solar), tratadas em outra tarefa.

## Lacunas de pesquisa que mantêm projetos "em breve" (Task 8; detalhe em `docs/research/2026-11-lacunas.md`)

- **R2 (projeto 2):** polaridade BAT+/GND do conector JP1 (1,25 mm, 2 pinos) da Heltec V3. Não consta em texto no
  datasheet/esquema; conferir o desenho do esquema e a serigrafia da placa.
- **R3 (projeto 6):** medição do RAK 1 W pelo usuário (consumo médio com tráfego típico, base WisBlock e
  carregamento solar com picos de 1 A).
- **R4 (projeto 5):** decisão de produto sobre o painel para o CN3065 (máximo absoluto 6,5 V, entrada 4,4–6 V;
  um painel "6 V" passa de 7 V em aberto). A tensão do painel de 9 W do repetidor de PT não é declarada.
- **R5 (projeto 7):** página de onboarding do analyzer (analyzer.letsmesh.net/observer/onboard) deu 403 e não foi
  lida; falta a lista de placas do observer e conferir os brokers atuais.

## Desenhos de montagem em revisão (pedido do usuário, 11/11/2026)

Os desenhos `assets/svg/drawings/*.svg` ficam **em revisão** até o dono conferir. Já foram corrigidos (commit 6181657) e revisados por agente, mas precisam do olho humano antes de publicar:
- ordem dos pontos do TP4056 (agora OUT+, B+, B−, OUT− na saída e IN+, IN− na entrada, conforme a foto `assets/photos/tp4056-dw01.webp`);
- tamanho do desenho no PDF (página própria, nomes dos pontos com 8–9 pt impressos);
- cabo da antena (pigtail U.FL→SMA na caixa + trecho coaxial até a antena, para as opções de cabo longo).
