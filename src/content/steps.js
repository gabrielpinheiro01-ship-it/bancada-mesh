// Montagem e teste de bancada por projeto (só os `pronto`: 1, 3 e 4). Frases curtas, para quem nunca montou rádio.
// Os comandos de configuração vêm de src/core/commands.js; aqui só se fala deles.
// Nada de conta de energia: autonomia e painel mínimo saem calculados pela auditoria (spec §8.2).

/** Fonte de cada lista de STEPS (arquivo da skill + seção + link original). */
export const STEPS_SOURCE = Object.freeze({
  1: 'SKILL.md, "Checklist de companion" e "Reset de fábrica"; references/hardware-energia.md ("Escolha de placa", "Modo de gravação por placa") · https://wiki.seeedstudio.com/sensecap_t1000_e_meshcore/',
  3: 'SKILL.md, "Checklist de repetidor" e "Diagnóstico rápido"; references/guia-repeater-xiao-solar.md §5 (teste de bancada) e §6 · references/hardware-energia.md ("Armadilhas físicas") · https://meshcore.com.br/valores-de-referencia/',
  4: 'references/guia-repeater-xiao-solar.md §2 (esquema, solda nos pads BAT), §5 (teste de bancada) · SKILL.md ("Versões de firmware": sem bootlock na 1.18) · references/hardware-energia.md ("Proteção de bateria", "Armadilhas físicas") · https://wiki.seeedstudio.com/xiao_nrf52840&_wio_SX1262_kit_for_meshtastic/',
});

export const STEPS = Object.freeze({
  1: [
    'Carregue o aparelho por completo antes de começar, com o cabo que veio na caixa.',
    'Se o seu aparelho tem antena de rosquear, encaixe a antena antes de ligar. Nunca ligue o rádio sem antena: pode queimar o chip de rádio.',
    'Grave o firmware "Companion Bluetooth" pelo computador (página "Gravar o firmware").',
    'No celular, instale o app MeshCore (Android ou iPhone). Guarde também uma cópia do app para usar sem internet.',
    'Ligue o aparelho e faça o pareamento Bluetooth pelo app.',
    'No app, abra as Definições de Rádio e escolha o preset "Australia: SA, WA". É o mesmo do preset "Brazil" (alguns apps antigos não têm o nome Brazil).',
    'Confira os números do rádio, dígito por dígito, com a página "Comandos": 923.125 MHz, largura de banda 62.5, SF 8, CR 8 e potência 22. Um número diferente isola o seu rádio da rede.',
    'Em Definições Experimentais, ligue o hash do caminho de 2 bytes (um jeito de identificar os repetidores no caminho da mensagem) e salve.',
    'Em Informação Pública, ponha um nome e uma posição aproximada. Não precisa ser a sua casa.',
    'Toque em Send Advert. É o aviso "estou aqui" que o seu rádio manda para a rede.',
    'Teste de bancada: mande um "olá" no canal Public. Sem nenhum repetidor perto, ninguém vai responder e isso é normal. O que você confere é que o app aceitou o envio e o aparelho continua conectado.',
  ],
  3: [
    'Confira a revisão da placa que chegou (impressa nela) e se ela é a versão de 915 MHz. Pinagem e energia mudam de uma revisão para outra.',
    'Encaixe o pigtail (cabo curtinho com um conector U.FL numa ponta e SMA na outra) no conector da placa. Pressione reto, sem entortar, até o clique.',
    'Rosqueie a antena de 915 MHz no conector SMA. Só depois disso ligue a placa. Sem antena, o chip de rádio pode queimar.',
    'Grave o firmware "Repetidor" (página "Gravar o firmware").',
    'Configure o repetidor por USB, não por Bluetooth. Digite os comandos da página "Comandos" um por vez, esperando a resposta de cada um.',
    'Preencha à mão, no papel, o nome, a senha de admin e a posição aproximada. O nome só fica completo depois da gravação, porque usa o código da chave pública.',
    'Teste de bancada: com a placa ligada na mesa, use outro rádio com o app MeshCore (um companion) e veja se o repetidor aparece na lista de contatos.',
    'Ainda no teste, entre como administrador (Gerir, com a senha) e confira que o repetidor responde.',
    'Use uma fonte USB de 5 V de boa qualidade, de marca. Fonte chaveada barata gera ruído de rádio e piora o seu próprio sinal. Se o sinal piorar com a fonte ligada, troque a fonte e teste de novo.',
    'Monte na caixa clara com respiro. O cabo da fonte entra por um prensa-cabo bem apertado, com a curva para baixo (pingadeira) do lado de fora.',
    'Prenda a placa por dentro com espuma ou fita dupla-face. Nada solto batendo.',
    'Este repetidor fica do lado de fora: varanda, laje ou telhado. Dentro de casa, concreto e metal bloqueiam o sinal de 923 MHz.',
    'Antes de levar para cima, feche a caixa, ligue e repita o teste (aparecer na lista e responder ao login). Assim você descobre o problema ainda na mesa.',
  ],
  4: [
    'Confira se você tem o kit com nRF52840 (a XIAO sozinha não tem rádio; ela precisa do módulo Wio-SX1262 encaixado). A versão ESP32-S3 gasta bem mais bateria; a auditoria avisa.',
    'Encaixe o módulo Wio-SX1262 na XIAO e ligue o pigtail (U.FL para SMA) no módulo. Rosqueie a antena de 915 MHz no SMA antes de dar qualquer energia à placa.',
    'Antes de juntar as duas baterias 18650, meça cada uma com o multímetro. Elas precisam ter a mesma tensão, com diferença de no máximo 0,05 V. Se não estiverem iguais, carregue cada uma cheia, separadamente, e meça de novo.',
    'Coloque as baterias em um suporte que as ligue em paralelo (os dois polos positivos juntos e os dois negativos juntos).',
    'Carregador com TP4056 e DW01 (a proteção da bateria): bateria nos pontos B+ e B−. A XIAO vai nos pontos OUT+ e OUT−. A proteção corta a energia se a bateria esvaziar demais.',
    'Carregador com CN3791: ele não protege a bateria contra descarga. Use um BMS 1S (placa que protege a bateria) entre a bateria e a XIAO, ou células com proteção. Siga o desenho da página "Ligação".',
    'Solde os fios nos pads BAT+ e BAT− que ficam embaixo da XIAO. Estanhe o pad primeiro e solde rápido, com o ferro em torno de 330 °C, para não esquentar a placa.',
    'Fio vermelho é positivo (+) e fio preto é negativo (−). Confira a polaridade três vezes com o multímetro antes de ligar. Inverter mata a placa.',
    'O painel solar vai na entrada do carregador, nunca direto na USB da XIAO. O painel de 6 V passa de 7 V sem carga e o carregador interno da XIAO é fraco.',
    'Grave o firmware "Repetidor" e configure por USB, com a página "Comandos", um comando por vez (antes de fechar a caixa).',
    'Teste de bancada 1: com a bateria carregada e sem o cabo USB, a placa liga sozinha? Deve ligar.',
    'Teste de bancada 2: com outro rádio e o app MeshCore, veja se o repetidor aparece nos contatos e responde ao login de administrador.',
    'Teste de bancada 3: meça a corrente média parada, com medidor USB ou multímetro em série. Para nRF52840 com o módulo de rádio em escuta, o esperado fica por volta de 5 a 10 mA. Muito acima disso, procure o problema.',
    'Teste de bancada 4: ponha o painel no sol. O LED de carga acende e a tensão da bateria sobe?',
    'Teste de descarga completa: deixe o repetidor só na bateria, sem painel, até a proteção cortar a energia. Depois ligue o painel e veja se ele volta sozinho. Desde o firmware 1.18, a maioria das placas nRF52 não se desliga sozinha com a bateria fraca e pode travar. Se não voltar, não instale.',
    'Depois de passar na descarga, deixe 48 horas funcionando só no painel, com a bateria carregando e descarregando. Só então leve para o lugar definitivo.',
    'Feche a caixa: prensa-cabo no fio do painel, respiro de equalização, sachê de sílica gel dentro, tudo preso com espuma.',
  ],
});
