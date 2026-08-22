import { normalizeUserQueryInput } from "./queryLanguage.mjs";

export const MAX_RACK_LETTERS = 15;
export const MAX_PATTERN_LENGTH = 10;

export const validateAndCleanAnagramInput = (value: string) => {
  return normalizeUserQueryInput(value);
};

export const validateAndCleanPatternInput = (value: string) => {
  return normalizeUserQueryInput(value);
};
