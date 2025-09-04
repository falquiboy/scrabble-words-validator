#!/usr/bin/env python3
"""
Generate a compact GADDAG optimized for browser loading
Uses a more efficient JSON structure
"""

import json
import csv
import os
import time
from collections import defaultdict

class CompactGaddagBuilder:
    """Builds a compact GADDAG structure optimized for JSON serialization"""
    
    def __init__(self):
        self.nodes = {}  # Use dictionary for easier JSON serialization
        self.node_id = 0
        self.word_count = 0
        self.SEPARATOR = '>'
        
    def process_digraphs(self, word: str) -> str:
        """Process Spanish digraphs: CH -> Ç, LL -> K, RR -> W"""
        word = word.replace('CH', 'Ç').replace('LL', 'K').replace('RR', 'W')
        word = word.replace('ch', 'Ç').replace('ll', 'K').replace('rr', 'W')
        return word.upper()
    
    def add_word(self, word: str):
        """Add word to compact GADDAG"""
        if not word or len(word) < 2:
            return
            
        word = self.process_digraphs(word.upper())
        word_len = len(word)
        
        # For each position in the word, create a GADDAG entry
        for i in range(word_len + 1):
            if i == 0:
                gaddag_string = self.SEPARATOR + word
            elif i == word_len:
                gaddag_string = word[::-1] + self.SEPARATOR
            else:
                prefix = word[:i][::-1]  # Reverse the prefix
                suffix = word[i:]
                gaddag_string = prefix + self.SEPARATOR + suffix
            
            self._insert_string(gaddag_string)
        
        self.word_count += 1
        
        if self.word_count % 10000 == 0:
            print(f"  📊 Processed {self.word_count:,} words, {len(self.nodes):,} nodes")
    
    def _insert_string(self, gaddag_string: str):
        """Insert GADDAG string using compact node structure"""
        current_id = 0  # Root is always 0
        
        # Ensure root exists
        if 0 not in self.nodes:
            self.nodes[0] = {'c': {}, 't': False}  # c=children, t=terminal
        
        for char in gaddag_string:
            if char not in self.nodes[current_id]['c']:
                self.node_id += 1
                new_id = self.node_id
                self.nodes[current_id]['c'][char] = new_id
                self.nodes[new_id] = {'c': {}, 't': False}
                current_id = new_id
            else:
                current_id = self.nodes[current_id]['c'][char]
        
        # Mark terminal
        self.nodes[current_id]['t'] = True
    
    def load_from_csv(self, csv_path: str):
        """Load words from CSV"""
        print(f"📂 Loading words from {csv_path}...")
        
        with open(csv_path, 'r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                word = row.get('non_diac_word', '').strip()
                if word and len(word) >= 2:
                    self.add_word(word)
        
        print(f"✅ Loaded {self.word_count:,} words, {len(self.nodes):,} nodes")
    
    def save_to_json(self, filename: str):
        """Save compact GADDAG to JSON"""
        print(f"💾 Saving compact GADDAG to {filename}...")
        
        gaddag_data = {
            'meta': {
                'v': '1.0',  # version
                'wc': self.word_count,  # word_count
                'nc': len(self.nodes),  # node_count
                'sep': self.SEPARATOR,  # separator
                'lang': 'es'  # language
            },
            'nodes': self.nodes
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(gaddag_data, f, ensure_ascii=False, separators=(',', ':'))
        
        size = os.path.getsize(filename)
        print(f"✅ Compact GADDAG saved ({size:,} bytes = {size/1024/1024:.1f} MB)")

def main():
    print("🇪🇸 Compact GADDAG Generator for Browser")
    print("=" * 40)
    
    CSV_PATH = "../csvs/lexicon_keys.csv"
    
    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV file not found: {CSV_PATH}")
        return 1
    
    builder = CompactGaddagBuilder()
    
    start_time = time.time()
    
    # Load and build
    builder.load_from_csv(CSV_PATH)
    
    # Save compact version
    builder.save_to_json('../public/spanish_gaddag_compact.json')
    
    total_time = time.time() - start_time
    print(f"\n⏱️ Total time: {total_time:.2f} seconds")
    
    return 0

if __name__ == "__main__":
    exit(main())