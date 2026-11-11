# Bancada Mesh

**monte seu rádio MeshCore sem errar**

Site estático que guia a montagem de um rádio [MeshCore](https://meshcore.co.uk/): escolha as peças, confira a compatibilidade e receba um checklist de configuração. Sem servidor, sem IA, sem cadastro e sem rastreamento: nada do que você digita sai do navegador.

## Como rodar

Pré-requisito: Node 22 ou mais novo (para os testes). O site em si é HTML, CSS e JavaScript puros.

Testes:

```sh
npm test
```

Site local:

```sh
python -m http.server 8000
```

Depois abra http://localhost:8000 no navegador.

## Documentação

O spec do projeto está em [`docs/superpowers/specs/2026-11-11-bancada-mesh-design.md`](docs/superpowers/specs/2026-11-11-bancada-mesh-design.md).

## Licenças

- Código: [MIT](LICENSE).
- Textos e ilustrações próprios: [CC BY-SA 4.0](LICENSE-CONTENT). Fotos de terceiros mantêm a licença original indicada ao lado de cada foto.

## Aviso

Projeto comunitário e independente. Não é oficial do MeshCore nem do MeshCore Brasil.
