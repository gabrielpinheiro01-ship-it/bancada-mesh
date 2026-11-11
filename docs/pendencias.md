# Pendências

## EN-15 (Heltec V4, corte em 3,8 V) — não implementada na v1

A regra pede usar 3,8 V como tensão mínima da Heltec V4 em vez de 3,6 V. A fração útil da bateria para 3,8 V
**não está na skill** `meshcore-hubreal` (ela só dá o valor de 68 % para 3,6 V) e nenhum projeto da v1 tem uma
Heltec V4 a bateria. Quando houver o dado (curva de descarga com fonte), implementar em `src/rules/energy.js`.

## EN-09 e EN-14

São instruções do PDF (medir tensão das células antes de ligar em paralelo; teste de descarga completa e 48 h só
no solar), tratadas em outra tarefa.
