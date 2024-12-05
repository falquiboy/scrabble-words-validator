import { useEffect, useState } from 'react';
import { initializeTrie } from './utils/trie';
import './App.css';
import ModuleSelector from './components/ModuleSelector';

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
    </div>
  );
}

export default App;