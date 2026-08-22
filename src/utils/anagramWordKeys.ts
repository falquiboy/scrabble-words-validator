import { processDigraphs, toDisplayFormat } from './digraphs.ts';

export const getAnagramWordKey = (word: string): string =>
  processDigraphs(word).toUpperCase();

export const getAnagramWordDisplayKey = (word: string): string =>
  toDisplayFormat(getAnagramWordKey(word)).toUpperCase();

export const setAnagramWordInfoAliases = <T>(
  target: Map<string, T>,
  word: string,
  value: T,
): void => {
  const internalKey = getAnagramWordKey(word);
  const displayKey = getAnagramWordDisplayKey(word);

  if (internalKey) target.set(internalKey, value);
  if (displayKey) target.set(displayKey, value);
};

export const getAnagramWordInfo = <T>(
  source: Map<string, T>,
  word: string,
): T | undefined => {
  const displayKey = getAnagramWordDisplayKey(word);
  const internalKey = getAnagramWordKey(word);

  return source.get(displayKey) ?? source.get(internalKey);
};
