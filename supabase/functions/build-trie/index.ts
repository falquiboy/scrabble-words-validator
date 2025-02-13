
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
    let current = this.root;
    const upperWord = word.toUpperCase();
    
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
    trie.insert(word);
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
    const { data: words, error } = await supabaseClient
      .rpc('get_words_batch', { 
        batch_size: batchSize,
        last_word: lastWord 
      });

    if (error) {
      throw new Error(`Error fetching words batch: ${error.message}`);
    }

    if (!words || words.length === 0) {
      hasMore = false;
      break;
    }

    allWords.push(...words);
    lastWord = words[words.length - 1];
    console.log(`Fetched batch of ${words.length} words. Total words so far: ${allWords.length}`);

    if (words.length < batchSize) {
      hasMore = false;
    }
  }

  return allWords.map(w => w);
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
    console.error('Error:', error.message)
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

