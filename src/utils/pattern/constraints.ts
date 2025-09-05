export interface PatternConstraints {
  required: Set<string>;  // Letters that must be present (+)
  forbidden: Set<string>; // Letters that must not be present (-)
  pattern?: string;       // The actual pattern (if any)
  requiredCounts?: Map<string, number>; // Minimum counts for specific letters (+2L = at least 2 L's)
  maxCounts?: Map<string, number>;      // Maximum counts for specific letters (-3A = at most 3 A's)
}

/**
 * Parses constraint patterns like "+Q-EI", "+ABC-XYZ", "+2L", "-3A", etc.
 * Now supports numeric notation: +2L (at least 2 L's), -3A (at most 3 A's)
 * @param input The constraint pattern string
 * @returns Parsed constraints with required and forbidden letters
 */
export function parseConstraints(input: string): PatternConstraints {
  const constraints: PatternConstraints = {
    required: new Set(),
    forbidden: new Set(),
    requiredCounts: new Map(),
    maxCounts: new Map(),
  };
  
  // First, extract length constraint if present (e.g., "+Q-EI:5")
  let processedInput = input;
  const lengthMatch = input.match(/^(.+):(\d+)$/);
  if (lengthMatch) {
    processedInput = lengthMatch[1];
    // Store the length in the pattern for now (will be handled by the caller)
    // We'll add it back after processing constraints
  }
  
  // Check if there's a pattern part (before any +/- constraints)
  // Patterns can contain dots, wildcards, letters, commas, hyphens
  const constraintMatch = processedInput.match(/^([^+\-]*?)([+\-].*)$/);
  
  let constraintPart = processedInput;
  
  if (constraintMatch) {
    const [, patternPart, constraintSection] = constraintMatch;
    if (patternPart) {
      constraints.pattern = patternPart;
    }
    constraintPart = constraintSection;
  }
  
  // If we had a length constraint, append it to the pattern
  if (lengthMatch) {
    const lengthSuffix = ':' + lengthMatch[2];
    if (constraints.pattern) {
      constraints.pattern += lengthSuffix;
    } else {
      // If no pattern, we'll handle length separately in the search
      constraints.pattern = lengthSuffix;
    }
  }
  
  // Parse the constraints section
  const parts = constraintPart.split(/(?=[+\-])/);
  
  for (const part of parts) {
    if (part.startsWith('+')) {
      // Check if it has numeric notation like +2L or +3AB
      const numericMatch = part.match(/^\+(\d+)([A-Z]+)/i);
      if (numericMatch) {
        const count = parseInt(numericMatch[1]);
        const letters = numericMatch[2].toUpperCase();
        for (const letter of letters) {
          if (/[A-Z]/.test(letter)) {
            constraints.required.add(letter);
            // Store the minimum count requirement
            const currentMin = constraints.requiredCounts!.get(letter) || 0;
            constraints.requiredCounts!.set(letter, Math.max(currentMin, count));
          }
        }
      } else {
        // Regular required letters (no count specified means at least 1)
        const letters = part.substring(1).toUpperCase();
        for (const letter of letters) {
          if (/[A-Z]/.test(letter)) {
            constraints.required.add(letter);
            // If no count specified, default to 1
            if (!constraints.requiredCounts!.has(letter)) {
              constraints.requiredCounts!.set(letter, 1);
            }
          }
        }
      }
    } else if (part.startsWith('-')) {
      // Check if it has numeric notation like -3A
      const numericMatch = part.match(/^\-(\d+)([A-Z]+)/i);
      if (numericMatch) {
        const count = parseInt(numericMatch[1]);
        const letters = numericMatch[2].toUpperCase();
        for (const letter of letters) {
          if (/[A-Z]/.test(letter)) {
            // Store the maximum count restriction
            const currentMax = constraints.maxCounts!.get(letter);
            if (currentMax === undefined || count < currentMax) {
              constraints.maxCounts!.set(letter, count);
            }
          }
        }
      } else {
        // Regular forbidden letters (no count means 0 allowed)
        const letters = part.substring(1).toUpperCase();
        for (const letter of letters) {
          if (/[A-Z]/.test(letter)) {
            constraints.forbidden.add(letter);
            // Forbidden means max count is 0
            constraints.maxCounts!.set(letter, 0);
          }
        }
      }
    }
  }
  
  return constraints;
}

/**
 * Checks if a word satisfies the given constraints
 * @param word The word to check
 * @param constraints The constraints to apply
 * @returns true if the word satisfies all constraints
 */
export function satisfiesConstraints(word: string, constraints: PatternConstraints): boolean {
  const upperWord = word.toUpperCase();
  
  // Count letter occurrences in the word
  const letterCounts = new Map<string, number>();
  for (const letter of upperWord) {
    letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
  }
  
  // Check minimum required counts
  if (constraints.requiredCounts && constraints.requiredCounts.size > 0) {
    for (const [letter, minCount] of constraints.requiredCounts) {
      const actualCount = letterCounts.get(letter) || 0;
      if (actualCount < minCount) {
        return false; // Word doesn't have enough of this letter
      }
    }
  }
  
  // Check maximum allowed counts
  if (constraints.maxCounts && constraints.maxCounts.size > 0) {
    for (const [letter, maxCount] of constraints.maxCounts) {
      const actualCount = letterCounts.get(letter) || 0;
      if (actualCount > maxCount) {
        return false; // Word has too many of this letter
      }
    }
  }
  
  // Legacy support: Check required letters (must contain ALL of them)
  for (const letter of constraints.required) {
    if (!upperWord.includes(letter)) {
      return false;
    }
  }
  
  // Legacy support: Check forbidden letters (must not contain ANY of them)
  for (const letter of constraints.forbidden) {
    if (upperWord.includes(letter)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Filters an array of words based on constraints
 * @param words Array of words to filter
 * @param constraints The constraints to apply
 * @returns Filtered array of words that satisfy constraints
 */
export function filterByConstraints(words: string[], constraints: PatternConstraints): string[] {
  if (constraints.required.size === 0 && constraints.forbidden.size === 0) {
    return words;
  }
  
  return words.filter(word => satisfiesConstraints(word, constraints));
}

/**
 * Detects if a search term contains inclusion/exclusion constraints
 * Supports both simple (+A, -B) and numeric notation (+2L, -3A)
 * @param searchTerm The search term to check
 * @returns true if the term contains +/- constraints
 */
export function hasConstraints(searchTerm: string): boolean {
  // Check for simple constraints (+A, -B) or numeric constraints (+2L, -3A)
  return /[+\-](\d*[A-Za-z]|[A-Za-z])/.test(searchTerm);
}