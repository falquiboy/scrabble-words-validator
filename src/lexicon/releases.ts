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
  'dem': {
    key: 'dem',
    releaseId: 'lexicon-dle23-dem-femelex-rc4',
    publicLabel: 'DLE + DEM',
    help: 'DLE 23 + DEM 2.ª ed. · FEMELEX RC4',
    manifestUrl: '/lexicon/dem/rc4/manifest.json',
    minimumWordCount: 659_883,
    allowSupabaseFallback: false,
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
  { value: '2017', label: 'DLE 2017', help: 'DLE 23 según FISE 2016' },
  { value: 'dem', label: 'DLE + DEM', help: 'DLE 23 + DEM 2.ª ed. · FEMELEX RC4' },
  { value: '2027', label: 'DLE 2027', help: 'DLE 23.8.1 según FISE 2016' },
  { value: 'hybrid', label: 'Comparar 2017/2027', help: 'Unión comparativa de ambos releases DLE' },
];

export const releaseForMode = (mode: LexiconMode): LexiconReleaseDescriptor =>
  LEXICON_RELEASES[mode === 'hybrid' ? '2027' : mode];

export const wordCountForMode = (mode: LexiconMode): number => {
  if (mode === 'hybrid') return 650_054 + 214;
  return LEXICON_RELEASES[mode].minimumWordCount;
};
