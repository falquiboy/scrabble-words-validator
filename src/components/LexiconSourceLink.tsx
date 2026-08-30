import type { MouseEvent, ReactNode } from 'react';
import { useLexicon } from '@/lexicon/LexiconContext';
import { sourceLinkForWord } from '@/lexicon/sourceLinks';

interface LexiconSourceLinkProps {
  word: string;
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

const LexiconSourceLink = ({
  word,
  children,
  className = '',
  onClick,
}: LexiconSourceLinkProps) => {
  const { mode, membership } = useLexicon();
  const source = sourceLinkForWord(word, mode, membership(word));

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={source.title}
      onClick={onClick}
    >
      {children}
    </a>
  );
};

export default LexiconSourceLink;
