# Como contribuir

A Bancada Mesh é um projeto da comunidade, mantido por voluntários. O público sugere e uma pessoa confere a fonte antes de mudar qualquer coisa.

## Como sugerir uma correção

Ache o link "achei um erro" ao lado da peça, do item de auditoria ou do comando. Ele já leva o identificador. Há dois caminhos:

1. **Formulário, sem cadastro.** Serve para qualquer pessoa. Não precisa de conta.
2. **GitHub.** Abra uma issue com o modelo "Sugerir uma correção". Serve para quem já usa o GitHub.

Nos dois, você responde as mesmas perguntas: o que está errado, o identificador, se usou IA e qual é a fonte.

## Sugestão só vira mudança com fonte

Fonte pode ser:

- a documentação oficial do MeshCore;
- uma nota de versão do firmware;
- uma página da comunidade (MeshCore Brasil, Mesh Sorocaba etc.);
- uma medição sua, com os números.

Sem fonte, a sugestão não vira regra. Isso vale para qualquer pessoa.

## Usou IA para escrever?

Tudo bem. Mas IA costuma inventar comandos do MeshCore. Confira na documentação antes de mandar e informe a fonte.

Quem mantém o projeto também pode usar IA para ajudar a conferir. Mesmo assim, a decisão final é de uma pessoa olhando a fonte original.

## Checklist de revisão

Faça isto a cada firmware novo e a cada sugestão aceita.

- [ ] Reconferir as fontes listadas em `references/fontes.md` da skill `meshcore-hubreal`. As principais:
  - repositório oficial: <https://github.com/meshcore-dev/MeshCore> (docs `cli_commands.md`, `faq.md`, `radio_presets.md`)
  - site e blog: <https://meshcore.io> e <https://blog.meshcore.io>
  - MeshCore Brasil: <https://meshcore.com.br> (página "valores de referência")
  - Mesh Sorocaba: <https://www.meshsorocaba.org> (só resumir, não copiar o texto)
  - wiki do MeshMapper: <https://wiki.meshmapper.net>
  - MeshCore Portugal: <https://www.meshcore.pt/pt/docs/list>
- [ ] Atualizar a regra afetada e o campo `checkedAt` dela.
- [ ] Atualizar `META.rulesCheckedAt` e `META.firmware` em `src/data/meta.js`.
- [ ] Rodar `npm test` e ver tudo passar.
- [ ] Atualizar também a skill privada `meshcore-hubreal`. As duas são mantidas em paralelo.
