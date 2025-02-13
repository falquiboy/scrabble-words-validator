
import { useState, useEffect, useCallback } from 'react';
import { Trie } from '@/utils/trie';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { compressData, decompressData, calculateChecksum } from '@/utils/compression';
import { serializeTrieToBinary, deserializeTrieFromBinary } from '@/utils/trie/binaryFormat';
import { WordLoader } from '@/services/WordLoader';

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
      
      const { data: cacheData } = await supabase
        .from('trie_cache')
        .select('serialized_trie, checksum, total_words')
        .maybeSingle();

      if (cacheData) {
        console.log('Cache encontrado, descomprimiendo...');
        const compressedData = new Uint8Array(Buffer.from(cacheData.serialized_trie, 'base64'));
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
      
      // Get total word count first
      const { count: totalWords, error: countError } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true });

      if (countError) throw new Error(`Failed to get word count: ${countError.message}`);
      if (!totalWords) throw new Error('No words found in database');

      // Construir el trie con las palabras del diccionario
      trie.clear();
      const loader = new WordLoader(totalWords);
      
      for await (const words of loader.loadWords()) {
        for (const word of words) {
          const upperWord = word.toUpperCase();
          trie.insert(upperWord, upperWord);
        }
        const progress = loader.getProgress();
        if (progress > loadingProgress) {
          setLoadingProgress(progress);
          console.log(`Loading progress: ${progress.toFixed(1)}%`);
        }
      }
      
      setWordCount(totalWords);
      
      // Serializar y almacenar en cache
      console.log('Serializando Trie...');
      const serializedTrie = serializeTrieToBinary(trie.getRoot());
      const checksum = await calculateChecksum(serializedTrie);
      const compressed = await compressData(serializedTrie);
      
      // Convertir Uint8Array a string base64 para almacenar en Supabase
      const base64Data = Buffer.from(compressed).toString('base64');
      
      console.log('Guardando en cache...');
      await supabase
        .from('trie_cache')
        .upsert({
          id: 1,
          serialized_trie: base64Data,
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
