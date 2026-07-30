
import { useState, useEffect } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import Lists from "@/components/Lists";
// Temporarily commented out for build fix
// import { TrainingSystemDemo } from "@/components/TrainingSystemDemo";
import NewModuleSelector from "@/components/NewModuleSelector";
import GlobalSettingsMenu from "@/components/GlobalSettingsMenu";
import { useWordTrie } from "@/hooks/useWordTrie";
import Residues from "@/components/Residues";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram' | 'lists' | 'residues' | 'training'>('judge');
  const [showTraining, setShowTraining] = useState(false);
  const [enableUltraFastMode] = useState(true);
  
  // States for anagram settings (lifted up from Anagramador)
  const [showShorter, setShowShorter] = useState(false);
  const [showExtendedView, setShowExtendedView] = useState(false);
  const [showHooksView, setShowHooksView] = useState(false);
  const [sortByEquity, setSortByEquity] = useState(false);
  const [hasActiveAnagramSearch, setHasActiveAnagramSearch] = useState(false);
  const [anagramCopyAllCallback, setAnagramCopyAllCallback] = useState<(() => void) | undefined>(undefined);
  const [isPatternWithoutRack, setIsPatternWithoutRack] = useState(false);
  
  // Persistent anagram search state (survives tab navigation)
  const [persistentAnagramSearch, setPersistentAnagramSearch] = useState({
    searchTerm: "",
    targetLength: null as number | null
  });
  
  
  // Use only useWordTrie - it handles all dictionary/database construction
  const { isLoading: isTrieLoading, trie, loadingProgress, stage: trieStage, wordCount } = useWordTrie(enableUltraFastMode);
  
  // Dictionary loading is only true when Trie is being built (ultra-fast mode enabled)
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
        setActiveModule((current) => {
          const currentIndex = moduleOrder.indexOf(current as typeof moduleOrder[number]);
          if (currentIndex === -1) return current;
          const nextIndex = (currentIndex + 1) % moduleOrder.length;
          return moduleOrder[nextIndex];
        });
      }
      
      // Verificar Ctrl + RePág (Page Up)
      if (e.ctrlKey && e.key === 'PageUp') {
        e.preventDefault();
        setActiveModule((current) => {
          const currentIndex = moduleOrder.indexOf(current as typeof moduleOrder[number]);
          if (currentIndex === -1) return current;
          const previousIndex = (currentIndex - 1 + moduleOrder.length) % moduleOrder.length;
          return moduleOrder[previousIndex];
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTraining]);

  return (
    <div
      className="h-screen bg-gray-50 flex flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <NewModuleSelector 
        activeModule={activeModule} 
        onModuleChange={setActiveModule}
      />
      <GlobalSettingsMenu 
        activeModule={activeModule}
        anagramSettings={{
          showShorter,
          onShowShorterChange: setShowShorter,
          showExtendedView,
          onExtendedViewChange: (show: boolean) => {
            setShowExtendedView(show);
            if (show) setShowHooksView(false);
          },
          showHooksView,
          onHooksViewChange: (show: boolean) => {
            setShowHooksView(show);
            if (show) setShowExtendedView(false);
          },
          hasActiveSearch: hasActiveAnagramSearch,
          onCopyAll: anagramCopyAllCallback,
          sortByEquity,
          onSortByEquityChange: setSortByEquity,
          isPatternWithoutRack
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
            {/* Temporarily commented out for build fix */}
            {/* <TrainingSystemDemo /> */}
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
                />
              ) : activeModule === 'anagram' ? (
                <Anagramador 
                  trie={trie}
                  showShorter={showShorter}
                  onShowShorterChange={setShowShorter}
                  showExtendedView={showExtendedView}
                  onExtendedViewChange={setShowExtendedView}
                  showHooksView={showHooksView}
                  onHooksViewChange={setShowHooksView}
                  sortByEquity={sortByEquity}
                  onSortByEquityChange={setSortByEquity}
                  onSearchStateChange={setHasActiveAnagramSearch}
                  onCopyAllCallbackChange={setAnagramCopyAllCallback}
                  onPatternWithoutRackChange={setIsPatternWithoutRack}
                  persistentSearchTerm={persistentAnagramSearch.searchTerm}
                  persistentTargetLength={persistentAnagramSearch.targetLength}
                  onPersistentSearchChange={setPersistentAnagramSearch}
                />
              ) : activeModule === 'lists' ? (
                <Lists trie={trie} />
              ) : activeModule === 'residues' ? (
                <Residues trie={trie} />
              ) : (
                null
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
