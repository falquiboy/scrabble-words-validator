/**
 * Highlights the letter that corresponds to the wildcard position in the search term
 * or the additional letter in extended matches
 */
export const highlightWildcardLetter = (word: string, searchTerm: string) => {
  // First, convert both word and search term to internal representation
  const processedWord = word
    .replace(/CH/g, 'Ç')
    .replace(/LL/g, 'K')
    .replace(/RR/g, 'W');
    
  const processedSearchTerm = searchTerm
    .replace(/\*/g, '')
    .replace(/CH/g, 'Ç')
    .replace(/LL/g, 'K')
    .replace(/RR/g, 'W');

  if (searchTerm.includes('*')) {
    // Find the position of the wildcard in the search term
    const wildcardIndex = searchTerm.indexOf('*');
    
    if (wildcardIndex !== -1) {
      // Create arrays of letters for comparison
      const searchTermLetters = processedSearchTerm.split('');
      const wordLetters = processedWord.split('');
      
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
      
      // The first non-marked letter is our wildcard match
      const wildcardPosition = remainingWordLetters.findIndex(letter => letter !== '#');
      
      if (wildcardPosition !== -1) {
        // Get the original letter/digraph from the word
        let originalLetter = '';
        const processedLetter = wordLetters[wildcardPosition];
        
        // Convert back to display format
        switch (processedLetter) {
          case 'Ç':
            originalLetter = 'CH';
            break;
          case 'K':
            originalLetter = 'LL';
            break;
          case 'W':
            originalLetter = 'RR';
            break;
          default:
            originalLetter = processedLetter;
        }
        
        // Calculate position in original word
        let pos = 0;
        for (let i = 0; i < wildcardPosition; i++) {
          const letter = wordLetters[i];
          pos += (letter === 'Ç' || letter === 'K' || letter === 'W') ? 2 : 1;
        }
        
        // Wrap the letter/digraph in blue (user wildcard)
        return word.slice(0, pos) + 
               `<span class="text-blue-500 font-bold">${originalLetter}</span>` + 
               word.slice(pos + originalLetter.length);
      }
    }
  } else {
    // For additional letter matches (no wildcards)
    const searchLetters = processedSearchTerm.split('');
    const wordLetters = processedWord.split('');
    
    // Create a copy of wordLetters to mark used letters
    let remainingWordLetters = [...wordLetters];
    
    // Mark all letters that match the search term
    for (const letter of searchLetters) {
      const index = remainingWordLetters.findIndex(l => l === letter);
      if (index !== -1) {
        remainingWordLetters[index] = '#'; // Mark as used
      }
    }
    
    // The first non-marked letter is our additional letter
    const additionalLetterPos = remainingWordLetters.findIndex(letter => letter !== '#');
    
    if (additionalLetterPos !== -1) {
      // Get the original letter/digraph from the word
      let originalLetter = '';
      const processedLetter = wordLetters[additionalLetterPos];
      
      // Convert back to display format
      switch (processedLetter) {
        case 'Ç':
          originalLetter = 'CH';
          break;
        case 'K':
          originalLetter = 'LL';
          break;
        case 'W':
          originalLetter = 'RR';
          break;
        default:
          originalLetter = processedLetter;
      }
      
      // Calculate position in original word
      let pos = 0;
      for (let i = 0; i < additionalLetterPos; i++) {
        const letter = wordLetters[i];
        pos += (letter === 'Ç' || letter === 'K' || letter === 'W') ? 2 : 1;
      }
      
      // Return the word with the additional letter highlighted in red
      return `<span class="text-gray-900">${word.slice(0, pos)}</span>` + 
             `<span class="text-red-500 font-bold">${originalLetter}</span>` + 
             `<span class="text-gray-900">${word.slice(pos + originalLetter.length)}</span>`;
    }
  }

  return word;
};