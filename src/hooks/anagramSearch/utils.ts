import { useState, useEffect } from "react";
import { findAnagrams } from "@/hooks/anagramSearch/utils";
import { findPatternMatches } from "@/utils/pattern/matching";
import { Trie } from "@/utils/trie/types";
import { SearchResults } from "./anagramSearch/types";
import { SPANISH_LETTERS } from './constants';
import { processDigraphs, generateAlphagram } from '@/utils/digraphs';

// Helper function to generate wildcard combinations
export const generateWildcardCombinations = (base: string, remainingWildcards: number): string[] => {
  if (remainingWildcards === 0) return [base];
  
  const combinations: string[] = [];
  for (const letter of SPANISH_LETTERS) {
    // Process the combination immediately
    const newCombo = base + letter;
    combinations.push(...generateWildcardCombinations(newCombo, remainingWildcards - 1));
  }
  return combinations;
};

const findExactMatches = (processedInput: string, trie: Trie): Set<string> => {
  const alphagram = generateAlphagram(processedInput);
  const matches = new Set<string>();
  const words = trie.findAnagrams(alphagram);
  words.forEach(word => matches.add(word));
  return matches;
};

const findWildcardMatches = (processedInput: string, wildcardCount: number, trie: Trie): Set<string> => {
  const matches = new Set<string>();
  const combinations = generateWildcardCombinations(processedInput, wildcardCount);
  
  for (const combo of combinations) {
    const alphagram = generateAlphagram(combo);
    const comboMatches = trie.findAnagrams(alphagram);
    comboMatches.forEach(match => matches.add(match));
  }
  
  return matches;
};

const findShorterMatches = (letters: string, trie: Trie): Set<string> => {
  const matches = new Set<string>();
  const letterArray = letters.split('');
  
  // Generate all possible combinations of letters
  for (let len = 1; len < letters.length; len++) {
    const combinations = generateCombinations(letterArray, len);
    
    for (const combo of combinations) {
      const processedCombo = combo.join('');
      const alphagram = generateAlphagram(processedCombo);
      const comboMatches = trie.findAnagrams(alphagram);
      comboMatches.forEach(match => matches.add(match));
    }
  }
  
  return matches;
};

// Helper function to generate all possible combinations of letters
const generateCombinations = (arr: string[], len: number): string[][] => {
  const result: string[][] = [];
  
  function backtrack(start: number, current: string[]) {
    if (current.length === len) {
      result.push([...current]);
      return;
    }
    
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  
  backtrack(0, []);
  return result;
};

const findAdditionalMatches = (baseLetters: string, wildcardCount: number, trie: Trie): Set<string> => {
  const matches = new Set<string>();
  
  // First process the digraphs of the input base
  const processedBase = processDigraphs(baseLetters);
  console.log('Base procesada:', processedBase);
  
  // For each Spanish letter (including digraphs), add it to the processed base
  for (const letter of SPANISH_LETTERS) {
    // Create new combination by adding the letter (which might be a digraph)
    const newCombo = processedBase + letter;
    console.log('Nueva combinación con letra adicional:', newCombo);
    
    const alphagram = generateAlphagram(newCombo);
    console.log('Alfagrama generado:', alphagram);
    
    const baseMatches = trie.findAnagrams(alphagram);
    baseMatches.forEach(match => matches.add(match));
  }
  
  // Handle wildcards similarly
  if (wildcardCount > 0) {
    const wildcardCombos = generateWildcardCombinations(processedBase, wildcardCount);
    for (const combo of wildcardCombos) {
      for (const letter of SPANISH_LETTERS) {
        // Add the letter (which might be a digraph) directly
        const newCombo = combo + letter;
        const alphagram = generateAlphagram(newCombo);
        const comboMatches = trie.findAnagrams(alphagram);
        comboMatches.forEach(match => matches.add(match));
      }
    }
  }
  
  return matches;
};

export const findAnagrams = (searchTerm: string, trie: Trie, showShorter: boolean = false) => {
  // Count wildcards and process input
  const wildcardCount = (searchTerm.match(/\*/g) || []).length;
  const lettersOnly = searchTerm.replace(/\*/g, '');
  
  // Process digraphs ONCE at the beginning
  const processedInput = processDigraphs(lettersOnly);

  console.log('Processing search:', {
    searchTerm,
    wildcardCount,
    processedInput,
    showShorter
  });

  // Find matches based on wildcards
  const exactMatches = Array.from(wildcardCount === 0 ? 
    findExactMatches(processedInput, trie) : 
    findWildcardMatches(processedInput, wildcardCount, trie)
  );

  // Find additional matches with one more letter
  const additionalWildcardMatches = Array.from(findAdditionalMatches(processedInput, wildcardCount, trie));

  // Find shorter matches if requested
  const shorterMatches = showShorter ? Array.from(findShorterMatches(processedInput, trie)) : [];

  return {
    exactMatches,
    wildcardMatches: wildcardCount > 0 ? exactMatches : [],
    additionalWildcardMatches,
    shorterMatches
  };
};