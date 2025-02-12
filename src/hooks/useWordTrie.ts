
import { useState, useEffect, useCallback } from 'react';
import { Trie } from '@/utils/trie';
import { toast } from 'sonner';
import { loadDictionary } from '@/utils/dictionary/loader';
import { supabase } from '@/integrations/supabase/client';
import { compressData, decompressData, calculateChecksum } from '@/utils/compression';
import { serializeTrieToBinary, deserializeTrieFromBinary } from '@/utils/trie/binaryFormat';

export const useWordTrie = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trie] = useState<Trie>(() => new Trie());
  const [wordCount, setWordCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const initTrie = useCallback(async () => {
    if (!isLoading) return;
    
    try {
      console.log('Intentando cargar Trie desde cache...');
      
      // Intentar cargar desde Supabase primero
      const { data: cacheData } = await supabase
        .from('trie_cache')
        .select('serialized_trie, checksum, total_words')
        .single();

      if (cacheData) {
        console.log('Cache encontrado, descomprimiendo...');
        // Convertir el array de bytes a Uint8Array
        const compressedData = new Uint8Array(Object.values(cacheData.serialized_trie));
        const buffer = await decompressData(compressedData);
        const checksum = await calculateChecksum(buffer);
        
        if (checksum === cacheData.checksum) {
          console.log('Checksum válido, cargando Trie...');
          const root = deserializeTrieFromBinary(buffer);
          trie.setRoot(root);
          setWordCount(cacheData.total_words);
          setLoadingProgress(100);
          setIsLoading(false);
          return;
        }
      }
      
      console.log('Cache no encontrado o inválido, construyendo Trie...');
      const startTime = performance.now();
      
      // Cargar el diccionario binario
      const dictionary = await loadDictionary();
      
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
      
      // Serializar y almacenar en cache
      console.log('Serializando Trie...');
      const serializedTrie = serializeTrieToBinary(trie.getRoot());
      const checksum = await calculateChecksum(serializedTrie);
      const compressed = await compressData(serializedTrie);
      
      console.log('Guardando en cache...');
      await supabase
        .from('trie_cache')
        .upsert({
          id: 1,
          serialized_trie: compressed,
          checksum,
          total_words: totalWords,
          compressed: true
        })
        .eq('id', 1);
      
      const endTime = performance.now();
      console.log(`Trie construido en ${((endTime - startTime) / 1000).toFixed(2)}s con ${totalWords} palabras`);
      
    } catch (err) {
      console.error('Error al cargar el diccionario:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el diccionario';
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
    }
  }, [isLoading, trie, loadingProgress]); 

  useEffect(() => {
    initTrie();
  }, [initTrie]);

  return { isLoading, error, wordCount, trie, loadingProgress };
};
