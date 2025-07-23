import { supabase } from "@/integrations/supabase/client";
import { processDigraphs, toDisplayFormat } from "./digraphs";

export interface HookInfo {
  word: string;
  leftExternal?: string;
  rightExternal?: string;
  leftInternal?: string;
  rightInternal?: string;
  hasExternalHooks: boolean;
  hasInternalHooks: boolean;
}

export interface ProcessedHooks {
  leftExternal: string[];
  rightExternal: string[];
  hasLeftInternal: boolean;
  hasRightInternal: boolean;
  leftInternalLetters: string[];
  rightInternalLetters: string[];
}

export async function fetchHooksData(words: string[]): Promise<Map<string, HookInfo>> {
  const results = new Map<string, HookInfo>();
  
  if (words.length === 0) return results;

  console.log('🎣 fetchHooksData called with:', words);

  try {
    // Convert words to internal format for querying (CH->Ç, LL->K, RR->W)
    const internalWords = words.map(word => processDigraphs(word.toLowerCase()));
    console.log('🔄 Converted to internal format:', internalWords);

    const { data: hooksData, error } = await supabase
      .from('hooks')
      .select(`
        word,
        left_external,
        right_external,
        left_internal,
        right_internal,
        has_external_hooks,
        has_internal_hooks
      `)
      .in('word', internalWords);

    if (error) {
      console.error('❌ Hooks table error:', error);
      throw error;
    }

    console.log('✅ Hooks response:', hooksData);
    console.log('✅ Number of hooks found:', hooksData?.length || 0);

    if (hooksData && hooksData.length > 0) {
      // Create map with original word as key
      const internalToOriginal = new Map<string, string>();
      words.forEach(word => {
        const internal = processDigraphs(word.toLowerCase());
        internalToOriginal.set(internal, word);
      });

      hooksData.forEach(hook => {
        const originalWord = internalToOriginal.get(hook.word) || hook.word;
        
        const hookInfo: HookInfo = {
          word: originalWord,
          leftExternal: hook.left_external || undefined,
          rightExternal: hook.right_external || undefined,
          leftInternal: hook.left_internal || undefined,
          rightInternal: hook.right_internal || undefined,
          hasExternalHooks: hook.has_external_hooks === "1",
          hasInternalHooks: hook.has_internal_hooks === "1"
        };

        console.log(`🎣 Processed hooks for: ${originalWord}`, hookInfo);
        results.set(originalWord, hookInfo);
      });
    }

    // Add empty entries for words without hooks
    words.forEach(word => {
      if (!results.has(word)) {
        results.set(word, {
          word,
          hasExternalHooks: false,
          hasInternalHooks: false
        });
      }
    });

  } catch (error) {
    console.error('❌ Error fetching hooks data:', error);
    
    // Return empty hook info for all words on error
    words.forEach(word => {
      results.set(word, {
        word,
        hasExternalHooks: false,
        hasInternalHooks: false
      });
    });
  }

  return results;
}

export function processHooks(hookInfo: HookInfo): ProcessedHooks {
  const processed: ProcessedHooks = {
    leftExternal: [],
    rightExternal: [],
    hasLeftInternal: false,
    hasRightInternal: false,
    leftInternalLetters: [],
    rightInternalLetters: []
  };

  // Process external hooks - convert back to display format
  if (hookInfo.leftExternal) {
    processed.leftExternal = hookInfo.leftExternal.split('').map(letter => 
      toDisplayFormat(letter)
    );
  }

  if (hookInfo.rightExternal) {
    processed.rightExternal = hookInfo.rightExternal.split('').map(letter => 
      toDisplayFormat(letter)
    );
  }

  // Process internal hooks
  if (hookInfo.leftInternal) {
    processed.hasLeftInternal = true;
    processed.leftInternalLetters = hookInfo.leftInternal.split('').map(letter => 
      toDisplayFormat(letter)
    );
  }

  if (hookInfo.rightInternal) {
    processed.hasRightInternal = true;
    processed.rightInternalLetters = hookInfo.rightInternal.split('').map(letter => 
      toDisplayFormat(letter)
    );
  }

  return processed;
}

export function formatHooksForDisplay(word: string, hooks: ProcessedHooks): {
  leftHooks: string[];
  rightHooks: string[];
  displayWord: string;
} {
  const displayWord = toDisplayFormat(word);
  
  return {
    leftHooks: hooks.leftExternal,
    rightHooks: hooks.rightExternal,
    displayWord
  };
}