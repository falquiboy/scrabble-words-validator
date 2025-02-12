
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BATCH_SIZE = 2000; // Increased from 500 to 2000

export class WordLoader {
  private lastWord = '';
  private totalWords = 0;
  private expectedCount: number;
  
  constructor(expectedCount: number) {
    this.expectedCount = expectedCount;
  }

  async *loadWords(): AsyncGenerator<string[], void> {
    let hasMore = true;

    while (hasMore) {
      try {
        const { data: words, error } = await supabase
          .from('words')
          .select('word')
          .gt('word', this.lastWord)
          .order('word')
          .limit(BATCH_SIZE);

        if (error) throw new Error(`Supabase fetch error: ${error.message}`);
        
        if (!words || words.length === 0) {
          if (this.totalWords < this.expectedCount) {
            throw new Error(`Incomplete dictionary: ${this.totalWords}/${this.expectedCount}`);
          }
          hasMore = false;
          break;
        }

        this.totalWords += words.length;
        this.lastWord = words[words.length - 1].word;
        
        yield words.map(w => w.word);

      } catch (error) {
        console.error('Word loading error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load dictionary');
        throw error;
      }
    }
  }

  getProgress(): number {
    return Math.min((this.totalWords / this.expectedCount) * 100, 100);
  }
}
