import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mic, MicOff } from "lucide-react";

const WordResult = ({ word }: { word: string }) => {
  const raeUrl = `https://dle.rae.es/${encodeURIComponent(word)}`;
  
  return (
    <a
      href={raeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-gray-50 hover:bg-[#D6BCFA] p-2 rounded text-center transition-colors"
      aria-label={`Buscar "${word}" en el diccionario RAE`}
    >
      {word}
    </a>
  );
};

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

      // Type assertion since we know the shape of the data
      setResults((words || []).map((w: { word: string }) => w.word));
      
      // Store query in history
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
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
      <div className="space-y-2">
        <div className="flex gap-2">
          <Textarea
            placeholder="Escribe tu consulta en español (ej: palabras de cinco letras con dos eles)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[100px]"
          />
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant="outline"
            size="icon"
            className="flex-shrink-0"
            type="button"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
        <Button 
          onClick={handleSearch} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {/* AdSense Ad Unit */}
      <ins 
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6198157256707928"
        data-ad-slot="your-ad-slot-id"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Resultados ({results.length})</h3>
          <div className="max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {results.map((word, index) => (
                <WordResult key={index} word={word} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lists;
