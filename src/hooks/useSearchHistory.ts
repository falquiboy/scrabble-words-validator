import { useState, useEffect } from 'react';

const MAX_HISTORY_ITEMS = 10;

export type ModuleType = 'judge' | 'anagram';

export const useSearchHistory = (moduleType: ModuleType) => {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  useEffect(() => {
    const storedHistory = localStorage.getItem(`searchHistory_${moduleType}`);
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, [moduleType]);

  const addToHistory = (search: string) => {
    if (!search.trim()) return;
    
    const newHistory = [
      search,
      ...history.filter(item => item !== search)
    ].slice(0, MAX_HISTORY_ITEMS);
    
    setHistory(newHistory);
    localStorage.setItem(`searchHistory_${moduleType}`, JSON.stringify(newHistory));
    setHistoryIndex(-1);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`searchHistory_${moduleType}`);
    setHistoryIndex(-1);
  };

  const navigateHistory = (direction: 'up' | 'down', currentInput: string) => {
    if (history.length === 0) return currentInput;

    let newIndex = historyIndex;
    
    if (direction === 'up') {
      newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
    } else {
      newIndex = Math.min(history.length - 1, historyIndex + 1);
      if (newIndex === history.length - 1) newIndex = -1;
    }

    setHistoryIndex(newIndex);
    return newIndex === -1 ? currentInput : history[newIndex];
  };

  return {
    history,
    addToHistory,
    clearHistory,
    navigateHistory,
    historyIndex
  };
};