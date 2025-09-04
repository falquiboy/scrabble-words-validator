#!/usr/bin/env python3
"""
GADDAG Generator for Spanish Scrabble - JSON Export
Generate a simplified GADDAG as JSON that can be loaded by the browser
"""

import csv
import json
import gzip
from collections import defaultdict
from typing import Dict, Set
import os
import time

class SimpleGaddagBuilder:
    def __init__(self):
        self.words = set()
        self.word_count = 0
        
    def process_digraphs(self, word: str) -> str:
        """Process Spanish digraphs: CH -> Ç, LL -> K, RR -> W"""
        word = word.replace('CH', 'Ç').replace('LL', 'K').replace('RR', 'W')
        word = word.replace('ch', 'Ç').replace('ll', 'K').replace('rr', 'W')
        return word.upper()
    
    def add_word(self, word: str) -> None:
        """Add word to the word set"""
        if not word or len(word) < 2:
            return
            
        word = self.process_digraphs(word.upper())
        self.words.add(word)
        self.word_count += 1
        
        if self.word_count % 50000 == 0:
            print(f"  📊 Progress: {self.word_count:,} words processed...")
        
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
                    self.add_word(word)
                    valid_words += 1
                
                words_processed += 1
        
        print(f"✅ Successfully processed {valid_words:,} valid words from {words_processed:,} rows")
        print(f"📈 Word Set Stats: {len(self.words):,} unique words")
    
    def save_to_json(self, filename: str) -> None:
        """Save word set to compressed JSON format"""
        print(f"💾 Saving word set to compressed JSON {filename}...")
        
        # Create a simple structure: just the word list for now
        gaddag_data = {
            'metadata': {
                'format_version': '1.0-simple',
                'generator': 'SimpleGaddagBuilder',
                'word_count': len(self.words),
                'language': 'Spanish',
                'digraph_mapping': 'CH->Ç, LL->K, RR->W'
            },
            'words': sorted(list(self.words))
        }
        
        # Save as compressed JSON
        json_str = json.dumps(gaddag_data, ensure_ascii=False, separators=(',', ':'))
        
        with gzip.open(filename, 'wt', encoding='utf-8') as f:
            f.write(json_str)
        
        file_size = os.path.getsize(filename)
        print(f"✅ Word set saved to JSON successfully ({file_size:,} bytes)")

def main():
    print("🇪🇸 Simple Spanish Word Set Generator (JSON)")
    print("=" * 50)
    
    CSV_PATH = "../../csvs/lexicon_keys.csv"
    
    if not os.path.exists(CSV_PATH):
        print(f"❌ Error: CSV file not found at {CSV_PATH}")
        return 1
    
    builder = SimpleGaddagBuilder()
    start_time = time.time()
    
    try:
        # Load and build
        builder.load_from_csv(CSV_PATH)
        
        load_time = time.time() - start_time
        print(f"⏱️ Loading completed in {load_time:.2f} seconds")
        
        # Save JSON
        save_start = time.time()
        builder.save_to_json('spanish_words.json.gz')
        
        save_time = time.time() - save_start
        total_time = time.time() - start_time
        
        print(f"\n✅ Spanish word set generation completed!")
        print(f"📊 Final Stats:")
        print(f"   Unique words: {len(builder.words):,}")
        print(f"⏱️ Performance:")
        print(f"   Total time: {total_time:.2f} seconds")
        print(f"   Words/sec: {len(builder.words)/total_time:.0f}")
        print(f"\n📦 Generated: spanish_words.json.gz ({os.path.getsize('spanish_words.json.gz'):,} bytes)")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())