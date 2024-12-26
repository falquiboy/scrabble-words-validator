import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NaturalSearchHandlerProps {
  query: string;
  onResults: (results: string[]) => void;
}

export const NaturalSearchHandler = async ({ 
  query,
  onResults
}: NaturalSearchHandlerProps) => {
  const { toast } = useToast();

  try {
    const { data, error } = await supabase.functions.invoke('process-natural-query', {
      body: { query },
    });

    if (error) throw error;
    
    if (data.results?.length > 0) {
      onResults(data.results);
      toast({
        title: "Consulta procesada",
        description: `Se encontraron ${data.results.length} palabras`,
      });
    } else if (data.error) {
      toast({
        title: "Error",
        description: data.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sin resultados",
        description: "No se encontraron palabras para esta consulta",
      });
    }
  } catch (error) {
    console.error('Error processing natural language:', error);
    toast({
      title: "Error",
      description: "No se pudo procesar la consulta en lenguaje natural",
      variant: "destructive",
    });
  }
};