#!/usr/bin/env python3
"""
GADDAG Generator for Spanish Scrabble - Binary Only
Fast binary generation without JSON to avoid memory issues
"""

import csv
import pickle
import gzip
from collections import defaultdict
from typing import Dict, List
import hashlib
import os
import time
from dataclasses import dataclass

@dataclass
class GaddagNode:
    letter: str = ''
    is_terminal: bool = False
    children: Dict[str, 'GaddagNode'] = None
    
    def __post_init__(self):
        if self.children is None:
            self.children = {}

class CompactGaddagBuilder:
    def __init__(self):
        self.root = GaddagNode()
        self.word_count = 0
        self.node_count = 0
        self.GADDAG_SEPARATOR = '>'
        
    def process_digraphs(self, word: str) -> str:
        """Process Spanish digraphs: CH -> Ç, LL -> K, RR -> W"""
        word = word.replace('CH', 'Ç').replace('LL', 'K').replace('RR', 'W')
        word = word.replace('ch', 'Ç').replace('ll', 'K').replace('rr', 'W')
        return word.upper()
    
    def add_word_to_gaddag(self, word: str) -> None:
        """Add word to GADDAG using Gordon's algorithm"""
        if not word or len(word) < 2:
            return
            
        word = self.process_digraphs(word.upper())
        word_len = len(word)
        
        # For each position in the word, create a GADDAG entry
        for i in range(word_len + 1):
            if i == 0:
                gaddag_string = self.GADDAG_SEPARATOR + word
            elif i == word_len:
                gaddag_string = word[::-1] + self.GADDAG_SEPARATOR
            else:
                prefix = word[:i][::-1]
                suffix = word[i:]
                gaddag_string = prefix + self.GADDAG_SEPARATOR + suffix
            
            self._insert_string(gaddag_string)
        
        self.word_count += 1
        
        if self.word_count % 50000 == 0:
            print(f"  📊 Progress: {self.word_count:,} words processed...")
        
    def _insert_string(self, gaddag_string: str) -> None:
        """Insert a GADDAG string into the trie structure"""
        current = self.root
        
        for char in gaddag_string:
            if char not in current.children:
                current.children[char] = GaddagNode(letter=char)
                self.node_count += 1
            current = current.children[char]
        
        current.is_terminal = True
    
    def load_from_csv(self, csv_path: str) -> None:
        """Load words from lexicon_keys.csv file"""
        print(f"📂 Loading words from {csv_path}...")
        
        words_processed = 0
        valid_words = 0
        
        with open(csv_path, 'r', encoding='utf-8-sig') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                word = row.get('non_diac_word', '').strip()
                
                if word and len(word) >= 2:
                    self.add_word_to_gaddag(word)
                    valid_words += 1
                
                words_processed += 1
        
        print(f"✅ Successfully processed {valid_words:,} valid words from {words_processed:,} rows")
        print(f"📈 GADDAG Stats: {self.node_count:,} nodes, {self.word_count:,} words")
    
    def save_to_binary(self, filename: str) -> None:
        """Save GADDAG to compressed binary format"""
        print(f"💾 Saving GADDAG to compressed binary {filename}...")
        
        def node_to_dict(node: GaddagNode) -> dict:
            return {
                'letter': node.letter,
                'is_terminal': node.is_terminal,
                'children': {k: node_to_dict(v) for k, v in node.children.items()}
            }
        
        gaddag_data = {
            'metadata': {
                'format_version': '1.0',
                'generator': 'CompactGaddagBuilder',
                'word_count': self.word_count,
                'node_count': self.node_count,
                'separator': self.GADDAG_SEPARATOR,
                'language': 'Spanish',
                'digraph_mapping': 'CH->Ç, LL->K, RR->W',
                'checksum': hashlib.md5(f"{self.word_count}:{self.node_count}".encode()).hexdigest()
            },
            'root': node_to_dict(self.root)
        }
        
        with gzip.open(filename, 'wb') as f:
            pickle.dump(gaddag_data, f, protocol=pickle.HIGHEST_PROTOCOL)
        
        binary_size = os.path.getsize(filename)
        print(f"✅ GADDAG saved to binary successfully ({binary_size:,} bytes)")

def main():
    print("🇪🇸 Compact Spanish GADDAG Generator (Binary Only)")
    print("=" * 50)
    
    CSV_PATH = "../../csvs/lexicon_keys.csv"
    
    if not os.path.exists(CSV_PATH):
        print(f"❌ Error: CSV file not found at {CSV_PATH}")
        return 1
    
    builder = CompactGaddagBuilder()
    start_time = time.time()
    
    try:
        # Load and build
        builder.load_from_csv(CSV_PATH)
        
        load_time = time.time() - start_time
        print(f"⏱️ Loading and building completed in {load_time:.2f} seconds")
        
        # Save binary only
        save_start = time.time()
        builder.save_to_binary('spanish_gaddag.pkl.gz')
        
        save_time = time.time() - save_start
        total_time = time.time() - start_time
        
        print(f"\n✅ Spanish GADDAG generation completed!")
        print(f"📊 Final Stats:")
        print(f"   Words: {builder.word_count:,}")
        print(f"   Nodes: {builder.node_count:,}")
        print(f"   Efficiency: {builder.node_count/builder.word_count:.1f} nodes per word")
        print(f"⏱️ Performance:")
        print(f"   Total time: {total_time:.2f} seconds")
        print(f"   Words/sec: {builder.word_count/total_time:.0f}")
        print(f"\n📦 Generated: spanish_gaddag.pkl.gz ({os.path.getsize('spanish_gaddag.pkl.gz'):,} bytes)")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())