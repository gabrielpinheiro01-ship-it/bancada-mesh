// Notas de configuração do repetidor (CFG-05 nota, CFG-07 a CFG-11). Lista de blocos: { id, title, items, source }.
// O PDF deixa em branco nome, senha e coordenadas: a pessoa preenche à mão (spec §7.6 item 5).
// O comando de zerar o anúncio de vizinhança NÃO está na lista de comandos (CFG-05): aqui só se explica e se manda conferir.

export const CONFIG_NOTES = Object.freeze([
  {
    id: 'CFG-07',
    title: 'Nome do repetidor: CIDADE-REGIONAL-XXXX',
    items: [
      'Formato: CIDADE-REGIONAL-XXXX. Tudo em maiúsculas, sem espaço, sem acento e sem emoji.',
      'CIDADE: três letras que identificam a cidade (por exemplo SOR para Sorocaba). REGIONAL: o bairro, morro ou marco onde ele fica.',
      'XXXX: os quatro primeiros caracteres da chave pública do seu rádio. Essa chave só existe depois de gravar o firmware. Por isso o nome fica em branco no papel e você completa depois.',
      'No máximo 23 bytes quando o nome vai com localização (31 sem localização). Acento e emoji ocupam mais de um byte, então evite. Se passar, encurte a REGIONAL.',
      'Para ver a chave pública: console do repetidor, comando get public.key.',
      'Para ajudar a montar o nome, use um destes geradores: https://meshcore.com.br/gerador-de-nomes-para-repetidores-meshcore/ ou https://www.meshsorocaba.org/ferramentas/nomes-repetidores/',
      'Trocou o nome depois? Mande o anúncio (Send Advert) de novo e reenvie o nó ao mapa.',
    ],
    source: 'references/padroes-comunidade-br.md §5 · https://meshcore.com.br/gerador-de-nomes-para-repetidores-meshcore/ · https://www.meshsorocaba.org/ferramentas/nomes-repetidores/ (só resumo e link) · references/oficial/cli_commands.md (get public.key)',
  },
  {
    id: 'CFG-08',
    title: 'Como configurar: por USB, um comando por vez',
    items: [
      'Repetidor não se configura por Bluetooth. A primeira configuração é pelo cabo USB, no site config.meshcore.io ou no configurador do próprio flasher.',
      'Digite um comando por vez no console e espere a resposta. Se você colar um bloco de várias linhas, elas se juntam e dão erro.',
      'Ajuste o rádio (set radio) aqui na bancada. Errar esse comando à distância derruba o repetidor, e ele só volta com um cabo na mão.',
      'Depois que estiver no ar, dá para administrar tudo pelo app: Contatos → o repetidor → Gerir, com a senha de admin.',
    ],
    source: 'SKILL.md ("Checklist de repetidor") · references/padroes-comunidade-br.md §2 (Operação) · https://meshcore.com.br/valores-de-referencia/',
  },
  {
    id: 'CFG-09',
    title: 'Senhas, dados do dono e Repeat Mode',
    items: [
      'Senha de admin: troque a de fábrica por uma senha forte (longa, com letras e números). Quem tiver essa senha reconfigura o seu repetidor de longe. Anote só no papel que você guarda, não neste PDF.',
      'Senha de convidado (guest): deixe vazia.',
      'Owner Info (texto sobre o dono): como a senha de convidado é vazia, qualquer pessoa pode ler. Não ponha telefone, endereço nem nenhum dado pessoal sensível.',
      'Repeat Mode: precisa estar ligado. Sem ele o repetidor não repete as mensagens dos outros.',
    ],
    source: 'references/padroes-comunidade-br.md §2 (outros campos) · SKILL.md ("Checklist de repetidor") · references/guia-repeater-xiao-solar.md §4',
  },
  {
    id: 'CFG-10',
    title: 'Posição: manual e aproximada',
    items: [
      'Digite a latitude e a longitude à mão, de um ponto aproximado (a rua ou o bairro serve). Deixe em branco neste papel e preencha depois.',
      'Não use GPS em repetidor fixo: ele só gasta energia, e a posição não muda.',
      'A posição aparece no mapa para todo mundo. Por isso, aproximada.',
    ],
    source: 'references/padroes-comunidade-br.md §2 e §7 (privacidade: coordenada aproximada) · SKILL.md ("Checklist de repetidor")',
  },
  {
    id: 'CFG-11',
    title: 'A chave privada é segredo',
    items: [
      'O comando get prv.key mostra a chave privada do rádio. Quem tem essa chave se passa pelo seu repetidor.',
      'Guarde essa chave offline (papel ou arquivo sem internet). Nunca cole em conversa, nem tire print.',
      'Antes de apagar o rádio ou gravar o firmware de novo, salve a chave. Sem ela, o repetidor ganha uma identidade nova.',
    ],
    source: 'SKILL.md ("Reset de fábrica / placa travada": antes de apagar um repetidor) · references/oficial/cli_commands.md (get prv.key)',
  },
  {
    id: 'CFG-05-advert',
    title: 'Anúncio de vizinhança (advert.interval)',
    items: [
      'O padrão do Brasil quer o anúncio de vizinhança desligado. Ele só é ouvido por quem está ao alcance direto do rádio e não adianta nada: o anúncio por toda a rede já faz esse trabalho.',
      'O firmware 1.18 aceita o valor zero, mas já zera esse intervalo sozinho quando você salva qualquer configuração.',
      'Por isso a lista de comandos não manda mudar. Ela só manda conferir: depois de configurar, rode get advert.interval. A resposta tem que ser 0.',
    ],
    source: 'references/padroes-comunidade-br.md §2 · SKILL.md ("Checklist de repetidor", nota sobre advert.interval) · docs/superpowers/specs/2026-11-11-bancada-mesh-design.md §8.1 CFG-05',
  },
]);
