import { supabase } from "@/integrations/supabase/client";

interface UseNaturalSearchProps {
  onResults: (results: string[]) => void;
}

export const useNaturalSearch = ({ onResults }: UseNaturalSearchProps) => {
  const processQuery = async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-natural-query', {
        body: { query },
      });

      if (error) throw error;
      
      if (data.results?.length > 0) {
        onResults(data.results);
        return {
          success: true,
          count: data.results.length,
        };
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        return {
          success: true,
          count: 0,
        };
      }
    } catch (error) {
      console.error('Error processing natural language:', error);
      throw error;
    }
  };

  return { processQuery };
};