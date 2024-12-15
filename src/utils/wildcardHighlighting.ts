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
      // Create arrays of letters for comparison
      const searchTermLetters = searchTerm.replace('*', '').split('');
      const wordLetters = word.split('');
      
      // Create a copy of wordLetters to mark used letters
      let remainingWordLetters = [...wordLetters];
      
      // Mark all letters that match the search term (excluding wildcard)
      searchTermLetters.forEach(letter => {
        const index = remainingWordLetters.indexOf(letter);
        if (index !== -1) {
          remainingWordLetters[index] = '#'; // Mark as used
        }
      });
      
      // The first non-marked letter is our wildcard match
      const wildcardPosition = remainingWordLetters.findIndex(letter => letter !== '#');
      
      if (wildcardPosition !== -1) {
        // Check if this letter is part of a digraph
        const possibleDigraph = word.substr(wildcardPosition, 2);
        if (digraphs.includes(possibleDigraph)) {
          // Wrap both letters of the digraph
          result = word.slice(0, wildcardPosition) + 
                  `<span class="font-bold text-blue-500">${possibleDigraph}</span>` + 
                  word.slice(wildcardPosition + 2);
        } else {
          // Wrap single letter
          result = word.slice(0, wildcardPosition) + 
                  `<span class="font-bold text-blue-500">${word[wildcardPosition]}</span>` + 
                  word.slice(wildcardPosition + 1);
        }
      }
    }
  } else {
    // For additional letter matches (no wildcards)
    // Create arrays of letters for comparison
    const searchLetters = searchTerm.split('');
    const wordLetters = word.split('');
    
    // Create a copy of wordLetters to mark used letters
    let remainingWordLetters = [...wordLetters];
    
    // Mark all letters that match the search term
    searchLetters.forEach(letter => {
      const index = remainingWordLetters.indexOf(letter);
      if (index !== -1) {
        remainingWordLetters[index] = '#'; // Mark as used
      }
    });
    
    // The first non-marked letter is our additional letter
    const additionalLetterPos = remainingWordLetters.findIndex(letter => letter !== '#');
    
    if (additionalLetterPos !== -1) {
      // Check if this letter is part of a digraph
      const possibleDigraph = word.substr(additionalLetterPos, 2);
      if (digraphs.includes(possibleDigraph)) {
        // Wrap both letters of the digraph in blue
        result = word.slice(0, additionalLetterPos) + 
                `<span class="text-blue-500 font-bold">${possibleDigraph}</span>` + 
                word.slice(additionalLetterPos + 2);
      } else {
        // Wrap single letter in blue
        result = word.slice(0, additionalLetterPos) + 
                `<span class="text-blue-500 font-bold">${word[additionalLetterPos]}</span>` + 
                word.slice(additionalLetterPos + 1);
      }
    }
  }

  return result;
};
