import test from 'node:test';
import assert from 'node:assert/strict';

import {
  auditLexicon,
  loadAnnotations,
  resolvePlurals,
  toDisplaySpelling,
  toEngineSpelling,
} from '../scripts/lexicon/plural-vocal-y.mjs';

const annotations = loadAnnotations();
const pluralesDe = (lemma) => resolvePlurals(lemma, annotations).plurales.map(toDisplaySpelling).sort();

test('la lista explicita de la gramatica gana a la regla general', () => {
  assert.deepEqual(pluralesDe('BOCOY'), ['BOCOYES']);
  assert.deepEqual(pluralesDe('CONVOY'), ['CONVOYES']);
  assert.equal(resolvePlurals('BOCOY', annotations).regla, 'R3-NGLE-ES');
});

test('los dobles plurales explicitos producen las dos formas', () => {
  assert.deepEqual(pluralesDe('COY'), ['COIS', 'COYES']);
  assert.deepEqual(pluralesDe('NORAY'), ['NORAIS', 'NORAYES']);
});

test('una voz no castellanizada solo admite el plural en -is', () => {
  assert.deepEqual(pluralesDe('ACROY'), ['ACROIS']);
  assert.deepEqual(pluralesDe('CORDEROY'), ['CORDEROIS']);
});

test('la analogia hereda la forma del plural, no las letras del modelo', () => {
  const coicoy = resolvePlurals('COICOY', annotations);
  assert.deepEqual(pluralesDe('COICOY'), ['COICOIS', 'COICOYES']);
  assert.equal(coicoy.regla, 'R7-ANALOGIA');
  assert.equal(coicoy.revision, 'pendiente');
});

test('los lemas sin flexion y las formas verbales no generan plural', () => {
  assert.deepEqual(pluralesDe('TROY'), []);
  assert.deepEqual(pluralesDe('PLAYBOY'), []);
  assert.equal(resolvePlurals('VOY', annotations).regla, 'R0-NO-LEMA');
});

test('un lema sin anotar cae en la regla por defecto y queda marcado', () => {
  const resolved = resolvePlurals('ABEY', annotations);
  assert.equal(resolved.regla, 'R8-PATRIMONIAL');
  assert.equal(resolved.anotado, false);
});

test('las anotaciones viajan en grafia visible y se resuelven en grafia de motor', () => {
  assert.equal(toEngineSpelling('CHOROY'), '[CH]OROY');
  assert.equal(toDisplaySpelling('[CH]OROY'), 'CHOROY');
  assert.deepEqual(pluralesDe('CHOROY'), ['CHOROIS', 'CHOROYES']);
});

test('un homografo declarado no se reporta como forma huerfana', () => {
  const lexicon = new Set(['REY', 'REYES', 'REIS', 'ACROY', 'ACROIS', 'ACROYES']);
  const informe = auditLexicon(lexicon, annotations);
  const huerfanas = informe.sobran.map(({ forma }) => forma);

  assert.deepEqual(huerfanas, ['ACROYES']);
  assert.ok(informe.conformes.some(({ forma, justificacion }) => forma === 'REIS' && justificacion));
});

test('el auditor reclama las formas que la regla predice y el lexicon no recoge', () => {
  const lexicon = new Set(['TIMBOY', 'TIMBOIS']);
  const informe = auditLexicon(lexicon, annotations);

  assert.deepEqual(informe.faltan.map(({ forma }) => forma), ['TIMBOYES']);
});
