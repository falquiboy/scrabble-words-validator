import React, { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import LexiconSourceLink from '@/components/LexiconSourceLink';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  fetchAnagramWordsData,
  getCachedAnagramWordInfo,
  type AnagramWordInfo,
} from '@/utils/anagramWordData';
import { getAnagramWordInfo } from '@/utils/anagramWordKeys';
import {
  closeDefinitionTooltip,
  getActiveDefinitionTooltipId,
  getServerDefinitionTooltipId,
  openDefinitionTooltip,
  subscribeDefinitionTooltip,
} from './definitionTooltipStore';

interface DefinitionTooltipLinkProps {
  word: string;
  children: React.ReactNode;
}

const LONG_PRESS_DURATION_MS = 550;
const LOADING_MESSAGE = 'Cargando definición…';
const EMPTY_MESSAGE = 'Sin definición disponible.';

const DefinitionTooltipLink: React.FC<DefinitionTooltipLinkProps> = ({ word, children }) => {
  const tooltipId = useId();
  const [wordInfo, setWordInfo] = useState<AnagramWordInfo | null>(() => getCachedAnagramWordInfo(word) || null);
  const [isFetching, setIsFetching] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [openRequested, setOpenRequested] = useState(false);
  const wordRef = useRef(word);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const touchActiveRef = useRef(false);

  const activeTooltipId = useSyncExternalStore(
    subscribeDefinitionTooltip,
    getActiveDefinitionTooltipId,
    getServerDefinitionTooltipId,
  );
  // La definición fijada con una pulsación larga permanece abierta hasta que
  // llega un nuevo toque (aquí, en otra palabra o en cualquier otro punto).
  const isPinned = activeTooltipId === tooltipId;

  // Las filas se reciclan al cambiar de consulta, así que la palabra puede
  // cambiar bajo el mismo componente: se descarta la definición anterior.
  useEffect(() => {
    wordRef.current = word;
    setHasRequested(false);
    setWordInfo(getCachedAnagramWordInfo(word) || null);
    setIsFetching(false);
  }, [word]);

  const requestDefinition = useCallback(() => {
    if (hasRequested) return;

    // Tras la precarga de la consulta lo habitual es acertar en caché y
    // mostrar la definición sin ninguna espera.
    const cached = getCachedAnagramWordInfo(word);
    setHasRequested(true);
    if (cached) {
      setWordInfo(cached);
      return;
    }

    setIsFetching(true);
    void fetchAnagramWordsData([word.toUpperCase()])
      .then((data) => {
        if (wordRef.current !== word) return;
        setWordInfo(getAnagramWordInfo(data, word) || null);
      })
      .catch((error) => {
        console.error(`Error cargando la definición de ${word}:`, error);
        if (wordRef.current !== word) return;
        setHasRequested(false);
      })
      .finally(() => {
        if (wordRef.current !== word) return;
        setIsFetching(false);
      });
  }, [hasRequested, word]);

  const definition = wordInfo?.shortDefinition?.trim();
  const message = useMemo(() => {
    if (definition) return definition;
    if (isFetching) return LOADING_MESSAGE;
    return hasRequested ? EMPTY_MESSAGE : '';
  }, [definition, hasRequested, isFetching]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearLongPressTimer();
    if (clickResetTimerRef.current) clearTimeout(clickResetTimerRef.current);
    closeDefinitionTooltip(tooltipId);
  }, [clearLongPressTimer, tooltipId]);

  const handleTouchStart = () => {
    clearLongPressTimer();
    touchActiveRef.current = true;
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      openDefinitionTooltip(tooltipId);
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
      open={Boolean(message) && (openRequested || isPinned)}
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
      {message && (
        <TooltipContent
          side="top"
          align="start"
          className="w-72 max-w-[calc(100vw-2rem)] whitespace-normal px-3 py-2 text-sm leading-relaxed"
        >
          {message}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export default DefinitionTooltipLink;
