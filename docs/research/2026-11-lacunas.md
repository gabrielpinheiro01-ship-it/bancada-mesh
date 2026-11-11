# Pesquisa das lacunas (Task 8) — 11/11/2026

Regra: só conta como **fechada** a lacuna com fonte clara lida na data abaixo. Todas as leituras são de 11/11/2026,
salvo onde dito. Nada aqui foi inventado: onde a fonte não diz, está escrito "não consta".

---

## R1 — Modo de gravação (T1000-E, Wio Tracker L1 Pro, WisMesh Tag, RAK3401)

**Conclusão: FECHADA** para as 4 placas (com uma ressalva no Wio Tracker L1 Pro).

A skill (`hardware-energia.md`, "Modo de gravação por placa", commit 44a7e38) tem as 4 placas, cada uma com fonte.
Reabri as 4 páginas hoje e todas confirmam o que a skill diz:

| Placa | Fonte (lida em 11/11/2026) | O que a fonte diz | Sinal |
|---|---|---|---|
| SenseCAP T1000-E | https://wiki.seeedstudio.com/sensecap_t1000_e_meshcore/ | Cabo de carga ligado; segurar o botão e plugar o cabo magnético **2× rápido** (pode levar várias tentativas). Travou em DFU: segurar o botão e plugar 1× reinicia. O flasher também tem "Enter DFU Mode". | LED verde fixo; disco `T1000-E` em 10–15 s |
| Wio Tracker L1 / L1 Pro | https://wiki.seeedstudio.com/get_started_with_meshtastic_wio_tracker_l1/ | Cabo USB de **dados**, **duplo toque no Reset**; sair com 1 toque. Avisa para não usar NRF-OTA (pode deixar morto). | LED amarelo fixo; porta serial DFU |
| RAK WisMesh Tag | https://docs.rakwireless.com/product-categories/meshtastic/wismesh-tag/quickstart | **Duplo toque no botão de trás** (1 toque só reinicia; o da frente não faz DFU). USB = conector magnético de 4 pinos. | LED verde "respirando" = DFU por BLE |
| RAK3401 | https://docs.rakwireless.com/product-categories/wisblock/rak3401/quickstart/ | USB no PC e **duplo clique no reset da base WisBlock**. Aparece o drive `RAK4631` (mesmo bootloader). `INFO_UF2.TXT` com data Dec 1 2021 = bootloader atual. | Drive `RAK4631` |

Ressalvas honestas:
- As páginas do Wio Tracker L1 e do WisMesh Tag são guias de **Meshtastic**. O procedimento é do bootloader/placa e
  vale para MeshCore (a skill diz o mesmo), mas a fonte não diz "MeshCore". A página do T1000-E é de MeshCore.
- A página da Seeed que abri fala de "Wio Tracker L1"; a menção explícita a "Pro" vem da skill (página de 26/10/2026),
  não a reconfirmei palavra por palavra hoje.

**Outras placas dos projetos** (origem: skill, não reconfirmadas hoje, exceto onde indicado):
- XIAO nRF52840: dois toques rápidos no RESET, drive tipo `XIAO-SENSE`, LED pulsa (`guia-repeater-xiao-solar.md` §4, passo 4; SKILL.md "nRF52840: duplo toque no RST").
- XIAO ESP32-S3, Heltec V3 e V4 (ESP32-S3): segurar PRG/BOOT e plugar o USB, ou PRG + toque em RST; depois de gravar pode precisar de RST (SKILL.md linhas ~117–118).
- Heltec T114 (nRF52840): regra genérica de nRF52 (duplo toque no reset, `hardware-energia.md` "Atualização de firmware"). Não há linha própria com fonte do fabricante para a T114. **Parcial**: serve, mas é a regra genérica; vale o aviso "se não aparecer, use Enter DFU Mode do flasher".
- Em todas, o botão "Enter DFU Mode" do flasher costuma bastar (confirmado nas páginas da Seeed hoje).

---

## R2 — Bateria do companion Heltec V3

**Conclusão: ABERTA** (tipo de célula e carregador/proteção estão fechados; **conector físico e polaridade não**).

Fontes lidas em 11/11/2026:
- Datasheet `HTIT-WB32LA_V3.2.pdf` (Rev 1.1, set/2022), pasta oficial https://resource.heltec.cn/download/WiFi_LoRa_32_V3/datasheet/ :
  - "Battery: 3.7 V lithium battery power supply and charging"; faixa da bateria 3,3 / 3,7 / 4,2 V (mín/típ/máx), fonte capaz de ≥ 250 mA.
  - Interface: "2*1.25 lithium battery interface" (conector de 2 pinos, passo 1,25 mm).
  - Rodapé de tabela: "Built-in charge and discharge management, overcharge protection, battery level detection, and automatic power switching between USB and battery".
  - Pino ADC1_CH0 lê a bateria (divisor 100k/390k).
- Esquema `WiFi_LoRa_32_V3.2_Schematic_Diagram.pdf` (extraí o texto): conector `JP1 1.25X2P-LiPo`, carregador **LGS4056HDA** (família TP4056, linear, 4,2 V), MOSFETs P (AO3401) na rota da bateria. O texto extraído **não rotula qual pino é BAT+ e qual é GND** (só a ordem solta dos textos, que não é prova).
- Wiki Heltec V3 (https://wiki.heltec.org/docs/devices/open-source-hardware/esp32-series/lora-32/wifi-lora-32-v3/): repete "Li-Po battery management system" e "charging and battery protection circuit"; não traz conector nem polaridade.

O que falta, e é exatamente o risco conhecido (cabo de bateria de terceiros com polaridade invertida): **ordem BAT+/GND do JP1** (precisa ver o desenho do esquema ou a serigrafia da placa, `+`/`-`) e **qual fio do cabo vendido vai em qual pino**. Também não achei aviso oficial da Heltec sobre polaridade, nem se a proteção dela cobre inversão. Como a "proteção" citada é de sobrecarga/descarga, **não** dá para afirmar que cobre polaridade invertida.
Para fechar: abrir o PDF do esquema numa tela (ver o pino 1 e 2 de JP1) **e** conferir a serigrafia da placa em mãos; ou manter no site "confira o + e o − impressos na placa, não confie na cor do fio".
Não aceito como fechada: bateria genérica "com plug JST 1.25" sem conferir polaridade.

---

## R3 — RAK 1 W (consumo médio, base WisBlock, carregamento com picos de 1 A)

**Conclusão: ABERTA** (depende de medição física do usuário; sem medição o projeto 6 fica "em breve").

O que a skill tem (`hardware-energia.md`): RAK13302 VD, `set tx 22` = 30 dBm, **pico ~1000 mA a 5 V**; 19 dBm = 27 dBm/740 mA; 16 dBm = 24 dBm/560 mA; pico de ~0,75 A medido no PPK2, por ~0,6 s; o estágio de 1 W não funciona bem em 3,3 V (`manuais-e-datasheets.md`). **Consumo médio: não consta** (depende do tráfego). **Base WisBlock e carregador solar que aguente picos de 1 A: não consta** (a skill só cita RAK19007 como exemplo de base para o duplo toque, não como escolha para 1 W solar). Não pesquisei mais porque o brief diz que depende de medição. Pergunta pendente ao usuário: tem PPK2 ou medidor USB? Qual base usará?

---

## R4 — Tensão do painel para o CN3065 (projeto 5)

**Conclusão: PARCIAL.** A regra de segurança fecha (e é restritiva); o painel exato do repetidor de PT **não** fecha.

Fontes:
1. Datasheet Consonance CN3065, **REV 1.0** (baixei o PDF hospedado em https://www.datasheetcafe.com/wp-content/uploads/2021/02/CN3065.pdf, lido em 11/11/2026; cópia de terceiros, o site da Consonance não foi aberto): 
   - Absolute Maximum Ratings: "All Terminal Voltage −0.3 V to 6.5 V".
   - Tabela elétrica: tensão de entrada VIN **4,4 a 6 V**; tensão mínima de operação 4,35 V.
   - Regulação da bateria 4,2 V ±1 %; linear; o ADC interno reduz a corrente conforme o painel aguenta.
   - O chip não tem MPPT nem regulador de entrada que corte tensão alta; tensão acima de 6,5 V no pino VIN é dano.
2. MeshCore Portugal, tutorial "Montagem de Repeater com T114" (https://www.meshcore.pt/docs/tutorials/build-repeater) e página de hardware (https://www.meshcore.pt/pt/hardware/repeater), lidas em 11/11/2026: lista "Painel Solar 9W", "Carregador de Bateria de Lítio CN3065 (opcional)", "Bateria de Lítio 18650 (3350 mAh, 6,5 A)". **Nenhuma tensão do painel é declarada.** A página de hardware não cita BMS (a skill diz BMS; não está nessa página). A página de lista `/pt/docs/list` só aponta para esse tutorial; o texto do tutorial veio sem a tabela de peças, então não li detalhes de ligação.
3. Uma página de terceiros (components101) cita "6,5 V" de entrada para um módulo de nome parecido, mas descreve outra topologia; **descartei** por conflito com o datasheet.

Conclusão técnica: um painel "6 V" nominal costuma ter tensão em aberto (Voc) acima de 7 V (a própria skill diz isso: "tensão em aberto > 7 V"). Isso passa do máximo absoluto de 6,5 V do CN3065: **não é seguro ligar direto**. Seguro = painel de **5 V nominal (Voc ≤ ~6 V, conferido no rótulo/medido)**, ou um regulador/limitador antes do carregador. Um painel de 9 W a 5 V entregaria ~1,8 A, mas o carregador depende do resistor ISET (corrente de carga definida; o módulo típico entrega até ~1 A), então a potência do painel sobra e o carregador é o gargalo.
Para fechar o projeto 5: (a) achar quem montou o repetidor de PT e a tensão do painel dele, ou (b) o site definir a peça como "painel 5 V com Voc ≤ 6 V, 9 W" e a regra como Perigo se a tensão em aberto informada for > 6 V. A opção (b) é decisão de produto, não fato de fonte do PT.

---

## R5 — Firmware de observer (projeto 7)

**Conclusão: PARCIAL.** O passo a passo do observer.gessaman.com está lido e fecha o fluxo; o link oficial da FAQ 3.8 não abriu e há um alerta de terceiros que precisa conferência.

Fontes:
- https://observer.gessaman.com (lido em 11/11/2026). Fluxo atual:
  1. Chrome ou Edge (Chrome Android também grava por USB; Safari não).
  2. Placa por cabo USB de dados; escolher a placa na lista pesquisável e o papel **Repeater (recomendado)** ou Room Server; versão de release (não `-dev`).
  3. **Erase Device: deixar desmarcado** ao atualizar (apagar remove a identidade MeshCore). Apagar só na primeira vez / quando for trocar de fato (a skill diz marcar na 1ª vez e salvar `get prv.key` antes: compatível, mas a página insiste em não apagar se for só atualizar).
  4. Gravar; configurar no Console: `set radio ...`, `set tx 22`, `set name ...`, `set mqtt.iata XXX` (código do aeroporto), `set wifi.ssid`, `set wifi.pwd`, `reboot`. (Os valores de rádio do exemplo são exemplo, não os do BR.)
  5. Brokers MQTT: slots 1 e 2 vêm como `analyzer-us` e `analyzer-eu`; fora da Europa, slot 2 pode ser MeshMapper (`set mqtt2.preset meshmapper`); `get mqtt.presets` lista os suportados.
  6. Alternativa sem cabo: hotspot `MeshCore-Setup-XXXX`, página `http://192.168.4.1`, só nos primeiros minutos após o 1º boot/apagar.
  - Placas suportadas: a página **não lista** (escolhe-se no flasher). Placas com PSRAM aguentam até 5 brokers; sem PSRAM, 2.
- https://analyzer.letsmesh.net/observer/onboard (link da FAQ 3.8): **não abriu** (HTTP 403 ao leitor automático). Não consegui confirmar o conteúdo oficial.
- https://wiki.meshmapper.net/mqtt-main (lido hoje): firmware MQTT nativo roda no próprio rádio; "a maioria dos dispositivos ESP com Wi-Fi"; passo a passo em página separada (`/mqtt-firmware/`, não lida). Resultado de busca (não lido na fonte) cita Heltec V3/V4 e um alerta de que o README do EastMesh marca como encerrados os endpoints LetsMesh US/EU: **não confirmado**, mas pode contradizer o preset `analyzer-us/eu` da página do Gessaman.

Contradições com a skill: nenhuma direta. Diferenças a incorporar: (1) não apagar o dispositivo ao atualizar; (2) a skill fala só do MQTT para CoreScope, a página usa brokers LetsMesh/MeshMapper por preset; (3) a skill diz "marcar Erase Device na 1ª vez": a página só avisa o efeito, sem exigir.
Para fechar: abrir o onboard oficial no navegador (manual), conferir os endpoints atuais dos brokers e se Heltec V3/V4 estão na lista do flasher.

---

## R6 — `set advert.interval 0`

**Conclusão: FECHADA** (como decisão do site).

Fonte: SKILL.md, nota `advert.interval` (conferido em 11/2026): a documentação oficial dá 60–240 min, mas o código do firmware v1.18.0 (`src/helpers/CommonCLI.cpp`, tag `repeater-v1.18.0`, `handleSetCmd`) **aceita 0** (= desligado) e só recusa 1–59 e > 240. Qualquer `set` salvo já zera um intervalo < 60 (o de fábrica é 2 min), então o comando é redundante. Eu não reabri o código, usei a conclusão da skill.
Decisão do plano: o comando **não volta** à lista do site (teste: a lista de comandos não contém `set advert.interval 0`). Fica `get advert.interval` para conferir; a nota da skill diz "→ `> 0`". Ao redigir a verificação no site, copiar essa frase da skill e não prometer outro número.

---

## Projeto → pode abrir na v1?

| Projeto | Abrir na v1? | Por quê |
|---|---|---|
| 1 Companion de bolso pronto | **Sim** | R1 fechada: modo de gravação das 4 placas com fonte (T1000-E, Wio Tracker L1 Pro, WisMesh Tag; RAK3401 é só do projeto 6). Ressalva: a fonte do L1/Tag é guia de Meshtastic, procedimento de bootloader. Sem conta de energia. |
| 2 Companion DIY Heltec V3 | **Não** | R2 aberta: conector é 1,25 mm de 2 pinos, mas **polaridade BAT+/GND do JP1 não consta** em texto e não há aviso oficial. Abrir só depois de ver o esquema/serigrafia. |
| 5 Repetidor solar T114 | **Não** | R4 parcial: o CN3065 tem máximo absoluto de 6,5 V e entrada 4,4–6 V; a tensão do painel de 9 W do repetidor de PT **não é declarada**. Abrir só se o site definir a peça como painel 5 V com Voc ≤ 6 V (decisão de produto) ou se a tensão for achada. |
| 6 Repetidor 1 W RAK solar | **Não** | R3 aberta: faltam consumo médio medido, base WisBlock e carregador para picos de 1 A; depende de medição do usuário. |
| 7 Observer Wi-Fi | **Não (por enquanto)** | R5 parcial: o fluxo do Gessaman está lido, mas a página oficial da FAQ 3.8 não abriu, a lista de placas não consta e há alerta não confirmado sobre brokers encerrados. |

**Recomendação:** abrir só o projeto 1 (e os projetos 3 e 4 que já estavam sem lacuna). Projetos 2, 5, 6 e 7 ficam "em breve" com `blockedBy` apontando para R2, R4, R3 e R5.

---

## Decisão (controlador, 11/11/2026)

**Abre na v1:** projeto 1 (R1 fechada), além dos projetos 3 e 4, que já não tinham lacuna. O projeto 1 usa um
desenho genérico (`p1-aparelho`), sem fiação; o SVG sai na Task 12.

**Continuam "em breve"** (campo `blockedBy`), e o que falta para cada um:

| Projeto | blockedBy | O que falta |
|---|---|---|
| 2 Companion DIY Heltec V3 | R2 | Polaridade BAT+/GND do conector JP1: ler o desenho do esquema e conferir a serigrafia da placa; achar (ou não) aviso oficial. |
| 5 Repetidor solar T114 | R4 | Decisão de produto: definir o painel (5 V, tensão em aberto ≤ 6 V) ou achar a tensão do painel de 9 W do repetidor de PT. |
| 6 Repetidor 1 W RAK solar | R3 | Medição do usuário (PPK2 ou medidor USB), escolha da base WisBlock e carregador que aguente picos de 1 A. |
| 7 Observer Wi-Fi | R5 | Ler o onboarding oficial do analyzer (deu 403), lista de placas suportadas e conferir os brokers atuais. |
