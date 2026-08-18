import React, { useState, useRef } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SearchInput from './lists/SearchInput';
import ResultsList from './lists/ResultsList';
import WordDetails from './lists/WordDetails';
import WordPopup from './lists/WordPopup';
import { fetchWordData, WordData } from '@/utils/wordDatabase';
import { toDisplayFormat } from "@/utils/digraphs";
import type { WordSearchService } from '@/lexicon/types';
import { useLexicon } from '@/lexicon/LexiconContext';

interface ListsProps {
  trie: WordSearchService;
}

// Query type detection and response types
type QueryType = 'word' | 'anagram' | 'pattern' | 'natural_language';

interface WordInfo {
  word: string;
  isValid: boolean;
  anagrams: string[];
  subanagrams: string[];
  definition?: string;
}

const Lists = ({ trie }: ListsProps) => {
  const { sortWords } = useLexicon();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [queryType, setQueryType] = useState<QueryType | null>(null);
  const [popupWordData, setPopupWordData] = useState<WordData | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLoadingPopup, setIsLoadingPopup] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Automatic query type detection
  const detectQueryType = async (input: string): Promise<QueryType> => {
    const trimmed = input.trim().toLowerCase();
    
    // Pattern detection (contains *, . or _ or -)
    if (trimmed.includes('*') || trimmed.includes('.') || trimmed.includes('_') || trimmed.includes('-') || trimmed.includes(':')) {
      return 'pattern';
    }
    
    // Single word without spaces (could be word or anagram letters)
    if (!trimmed.includes(' ') && /^[a-záéíóúüñç*]+$/i.test(trimmed)) {
      // If it's a valid word, treat as word lookup
      const upperWord = trimmed.toUpperCase();
      if (await trie.searchAsync(upperWord)) {
        return 'word';
      }
      // Otherwise treat as anagram letters
      return 'anagram';
    }
    
    // Default to natural language for multi-word queries
    return 'natural_language';
  };

  // Word validation and analysis
  const analyzeWord = async (word: string): Promise<WordInfo> => {
    const upperWord = word.toUpperCase();
    const isValid = await trie.searchAsync(upperWord);
    
    let anagrams: string[] = [];
    let subanagrams: string[] = [];
    
    if (isValid || word.length <= 8) { // Get anagrams even for invalid short words
      const { exactMatches, shorterMatches } = await trie.findAnagramsWithSubAnagrams(word, true);
      anagrams = exactMatches.filter(w => w !== upperWord).map(w => toDisplayFormat(w)).slice(0, 20);
      subanagrams = shorterMatches.map(w => toDisplayFormat(w)).slice(0, 30);
    }

    return {
      word: toDisplayFormat(upperWord),
      isValid,
      anagrams,
      subanagrams
    };
  };

  // Handle word click to show popup with database info
  const handleWordClick = async (word: string) => {
    if (isLoadingPopup) return; // Prevent multiple simultaneous requests
    
    setIsLoadingPopup(true);
    setIsPopupOpen(true);
    setPopupWordData(null); // Clear previous data
    
    try {
      const wordData = await fetchWordData(word);
      setPopupWordData(wordData);
    } catch (error) {
      console.error('Error fetching word data:', error);
      toast.error('Error al cargar información de la palabra');
    } finally {
      setIsLoadingPopup(false);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setPopupWordData(null);
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Por favor ingresa una consulta');
      return;
    }

    console.log('🔍 Iniciando búsqueda omnibox con query:', query);
    setIsLoading(true);
    setWordInfo(null);
    setResults([]);
    
    const detectedType = await detectQueryType(query);
    setQueryType(detectedType);
    console.log('🎯 Tipo de consulta detectado:', detectedType);
    
    try {
      switch (detectedType) {
        case 'word': {
          console.log('📖 Procesando como palabra individual');
          const analysis = await analyzeWord(query.trim());
          setWordInfo(analysis);
          
          if (analysis.isValid) {
            toast.success(`"${analysis.word}" es válida para Scrabble`);
          } else {
            toast.error(`"${analysis.word}" no es válida para Scrabble`);
          }
          break;
        }
        
        case 'anagram': {
          console.log('🔤 Procesando como anagrama');
          const { exactMatches, shorterMatches } = await trie.findAnagramsWithSubAnagrams(query.trim(), true);
          const wildcardMatches: string[] = [];
          const additionalWildcardMatches = await trie.findAnagramsWithOneAdditionalLetter(query.trim());
          
          const allResults: string[] = [];
          if (exactMatches.length > 0) allResults.push(...exactMatches);
          if (wildcardMatches.length > 0) allResults.push(...wildcardMatches);
          if (additionalWildcardMatches.length > 0) allResults.push(...additionalWildcardMatches);
          if (shorterMatches.length > 0) allResults.push(...shorterMatches);
          
          const formattedResults = sortWords(allResults).map(w => toDisplayFormat(w)).slice(0, 100);
          setResults(formattedResults);
          
          toast.success(`Encontrados ${formattedResults.length} anagramas${formattedResults.length === 100 ? ' (mostrando primeros 100)' : ''}`);
          break;
        }
        
        case 'pattern': {
          console.log('🎯 Procesando como patrón');
          const patternMatches = await trie.findPatternMatches(query.trim(), false, 8, null);
          const formattedResults = sortWords(patternMatches).map(w => toDisplayFormat(w)).slice(0, 100);
          setResults(formattedResults);
          
          toast.success(`Encontradas ${formattedResults.length} palabras que coinciden con el patrón${formattedResults.length === 100 ? ' (mostrando primeras 100)' : ''}`);
          break;
        }
        
        case 'natural_language': {
          console.log('🗣️ Procesando como lenguaje natural');
          console.log('🚀 USANDO ANTHROPIC CLAUDE');
          
          const { data: processedQuery, error: processError } = await supabase.functions.invoke('process-natural-query', {
            body: { query: query.trim() }
          });

          console.log('Respuesta de process-natural-query:', processedQuery, processError);

          if (processError) {
            console.error('Error al procesar la consulta:', processError);
            toast.error(processError.message || 'Error al procesar la consulta');
            return;
          }

          // Handle hybrid response from process-natural-query
          let formattedResults: string[] = [];
          
          if (processedQuery?.results && processedQuery.results.length > 0) {
            // Direct results from migrated database
            console.log('✅ Resultados de BD migrada:', processedQuery.results);
            const candidates = processedQuery.results.map((entry: { lemma: string }) => entry.lemma);
            const validity = await Promise.all(candidates.map((candidate: string) => trie.searchAsync(candidate)));
            formattedResults = sortWords(candidates.filter((_: string, index: number) => validity[index])).map(toDisplayFormat);
            setResults(formattedResults);
            
            if (processedQuery.message) {
              toast.success(processedQuery.message);
            }
          } else if (processedQuery?.sql) {
            // Fallback: execute SQL for words table (Claude generated)
            console.log('📝 Ejecutando SQL fallback:', processedQuery.sql);
            const { data: words, error, count } = await supabase
              .rpc('execute_natural_search', { query_text: processedQuery.sql });

            console.log('Respuesta de execute_natural_search:', words, error, count);

            if (error) {
              console.error('Error al ejecutar la consulta:', error);
              toast.error('Error al ejecutar la consulta');
              return;
            }

            // Convert internal representation to display format
            const candidates = (words || []).map((w: { word: string }) => w.word);
            const validity = await Promise.all(candidates.map((candidate: string) => trie.searchAsync(candidate)));
            formattedResults = sortWords(candidates.filter((_: string, index: number) => validity[index])).map(toDisplayFormat);
            setResults(formattedResults);
          } else {
            console.error('No se recibieron resultados ni SQL de process-natural-query');
            toast.error('Error al procesar la consulta');
            return;
          }

          // Notificar al usuario sobre los resultados
          if (formattedResults.length === 0) {
            toast.info('La búsqueda no arrojó resultados, intente reformular la consulta');
          } else if (formattedResults.length === 100) {
            toast.info('Se muestran solo los primeros 100 resultados');
          }
          
          await supabase.from('query_history').insert({
            natural_query: query.trim(),
            sql_query: processedQuery.sql || processedQuery.sql_query || 'Direct database search',
            successful: true
          });
          break;
        }
      }

    } catch (error) {
      console.error('Error inesperado:', error);
      toast.error('Error al procesar la consulta');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onload = async () => {
          if (typeof reader.result === 'string') {
            const base64Audio = reader.result.split(',')[1];
            
            try {
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio }
              });

              if (error) {
                toast.error('Error al procesar el audio');
                return;
              }

              if (data?.text) {
                setQuery(data.text);
                toast.success('Audio transcrito correctamente');
              }
            } catch (error) {
              console.error('Error processing voice:', error);
              toast.error('Error al procesar la voz');
            }
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Grabando...');

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Error al acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
      <div className="flex-1 space-y-4 p-4">
        {/* Show word details for single word analysis */}
        {wordInfo && <WordDetails wordInfo={wordInfo} onWordClick={handleWordClick} />}
        
        {/* Show results list for other query types */}
        {results.length > 0 && <ResultsList results={results} onWordClick={handleWordClick} />}
        
        {/* Show query type indicator */}
        {queryType && (
          <div className="text-xs text-gray-500 text-center">
            {queryType === 'word' && '📖 Análisis de palabra'}
            {queryType === 'anagram' && '🔤 Búsqueda de anagramas'}
            {queryType === 'pattern' && '🎯 Búsqueda por patrón'}
            {queryType === 'natural_language' && '🗣️ Consulta en lenguaje natural'}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-white">
        <SearchInput 
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          isLoading={isLoading}
        />
      </div>

      {/* Word popup */}
      <WordPopup
        wordData={popupWordData}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
      />
    </div>
  );
};

export default Lists;
