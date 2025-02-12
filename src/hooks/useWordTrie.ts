
import { useState, useEffect, useCallback } from 'react';
import { Trie } from '@/utils/trie';
import { toast } from 'sonner';
import { loadDictionary } from '@/utils/dictionary/loader';

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie] = useState<Trie>(() => new Trie());
  const [wordCount, setWordCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const initTrie = useCallback(async () => {
    if (!isLoading) return;
    
    try {
      console.log('Iniciando carga del diccionario binario...');
      const startTime = performance.now();
      
      // Cargar el diccionario binario
      const dictionary = await loadDictionary();
      console.log('Diccionario cargado:', dictionary);
      
      // Construir el trie con las palabras del diccionario
      trie.clear();
      let processed = 0;
      const totalWords = dictionary.words.length;
      
      for (const { word } of dictionary.words) {
        const upperWord = word.toUpperCase();
        trie.insert(upperWord, upperWord);
        processed++;
        
        // Actualizar progreso cada 1%
        const progress = Math.floor((processed / totalWords) * 100);
        if (progress > loadingProgress) {
          setLoadingProgress(progress);
        }
      }
      
      setWordCount(totalWords);
      const endTime = performance.now();
      console.log(`Trie construido en ${((endTime - startTime) / 1000).toFixed(2)}s con ${totalWords} palabras`);
      
      // Agregar logging temporal para obtener una copia del Trie
      console.log('TRIE_DUMP:', JSON.stringify(trie.serialize()));
      
    } catch (err) {
      console.error('Error al cargar el diccionario:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el diccionario';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
    }
  }, [isLoading, trie]); // Removida la dependencia de loadingProgress

  useEffect(() => {
    initTrie();
  }, [initTrie]);

  return { isLoading, error, wordCount, trie, loadingProgress };
};
