import React, { useCallback, useEffect, useRef, useState } from 'react';
import LexiconSourceLink from '@/components/LexiconSourceLink';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { fetchAnagramWordsData, type AnagramWordInfo } from '@/utils/anagramWordData';
import { getAnagramWordInfo } from '@/utils/anagramWordKeys';

interface DefinitionTooltipLinkProps {
  word: string;
  children: React.ReactNode;
}

const LONG_PRESS_DURATION_MS = 550;
const MOBILE_DEFINITION_DURATION_MS = 4000;

const DefinitionTooltipLink: React.FC<DefinitionTooltipLinkProps> = ({ word, children }) => {
  const [wordInfo, setWordInfo] = useState<AnagramWordInfo | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [openRequested, setOpenRequested] = useState(false);
  const [longPressOpen, setLongPressOpen] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const touchActiveRef = useRef(false);

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

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearLongPressTimer();
    if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
  }, [clearLongPressTimer]);

  useEffect(() => {
    if (!longPressOpen || !definition) return;
    const timer = setTimeout(() => setLongPressOpen(false), MOBILE_DEFINITION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [definition, longPressOpen]);

  const handleTouchStart = () => {
    clearLongPressTimer();
    touchActiveRef.current = true;
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setLongPressOpen(true);
      requestDefinition();
    }, LONG_PRESS_DURATION_MS);
  };

  const handleTouchMove = () => {
    if (!longPressTriggeredRef.current) clearLongPressTimer();
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLAnchorElement>) => {
    clearLongPressTimer();
    touchActiveRef.current = false;
    if (!longPressTriggeredRef.current) return;

    event.preventDefault();
    if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
    clickResetTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = false;
    }, 700);
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!longPressTriggeredRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    longPressTriggeredRef.current = false;
  };

  return (
    <Tooltip
      delayDuration={350}
      open={Boolean(definition) && (openRequested || longPressOpen)}
      onOpenChange={(open) => {
        setOpenRequested(open);
        if (open) requestDefinition();
      }}
    >
      <TooltipTrigger asChild>
        <LexiconSourceLink
          word={word}
          className="touch-manipulation select-none transition-colors hover:text-blue-600 [-webkit-touch-callout:none]"
          title={undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            clearLongPressTimer();
            touchActiveRef.current = false;
          }}
          onClick={handleClick}
          onContextMenu={(event) => {
            if (touchActiveRef.current || longPressTriggeredRef.current) event.preventDefault();
          }}
          onDragStart={(event) => event.preventDefault()}
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
