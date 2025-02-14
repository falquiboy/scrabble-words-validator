
import React, { useState, useRef, useEffect } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SearchInput from './lists/SearchInput';
import ResultsList from './lists/ResultsList';

const Lists = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Initialize AdSense ad
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

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
      const { data: words, error } = await supabase
        .rpc('execute_natural_search', { query_text: processedQuery.sql });

      console.log('Respuesta de execute_natural_search:', words, error);

      if (error) {
        console.error('Error al ejecutar la consulta:', error);
        toast.error('Error al ejecutar la consulta');
        return;
      }

      setResults((words || []).map((w: { word: string }) => w.word));
      
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
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <SearchInput 
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        isLoading={isLoading}
      />

      {/* AdSense Ad Unit */}
      <ins 
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6198157256707928"
        data-ad-slot="your-ad-slot-id"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />

      <ResultsList results={results} />
    </div>
  );
};

export default Lists;
