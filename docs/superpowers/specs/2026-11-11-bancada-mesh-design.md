# Bancada Mesh — documento de design

> **Status:** **aprovado pelo dono em 11/11/2026** (revisado antes por um agente "construtor") · **Data:** 11/11/2026
> **Próximo passo:** plano de construção (superpowers:writing-plans) numa janela limpa, partindo só deste
> documento e da skill.
> **Base de conhecimento:** skill `meshcore-hubreal` (snapshot de 10/11/2026, firmware MeshCore v1.18.0),
> mantida num repositório privado do mantenedor.
> **Esboço visual de referência:** `esboco-bancada-mesh.html`, na mesma pasta deste documento. Abra no navegador.
> O esboço é descartável: serve para mostrar o fluxo e o visual, não como base de código.
>
> Legenda das decisões: **[usuário]** = decidido pelo dono do projeto · **[design]** = decisão de quem escreveu
> este documento, que o dono pode mudar · **[construtor]** = fica a critério de quem constrói.

---

## 1. Intenção e porquê

MeshCore é uma rede de rádio LoRa que troca mensagens de texto sem internet nem celular. No Brasil, a
comunidade MeshCore Brasil combinou um padrão: preset "Australia: SA, WA" (923,125 MHz, BW 62,5, SF 8,
CR 8), regiões `br-UF-DDD`, nomes de repetidor e assim por diante. Quem chega agora erra muito, e os erros
se repetem: compra antena de 868 MHz, bateria 18650 "9.900 mAh" falsa, carregador sem proteção, painel
pequeno demais, põe repetidor dentro de casa, usa placa ESP32 em repetidor solar ou digita um número errado
no `set radio`.

O **Bancada Mesh** é um site público e grátis em que qualquer pessoa, inclusive quem nunca mexeu com rádio,
escolhe um projeto pronto, troca peças se quiser e recebe na hora uma auditoria técnica com regras fixas.
No fim, baixa um PDF com tudo o que precisa para montar.

**Sucesso [usuário]:** a pessoa sai do site com **um projeto que vai funcionar**.

## 2. Para quem

- **Público principal:** leigos. Não sabem o que é dBm, SF ou BMS e chegam pelo celular, vindos de um grupo
  de Telegram ou de uma busca.
- **Público secundário:** quem já monta e quer conferir uma combinação de peças ou gerar os comandos sem
  errar.
- O site é um **projeto comunitário neutro [usuário]**: sem marca de empresa, e o dono é só mais um
  contribuidor. Ele não pode parecer site oficial do MeshCore nem da página do MeshCore Brasil.

## 3. Objetivos

1. Levar o leigo do "quero um rádio" até uma lista de compras, um desenho de ligação, os comandos e um
   passo a passo **que funcionam**, sem precisar entender a teoria.
2. Mostrar **por que** cada problema importa e **como** resolver, em linguagem simples, com um botão que
   aplica a correção.
3. Gerar comandos já no padrão BR, com região e `txdelay` preenchidos, para eliminar erro de digitação.
4. Rodar inteiro no navegador: **sem IA, sem servidor, sem custo por visita [usuário]**.
5. Ser mantido pela comunidade: qualquer pessoa sugere correções e uma pessoa confere a fonte antes de mudar.

## 4. Não-objetivos

- **Parte legal / ANATEL** (potência máxima permitida, homologação, EIRP): fica de fora **[usuário]**. O site
  não diz que nada é "legal" ou "ilegal". Os limites técnicos de amplificador (o que queima ou danifica)
  continuam, porque são sobre a peça funcionar.
- Conta, login ou salvamento de projeto no site **[usuário]**. Fechou a página, começa de novo.
- Simulador genérico de qualquer hardware. Na v1, só os **7 projetos prontos**, cada um com as peças
  alternativas listadas para cada posição. **[design]**
- Links de loja, afiliados, cotação de preço ou recomendação de vendedor. Preço só como faixa, com a data.
  **[design]**
- Meshtastic, rádio de voz e radioamador VHF/UHF.
- Previsão de cobertura de rádio, mapa da rede ou dados ao vivo da malha. O site aponta para o mapa, o
  CoreScope e o MeshMapper, mas não os reproduz.
- Outros idiomas na v1 (só português do Brasil).

## 5. Anti-objetivos (fracasso mesmo que "funcione")

- **Falso OK:** o site aprovar um projeto que falha na prática. É o pior erro possível. Na dúvida, a regra
  vira "atenção" e manda medir, nunca "ok".
- Parecer oficial, de empresa ou de uma pessoa (o nome do dono no endereço do site, por exemplo).
- Afirmar legalidade ou ilegalidade.
- Jargão sem explicação na primeira camada da tela.
- Copiar texto de sites sem licença. As páginas da Mesh Sorocaba não têm licença: só resumir com palavras
  próprias e dar o link.
- Usar foto de loja ou de fabricante (Heltec, RAK etc.).
- Mandar dado da pessoa para fora do navegador: senha, coordenadas, nome do nó, endereço.

## 6. Restrições

| Restrição | Detalhe |
|---|---|
| Hospedagem | Estática e grátis: GitHub Pages **[usuário]**, numa **organização própria do GitHub** com o nome do projeto (ex.: `bancadamesh.github.io`), não na conta pessoal **[usuário]**. |
| Sem IA, sem backend | Auditoria por regras fixas em JavaScript, rodando no navegador **[usuário]**. O PDF também é gerado no navegador. |
| Privacidade | Nenhum dado digitado sai do navegador. Sem cookies e sem rastreamento de terceiros **[design]**. Fontes servidas pelo próprio site, sem Google Fonts em produção **[design]**. |
| Celular | Tem que funcionar bem num celular comum (largura de 375 px) e com toque. |
| Acessibilidade | Contraste ≥ 4,5:1. Problema nunca indicado só pela cor (sempre ícone + texto + contorno). Teclado funciona em tudo, inclusive nas peças do desenho. Respeitar `prefers-reduced-motion`. |
| Imagens | Ilustrações SVG próprias **[usuário]**. Fotos reais só com licença livre e crédito: wiki da Seeed (CC BY-SA 4.0) e Wikimedia Commons, categoria Meshtastic **[usuário]**. Nada de foto de loja ou fabricante. |
| Textos | Em palavras próprias. A documentação oficial do MeshCore é MIT: pode citar com crédito. |
| Fonte das regras | Toda regra precisa ter fonte (arquivo da skill + link original) e data de conferência. Regra sem fonte não entra. |

## 7. Decisões já tomadas

### 7.1 Nome e identidade
- Nome: **Bancada Mesh**. Subtítulo: *"monte seu rádio MeshCore sem errar"* **[usuário]**.
- "MeshCore" aparece só no subtítulo e no texto, para não parecer ferramenta oficial **[design]**.
- Marca simples: três nós ligados em triângulo, como no esboço. Desenho final a cargo do construtor.
- Rodapé fixo: "Projeto comunitário e independente. Não é oficial do MeshCore nem do MeshCore Brasil." **[design]**

### 7.2 Fluxo: "mistura" do assistente com a bancada **[usuário]**

São 3 passos com indicador de progresso (voltar sempre disponível):

1. **Escolha um projeto.** Sete cartões, do mais simples ao mais trabalhoso. Cada cartão mostra: nome, para
   que serve (uma frase), dificuldade de 1 a 5 pontos, se precisa soldar, placa principal e faixa de custo
   com data. Clicar leva direto ao passo 2.
2. **Monte na bancada.** É a tela principal, em três áreas:
   - **Trocar peça** (esquerda): as alternativas de cada posição do projeto (placa, bateria, carregador,
     painel, antena, caixa…), com a peça em uso marcada.
   - **Montagem** (centro): desenho SVG da montagem com as peças clicáveis. Clicar mostra o detalhe da peça,
     o motivo de ela estar ali e o link "ver foto real", quando existe foto livre. Peças com problema
     **acendem** (contorno tracejado + selo).
   - **Auditoria ao vivo** (direita): barras de autonomia sem sol e de painel (meta marcada), mais a lista de
     itens. Clicar num item acende a peça. Um botão "Trocar por…" aplica a correção sugerida.
   - Campos abaixo do desenho: **onde vai ficar** (telhado/poste · prédio/morro baixo · serra/pico/torre ·
     dentro de casa), **dias sem sol** (padrão 9) e **estado + DDD** (para a região).
   - No celular, as três áreas viram abas: **Peças · Montagem · Auditoria**.
3. **Baixe o PDF.** Prévia das páginas e botão de baixar.

A auditoria **não é uma etapa separada**: ela recalcula a cada mudança.

**[design]** Se sobrar problema sem resolver, o PDF baixa mesmo assim, mas a capa traz um aviso vermelho
listando os problemas. O motivo é não travar quem tem uma razão para usar aquela peça.

**[design]** A lista inicial de cada projeto pronto sempre passa na auditoria sem nenhum problema. Isso vira
teste automático (ver §11).

### 7.3 Visual: "folha de bancada"

Saiu da análise com a skill `ui-ux-pro-max`. A recomendação anterior (Poppins/Open Sans, roxo + verde,
"vibrant block", padrão "community landing") **foi descartada [design]**:
- é padrão de página de comunidade (contagem de membros, botão "entrar"), e aqui é uma ferramenta sem conta;
- o verde do botão se confunde com o verde de "OK" da auditoria;
- blocos grandes e animados competem com o destaque de problema;
- na Poppins, `1 l I` e `0 O` se confundem, e a pessoa precisa copiar `923.125` sem errar.

Proposta adotada **[design]**:
- **Estilo plano** ("Flat Design", WCAG AAA): fundo de papel, linhas finas, sem sombra decorativa. É o mesmo
  visual na tela e no PDF, e imprime bem em preto e branco.
- **Letras:** Atkinson Hyperlegible no texto e títulos. JetBrains Mono em números, comandos e valores, com
  algarismos de largura fixa.
- **Cores:**

| Papel | Cor | Uso |
|---|---|---|
| Azul-tinta | `#1E3A8A` | botões, seleção, links |
| Tinta | `#0F172A` | texto |
| Texto secundário | `#475569` | notas |
| Papel | `#F5F6F8` | fundo |
| Linha | `#D5DBE3` | bordas |
| OK | `#15803D` (fundo `#E8F5EC`) | **só** resultado de auditoria |
| Atenção | `#A35400` (fundo `#FDF1DF`) | **só** resultado de auditoria |
| Problema | `#B91C1C` (fundo `#FDECEC`) | **só** resultado de auditoria |
| Placa (ilustração) | `#2B3440` | |
| Cobre (ilustração) | `#B9822F` | conectores |

- Verde, laranja e vermelho **nunca** aparecem fora do resultado da auditoria. Exceção: fio vermelho/preto
  para +/− nos desenhos, por ser convenção de eletricidade. O destaque de problema no desenho é **contorno
  tracejado + selo com ícone**, nunca só a cor.
- Tema claro apenas na v1 **[design]**.

### 7.4 Ilustrações e fotos
- Uma ilustração SVG própria por peça, todas no mesmo traço: contorno de 2 px, cores chapadas, cantos
  levemente arredondados, sem degradê. Cada peça tem uma versão pequena (catálogo) e o desenho de montagem.
- O desenho de montagem de cada projeto é feito à mão (não gerado automaticamente). Cada peça é um grupo
  clicável e focável pelo teclado, com nome acessível.
- **Não existe "fiação ilustrativa" [design].** Se uma troca muda a ligação (número de células, BMS a mais,
  placa com carregador próprio como o T114, pinos diferentes), essa combinação tem um **desenho próprio e
  correto**. Sem desenho correto, a alternativa **não é oferecida** na bancada. É assim que o construtor
  controla o custo: oferecendo menos alternativas, nunca desenhando errado. Exceção: os **contraexemplos**
  (peça errada que a auditoria reprova, como antena 868 ou bateria falsa) podem reaproveitar o desenho
  padrão com a peça marcada, porque o PDF sai com o aviso vermelho na capa.
- "Ver foto real" abre a foto com crédito, licença e link de origem. Peça sem foto livre mostra: "Sem foto
  de licença livre: só a ilustração."
- Os SVGs da skill (`assets/diagramas/*.svg`: fiação do repetidor solar, instalação no mastro, `txdelay`
  por altura, antenas) servem de referência de conteúdo, mas precisam ser redesenhados no estilo único.

### 7.5 Auditoria: como funciona
- **Três níveis:** **Problema** (não vai funcionar ou pode danificar), **Atenção** (funciona com ressalva ou
  precisa medir) e **OK**.
- Cada item mostra: título curto, uma ou duas frases de "por que importa" e, quando há, a correção com
  botão.
- As regras ficam num **arquivo de dados público** (formato a critério do construtor), separado do código
  de tela. Cada regra tem: identificador, condição, nível, texto leigo, correção sugerida, **fonte** (arquivo
  da skill + link original), **data de conferência** e versão de firmware de referência.
- O site mostra no rodapé e na capa do PDF: "regras conferidas em DD/MM/AAAA · firmware X.Y.Z".
- Cada item da auditoria tem o link "achei um erro" (ver §7.7).

### 7.6 PDF **[usuário aprovou a lista]**
Gerado no navegador, pensado para montar com o papel na mão e sem internet. Imprime em preto e branco.

1. **Capa:** nome do projeto, data, versão das regras e do firmware, resultado da auditoria ou o aviso
   vermelho com os problemas pendentes.
2. **Lista de compras** com caixinhas de marcar: quantidade e o detalhe que evita erro ("versão 915 MHz",
   "TP4056 **com** DW01", "18650 de marca"). Preço como faixa, com data e fonte. Sem link de loja.
3. **Desenho da ligação:** o mesmo SVG da bancada, com os alertas (nunca ligar sem antena, conferir
   polaridade, vermelho = +, preto = −).
4. **Gravar o firmware:** qual tipo escolher no flasher (Repetidor / Companion Bluetooth / Observer) e como
   pôr **aquela** placa em modo de gravação.
5. **Comandos já preenchidos**, um por linha, com caixinha de marcar. A região sai do estado + DDD e o
   `txdelay` sai de "onde vai ficar". **Nome, senha e coordenadas ficam em branco para preencher à mão
   [usuário]**: o nome depende de um código que só existe depois de gravar, e senha e localização não devem
   passar pelo site.
6. **Conta de energia** com os números do projeto (consumo, bateria necessária, autonomia, painel mínimo).
7. **Montagem e teste de bancada** (descarga completa, 48 h só no solar), **instalação** (altura, painel
   para o norte, água, calor, segurança) e **manutenção** (a cada 3–6 meses).
8. **Depois de ligar:** enviar o anúncio, aparecer no mapa e no CoreScope, etiqueta da rede, guardar uma
   cópia offline do app e uma página "ninguém me ouve, e agora?" (fluxo de diagnóstico).

Fora do PDF: parte legal / ANATEL **[usuário]**.

### 7.7 Manutenção e sugestões **[usuário]**
- **O público sugere e uma pessoa confere se é verdade antes de mudar.** Sugestão só vira mudança com
  fonte: documentação oficial, nota de versão, página da comunidade ou medição.
- **Dois canais:**
  1. **Formulário sem cadastro**, para qualquer pessoa. Serviço grátis a critério do construtor; o
     respondente não pode precisar de conta.
  2. **GitHub** (issue com modelo pronto), para quem já usa.
  O link "achei um erro" em cada peça, item de auditoria e comando já leva o identificador da regra ou da
  peça.
- **Orientação sobre IA [usuário]**, no formulário e no modelo do GitHub:
  - aviso: *"Usou IA para escrever? Tudo bem, mas IA costuma inventar comandos do MeshCore. Confira na
    documentação antes de mandar."*;
  - pergunta obrigatória: *"Você usou IA (ChatGPT, Gemini…) para escrever isto?"*;
  - **fonte obrigatória** para quem marcar "sim". Sugestão sem fonte não vira regra, venha de quem vier.
  - Do lado dos mantenedores: se usarem IA para ajudar a conferir, a decisão final é de uma pessoa, olhando
    a fonte original.
- **Lembrete automático e grátis [usuário]:** uma automação no GitHub que abre um aviso "saiu versão nova do
  firmware MeshCore, revisar regras" a cada release de `github.com/meshcore-dev/MeshCore`. Ela só lembra,
  não muda nada.
- **Checklist de revisão** (a cada firmware novo ou sugestão aceita): reconferir as fontes de
  `references/fontes.md` da skill, atualizar o arquivo de regras e a data, rodar os testes e **atualizar
  também a skill privada**, já que as duas coisas são mantidas em paralelo **[design]**.

### 7.8 Licenças **[design, o dono pode mudar]**
- Código do site: MIT (a mesma do MeshCore).
- Textos e ilustrações próprios: CC BY-SA 4.0 (compatível com as fotos da Seeed).
- Fotos de terceiros mantêm a licença original, com crédito ao lado.

---

## 8. Regras de auditoria

Derivadas da skill `meshcore-hubreal`. A coluna "Fonte" aponta o arquivo da skill. O link original de cada
fonte está em `references/fontes.md` e `references/manuais-e-datasheets.md`.

### 8.1 Valores fixos do padrão BR (não editáveis pelo usuário; entram nos comandos)

| ID | Regra | Fonte |
|---|---|---|
| CFG-01 | Rádio: `set radio 923.125,62.5,8,8`. No app (companion): preset **"Australia: SA, WA"**, idêntico ao "Brazil" da API. Nunca "Australia" (915,8/BW250) nem "Australia (Narrow)". O PDF manda conferir os 4 números dígito a dígito. | SKILL.md (Padrão nacional) |
| CFG-02 | Potência: `set tx 22`, fixo nas placas sem amplificador. **Em placa com amplificador (PA)** o padrão também é 22 (no projeto 6 é isso que dá 1 W), mas a pessoa pode **reduzir** para 19 ou 16. A bancada mostra a saída real e o pico de corrente de cada opção (HW-12), e o pico entra na conta de energia. Nunca acima de 22. **[design]** | SKILL.md; hardware-energia.md (tabela PA, "reduzir TX na dúvida") |
| CFG-03 | Hash de caminho de 2 bytes: repetidor `set path.hash.mode 1`; companion em Definições Experimentais. | padroes-comunidade-br.md §1–2 |
| CFG-04 | Região: `region def br br-<uf> br-<uf>-<ddd>` + `region save`, tudo **minúsculo e exato**. UF entre as 27 siglas; DDD válido para aquela UF. Não negar `*`. **[design]** Como o 3º nível pode ser um agrupamento combinado (`br-sp-valeparaiba`, `br-sc-litoral`) ou um código de fronteira, há um campo opcional "minha área usa outro nome de região", que valida só o formato (minúsculo, sem acento, começa com `br-<uf>-`). O item de região **nunca sai como OK**: é sempre uma Atenção fixa, "confira a grafia exata com o grupo local ou em Descobrir Regiões no app; uma letra diferente faz o repetidor descartar o tráfego sem avisar". Na v1 não existe lista de agrupamentos; ela pode vir depois, alimentada pelas sugestões (§7.7). | padroes-comunidade-br.md §4 |
| CFG-05 | Repetidor: `set flood.advert.interval 23` (mín. 23, ideal 47), `set rxdelay 3`, `set loop.detect moderate` (o padrão do fw 1.18 em instalação nova é `minimal`), `set multi.acks 1`, `set agc.reset.interval 300`, `set radio.rxgain on` (fw ≥ 1.14.1; conferir com `get radio.rxgain`). **Fora da lista: `set advert.interval 0`.** O padrão BR quer o anúncio zero-hop desligado, mas a documentação oficial aceita só 60–240 nesse comando, e o firmware já zera o valor sozinho quando o nó é configurado. No lugar dele, o PDF manda conferir com `get advert.interval` (tem que dar 0). **[design]** | SKILL.md; padroes-comunidade-br.md §2; oficial/cli_commands.md ("zero-hop advert interval") |
| CFG-06 | `txdelay` por local: telhado/poste **0.5** · prédio/morro baixo **1.0** · serra/pico/torre 360° **2.0**. | padroes-comunidade-br.md §3 |
| CFG-07 | Nome do repetidor: `CIDADE-REGIONAL-XXXX`, **máx. 23 bytes**, sem acento nem emoji; XXXX = 4 primeiros caracteres hex da chave pública (só existem depois de gravar). O PDF deixa em branco, explica o formato e aponta os geradores. | padroes-comunidade-br.md §5 |
| CFG-08 | Configuração do repetidor **por USB** (não por Bluetooth), **um comando por vez**, `set radio` ajustado **na bancada**. | SKILL.md (Checklist de repetidor) |
| CFG-09 | Senha de admin forte (o PDF deixa em branco); senha de convidado vazia; "Owner Info" sem dado pessoal sensível; Repeat Mode ligado. | padroes-comunidade-br.md §2 |
| CFG-10 | Posição manual e aproximada (o PDF deixa em branco); sem GPS em nó fixo. | padroes-comunidade-br.md §2, §7 |
| CFG-11 | A chave privada (`get prv.key`) é segredo: guardar offline e salvar antes de apagar ou regravar. | SKILL.md (Reset de fábrica) |

### 8.2 Energia (projetos com bateria/solar)

Método da Mesh Sorocaba, como está na skill (`hardware-energia.md`):

```
I        = consumo médio (mA)                 nRF52840 ≈ 10 · ESP32 (fw ≥ 1.16) ≈ 45 · +GPS +30–60
N        = dias sem sol (padrão 9, editável)
frac     = fração útil da Li-ion = 0,68       (de 4,2 V até 3,6 V)
E        = I × 24 × N                         (mAh)
C_nec    = E ÷ frac                           (bateria necessária, mAh)
autonomia= C_instalada × frac ÷ (I × 24)      (dias)
E_rec    = C_nec × frac + I × 24 × D          D = dias de sol para recarregar (padrão 2)
I_sol    = E_rec ÷ (HSP × D)                  HSP = horas de sol pleno (padrão 4,2)
P_min    = I_sol × 6 V ÷ 1000                 (W)
P_rec    = P_min × 1,25                       (margem de 20–30 %)
```

Exemplo de conferência (deve bater nos testes): nRF52840, 10 mA, 9 dias → E = 2.160 mAh, C_nec ≈ 3.176 mAh,
I_sol ≈ 314 mA, P_min ≈ 1,9 W, P_rec ≈ 2,4 W. Com 2 × 3.500 mAh: autonomia ≈ 19,8 dias.

**Só este método vale, no site e no PDF [design].** A conta de exemplo de `guia-repeater-xiao-solar.md` §5
(8 mA, 6 Ah, sem a fração 0,68, 4,5–5 h de sol, "~30 dias") **não** pode ir para o PDF: ela contradiz a
auditoria. O PDF mostra os números calculados aqui.

**Campos editáveis não podem gerar falso OK [design].** "Dias sem sol", "dias para recarregar" e "horas de
sol pleno" podem ser mudados. Se a pessoa usar um valor **menos conservador** que o padrão (menos de 9 dias
sem sol, **mais** de 2 dias para recarregar, mais de 4,2 horas de sol; quanto mais dias para recarregar,
menor o painel exigido), os itens de energia ficam **no máximo
em Atenção**, com a frase "com os valores padrão da comunidade daria X". Limites de digitação: dias sem sol
1–20, dias para recarregar 1–7, horas de sol 2–7.

**Placa com amplificador:** o consumo médio depende do tráfego e da potência escolhida (CFG-02). Enquanto não
houver medição (§12), o projeto 6 não mostra OK de energia, só Atenção com "meça o seu consumo".

| ID | Quando | Nível | Mensagem (resumo) |
|---|---|---|---|
| EN-01 | 18650 anunciada com mais de 3.500 mAh (a skill dá "máx. real ~3.500 mAh") | Problema | Capacidade falsa; não dá para confiar na conta. Usar célula de marca (Samsung 35E, LG MJ1, Molicel). A autonomia não é calculada. |
| EN-02 | autonomia ≥ N | OK | "Aguenta ~X dias sem sol" + lembrete de medir o consumo real. |
| EN-03 | 0,6·N ≤ autonomia < N | Atenção | Pôr mais uma célula em paralelo. |
| EN-04 | autonomia < 0,6·N | Problema | Falta bateria; se a placa for ESP32, sugerir nRF52840. |
| EN-05 | painel não cobre nem o consumo de um dia de sol: (W ÷ 6 V × 1000) × HSP < I × 24 (tudo em mAh) | Problema | Painel insuficiente; sugerir ≥ P_rec. |
| EN-06 | painel < P_min | Atenção | Recarrega devagar depois de dias nublados. |
| EN-07 | P_min ≤ painel < P_rec | Atenção | Passa sem a margem de 20–30 %. |
| EN-08 | painel ≥ P_rec | OK | "Painel dá conta". |
| EN-09 | células em paralelo | (instrução no PDF) | Medir antes: mesma tensão ±0,05 V. |
| EN-10 | bateria **sem nenhuma proteção de descarga** (sem DW01, sem BMS 1S e sem células protegidas), em **qualquer** placa sem bootlock | Problema | Desde o fw 1.18 a maioria das nRF52 (XIAO, RAK4631/3401, T114, SenseCAP Solar, GAT562) não se desliga sozinha com bateria fraca: pode travar e não voltar. ESP32 também não tem esse corte. Exceções com bootlock: heltec_t1, heltec_tower_v2, muzi_base. |
| EN-11 | CN3791 (MPPT): ele mesmo não protege a descarga | Problema, se não houver BMS 1S nem células protegidas (cai no EN-10); OK com BMS | O CN3791 é o carregador **bom** da skill. A correção sugerida é **acrescentar um BMS 1S** (ou usar células protegidas), **não** trocar de carregador. No catálogo, "CN3791 + BMS 1S" aparece como uma opção só, com desenho próprio. |
| EN-12 | painel ligado direto no USB-C do XIAO | Problema | Painel "6 V" passa de 7 V em aberto e o carregador interno é fraco. |
| EN-13 | LDO MCP1700 (250 mA) alimentando ESP32 transmitindo a 22 dBm | Atenção | Risco de reiniciar no pico de TX; a bateria fica invisível ao firmware (sem telemetria). |
| EN-14 | qualquer repetidor a bateria | (instrução no PDF) | Teste de descarga completa na bancada e 48 h só no solar antes de instalar. |
| EN-15 | Heltec V4 | (cálculo) | Usar 3,8 V como tensão mínima, não 3,6 V. A fração útil correspondente **não está na skill** (ver §12). |

Thresholds de 0,6·N e de 1,25 × P_min: **[design]**. O 1,25 vem da margem de 20–30 % da skill; o 0,6 é
decisão de produto.

### 8.3 Peças e compatibilidade

| ID | Quando | Nível | Mensagem (resumo) | Fonte |
|---|---|---|---|---|
| HW-01 | placa/rádio em versão 868 ou 433 MHz | Problema | Comprar sempre a versão 915 MHz. | hardware-energia.md |
| HW-02 | antena fora de 915–928 MHz (ex.: 868) | Problema | A rede usa 923,125 MHz. | SKILL.md; hardware-energia.md |
| HW-03 | sempre | (alerta fixo no desenho e no PDF) | Nunca ligar o rádio sem antena: pode queimar o SX1262. | SKILL.md |
| HW-04 | antena caseira (colinear de fio, COCO) | Atenção | Só com ROE medida em NanoVNA (< 1,5 em 923 MHz). Para quem não tem NanoVNA, omni comercial de 5–6 dBi. | hardware-energia.md (Antenas) |
| HW-05 | antena de ganho alto (6–9 dBi) em serra/pico olhando para baixo | Atenção | Lóbulo achatado; preferir 3–5 dBi. | hardware-energia.md |
| HW-06 | cabo coaxial RG-58 longo | Atenção | Perde ~0,5 dB/m em 900 MHz; melhor rádio perto da antena com pigtail curto, ou LMR-400/RG-213. Limite de "longo": **[design]**, sugestão > 1 m. | hardware-energia.md |
| HW-07 | placa ESP32 em repetidor solar | Atenção (vira Problema via EN-04) | Gasta 4–8× mais que nRF52840; ESP32 só faz sentido na tomada ou como observer. | SKILL.md; hardware-energia.md |
| HW-08 | GPS ligado em nó fixo | Atenção | +30–60 mA sem benefício; posição é manual. | hardware-energia.md |
| HW-09 | placa sem suporte oficial (ex.: Wio Tracker L2 Pro) | Problema | Não há variante no repositório oficial (conferido em 10/11/2026). | SKILL.md |
| HW-10 | XIAO nRF52840 sem o Wio-SX1262 | Problema | A XIAO sozinha não tem rádio LoRa. | hardware-energia.md |
| HW-11 | T-Beam como repetidor solar | Atenção/Problema via energia | ESP32 + GPS; nenhuma comunidade BR indica. | hardware-energia.md |
| HW-12 | placa com amplificador (PA) | Atenção (informativa) | O número do `set tx` não inclui o ganho do PA: Heltec V4 em 22 → ~28 dBm; RAK3401+RAK13302 em 22 → 30 dBm, ~1 A de pico. Errar a potência pode danificar o rádio. Sem falar de limite legal (§4). | hardware-energia.md (tabela PA) |
| HW-13 | RAK13302 alimentado em 3,3 V | Problema | O estágio de 1 W não funciona bem em 3,3 V; usar a variante/alimentação de 5 V. | manuais-e-datasheets.md |
| HW-14 | Heltec V3 como companion | Atenção (informativa) | Bluetooth de alcance curto e queda conhecida (FAQ 6.6); gasta mais bateria. | hardware-energia.md; oficial/faq.md 6.6 |
| HW-15 | revisão da placa | (instrução no PDF) | Conferir a revisão (V3/V3.1/V3.2, V4.2/V4.3/V4-R8, T114 v1/v2, RAK13302 VC/VD): pinagem e energia mudam. | manuais-e-datasheets.md |

### 8.4 Instalação

| ID | Quando | Nível | Mensagem (resumo) | Fonte |
|---|---|---|---|---|
| IN-01 | repetidor "dentro de casa" | Problema | Concreto e metal bloqueiam 923 MHz; repetidor só funciona do lado de fora. | SKILL.md (Diagnóstico) |
| IN-02 | caixa sem respiro | Atenção | Forma condensação; usar respiro IP67 + sílica. | hardware-energia.md |
| IN-03 | caixa escura ou no sol | Atenção | Passa de 60 °C; Li-ion carregando acima de 45 °C degrada. Caixa clara, à sombra. | SKILL.md; hardware-energia.md |
| IN-04 | repetidor só na tomada | Atenção (informativa) | Na falta de luz ele desliga; para apagão, usar bateria ou o projeto solar. **[design]**, deduzido do propósito da rede. | — |
| IN-05 | sempre | (instrução no PDF) | Água (prensa-cabo, pingadeira, dreno, fita autofusão), painel para o norte com inclinação ≈ latitude, segurança (não subir sozinho, longe da rede elétrica, aterramento em mastro alto). | guia-repeater-xiao-solar.md §6; hardware-energia.md |
| IN-06 | observer móvel | Problema | Observer precisa ser fixo; móvel gera dados enganosos. | padroes-comunidade-br.md §7 |
| IN-07 | observer sem Wi-Fi no local | Problema | O observer manda pacotes pela internet (MQTT). | padroes-comunidade-br.md §7 |

---

## 9. Os 7 projetos prontos

Ordem do mais simples ao mais trabalhoso **[usuário deixou a escolha para o design]**. Preços: Mesh Sorocaba,
27/04/2026, com frete e impostos; são referência, não cotação. "Alternativas" = o que aparece em "Trocar
peça" na bancada. Cada alternativa precisa ter as regras dela cobertas.

| # | Projeto | Papel / firmware | Peças padrão | Alternativas na bancada | Dificuldade · solda | Notas para o PDF |
|---|---|---|---|---|---|---|
| 1 | **Companion de bolso pronto** | Companion Bluetooth | Seeed Wio Tracker L1 Pro **ou** SenseCAP T1000-E (~R$ 380) | RAK WisMesh Tag (~R$ 345); Wio Tracker L2 Pro como exemplo de "sem suporte" (HW-09) | 1 · sem solda | Gravar pelo flasher; configurar no app (preset, hash 2 bytes, Send Advert, "olá" no Public); a Seeed alerta que OTA via nRF pode travar o T1000-E; guardar cópia offline do app. Sem conta de energia. |
| 2 | **Companion DIY Heltec V3** | Companion Bluetooth | Heltec V3 versão 915 MHz (~R$ 290), antena 915, bateria e caixa | Heltec V4 (HW-12) | 2 · solda leve | HW-14 (Bluetooth/consumo); modo de gravação ESP32-S3 (segurar PRG/BOOT ao plugar). Especificação da bateria: **lacuna** (§12). |
| 3 | **Repetidor de varanda na tomada** | Repetidor | Heltec T114 ou Heltec V3, fonte USB 5 V, caixa IP65 com prensa-cabo, pigtail curto + antena omni 915 | T114 ↔ V3; antena "pretinha" × omni; local | 2 · pouca solda | Fica **do lado de fora** (varanda, laje, telhado); recomendado mesmo com repetidor regional perto. IN-04 (falta de luz). Fonte chaveada ruim causa interferência (Diagnóstico). |
| 4 | **Repetidor solar XIAO** | Repetidor | Kit XIAO nRF52840 + Wio-SX1262; 2× 18650 de marca em paralelo; TP4056 com DW01 (ou CN3791 + BMS); painel 6 V 2–5 W; pigtail U.FL→SMA 10–15 cm; antena 915 MHz; caixa IP65 clara + prensa-cabo + respiro + sílica | as de `guia-repeater-xiao-solar.md` §1, mais os contraexemplos (sem DW01, bateria falsa, painel 1 W, antena 868, sem respiro, ESP32) | 3 · solda (pads BAT embaixo da XIAO) | BOM, esquema, gravação, teste de bancada, instalação e manutenção: `guia-repeater-xiao-solar.md`, **exceto** a "Conta de energia (exemplo)" do §5 (usar só §8.2) e o `set advert.interval 0` do §4 (ver CFG-05). Comandos sempre da §8.1. Total R$ 300–600. |
| 5 | **Repetidor solar T114** | Repetidor | Heltec T114 sem tela; 3× 18650 3.200 mAh em paralelo + BMS; carregador CN3065; painel 9 W; caixa ABS IP65 150×100×70; pigtail IPEX→N de 10 cm de qualidade; prensa-cabo PG7; válvula de respiro; fita de alumínio na tampa | bateria (1–3 células), painel, antena, caixa | 3 · solda básica (1–2 h) | Referência: repetidor T114 do MeshCore Portugal (`portugal-e-plano333.md`), **só o hardware**; frequências de PT não valem. EN-10 (T114 sem bootlock desde o 1.18). |
| 6 | **Repetidor 1 W RAK solar** | Repetidor | RAK3401 + RAK13302 (1 W) + base WisBlock; bateria, painel e caixa | potência `set tx` (22/19/16 → 30/27/24 dBm) | 4 · montagem modular | HW-12, HW-13; pico de ~1 A a 5 V. Consumo médio **não está na skill** (depende do tráfego): ver §12. Kit de referência: WisMesh 1W Booster Starter Kit. |
| 7 | **Observer Wi-Fi** | Observer (manda pacotes por MQTT ao CoreScope/MeshMapper) | Placa ESP32 com Wi-Fi (Heltec V3/V4) na tomada, antena 915, caixa | placa; local | 4 · sem solda, mais configuração | Firmware de observer (observer.gessaman.com, "Erase Device" na 1ª vez, apaga a configuração: salvar `get prv.key` antes) ou firmware MQTT nativo. Precisa de Wi-Fi no local; fixo (IN-06, IN-07). Instruções oficiais: analyzer.letsmesh.net/observer/onboard (FAQ 3.8). |

**[design]** Um projeto só vai ao ar quando todas as peças e regras dele tiverem fonte. Os projetos 1, 2, 6 e 7
têm lacunas (§12). No projeto 1 a lacuna é só o modo de gravação das placas, que se fecha lendo os guias
já listados na skill. Se elas não forem fechadas a tempo, a v1 sai com os demais e esses aparecem como "em
breve".

---

## 10. Fica a critério de quem constrói

- Stack do site estático (framework ou HTML/JS puro), desde que publique no GitHub Pages sem servidor.
- Biblioteca de geração de PDF no navegador e o layout exato das páginas, respeitando §7.6 e o visual §7.3.
- Formato do arquivo de regras e do catálogo de peças (JSON, YAML, módulos JS…).
- Desenho final das ilustrações e da marca, dentro do estilo §7.4.
- Serviço do formulário de sugestões (grátis, sem cadastro para quem responde).
- Lista de DDDs por UF (fonte pública).
- Tabela de horas de sol pleno por cidade: opcional. Na v1 basta o campo editável com padrão 4,2 e a
  explicação.
- Funcionar offline (PWA): opcional. O PDF já cobre o uso sem internet.
- Animações (curtas, 150–300 ms, só com significado e respeitando `prefers-reduced-motion`).

## 11. Sensores (como saber que está certo)

- **Teste por regra:** cada ID de §8 tem pelo menos um caso que dispara e um que não dispara.
- **Teste dos 7 projetos:** a lista padrão de cada um passa com **zero problemas**, e os números de energia do
  projeto 4 batem com o exemplo de §8.2.
- **Teste dos contraexemplos:** antena 868, 18650 "9.900 mAh", TP4056 sem DW01, **CN3791 sem BMS**, painel
  de 1 W, ESP32 solar e "dentro de casa" disparam o nível esperado. CN3791 **com** BMS passa.
- **Teste de falso OK por digitação:** com 2 dias sem sol ou 6 horas de sol, um ESP32 com 1 célula **não**
  sai OK (fica no máximo Atenção, §8.2).
- **Teste dos comandos:** a saída para (MG, 31, telhado) é exatamente
  `region def br br-mg br-mg-31` e `set txdelay 0.5`. A lista de comandos **não** contém
  `set advert.interval 0`. O item de região é sempre Atenção, nunca OK.
- Acessibilidade: contraste, navegação por teclado no desenho, leitor de tela lendo o resultado da
  auditoria.
- Verificação manual no celular (375 px) e impressão do PDF em preto e branco.

## 12. Lacunas e riscos (fechar antes de publicar o projeto afetado)

| Lacuna | Afeta | O que falta |
|---|---|---|
| Consumo médio do RAK3401+RAK13302 (1 W) | projeto 6 | Medição (PPK2 ou medidor USB) com tráfego típico. A skill só tem o pico (~0,75–1 A por ~0,6 s). |
| Base WisBlock e carregamento solar com picos de 1 A | projeto 6 | Qual base usar e se o carregador dela aguenta; não está na skill. |
| Bateria do companion Heltec V3 (tipo, conector, polaridade) | projeto 2 | Não está na skill; levantar no datasheet da Heltec (`manuais-e-datasheets.md`). |
| Fração útil para corte em 3,8 V (Heltec V4) | EN-15 | Curva de descarga; a skill só dá o valor para 3,6 V. |
| Detalhes do firmware de observer | projeto 7 | Passo a passo atual em observer.gessaman.com e analyzer.letsmesh.net. |
| Firmware muda rápido | todas | Lembrete de release + checklist §7.7. |
| Modo de gravação de cada placa | projetos 1, 6 (e qualquer placa nova) | A skill só tem o genérico de nRF52 (duplo toque no reset), o do XIAO e o do ESP32-S3 (PRG/BOOT). Faltam T1000-E (há só o link do guia MeshCore da Seeed), Wio Tracker L1 Pro (a wiki tem seção de recuperar bootloader), RAK WisMesh Tag e RAK3401. O passo 4 do PDF exige isso "para aquela placa". |
| `set advert.interval 0` | CFG-05 | A documentação oficial diz 60–240; conferir no firmware 1.18 se `0` dá erro no console. Até lá, fica fora dos comandos (CFG-05). |
| Nome livre? | identidade | Conferir se "Bancada Mesh" está livre como organização no GitHub e se não há outro projeto com o mesmo nome. |

## 13. Referências (skill `meshcore-hubreal`)

- `SKILL.md`: padrão nacional, checklists, armadilhas, versões de firmware.
- `references/padroes-comunidade-br.md`: rádio, parâmetros do repetidor, `txdelay`, regiões, nomes, canais,
  mapa/CoreScope/MeshMapper/observer, diagnóstico, etiqueta, apps.
- `references/hardware-energia.md`: placas, PA, consumo, dimensionamento, proteção de bateria, armadilhas,
  antenas, checagem de recomendações da internet.
- `references/guia-repeater-xiao-solar.md`: projeto 4 completo.
- `references/portugal-e-plano333.md`: hardware de referência do projeto 5.
- `references/manuais-e-datasheets.md`: links de manuais, esquemas e datasheets (conferir revisão).
- `references/oficial/`: documentação oficial MeshCore (MIT): `cli_commands.md`, `faq.md`,
  `nrf52_power_management.md` (desatualizada desde o 1.18), `radio_presets.md`.
- `assets/diagramas/`: SVGs de referência (redesenhar no estilo único).
