
// Utility functions specific to natural language query processing
export const processNaturalQuery = (input: string): {
  processedQuery: string,
  hasSeparateLetters: {
    ch?: boolean
  }
} => {
  if (!input) return { processedQuery: '', hasSeparateLetters: {} };
  
  let result = input.toUpperCase();
  
  // Detect if C and H are meant to be separate letters
  const hasSeparateCH = /\bC\s*(?:Y|CON|,)\s*H\b/g.test(result);
  
  // Handle L/LL explicit references without digraph processing
  result = result
    .replace(/\b(ELE|ELES)\b/g, 'L')
    .replace(/\b(ELLE|ELLES)\b/g, 'LL')
    .replace(/\b([^A-Z]|^)L([^A-Z]|$)\b/g, '$1L$2')
    .replace(/\b([^A-Z]|^)LL([^A-Z]|$)\b/g, '$1LL$2');
  
  // Special handling for Ñ during accent removal
  result = result.replace(/Ñ/g, '#');
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
  result = result.replace(/#/g, 'Ñ');
  
  return {
    processedQuery: result,
    hasSeparateLetters: {
      ch: hasSeparateCH
    }
  };
};
