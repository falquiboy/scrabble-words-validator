export const loadWordList = async (file: File): Promise<Set<string>> => {
  const text = await file.text();
  // Split by newlines and create a Set for O(1) lookups
  return new Set(text.split('\n').map(word => word.trim().toUpperCase()));
};