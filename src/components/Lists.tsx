import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Lists = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Por favor ingresa una consulta');
      return;
    }

    setIsLoading(true);
    try {
      const { data: processedQuery } = await supabase.functions.invoke('process-natural-query', {
        body: { query: query.trim() }
      });

      if (processedQuery.error) {
        toast.error(processedQuery.error);
        return;
      }

      const { data: words, error } = await supabase
        .rpc('execute_natural_search', { query_text: processedQuery.sql });

      if (error) {
        toast.error('Error al ejecutar la consulta');
        console.error('Query error:', error);
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
      console.error('Error:', error);
      toast.error('Error al procesar la consulta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Escribe tu consulta en español (ej: palabras de cinco letras con dos eles)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[100px]"
        />
        <Button 
          onClick={handleSearch} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Resultados ({results.length})</h3>
          <div className="max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {results.map((word, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 p-2 rounded text-center"
                >
                  {word}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lists;