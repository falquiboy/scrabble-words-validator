import { toDisplayFormat } from '@/utils/digraphs';
import type { LexiconMembership, LexiconMode } from './types';

export interface LexiconSourceLink {
  label: 'DEM' | 'DLE';
  title: string;
  url: string;
}

export const sourceLinkForWord = (
  word: string,
  mode: LexiconMode,
  membership: LexiconMembership,
): LexiconSourceLink => {
  const displayWord = toDisplayFormat(word).toLowerCase();
  if (mode === 'dem' && membership === 'new-dem') {
    return {
      label: 'DEM',
      title: 'Consultar en el Diccionario del Español de México',
      url: `https://dem.colmex.mx/Ver/${encodeURIComponent(displayWord)}`,
    };
  }
  return {
    label: 'DLE',
    title: 'Consultar en el Diccionario de la lengua española',
    url: `https://dle.rae.es/?w=${encodeURIComponent(displayWord)}`,
  };
};
