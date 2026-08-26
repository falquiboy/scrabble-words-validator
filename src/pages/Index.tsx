
import { useState, useEffect, useMemo, useCallback } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import Lists from "@/components/Lists";
// Temporarily commented out for build fix
import NewModuleSelector from "@/components/NewModuleSelector";
import GlobalSettingsMenu from "@/components/GlobalSettingsMenu";
import { useWordTrie } from "@/hooks/useWordTrie";
import { LexiconContext, createLexiconContextValue } from '@/lexicon/LexiconContext';
import { normalizeLexiconMode } from '@/lexicon/policy.mjs';
import type { LexiconMode } from '@/lexicon/types';
import type { AnagramResultView } from '@/components/anagramador/viewTypes';

const readStoredMode = (): LexiconMode => {
  try { return normalizeLexiconMode(localStorage.getItem('maslexico:lexicon-mode')); }
  catch { return '2017'; }
};

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram' | 'lists' | 'residues' | 'training'>('judge');
  const [showTraining, setShowTraining] = useState(false);
  const [enableUltraFastMode] = useState(true);
  const [lexiconMode, setLexiconMode] = useState<LexiconMode>(readStoredMode);
  const [newWordsFirst, setNewWordsFirst] = useState(() => {
    try { return localStorage.getItem('maslexico:new-words-first') === 'true'; }
    catch { return false; }
  });
  
  // States for anagram settings (lifted up from Anagramador)
  const [showShorter, setShowShorter] = useState(false);
  const [anagramView, setAnagramView] = useState<AnagramResultView>('anagrams');
  const [hasActiveAnagramSearch, setHasActiveAnagramSearch] = useState(false);
  const [anagramCopyAllCallback, setAnagramCopyAllCallback] = useState<(() => void) | undefined>(undefined);
  const [isPatternSearch, setIsPatternSearch] = useState(false);

  const handleModuleChange = useCallback((module: 'judge' | 'anagram' | 'lists' | 'residues' | 'training') => {
    setActiveModule(module);
    if (module === 'residues') {
      setAnagramView('residues');
      setShowShorter(true);
    } else if (module === 'anagram') {
      setAnagramView((current) => current === 'residues' ? 'anagrams' : current);
    }
  }, []);

  const handleAnagramViewChange = useCallback((view: AnagramResultView) => {
    setAnagramView(view);
    if (view === 'residues') {
      setShowShorter(true);
      setActiveModule('residues');
    } else {
      setActiveModule((current) => current === 'residues' ? 'anagram' : current);
    }
  }, []);

  const handleShowShorterChange = useCallback((show: boolean) => {
    setShowShorter(show);
    if (!show) {
      setAnagramView((current) => current === 'residues' ? 'anagrams' : current);
      setActiveModule((current) => current === 'residues' ? 'anagram' : current);
    }
  }, []);
  
  // Persistent anagram search state (survives tab navigation)
  const [persistentAnagramSearch, setPersistentAnagramSearch] = useState({
    searchTerm: "",
    targetLength: null as number | null
  });
  
  
  // Use only useWordTrie - it handles all dictionary/database construction
  const {
    isLoading: isTrieLoading,
    isTrieBuilding,
    isTrieReady,
    trie,
    loadingProgress,
    stage: trieStage,
    wordCount
  } = useWordTrie(enableUltraFastMode, lexiconMode);
  const lexiconContext = useMemo(
    () => createLexiconContextValue(lexiconMode, newWordsFirst),
    [lexiconMode, newWordsFirst]
  );

  useEffect(() => {
    try { localStorage.setItem('maslexico:lexicon-mode', lexiconMode); } catch { /* optional */ }
  }, [lexiconMode]);

  useEffect(() => {
    try { localStorage.setItem('maslexico:new-words-first', String(newWordsFirst)); } catch { /* optional */ }
  }, [newWordsFirst]);
  
  // Only SQLite startup blocks the controls; Trie promotion stays in background.
  const isDictionaryLoading = isTrieLoading;
  
  // Get loading progress from Trie only
  const getProgress = () => {
    return isTrieLoading ? loadingProgress : 100;
  };
  
  // Get current stage from Trie only
  const getCurrentStage = () => {
    return isTrieLoading && trieStage ? trieStage : 'complete';
  };

  // Manejar navegación con Control + AvPág/RePág y acceso al sistema de entrenamiento
  useEffect(() => {
    const moduleOrder: Array<'judge' | 'anagram' | 'lists' | 'residues'> = ['judge', 'anagram', 'lists', 'residues'];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Acceso especial al sistema de entrenamiento: Ctrl + Shift + E (⌘ + Shift + E en Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setShowTraining(!showTraining);
        return;
      }
      
      // Verificar Ctrl + AvPág (Page Down)
      if (e.ctrlKey && e.key === 'PageDown') {
        e.preventDefault();
        const currentIndex = moduleOrder.indexOf(activeModule as typeof moduleOrder[number]);
        if (currentIndex !== -1) handleModuleChange(moduleOrder[(currentIndex + 1) % moduleOrder.length]);
      }
      
      // Verificar Ctrl + RePág (Page Up)
      if (e.ctrlKey && e.key === 'PageUp') {
        e.preventDefault();
        const currentIndex = moduleOrder.indexOf(activeModule as typeof moduleOrder[number]);
        if (currentIndex !== -1) {
          handleModuleChange(moduleOrder[(currentIndex - 1 + moduleOrder.length) % moduleOrder.length]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModule, handleModuleChange, showTraining]);

  return (
    <LexiconContext.Provider value={lexiconContext}>
    <div
      className="h-screen bg-gray-50 flex flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <NewModuleSelector 
        activeModule={activeModule} 
        onModuleChange={handleModuleChange}
      />
      <GlobalSettingsMenu 
        activeModule={activeModule}
        lexiconMode={lexiconMode}
        onLexiconModeChange={setLexiconMode}
        newWordsFirst={newWordsFirst}
        onNewWordsFirstChange={setNewWordsFirst}
        anagramSettings={{
          showShorter,
          onShowShorterChange: handleShowShorterChange,
          view: anagramView,
          onViewChange: handleAnagramViewChange,
          hasActiveSearch: hasActiveAnagramSearch,
          onCopyAll: anagramCopyAllCallback,
          isPatternSearch
        }}
      />
      <div className="mt-20 flex-1 w-full min-h-0">
        {showTraining ? (
          <div className="container mx-auto px-4 py-6">
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-blue-800">
                  🧪 Sistema de Entrenamiento - Modo Desarrollo
                </h2>
                <button
                  onClick={() => setShowTraining(false)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ✕ Cerrar (⌘+Shift+E)
                </button>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Sistema dual de entrenamiento para agentes de IA. Usa ⌘+Shift+E para mostrar/ocultar.
              </p>
            </div>
            <div className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">🔧 Sistema de Entrenamiento</h2>
              <p className="text-gray-600">Funcionalidad en desarrollo...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-full">
              {activeModule === 'judge' ? (
                <WordValidator 
                  isDictionaryLoading={isDictionaryLoading} 
                  progress={getProgress()}
                  trie={trie}
                  stage={getCurrentStage()}
                  wordCount={wordCount}
                  isTrieBuilding={isTrieBuilding}
                  isTrieReady={isTrieReady}
                  mode={lexiconMode}
                />
              ) : activeModule === 'anagram' || activeModule === 'residues' ? (
                <Anagramador 
                  trie={trie}
                  showShorter={showShorter}
                  onShowShorterChange={handleShowShorterChange}
                  view={anagramView}
                  onViewChange={handleAnagramViewChange}
                  onSearchStateChange={setHasActiveAnagramSearch}
                  onCopyAllCallbackChange={setAnagramCopyAllCallback}
                  onPatternSearchChange={setIsPatternSearch}
                  persistentSearchTerm={persistentAnagramSearch.searchTerm}
                  persistentTargetLength={persistentAnagramSearch.targetLength}
                  onPersistentSearchChange={setPersistentAnagramSearch}
                />
              ) : activeModule === 'lists' ? (
                <Lists trie={trie} />
              ) : (
                null
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </LexiconContext.Provider>
  );
};

export default Index;
