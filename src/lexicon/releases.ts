import type { LexiconMode, LexiconReleaseKey } from './types';

export interface LexiconReleaseDescriptor {
  key: LexiconReleaseKey;
  releaseId: string;
  publicLabel: string;
  help: string;
  manifestUrl: string;
  minimumWordCount: number;
  allowSupabaseFallback: boolean;
}

export const LEXICON_RELEASES: Record<LexiconReleaseKey, LexiconReleaseDescriptor> = {
  '2017': {
    key: '2017',
    releaseId: 'lexicon-dle23-fise2016',
    publicLabel: '2017',
    help: 'DLE 23 según FISE 2016',
    manifestUrl: '/lexicon/manifest.json',
    minimumWordCount: 639_293,
    allowSupabaseFallback: true,
  },
  '2027': {
    key: '2027',
    releaseId: 'lexicon-2027-rc1',
    publicLabel: '2027',
    help: 'DLE 23.8.1 según FISE 2016',
    manifestUrl: '/lexicon/2027/manifest.json',
    minimumWordCount: 650_054,
    allowSupabaseFallback: false,
  },
};

export const LEXICON_MODE_OPTIONS: Array<{
  value: LexiconMode;
  label: string;
  help: string;
}> = [
  { value: '2017', label: 'Lexicón 2017', help: 'El lexicón estable actual' },
  { value: 'hybrid', label: 'Híbrido', help: 'Compara y distingue 2017 y 2027' },
  { value: '2027', label: 'Lexicón 2027', help: 'La nueva release como autoridad' },
];

export const releaseForMode = (mode: LexiconMode): LexiconReleaseDescriptor =>
  LEXICON_RELEASES[mode === '2017' ? '2017' : '2027'];

export const wordCountForMode = (mode: LexiconMode): number => {
  if (mode === 'hybrid') return 650_054 + 214;
  return LEXICON_RELEASES[mode].minimumWordCount;
};
