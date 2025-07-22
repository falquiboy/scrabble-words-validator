
import { useState, useEffect } from "react";
import WordValidator from "@/components/WordValidator";
import Anagramador from "@/components/Anagramador";
import Lists from "@/components/Lists";
// Temporarily commented out for build fix
// import { TrainingSystemDemo } from "@/components/TrainingSystemDemo";
import NewModuleSelector from "@/components/NewModuleSelector";
import { useWordDatabase } from "@/hooks/useWordDatabase";
import { useWordTrie } from "@/hooks/useWordTrie";

const Index = () => {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram' | 'lists' | 'training'>('judge');
  const [showTraining, setShowTraining] = useState(false);
  
  // Initialize dictionary at the top level so it's shared between modules
  const { isLoading: isDBLoading, progress: dbProgress, loadStartTime, isFirstLoad, wordCount } = useWordDatabase();
  const { isLoading: isTrieLoading, trie, loadingProgress, stage: trieStage } = useWordTrie();
  
  const isDictionaryLoading = isDBLoading || isTrieLoading;
  
  // Calculate combined progress based on the current stage
  const getCombinedProgress = () => {
    if (isTrieLoading && trieStage === 'building') {
      // If we're building the trie, the DB is already loaded, so combine the progress
      // with 90% weight to DB loading and 10% to trie building
      return Math.min(90 + (loadingProgress * 0.1), 100);
    }
    
    if (isDBLoading) {
      return dbProgress.percent;
    }
    
    if (isTrieLoading) {
      return loadingProgress;
    }
    
    return 100;
  };
  
  // Determine the current stage to display
  const getCurrentStage = () => {
    if (isTrieLoading && trieStage) {
      return trieStage;
    }
    
    if (isDBLoading && dbProgress.stage) {
      return dbProgress.stage;
    }
    
    return 'complete';
  };

  // Manejar navegación con Control + AvPág/RePág y acceso al sistema de entrenamiento
  useEffect(() => {
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
          switch (current) {
            case 'judge': return 'anagram';
            case 'anagram': return 'lists';
            case 'lists': return 'judge';
            default: return current;
          }
        });
      }
      
      // Verificar Ctrl + RePág (Page Up)
      if (e.ctrlKey && e.key === 'PageUp') {
        e.preventDefault();
        setActiveModule((current) => {
          switch (current) {
            case 'judge': return 'lists';
            case 'anagram': return 'judge';
            case 'lists': return 'anagram';
            default: return current;
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTraining]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NewModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className="mt-20 flex-1 w-full">
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
            {activeModule === 'judge' ? (
              <WordValidator 
                isDictionaryLoading={isDictionaryLoading} 
                progress={getCombinedProgress()}
                trie={trie}
                stage={getCurrentStage()}
                loadStartTime={loadStartTime}
                isFirstLoad={isFirstLoad}
                wordCount={wordCount}
              />
            ) : activeModule === 'anagram' ? (
              <Anagramador trie={trie} />
            ) : (
              <Lists trie={trie} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
