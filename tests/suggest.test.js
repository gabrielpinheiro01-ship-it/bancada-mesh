import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestLinks } from '../src/core/suggest.js';

const META_OK = { githubRepo: 'bancadamesh/bancadamesh.github.io', formPrefillUrl: 'https://exemplo.test/form?id={id}' };

test('GitHub: título termina com [ID] codificado', () => {
  const { github } = suggestLinks({ kind: 'regra', id: 'EN-05' }, META_OK);
  assert.ok(github.startsWith('https://github.com/bancadamesh/bancadamesh.github.io/issues/new?template=sugestao.yml&title='));
  assert.ok(github.endsWith('title=%5BEN-05%5D%20'));
});

test('formulário: {id} é substituído com encodeURIComponent', () => {
  assert.equal(suggestLinks({ kind: 'peca', id: 'T-Beam_1.2' }, META_OK).form, 'https://exemplo.test/form?id=T-Beam_1.2');
});

test('a URL só contém o id e o template (nenhum estado do usuário)', () => {
  const { github, form } = suggestLinks({ kind: 'comando', id: 'CFG-05' }, META_OK);
  assert.equal(github, 'https://github.com/bancadamesh/bancadamesh.github.io/issues/new?template=sugestao.yml&title=%5BCFG-05%5D%20');
  assert.equal(form, 'https://exemplo.test/form?id=CFG-05');
  assert.ok(!/comando/.test(github + form));
});

test('sem configuração: tudo null', () => {
  assert.deepEqual(suggestLinks({ kind: 'regra', id: 'EN-05' }), { form: null, github: null });
  assert.deepEqual(suggestLinks({ kind: 'regra', id: 'EN-05' }, { githubRepo: null, formPrefillUrl: null }), { form: null, github: null });
});

test('id inválido lança erro', () => {
  for (const id of ['', 'a b', 'EN/05', 'x&y=1', 'ç', 5, null]) {
    assert.throws(() => suggestLinks({ kind: 'regra', id }, META_OK), /id/);
  }
});

test('kind inválido lança erro', () => {
  assert.throws(() => suggestLinks({ kind: 'outro', id: 'EN-05' }, META_OK), /kind/);
});
