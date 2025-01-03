// Converts user-friendly pattern syntax to internal regex pattern
export const convertToInternalPattern = (input: string): { pattern: string, rack: string } => {
  // Split into pattern and rack parts
  const [pattern = '', rack = ''] = input.split(',').map(p => p?.trim().toUpperCase());

  // Early return if empty
  if (!pattern) return { pattern: '', rack: '' };

  // Validate no internal hyphens
  if (pattern.slice(1, -1).includes('-')) {
    throw new Error("El guion (-) solo puede usarse al inicio o final del patrón");
  }

  // Convert pattern based on hyphens
  let internalPattern = pattern.replace(/\?/g, '?');
  const hasStartHyphen = pattern.startsWith('-');
  const hasEndHyphen = pattern.endsWith('-');

  // Remove hyphens for processing
  internalPattern = internalPattern.replace(/-/g, '');

  // Add anchors and wildcards based on hyphen positions
  if (hasStartHyphen && hasEndHyphen) {
    internalPattern = `^.*${internalPattern}.*$`;
  } else if (hasStartHyphen) {
    internalPattern = `^.*${internalPattern}$`;
  } else if (hasEndHyphen) {
    internalPattern = `^${internalPattern}.*$`;
  } else {
    internalPattern = `^${internalPattern}$`;
  }

  return {
    pattern: internalPattern,
    rack: rack
  };
};