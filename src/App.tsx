import { useEffect, useState } from 'react';
import { initializeTrie } from './utils/trie';
import './App.css';
import ModuleSelector from './components/ModuleSelector';
import WordValidator from './components/WordValidator';
import Anagramador from './components/Anagramador';

function App() {
  const [activeModule, setActiveModule] = useState<'judge' | 'anagram'>('judge');

  useEffect(() => {
    initializeTrie();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ModuleSelector 
        activeModule={activeModule} 
        onModuleChange={setActiveModule}
      />
      <div className="mt-8 flex justify-center">
        {activeModule === 'judge' ? <WordValidator /> : <Anagramador />}
      </div>
    </div>
  );
}

export default App;