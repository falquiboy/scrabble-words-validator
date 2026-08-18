import { useLexicon } from '@/lexicon/LexiconContext';

interface LexiconBadgeProps {
  word: string;
  className?: string;
}

const LexiconBadge = ({ word, className = '' }: LexiconBadgeProps) => {
  const { mode, membership } = useLexicon();
  if (mode !== 'hybrid') return null;

  const status = membership(word);
  if (status === 'shared') return null;
  const isNew = status === 'new-2027';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold leading-none ${
        isNew
          ? 'border-amber-300 bg-amber-100 text-amber-800'
          : 'border-slate-300 bg-slate-100 text-slate-600'
      } ${className}`}
      title={isNew ? 'Grafía incorporada al lexicón 2027' : 'Grafía exclusiva del lexicón 2017'}
    >
      {isNew ? '2027' : '2017'}
    </span>
  );
};

export default LexiconBadge;
