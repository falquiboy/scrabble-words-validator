import { useLexicon } from '@/lexicon/LexiconContext';

interface LexiconBadgeProps {
  word: string;
  className?: string;
}

const LexiconBadge = ({ word, className = '' }: LexiconBadgeProps) => {
  const { mode, membership } = useLexicon();
  if (mode !== 'hybrid' && mode !== 'dem') return null;

  const status = membership(word);
  if (status === 'shared') return null;
  const isNew2027 = status === 'new-2027';
  const isNewDem = status === 'new-dem';

  const style = isNewDem
    ? 'border-rose-300 bg-rose-100 text-rose-800'
    : isNew2027
      ? 'border-amber-300 bg-amber-100 text-amber-800'
      : 'border-slate-300 bg-slate-100 text-slate-600';
  const label = isNewDem ? 'DEM' : isNew2027 ? '2027' : '2017';
  const title = isNewDem
    ? 'Grafía aportada por el DEM al lexicón combinado'
    : isNew2027
      ? 'Grafía incorporada al lexicón 2027'
      : 'Grafía exclusiva del lexicón 2017';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold leading-none ${style} ${className}`}
      title={title}
    >
      {label}
    </span>
  );
};

export default LexiconBadge;
