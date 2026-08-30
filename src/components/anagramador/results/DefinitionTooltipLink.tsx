import React, { useCallback, useState } from 'react';
import LexiconSourceLink from '@/components/LexiconSourceLink';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchAnagramWordsData, type AnagramWordInfo } from '@/utils/anagramWordData';
import { getAnagramWordInfo } from '@/utils/anagramWordKeys';

interface DefinitionTooltipLinkProps {
  word: string;
  children: React.ReactNode;
}

const DefinitionTooltipLink: React.FC<DefinitionTooltipLinkProps> = ({ word, children }) => {
  const [wordInfo, setWordInfo] = useState<AnagramWordInfo | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  const requestDefinition = useCallback(() => {
    if (hasRequested) return;

    setHasRequested(true);
    void fetchAnagramWordsData([word.toUpperCase()])
      .then((data) => {
        setWordInfo(getAnagramWordInfo(data, word) || null);
      })
      .catch((error) => {
        console.error(`Error cargando la definición de ${word}:`, error);
        setHasRequested(false);
      });
  }, [hasRequested, word]);

  const definition = wordInfo?.shortDefinition?.trim();

  return (
    <Tooltip delayDuration={350} onOpenChange={(open) => open && requestDefinition()}>
      <TooltipTrigger asChild>
        <LexiconSourceLink
          word={word}
          className="hover:text-blue-600 transition-colors"
          title={undefined}
        >
          {children}
        </LexiconSourceLink>
      </TooltipTrigger>
      {definition && (
        <TooltipContent
          side="top"
          align="start"
          className="w-72 max-w-[calc(100vw-2rem)] whitespace-normal px-3 py-2 text-sm leading-relaxed"
        >
          {definition}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export default DefinitionTooltipLink;
