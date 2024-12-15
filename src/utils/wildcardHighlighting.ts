/**
 * Highlights the letter that corresponds to the wildcard position in the search term
 * @param word The result word to highlight
 * @param searchTerm The original search term with wildcard
 * @returns JSX element with highlighted letter
 */
export const highlightWildcardLetter = (word: string, searchTerm: string) => {
  const digraphs = ['CH', 'LL', 'RR'];
  let result = word;
  
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

  return result;
};