import { readFileSync } from 'node:fs';

// Motor de referencia para el plural de los lemas terminados en vocal + Y.
// Convierte una anotacion normativa por lema en un conjunto cerrado de plurales
// y audita el lexicon contra esa prediccion. No participa en el build: su
// salida es un informe para decidir que formas entran en el proximo lexicon.

const RELEASES = {
  2027: new URL('./FILE2027-RC1.txt', import.meta.url),
  dem: new URL('./FILE2017-DEM-FEMELEX-RC4.txt', import.meta.url),
};

const DIGRAPHS = [['CH', '[CH]'], ['LL', '[LL]'], ['RR', '[RR]']];

export const toEngineSpelling = (word) => {
  const upper = String(word ?? '').toUpperCase();
  if (upper.includes('[')) return upper;
  return DIGRAPHS.reduce((acc, [display, token]) => acc.replaceAll(display, token), upper);
};

export const toDisplaySpelling = (word) => DIGRAPHS
  .reduce((acc, [display, token]) => acc.replaceAll(token, display), String(word ?? '').toUpperCase());

const pluralEnEs = (lemma) => `${lemma}ES`;
const pluralEnIs = (lemma) => `${lemma.slice(0, -1)}IS`;

// Las reglas se evaluan en orden: la primera que reconoce el lema lo resuelve.
// La lista explicita de la gramatica gana siempre a la regla general, y la
// regla general gana siempre a la analogia.
const RULES = [
  {
    id: 'R0-NO-LEMA',
    etiqueta: 'no es lema nominal',
    evidencia: 'excluido',
    applies: ({ marca }) => marca === 'no_lema',
    plurales: () => [],
  },
  {
    id: 'R1-SIN-PLURAL',
    etiqueta: 'sin flexion de numero',
    evidencia: 'normativa',
    applies: ({ marca }) => marca === 'sin_plural',
    plurales: () => [],
  },
  {
    id: 'R2-NGLE-DOBLE',
    etiqueta: 'doble plural explicito en NGLE',
    evidencia: 'normativa',
    applies: ({ listas, lemma }) => listas.ngle_doble.has(lemma),
    plurales: (lemma) => [pluralEnIs(lemma), pluralEnEs(lemma)],
  },
  {
    id: 'R3-NGLE-ES',
    etiqueta: 'plural en -es explicito en NGLE',
    evidencia: 'normativa',
    applies: ({ listas, lemma }) => listas.ngle_es.has(lemma),
    plurales: (lemma) => [pluralEnEs(lemma)],
  },
  {
    id: 'R4-NGLE-IS',
    etiqueta: 'plural en -is explicito en NGLE',
    evidencia: 'normativa',
    applies: ({ listas, lemma }) => listas.ngle_is.has(lemma),
    plurales: (lemma) => [pluralEnIs(lemma)],
  },
  {
    id: 'R5-EXTRANJERISMO',
    etiqueta: 'voz no castellanizada: Y > I mas -s',
    evidencia: 'regla',
    applies: ({ marca }) => marca === 'extranjerismo',
    plurales: (lemma) => [pluralEnIs(lemma)],
  },
  {
    id: 'R6-DOBLE-USO',
    etiqueta: 'doble plural por uso documentado',
    evidencia: 'documentada',
    applies: ({ marca }) => marca === 'doble_uso',
    plurales: (lemma) => [pluralEnIs(lemma), pluralEnEs(lemma)],
  },
  {
    id: 'R7-ANALOGIA',
    etiqueta: 'analogia con un lema modelo',
    evidencia: 'analogica',
    applies: ({ marca }) => marca === 'analogia',
    plurales: () => [],
  },
  {
    id: 'R8-PATRIMONIAL',
    etiqueta: 'regla general: vocal + Y patrimonial toma -es',
    evidencia: 'regla',
    applies: () => true,
    plurales: (lemma) => [pluralEnEs(lemma)],
  },
];

export const loadAnnotations = (path = new URL('./plurales-vocal-y.json', import.meta.url)) => {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const listas = Object.fromEntries(Object.entries(raw.listas)
    .map(([name, { lemas }]) => [name, new Set(lemas.map(toEngineSpelling))]));
  const lemas = new Map(Object.entries(raw.lemas)
    .map(([lemma, annotation]) => [toEngineSpelling(lemma), annotation]));
  return { listas, lemas };
};

export function resolvePlurals(lemma, annotations, seen = new Set()) {
  const key = toEngineSpelling(lemma);
  const annotation = annotations.lemas.get(key) ?? {};
  const context = { lemma: key, marca: annotation.marca, listas: annotations.listas };
  const rule = RULES.find((candidate) => candidate.applies(context));

  if (rule.id === 'R7-ANALOGIA') {
    if (seen.has(key)) throw new Error(`Analogia circular en ${toDisplaySpelling(key)}`);
    const modelKey = toEngineSpelling(annotation.modelo);
    const model = resolvePlurals(modelKey, annotations, new Set([...seen, key]));
    // De la resolucion del modelo se hereda la forma del plural, no sus letras.
    const hereda = new Set(model.plurales
      .map((forma) => (forma === pluralEnIs(modelKey) ? 'IS' : 'ES')));
    return {
      lemma: key,
      plurales: [
        ...(hereda.has('IS') ? [pluralEnIs(key)] : []),
        ...(hereda.has('ES') ? [pluralEnEs(key)] : []),
      ],
      regla: rule.id,
      etiqueta: `${rule.etiqueta} (${toDisplaySpelling(modelKey)})`,
      evidencia: rule.evidencia,
      revision: annotation.revision ?? 'pendiente',
      anotado: true,
      homografos: annotation.homografos ?? {},
      nota: annotation.nota ?? null,
    };
  }

  return {
    lemma: key,
    plurales: rule.plurales(key),
    regla: rule.id,
    etiqueta: rule.etiqueta,
    evidencia: rule.evidencia,
    revision: annotation.revision ?? null,
    // R8 es la unica regla que resuelve sin evidencia: un lema que solo llega
    // hasta ella y no trae marca propia sigue pendiente de anotar.
    anotado: rule.id !== 'R8-PATRIMONIAL' || Boolean(annotation.marca),
    homografos: annotation.homografos ?? {},
    nota: annotation.nota ?? null,
  };
}

export function auditLexicon(words, annotations, { grupo = '' } = {}) {
  const inLexicon = words instanceof Set ? words : new Set(words);
  // `grupo` acota el informe a una terminacion concreta: 'OY', 'O' o '-oy'.
  const normalizado = toEngineSpelling(grupo).replace(/[^A-Z[\]]/gu, '');
  const terminacion = normalizado && !normalizado.endsWith('Y') ? `${normalizado}Y` : normalizado;
  const lemas = [...inLexicon]
    .filter((word) => /[AEOU]Y$/u.test(word) && word.endsWith(terminacion))
    .sort();

  const informe = { conformes: [], sobran: [], faltan: [], sinAnotar: [], excluidos: [] };

  for (const lemma of lemas) {
    const resolved = resolvePlurals(lemma, annotations);
    if (resolved.regla === 'R0-NO-LEMA') {
      informe.excluidos.push(resolved);
      continue;
    }
    if (!resolved.anotado) {
      informe.sinAnotar.push(resolved);
      continue;
    }

    const previstos = new Set(resolved.plurales);
    const candidatos = new Set([pluralEnEs(lemma), pluralEnIs(lemma)]);
    for (const forma of candidatos) {
      const presente = inLexicon.has(forma);
      const justificacion = resolved.homografos[toDisplaySpelling(forma)];
      const entry = { lemma, forma, regla: resolved.regla, revision: resolved.revision };

      if (previstos.has(forma) && presente) informe.conformes.push(entry);
      else if (previstos.has(forma) && !presente) informe.faltan.push(entry);
      else if (!previstos.has(forma) && presente && !justificacion) informe.sobran.push(entry);
      else if (!previstos.has(forma) && presente) {
        informe.conformes.push({ ...entry, justificacion });
      }
    }
  }

  return informe;
}

const formatRow = ({ lemma, forma, regla, revision, justificacion }) => [
  `  ${toDisplaySpelling(lemma).padEnd(12)} ${toDisplaySpelling(forma).padEnd(14)} ${regla}`,
  revision ? ` [revision: ${revision}]` : '',
  justificacion ? ` [justificada como ${justificacion}]` : '',
].join('');

function runCli(argv) {
  const args = new Map(argv.filter((arg) => arg.startsWith('--'))
    .map((arg) => arg.replace(/^--/u, '').split('=')));
  const release = args.get('release') ?? '2027';
  const grupo = args.get('grupo') ?? '';
  const source = RELEASES[release];
  if (!source) throw new Error(`Release desconocido: ${release}. Use 2027 o dem.`);

  const words = new Set(readFileSync(source, 'utf8').split(/\r?\n/u).filter(Boolean));
  const annotations = loadAnnotations();
  const informe = auditLexicon(words, annotations, { grupo });

  if (args.get('formato') === 'json') {
    console.log(JSON.stringify(informe, null, 2));
    return;
  }

  console.log(`Auditoria de plurales en vocal + Y — release ${release}${grupo ? ` — grupo ${grupo}` : ''}\n`);
  console.log(`SOBRAN (${informe.sobran.length}) formas en el lexicon que ninguna regla justifica:`);
  informe.sobran.forEach((row) => console.log(formatRow(row)));
  console.log(`\nFALTAN (${informe.faltan.length}) formas que las reglas predicen y el lexicon no recoge:`);
  informe.faltan.forEach((row) => console.log(formatRow(row)));
  console.log(`\nCONFORMES: ${informe.conformes.length}`);
  console.log(`EXCLUIDOS (no son lemas nominales): ${informe.excluidos.length}`);
  console.log(`SIN ANOTAR (caen en la regla por defecto, pendientes de revision): ${informe.sinAnotar.length}`);
  informe.sinAnotar.forEach(({ lemma }) => console.log(`  ${toDisplaySpelling(lemma)}`));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2));
}
