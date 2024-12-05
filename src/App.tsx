import { useEffect } from 'react';
import { initializeTrie } from './utils/trie';
import './App.css';
import ModuleSelector from './components/ModuleSelector';

function App() {
  useEffect(() => {
    initializeTrie();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ModuleSelector />
    </div>
  );
}

export default App;