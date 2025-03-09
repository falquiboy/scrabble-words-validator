
import { supabase } from '@/integrations/supabase/client';
import { wordDB } from '@/services/WordDatabase';
import { toast } from 'sonner';

const CSV_BUCKET_NAME = 'words';
const CSV_FILE_PATH = 'words.csv';
const CHUNK_SIZE = 5000;

export class CsvWordLoader {
  private totalWords = 0;
  private processedWords = 0;
  private expectedCount: number;
  private abortController: AbortController | null = null;
  
  constructor(expectedCount: number) {
    this.expectedCount = expectedCount;
  }

  getProgress(): number {
    return Math.min((this.processedWords / this.expectedCount) * 100, 100);
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async loadCsvFile(): Promise<boolean> {
    try {
      console.log('Checking for CSV dictionary in Supabase storage...');
      
      // Check if the file exists
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from(CSV_BUCKET_NAME)
        .download(CSV_FILE_PATH);
      
      if (fileError || !fileData) {
        console.log('CSV file not found or error accessing it:', fileError);
        return false;
      }
      
      console.log('CSV file found, starting processing...');
      this.abortController = new AbortController();
      
      // Process the CSV file
      return await this.processCsvFile(fileData);
    } catch (error) {
      console.error('Error loading CSV file:', error);
      return false;
    }
  }
  
  private async processCsvFile(file: Blob): Promise<boolean> {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const header = lines[0]; // Not used but keeping for reference
      
      console.log(`CSV file loaded with ${lines.length - 1} lines`);
      
      // Skip header line
      const wordsData = lines.slice(1).filter(line => line.trim().length > 0);
      this.totalWords = wordsData.length;
      
      if (this.totalWords === 0) {
        console.error('CSV file contains no words');
        return false;
      }
      
      // Process in chunks
      const chunks: string[][] = [];
      for (let i = 0; i < wordsData.length; i += CHUNK_SIZE) {
        chunks.push(wordsData.slice(i, i + CHUNK_SIZE));
      }
      
      console.log(`Processing ${chunks.length} chunks of ${CHUNK_SIZE} words each`);
      
      for (let i = 0; i < chunks.length; i++) {
        if (this.abortController?.signal.aborted) {
          console.log('CSV processing aborted');
          return false;
        }
        
        const chunkWords = chunks[i].map(line => {
          // Extract word from CSV line (assuming first column is the word)
          const columns = line.split(',');
          return columns[0].trim().replace(/"/g, '');
        }).filter(word => word.length > 0);
        
        await wordDB.addWords(chunkWords);
        
        this.processedWords += chunkWords.length;
        console.log(`Processed chunk ${i+1}/${chunks.length}, total: ${this.processedWords}/${this.totalWords} words`);
      }
      
      console.log('CSV processing complete');
      toast.success(`Diccionario cargado: ${this.processedWords.toLocaleString()} palabras`);
      return true;
      
    } catch (error) {
      console.error('Error processing CSV file:', error);
      toast.error('Error procesando el diccionario');
      return false;
    }
  }
}
