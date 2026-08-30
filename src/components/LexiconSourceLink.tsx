import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { useLexicon } from '@/lexicon/LexiconContext';
import { sourceLinkForWord } from '@/lexicon/sourceLinks';

interface LexiconSourceLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  word: string;
  children: ReactNode;
}

const LexiconSourceLink = forwardRef<HTMLAnchorElement, LexiconSourceLinkProps>(({
  word,
  children,
  className = '',
  ...anchorProps
}, ref) => {
  const { mode, membership } = useLexicon();
  const source = sourceLinkForWord(word, mode, membership(word));

  return (
    <a
      ref={ref}
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={source.title}
      {...anchorProps}
    >
      {children}
    </a>
  );
});

LexiconSourceLink.displayName = 'LexiconSourceLink';

export default LexiconSourceLink;
