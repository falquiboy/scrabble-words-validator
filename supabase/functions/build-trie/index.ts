
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { decompress, compress } from 'https://deno.land/x/brotli@0.1.7/mod.ts'
import { Buffer } from "https://deno.land/std@0.170.0/node/buffer.ts"

// Definir los headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  word: string;
}

interface SerializedTrieNode {
  children: [string, SerializedTrieNode][];
  isEndOfWord: boolean;
  word: string;
}

interface SerializedTrie {
  root: SerializedTrieNode;
}

class Trie {
  private root: TrieNode;

  constructor() {
    this.root = this.createNode();
  }

  private createNode(): TrieNode {
    return {
      children: new Map(),
      isEndOfWord: false,
      word: ''
    };
  }

  insert(word: string): void {
    if (!word || typeof word !== 'string') {
      console.error('Invalid word:', word, 'Type:', typeof word);
      return;
    }

    let current = this.root;
    const upperWord = String(word).toUpperCase();
    
    for (const char of upperWord) {
      if (!current.children.has(char)) {
        current.children.set(char, this.createNode());
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.word = upperWord;
  }

  serialize(): SerializedTrie {
    const serializeNode = (node: TrieNode): SerializedTrieNode => {
      return {
        children: Array.from(node.children.entries()).map(([key, value]) => [
          key,
          serializeNode(value),
        ]),
        isEndOfWord: node.isEndOfWord,
        word: node.word,
      };
    };

    return {
      root: serializeNode(this.root),
    };
  }
}

async function buildTrie(words: string[]): Promise<{serializedTrie: string, checksum: string}> {
  console.log('Building trie with', words.length, 'words...');
  
  const trie = new Trie();
  for (const word of words) {
    try {
      trie.insert(word);
    } catch (error) {
      console.error('Error inserting word:', word);
      console.error('Error details:', error);
    }
  }
  
  const serialized = trie.serialize();
  const serializedString = JSON.stringify(serialized);
  
  // Calcular checksum
  const encoder = new TextEncoder();
  const data = encoder.encode(serializedString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Comprimir
  const compressed = compress(encoder.encode(serializedString));
  const base64 = Buffer.from(compressed).toString('base64');
  
  console.log('Trie built and serialized. Compressed size:', base64.length, 'bytes');
  
  return {
    serializedTrie: base64,
    checksum
  };
}

async function getAllWords(supabaseClient: any): Promise<string[]> {
  const batchSize = 10000;
  let lastWord: string | null = null;
  const allWords: string[] = [];
  let hasMore = true;

  console.log('Starting to fetch words in batches...');

  while (hasMore) {
    try {
      const { data: words, error } = await supabaseClient
        .rpc('get_words_batch', { 
          batch_size: batchSize,
          last_word: lastWord 
        });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Error fetching words batch: ${error.message}`);
      }

      if (!words || words.length === 0) {
        console.log('No more words to fetch');
        hasMore = false;
        break;
      }

      // Log detallado de la primera palabra para debugging
      console.log('First word in batch:', JSON.stringify(words[0]));
      console.log('First word type:', typeof words[0]);
      
      if (typeof words[0] === 'object') {
        console.log('First word keys:', Object.keys(words[0]));
      }

      const processedWords = words.map((w: any) => {
        if (typeof w === 'string') return w;
        if (w && typeof w === 'object') {
          // Si es un objeto, intentamos obtener la propiedad 'word'
          const wordValue = w.word || w.word_text || w.text || String(w);
          console.log('Processing word object:', w, '-> processed as:', wordValue);
          return wordValue;
        }
        console.error('Unexpected word format:', w);
        return String(w);
      });

      allWords.push(...processedWords);
      lastWord = processedWords[processedWords.length - 1];
      console.log(`Batch processed. Current word count: ${allWords.length}`);

      if (words.length < batchSize) {
        hasMore = false;
      }
    } catch (error) {
      console.error('Error in batch processing:', error);
      throw error;
    }
  }

  console.log('Total words collected:', allWords.length);
  return allWords;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Crear cliente Supabase con service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )

    console.log('Starting word collection process...');
    
    // Obtener todas las palabras usando el nuevo método por lotes
    const words = await getAllWords(supabaseClient);

    if (!words || words.length === 0) {
      throw new Error('No words found in database');
    }

    console.log(`Found total of ${words.length} words`);

    // Construir y serializar el trie
    const { serializedTrie, checksum } = await buildTrie(words);

    // Guardar en trie_cache
    const { error: upsertError } = await supabaseClient
      .from('trie_cache')
      .upsert({
        id: 1, // Siempre usamos id=1 ya que solo necesitamos una entrada
        serialized_trie: serializedTrie,
        checksum,
        total_words: words.length,
        compressed: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (upsertError) {
      throw new Error(`Error upserting trie cache: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        wordCount: words.length,
        checksum,
        compressedSize: serializedTrie.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in main process:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
