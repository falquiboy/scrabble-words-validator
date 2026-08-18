import { createContext, useContext } from 'react';
import { lexiconCatalog } from './LexiconCatalog';
import type { LexiconMembership, LexiconMode } from './types';

interface LexiconContextValue {
  mode: LexiconMode;
  newWordsFirst: boolean;
  membership: (word: string) => LexiconMembership;
  sortWords: (words: string[]) => string[];
}

const defaultValue: LexiconContextValue = {
  mode: '2017',
  newWordsFirst: false,
  membership: () => 'shared',
  sortWords: (words) => words,
};

export const LexiconContext = createContext<LexiconContextValue>(defaultValue);

export const useLexicon = (): LexiconContextValue => useContext(LexiconContext);

export const createLexiconContextValue = (
  mode: LexiconMode,
  newWordsFirst: boolean,
): LexiconContextValue => ({
  mode,
  newWordsFirst,
  membership: (word) => mode === 'hybrid' ? lexiconCatalog.membership(word) : 'shared',
  sortWords: (words) => lexiconCatalog.sort(words, mode, newWordsFirst),
});
