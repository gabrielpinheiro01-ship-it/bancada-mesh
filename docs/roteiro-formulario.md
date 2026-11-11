# Roteiro: formulário de sugestões sem cadastro

Este roteiro é para quem mantém o site. O formulário precisa de uma conta sua, então ele não é criado pelo código. Quem responde **não** pode precisar de conta.

## Serviço sugerido

**Google Forms** (grátis). Em *Configurações > Respostas*, deixe **"Coletar endereços de e-mail" desativado** e **"Limitar a 1 resposta" desativado** (essa opção exige login). Qualquer serviço grátis que aceite resposta anônima e link pré-preenchido serve.

## Aviso no topo (descrição do formulário)

> Usou IA para escrever? Tudo bem, mas IA costuma inventar comandos do MeshCore. Confira na documentação antes de mandar.

Acrescente: "Sugestão só vira mudança com fonte: documentação oficial, nota de versão, página da comunidade ou medição."

## Campos (mesmos do modelo do GitHub)

1. **O que está errado?** Resposta longa. Obrigatório.
2. **Identificador.** Resposta curta. Vem preenchido pelo link "achei um erro" (ex.: EN-05).
3. **Você usou IA (ChatGPT, Gemini…) para escrever isto?** Múltipla escolha: Sim / Não. Obrigatório.
4. **Fonte.** Resposta curta. Link da documentação, nota de versão ou medição. Na descrição: "Obrigatória para quem marcou Sim. Sem fonte, a sugestão não vira regra."

## Gerar o link de preenchimento com o identificador

1. No Google Forms, menu de três pontos > **Receber link pré-preenchido**.
2. No campo **Identificador**, digite um texto fácil de achar, como `ID_AQUI`. Clique em **Obter link** e copie.
3. O link terá a forma `https://docs.google.com/forms/d/e/<FORM>/viewform?usp=pp_url&entry.123456=ID_AQUI`.
4. Troque `ID_AQUI` por `{id}`: `...&entry.123456={id}`.
5. Grave esse texto em `src/data/meta.js`, no campo `formPrefillUrl`. O site troca `{id}` pelo identificador de cada regra, peça ou comando.

Quando o repositório do GitHub existir, preencha também `githubRepo` (formato `dono/repositorio`). Enquanto os dois campos forem `null`, os links "achei um erro" ficam escondidos.
