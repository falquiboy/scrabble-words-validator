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
  
  if (words.length === 0) {
    console.log('🎣 fetchHooksData: No words provided');
    return results;
  }

  console.log('🎣 fetchHooksData called with:', words);
  console.log('🎣 Words count:', words.length);

  try {
    // Convert words to internal format for querying (CH->Ç, LL->K, RR->W)
    const internalWords = words.map(word => processDigraphs(word.toLowerCase()));
    console.log('🔄 Converted to internal format:', internalWords);
    console.log('🔄 Internal words count:', internalWords.length);

    // First, let's check if the hooks table even exists
    console.log('🔍 Testing hooks table access...');
    
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
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Check if it's a table not found error
      if (error.message && error.message.includes('does not exist')) {
        console.error('❌ HOOKS TABLE DOES NOT EXIST! Need to import hooks.csv first');
      }
      
      throw error;
    }

    console.log('✅ Hooks response received');
    console.log('✅ Hooks data:', hooksData);
    console.log('✅ Number of hooks found:', hooksData?.length || 0);
    
    // Log each hook found for debugging
    if (hooksData && hooksData.length > 0) {
      hooksData.forEach((hook, index) => {
        console.log(`🎣 Hook ${index + 1}:`, hook);
      });
    } else {
      console.warn('⚠️ No hooks data returned from database');
    }

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
        // Store with uppercase key to match HooksView lookup
        const upperKey = toDisplayFormat(originalWord).toUpperCase();
        results.set(upperKey, hookInfo);
      });
    }

    // Add empty entries for words without hooks
    words.forEach(word => {
      const upperKey = toDisplayFormat(word).toUpperCase();
      if (!results.has(upperKey)) {
        results.set(upperKey, {
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
      const upperKey = toDisplayFormat(word).toUpperCase();
      results.set(upperKey, {
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