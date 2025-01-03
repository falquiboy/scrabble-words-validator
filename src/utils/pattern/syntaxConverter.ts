// Converts user-friendly pattern syntax to internal regex pattern
export const convertToInternalPattern = (input: string): { pattern: string, rack: string } => {
  // Split into pattern and rack parts
  const [pattern = '', rack = ''] = input.split(',').map(p => p?.trim().toUpperCase());

  // Early return if empty
  if (!pattern) return { pattern: '', rack: '' };

  // Keep the pattern as is, since we handle dashes in validation
  return {
    pattern: pattern,
    rack: rack
  };
};
