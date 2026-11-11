// Depois de ligar (spec §7.6 item 8). Lista de blocos: { title, items, source, ordered? }.
// `ordered: true` = passos numerados (o PDF numera; não ponha o número no texto).

export const AFTER = Object.freeze([
  {
    id: 'advert',
    title: 'Avisar a rede que você existe',
    items: [
      'Toque em Send Advert (enviar anúncio). É o aviso "estou aqui" com o nome e a chave do seu rádio.',
      'Repetidor: depois de configurar e testar na mesa, mande o anúncio de novo já no lugar onde ele vai ficar.',
    ],
    source: 'SKILL.md ("Checklist de repetidor", "Checklist de companion")',
  },
  {
    id: 'mapa',
    title: 'Aparecer no mapa',
    items: [
      'O mapa fica em map.meshcore.io (e o espelho brasileiro, meshcore.com.br/mapa).',
      'Companion: no app, ⋮ → Mapa da Internet → ⋮ → Adicionar-me ao Mapa.',
      'Repetidor: no app, Contatos → ⋮ → Partilhar → Carregar para Mapa da Internet. O app precisa ter recebido o anúncio dele antes.',
      'Use uma coordenada aproximada, não a porta da sua casa.',
      'A cor do ponto mostra quando o nó foi visto: verde (até 5 dias), amarelo (até 10), vermelho (até 20) e preto (mais de 20; será removido).',
    ],
    source: 'references/padroes-comunidade-br.md §7 (Mapa da Internet) · SKILL.md · https://map.meshcore.io · https://meshcore.com.br/mapa/',
  },
  {
    id: 'corescope',
    title: 'Conferir no CoreScope',
    items: [
      'CoreScope é um painel que mostra as mensagens da rede em tempo real: corescope.meshcore.com.br.',
      'Procure o nome do seu repetidor e abra o anúncio dele. As abas Paths e Graph mostram quem ouviu o seu nó direto e quem ouviu pela malha.',
      'Ele só mostra o que algum "observer" (rádio ligado à internet que escuta a rede) ouviu. Se a sua região não tem observer, você não aparece lá, e isso não quer dizer que o seu rádio está com defeito.',
    ],
    source: 'references/padroes-comunidade-br.md §7 (CoreScope, Observer) · SKILL.md ("Checklist de repetidor") · https://corescope.meshcore.com.br',
  },
  {
    id: 'etiqueta',
    title: 'Etiqueta da comunidade',
    items: [
      'Para falar com uma pessoa, use mensagem direta (DM) em vez de canal. Canal repete a mensagem por toda a rede.',
      'Use o âmbito (região) mais restrito que ainda entrega a sua mensagem. Comece pela sua cidade e só amplie se precisar.',
      'Sem robôs (bots) nos canais. Se fizer um, deixe só responder em mensagem direta.',
      'Sem política nem briga nos canais. Leve esse assunto para o privado ou para o Telegram.',
      'Mantenha o firmware e a configuração no padrão da comunidade, e ajude quem está chegando agora.',
    ],
    source: 'references/padroes-comunidade-br.md §9 · https://meshcore.com.br (regras de etiqueta)',
  },
  {
    id: 'copia-offline',
    title: 'Guarde uma cópia do app, sem internet',
    items: [
      'Baixe o instalador do app MeshCore e guarde no celular ou no computador.',
      'Num apagão a loja de aplicativos pode não abrir. Com a cópia guardada, você reinstala mesmo assim.',
    ],
    source: 'references/padroes-comunidade-br.md §10',
  },
  {
    id: 'ninguem-me-ouve',
    title: 'Ninguém me ouve, e agora?',
    ordered: true,
    items: [
      'Você enxerga algum repetidor da rede, sem parede grossa no meio? O sinal de 923 MHz não atravessa concreto nem metal. Se não enxerga, ponha um repetidor do lado de fora (varanda, laje, telhado).',
      'O seu rádio e o repetidor estão com os mesmos números? Confira dígito a dígito: 923.125 não é 923.25. Preset "Australia: SA, WA" (ou "Brazil"), 62.5, 8, 8.',
      'O repetidor enxerga vizinhos? No app: Gerir → Vizinhos → Descobrir.',
      'Faça um traceroute (teste que mostra o caminho e a qualidade em cada salto). Se o SNR (quanto o sinal se destaca do ruído) ficar negativo na volta, tem interferência no seu local: fonte chaveada, filtro ou antena mal posta. Mude o ponto. Se for na ida, o problema é do vizinho (potência ou interferência dele).',
      'Ligue um companion na antena do repetidor e tente falar com o vizinho. Se funcionou, o problema está no repetidor: bateria abaixo de 3,5 V, cabo de antena solto ou a própria placa. Se não funcionou, o problema é a antena ou o cabo dela.',
      'O flasher não vê a placa? Provavelmente é cabo que só carrega. Troque por um de dados e dê dois toques no botão de reset (a T1000-E e a WisMesh Tag têm outro jeito; veja a página de gravação).',
      'O Gerir falha? Confira a senha, chegue mais perto e use `set multi.acks 1` no repetidor.',
      'O mapa ou o CoreScope diz "Repeater time is not set correctly"? No Gerir, use `clock` para ver a hora e `clock sync` para acertar com a do celular.',
    ],
    source: 'SKILL.md ("Diagnóstico rápido") · references/padroes-comunidade-br.md §8 · references/diagramas.md ("Diagnóstico ninguém me ouve") · https://www.meshsorocaba.org/configuracao/diagrama-de-resolucao-de-problemas-no-meshcore/ (resumo, texto original não copiado)',
  },
]);
