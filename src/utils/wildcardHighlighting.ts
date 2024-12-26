/**
 * Highlights the letter that corresponds to the wildcard position in the search term
 * or the additional letter in extended matches
 * @param word The result word to highlight
 * @param searchTerm The original search term with wildcard
 * @returns JSX element with highlighted letter
 */
export const highlightWildcardLetter = (word: string, searchTerm: string) => {
  const digraphs = ['CH', 'LL', 'RR'];
  let result = word;
  
  if (searchTerm.includes('*')) {
    // Find the position of the wildcard in the search term
    const wildcardIndex = searchTerm.indexOf('*');
    
    if (wildcardIndex !== -1) {
      // Create arrays of letters for comparison, handling digraphs
      const searchTermLetters = searchTerm.replace('*', '').split('');
      let wordLetters: string[] = [];
      
      // Split word into letters/digraphs
      for (let i = 0; i < word.length; i++) {
        const possibleDigraph = word.substr(i, 2);
        if (digraphs.includes(possibleDigraph)) {
          wordLetters.push(possibleDigraph);
          i++; // Skip next letter as it's part of the digraph
        } else {
          wordLetters.push(word[i]);
        }
      }
      
      // Create a copy of wordLetters to mark used letters
      let remainingWordLetters = [...wordLetters];
      
      // Mark all letters that match the search term (excluding wildcard)
      for (let i = 0; i < searchTermLetters.length; i++) {
        const letter = searchTermLetters[i];
        const index = remainingWordLetters.findIndex(l => l === letter);
        if (index !== -1) {
          remainingWordLetters[index] = '#'; // Mark as used
        }
      }
      
      // The first non-marked letter/digraph is our wildcard match
      const wildcardPosition = remainingWordLetters.findIndex(letter => letter !== '#');
      
      if (wildcardPosition !== -1) {
        // Calculate actual position in original word
        let actualPosition = 0;
        for (let i = 0; i < wildcardPosition; i++) {
          actualPosition += wordLetters[i].length;
        }
        
        // Wrap the letter/digraph in blue (user wildcard)
        const wildcardMatch = wordLetters[wildcardPosition];
        result = word.slice(0, actualPosition) + 
                `<span class="text-blue-500 font-bold">${wildcardMatch}</span>` + 
                word.slice(actualPosition + wildcardMatch.length);
      }
    }
  } else {
    // For additional letter matches (no wildcards)
    // Split word into letters/digraphs
    let wordLetters: string[] = [];
    for (let i = 0; i < word.length; i++) {
      const possibleDigraph = word.substr(i, 2);
      if (digraphs.includes(possibleDigraph)) {
        wordLetters.push(possibleDigraph);
        i++; // Skip next letter as it's part of the digraph
      } else {
        wordLetters.push(word[i]);
      }
    }
    
    // Split search term into letters/digraphs
    let searchLetters: string[] = [];
    for (let i = 0; i < searchTerm.length; i++) {
      const possibleDigraph = searchTerm.substr(i, 2);
      if (digraphs.includes(possibleDigraph)) {
        searchLetters.push(possibleDigraph);
        i++; // Skip next letter as it's part of the digraph
      } else {
        searchLetters.push(searchTerm[i]);
      }
    }
    
    // Create a copy of wordLetters to mark used letters
    let remainingWordLetters = [...wordLetters];
    
    // Mark all letters that match the search term
    for (const letter of searchLetters) {
      const index = remainingWordLetters.findIndex(l => l === letter);
      if (index !== -1) {
        remainingWordLetters[index] = '#'; // Mark as used
      }
    }
    
    // The first non-marked letter/digraph is our additional letter
    const additionalLetterPos = remainingWordLetters.findIndex(letter => letter !== '#');
    
    if (additionalLetterPos !== -1) {
      // Calculate actual position in original word
      let actualPosition = 0;
      for (let i = 0; i < additionalLetterPos; i++) {
        actualPosition += wordLetters[i].length;
      }
      
      // Wrap the letter/digraph in red (additional letter)
      const additionalLetter = wordLetters[additionalLetterPos];
      result = word.slice(0, actualPosition) + 
              `<span class="text-red-500 font-bold">${additionalLetter}</span>` + 
              word.slice(actualPosition + additionalLetter.length);
    }
  }

  return result;
};