const ALLOWED_INPUT = /[^A-ZÑÇKW?*.,:+\-@&0-9]/g;
const CONSTRAINT_TOKEN = /([+-])(\d*)([A-ZÑÇKW@&]+)/g;

export function encodeQueryDigraphs(value) {
  return value
    .replace(/CH/g, 'Ç')
    .replace(/LL/g, 'K')
    .replace(/RR/g, 'W');
}

function cleanSpanishText(value) {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/\s+/g, '')
    .replace(ALLOWED_INPUT, '');
}

function cleanExpression(expression, hasRack) {
  const patternLike = hasRack || /[*.@&+-]/.test(expression);
  let result = patternLike ? expression.replace(/\?/g, '') : expression;
  let insideConstraintCount = false;
  result = [...result].filter((character) => {
    if (character === '+' || character === '-') {
      insideConstraintCount = true;
      return true;
    }
    if (/\d/.test(character)) return insideConstraintCount;
    if (insideConstraintCount) insideConstraintCount = false;
    return true;
  }).join('');
  return result;
}

/**
 * Keeps one deliberately small, user-facing grammar:
 * EXPRESSION[,RACK][:LENGTH]. The old EXPRESSION:LENGTH,RACK order is
 * accepted and rewritten so saved searches keep working.
 */
export function normalizeUserQueryInput(value) {
  let cleaned = cleanSpanishText(value);

  const commaIndex = cleaned.indexOf(',');
  if (commaIndex >= 0) {
    const left = cleaned.slice(0, commaIndex);
    const right = cleaned.slice(commaIndex + 1).replace(/,/g, '');
    const legacyLength = left.match(/^(.*):(\d*)$/);
    if (legacyLength) {
      const rack = right.replace(/[^A-ZÑÇKW?]/g, '');
      return normalizeUserQueryInput(`${legacyLength[1]},${rack}:${legacyLength[2]}`);
    }
  }

  const terminalLength = cleaned.match(/:(\d*)$/);
  const lengthSuffix = terminalLength ? `:${terminalLength[1]}` : '';
  if (terminalLength) cleaned = cleaned.slice(0, terminalLength.index);
  cleaned = cleaned.replace(/:/g, '');

  const [rawExpression = '', ...rackParts] = cleaned.split(',');
  const rack = rackParts.join('').replace(/[^A-ZÑÇKW?]/g, '');
  const expression = cleanExpression(rawExpression, rackParts.length > 0);
  return rackParts.length > 0
    ? `${expression},${rack}${lengthSuffix}`
    : `${expression}${lengthSuffix}`;
}

function addCount(map, symbol, count, choose) {
  const current = map.get(symbol);
  map.set(symbol, current === undefined ? count : choose(current, count));
}

function parseConstraintSection(section) {
  const minimum = new Map();
  const maximum = new Map();
  let minimumVowels = null;
  let maximumVowels = null;
  let minimumConsonants = null;
  let maximumConsonants = null;
  let match;

  CONSTRAINT_TOKEN.lastIndex = 0;
  while ((match = CONSTRAINT_TOKEN.exec(section)) !== null) {
    const [, operator, countText, rawSymbols] = match;
    const count = countText ? Number.parseInt(countText, 10) : null;
    const symbols = encodeQueryDigraphs(rawSymbols);

    for (const symbol of symbols) {
      const amount = count ?? (operator === '+' ? 1 : 0);
      if (symbol === '@') {
        if (operator === '+') minimumVowels = Math.max(minimumVowels ?? 0, amount);
        else maximumVowels = Math.min(maximumVowels ?? Number.POSITIVE_INFINITY, amount);
      } else if (symbol === '&') {
        if (operator === '+') minimumConsonants = Math.max(minimumConsonants ?? 0, amount);
        else maximumConsonants = Math.min(maximumConsonants ?? Number.POSITIVE_INFINITY, amount);
      } else if (operator === '+') {
        addCount(minimum, symbol, amount, Math.max);
      } else {
        addCount(maximum, symbol, amount, Math.min);
      }
    }
  }

  return {
    minimum,
    maximum,
    minimumVowels,
    maximumVowels,
    minimumConsonants,
    maximumConsonants,
  };
}

export function parseUserQuery(value) {
  const normalized = normalizeUserQueryInput(value);
  const lengthMatch = normalized.match(/:(\d+)$/);
  const length = lengthMatch ? Number.parseInt(lengthMatch[1], 10) : null;
  const withoutLength = lengthMatch ? normalized.slice(0, lengthMatch.index) : normalized.replace(/:$/, '');
  const commaIndex = withoutLength.indexOf(',');
  const expression = commaIndex >= 0 ? withoutLength.slice(0, commaIndex) : withoutLength;
  const rack = commaIndex >= 0 ? withoutLength.slice(commaIndex + 1) : '';
  const constraintStart = expression.search(/[+-]/);
  const rawPattern = constraintStart >= 0 ? expression.slice(0, constraintStart) : expression;
  const constraintSection = constraintStart >= 0 ? expression.slice(constraintStart) : '';
  const constraints = parseConstraintSection(constraintSection);
  const hasConstraints = constraintSection.length > 0;
  const hasPatternSymbols = /[*.@&]/.test(rawPattern);
  const isLengthOnly = length !== null && expression.length === 0;
  const kind = commaIndex >= 0 || hasConstraints || hasPatternSymbols || isLengthOnly ? 'pattern' : 'anagram';

  return {
    normalized,
    kind,
    expression,
    letters: kind === 'anagram' ? expression : '',
    pattern: kind === 'pattern' ? (rawPattern || '*') : '',
    rack,
    length,
    wildcardCount: (expression.match(/\?/g) || []).length,
    hasConstraints,
    constraints,
  };
}

export function isPatternQuery(value) {
  return parseUserQuery(value).kind === 'pattern';
}

export function satisfiesQueryConstraints(word, constraints) {
  const encodedWord = encodeQueryDigraphs(String(word).toUpperCase());
  const counts = new Map();
  let vowels = 0;
  let consonants = 0;

  for (const letter of encodedWord) {
    counts.set(letter, (counts.get(letter) || 0) + 1);
    if ('AEIOU'.includes(letter)) vowels += 1;
    else if (/[A-ZÑÇKW]/.test(letter)) consonants += 1;
  }

  for (const [letter, minimum] of constraints.minimum) {
    if ((counts.get(letter) || 0) < minimum) return false;
  }
  for (const [letter, maximum] of constraints.maximum) {
    if ((counts.get(letter) || 0) > maximum) return false;
  }
  if (constraints.minimumVowels !== null && vowels < constraints.minimumVowels) return false;
  if (constraints.maximumVowels !== null && vowels > constraints.maximumVowels) return false;
  if (constraints.minimumConsonants !== null && consonants < constraints.minimumConsonants) return false;
  if (constraints.maximumConsonants !== null && consonants > constraints.maximumConsonants) return false;
  return true;
}

export function filterByQueryConstraints(words, constraints) {
  return words.filter((word) => satisfiesQueryConstraints(word, constraints));
}
