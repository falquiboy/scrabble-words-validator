import { getInternalLength } from './digraphs.ts';
import { parseUserQuery } from './queryLanguage.mjs';

export const canOrderShorterWordsByEquity = (searchTerm: string): boolean => {
  const query = parseUserQuery(searchTerm);
  return query.kind === 'anagram'
    && getInternalLength(query.letters) > 0
    && getInternalLength(query.letters) <= 7;
};
