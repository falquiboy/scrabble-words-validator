import React, { useState, useRef } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SearchInput from './lists/SearchInput';
import ResultsList from './lists/ResultsList';
import { toDisplayFormat } from "@/utils/digraphs";

const Lists = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Por favor ingresa una consulta');
      return;
    }

    console.log('Iniciando búsqueda con query:', query);
    setIsLoading(true);
    
    try {
      console.log('Llamando a process-natural-query...');
      const { data: processedQuery, error: processError } = await supabase.functions.invoke('process-natural-query', {
        body: { query: query.trim() }
      });

      console.log('Respuesta de process-natural-query:', processedQuery, processError);

      if (processError) {
        console.error('Error al procesar la consulta:', processError);
        toast.error(processError.message || 'Error al procesar la consulta');
        return;
      }

      if (!processedQuery?.sql) {
        console.error('No se recibió SQL de process-natural-query');
        toast.error('Error al generar la consulta SQL');
        return;
      }

      console.log('Ejecutando SQL:', processedQuery.sql);
      const { data: words, error, count } = await supabase
        .rpc('execute_natural_search', { query_text: processedQuery.sql });

      console.log('Respuesta de execute_natural_search:', words, error, count);

      if (error) {
        console.error('Error al ejecutar la consulta:', error);
        toast.error('Error al ejecutar la consulta');
        return;
      }

      // Convert internal representation to display format
      const formattedResults = (words || []).map((w: { word: string }) => toDisplayFormat(w.word));
      setResults(formattedResults);

      // Notificar al usuario sobre los resultados
      if (formattedResults.length === 0) {
        toast.info('La búsqueda no arrojó resultados, intente reformular la consulta');
      } else if (formattedResults.length === 100) {
        toast.info('Se muestran solo los primeros 100 resultados');
      }
      
      await supabase.from('query_history').insert({
        natural_query: query.trim(),
        sql_query: processedQuery.sql,
        successful: true
      });

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
      <div className="flex-1">
        <ResultsList results={results} />
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
    </div>
  );
};

export default Lists;
