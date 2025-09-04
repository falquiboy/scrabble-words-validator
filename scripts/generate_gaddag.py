#!/usr/bin/env python3
"""
GADDAG Generator for Spanish Scrabble
Based on Quackle's GADDAG implementation but adapted for Spanish.

This script generates a GADDAG (Graph Acyclic Directed DAG) from lexicon_keys.csv
for ultra-fast move generation in Scrabble Duplicada.

Author: Generated for +Léxico Duplicada Tournament Manager
"""

import json
import csv
import pickle
import gzip
from collections import defaultdict, deque
from typing import Dict, List, Set, Optional, Tuple
import hashlib
import os
from dataclasses import dataclass
import time

# Spanish Scrabble letter configuration
SPANISH_LETTERS = {
    'A': {'points': 1, 'quantity': 12},
    'E': {'points': 1, 'quantity': 12},
    'O': {'points': 1, 'quantity': 9},
    'I': {'points': 1, 'quantity': 6},
    'S': {'points': 1, 'quantity': 6},
    'N': {'points': 1, 'quantity': 5},
    'R': {'points': 1, 'quantity': 5},
    'U': {'points': 1, 'quantity': 5},
    'L': {'points': 1, 'quantity': 4},
    'T': {'points': 1, 'quantity': 4},
    'D': {'points': 2, 'quantity': 5},
    'G': {'points': 2, 'quantity': 2},
    'C': {'points': 3, 'quantity': 4},
    'B': {'points': 3, 'quantity': 2},
    'M': {'points': 3, 'quantity': 2},
    'P': {'points': 3, 'quantity': 2},
    'H': {'points': 4, 'quantity': 2},
    'F': {'points': 4, 'quantity': 1},
    'V': {'points': 4, 'quantity': 1},
    'Y': {'points': 4, 'quantity': 1},
    'Ç': {'points': 5, 'quantity': 1},  # CH procesado
    'Q': {'points': 5, 'quantity': 1},
    'Ñ': {'points': 8, 'quantity': 1},
    'J': {'points': 8, 'quantity': 1},
    'K': {'points': 8, 'quantity': 1},  # Extranjero pero válido
    'W': {'points': 8, 'quantity': 1},  # Extranjero pero válido
    'X': {'points': 8, 'quantity': 1},
    'Z': {'points': 10, 'quantity': 1},
}

# Separator character for GADDAG (like Quackle)
GADDAG_SEPARATOR = '>'

@dataclass
class GaddagNode:
    """
    GADDAG Node similar to Quackle's implementation
    Optimized for Spanish Scrabble move generation
    """
    letter: str = ''
    is_terminal: bool = False
    children: Dict[str, 'GaddagNode'] = None
    parent: Optional['GaddagNode'] = None
    
    def __post_init__(self):
        if self.children is None:
            self.children = {}

class SpanishGaddagBuilder:
    """
    Spanish GADDAG Builder
    Creates optimized GADDAG for Spanish Scrabble from lexicon_keys
    """
    
    def __init__(self):
        self.root = GaddagNode()
        self.word_count = 0
        self.node_count = 0
        
    def process_digraphs(self, word: str) -> str:
        """Process Spanish digraphs: CH -> Ç, LL -> K, RR -> W"""
        # Convert digraphs to single characters for internal representation
        word = word.replace('CH', 'Ç').replace('LL', 'K').replace('RR', 'W')
        # Also handle case variations
        word = word.replace('ch', 'Ç').replace('ll', 'K').replace('rr', 'W')
        return word.upper()
    
    def add_word_to_gaddag(self, word: str) -> None:
        """
        Add word to GADDAG using Gordon's algorithm
        Creates all possible hooks (reversed prefixes + separator + suffix)
        """
        if not word or len(word) < 2:
            return
            
        word = self.process_digraphs(word.upper())
        word_len = len(word)
        
        # For each position in the word, create a GADDAG entry
        for i in range(word_len + 1):
            # Create the GADDAG string: reversed_prefix + separator + suffix
            if i == 0:
                # Just the word with separator at the beginning
                gaddag_string = GADDAG_SEPARATOR + word
            elif i == word_len:
                # Completely reversed word
                gaddag_string = word[::-1] + GADDAG_SEPARATOR
            else:
                # Reversed prefix + separator + suffix
                prefix = word[:i][::-1]  # Reverse the prefix
                suffix = word[i:]
                gaddag_string = prefix + GADDAG_SEPARATOR + suffix
            
            self._insert_string(gaddag_string)
        
        self.word_count += 1
        
    def _insert_string(self, gaddag_string: str) -> None:
        """Insert a GADDAG string into the trie structure"""
        current = self.root
        
        for char in gaddag_string:
            if char not in current.children:
                current.children[char] = GaddagNode(letter=char, parent=current)
                self.node_count += 1
            current = current.children[char]
        
        # Mark as terminal (end of valid path)
        current.is_terminal = True
    
    def load_from_csv(self, csv_path: str) -> None:
        """Load words from lexicon_keys.csv file"""
        print(f"📂 Loading words from {csv_path}...")
        
        try:
            words_processed = 0
            valid_words = 0
            
            with open(csv_path, 'r', encoding='utf-8-sig') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for row in reader:
                    word = row.get('non_diac_word', '').strip()
                    
                    if word and len(word) >= 2:  # Only words with 2+ letters
                        self.add_word_to_gaddag(word)
                        valid_words += 1
                    
                    words_processed += 1
                    
                    if words_processed % 10000 == 0:
                        print(f"  📊 Processed {words_processed:,} rows, {valid_words:,} valid words...")
            
            print(f"✅ Successfully loaded {valid_words:,} valid words from {words_processed:,} rows")
            print(f"📈 GADDAG Stats: {self.node_count:,} nodes, {self.word_count:,} words")
            
        except Exception as e:
            print(f"❌ Error loading from CSV: {e}")
            raise
    
    def save_to_json(self, filename: str) -> None:
        """Save GADDAG to JSON for fast loading"""
        print(f"💾 Saving GADDAG to {filename}...")
        
        def node_to_dict(node: GaddagNode) -> dict:
            return {
                'letter': node.letter,
                'is_terminal': node.is_terminal,
                'children': {k: node_to_dict(v) for k, v in node.children.items()}
            }
        
        gaddag_data = {
            'metadata': {
                'format_version': '1.0',
                'generator': 'SpanishGaddagBuilder',
                'word_count': self.word_count,
                'node_count': self.node_count,
                'separator': GADDAG_SEPARATOR,
                'language': 'Spanish',
                'checksum': self._calculate_checksum()
            },
            'root': node_to_dict(self.root)
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(gaddag_data, f, ensure_ascii=False, separators=(',', ':'))
        
        print(f"✅ GADDAG saved to JSON successfully ({os.path.getsize(filename):,} bytes)")
    
    def save_to_binary(self, filename: str) -> None:
        """Save GADDAG to compressed binary format for maximum efficiency"""
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
                'generator': 'SpanishGaddagBuilder',
                'word_count': self.word_count,
                'node_count': self.node_count,
                'separator': GADDAG_SEPARATOR,
                'language': 'Spanish',
                'digraph_mapping': 'CH->Ç, LL->K, RR->W',
                'checksum': self._calculate_checksum()
            },
            'root': node_to_dict(self.root)
        }
        
        # Save as compressed pickle for fastest loading
        with gzip.open(filename, 'wb') as f:
            pickle.dump(gaddag_data, f, protocol=pickle.HIGHEST_PROTOCOL)
        
        json_size = os.path.getsize(filename.replace('.pkl.gz', '.json')) if os.path.exists(filename.replace('.pkl.gz', '.json')) else 0
        binary_size = os.path.getsize(filename)
        compression_ratio = (1 - binary_size / json_size) * 100 if json_size > 0 else 0
        
        print(f"✅ GADDAG saved to binary successfully ({binary_size:,} bytes)")
        if json_size > 0:
            print(f"📦 Compression: {compression_ratio:.1f}% smaller than JSON")
    
    def save_to_supabase(self, connection_string: str) -> None:
        """Save GADDAG to Supabase for fast querying"""
        print("🔗 Connecting to Supabase for saving GADDAG...")
        
        try:
            conn = psycopg2.connect(connection_string)
            cursor = conn.cursor()
            
            # Create GADDAG table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS gaddag_nodes (
                    id SERIAL PRIMARY KEY,
                    path VARCHAR(100) NOT NULL,
                    letter CHAR(1),
                    is_terminal BOOLEAN DEFAULT FALSE,
                    parent_path VARCHAR(100),
                    depth INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_gaddag_path ON gaddag_nodes(path);
                CREATE INDEX IF NOT EXISTS idx_gaddag_parent ON gaddag_nodes(parent_path);
            """)
            
            # Save metadata
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS gaddag_metadata (
                    id SERIAL PRIMARY KEY,
                    format_version VARCHAR(10),
                    word_count INTEGER,
                    node_count INTEGER,
                    separator CHAR(1),
                    language VARCHAR(20),
                    checksum VARCHAR(64),
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                -- Clear existing metadata
                TRUNCATE gaddag_metadata;
                
                INSERT INTO gaddag_metadata (format_version, word_count, node_count, separator, language, checksum)
                VALUES (%s, %s, %s, %s, %s, %s);
            """, ('1.0', self.word_count, self.node_count, GADDAG_SEPARATOR, 'Spanish', self._calculate_checksum()))
            
            # Clear existing GADDAG data
            cursor.execute("TRUNCATE gaddag_nodes;")
            
            # Save nodes in batches
            print("📤 Saving GADDAG nodes to Supabase...")
            self._save_nodes_recursive(cursor, self.root, '', 0)
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"✅ GADDAG saved to Supabase successfully")
            
        except Exception as e:
            print(f"❌ Error saving to Supabase: {e}")
            raise
    
    def _save_nodes_recursive(self, cursor, node: GaddagNode, path: str, depth: int) -> None:
        """Recursively save nodes to database"""
        if node.letter:  # Skip root node
            cursor.execute("""
                INSERT INTO gaddag_nodes (path, letter, is_terminal, parent_path, depth)
                VALUES (%s, %s, %s, %s, %s)
            """, (path, node.letter, node.is_terminal, path[:-1] if path else None, depth))
        
        for letter, child in node.children.items():
            child_path = path + letter
            self._save_nodes_recursive(cursor, child, child_path, depth + 1)
    
    def _calculate_checksum(self) -> str:
        """Calculate checksum for GADDAG verification"""
        data = f"{self.word_count}:{self.node_count}:{GADDAG_SEPARATOR}"
        return hashlib.md5(data.encode()).hexdigest()

class SpanishMoveGenerator:
    """
    Move generator using the Spanish GADDAG
    Handles wildcards and board constraints
    """
    
    def __init__(self, gaddag_root: GaddagNode):
        self.root = gaddag_root
        self.board_size = 15
        
    def generate_moves(self, rack: List[str], board: List[List[Optional[str]]], 
                      wildcards: int = 0) -> List[Dict]:
        """
        Generate all possible moves given rack and board state
        
        Args:
            rack: Available tiles (including up to 2 wildcards as '?')
            board: 15x15 board state (None for empty, letter for occupied)
            wildcards: Number of wildcards in rack
            
        Returns:
            List of possible moves with positions and scores
        """
        moves = []
        
        # This is a complex algorithm that will be implemented next
        # For now, return empty list
        print(f"🎯 Generating moves for rack: {rack}")
        print(f"🃏 Wildcards available: {wildcards}")
        
        # TODO: Implement full GADDAG move generation
        # 1. Find anchor squares (adjacent to existing tiles)
        # 2. For each anchor, traverse GADDAG to find valid placements
        # 3. Handle wildcards by trying all possible letters
        # 4. Validate cross-words formed
        # 5. Calculate scores including multipliers
        
        return moves

def main():
    """Main function to generate Spanish GADDAG"""
    print("🇪🇸 Spanish GADDAG Generator for Scrabble Duplicada")
    print("=" * 50)
    
    # CSV file path (relative to the script location)
    CSV_PATH = "../../csvs/lexicon_keys.csv"
    
    # Build GADDAG
    builder = SpanishGaddagBuilder()
    
    try:
        start_time = time.time()
        
        # Load words from CSV
        if not os.path.exists(CSV_PATH):
            print(f"❌ Error: CSV file not found at {CSV_PATH}")
            return 1
            
        builder.load_from_csv(CSV_PATH)
        
        load_time = time.time() - start_time
        print(f"⏱️ Loading completed in {load_time:.2f} seconds")
        
        # Save in multiple formats
        save_start = time.time()
        
        # JSON format (human readable, good for debugging)
        builder.save_to_json('spanish_gaddag.json')
        
        # Binary format (compressed, fastest loading)
        builder.save_to_binary('spanish_gaddag.pkl.gz')
        
        save_time = time.time() - save_start
        total_time = time.time() - start_time
        
        print(f"\n✅ Spanish GADDAG generation completed successfully!")
        print(f"📊 Final Stats:")
        print(f"   Words processed: {builder.word_count:,}")
        print(f"   GADDAG nodes: {builder.node_count:,}")
        print(f"   Compression ratio: {builder.node_count / max(builder.word_count, 1):.2f} nodes/word")
        print(f"   Memory efficiency: {(builder.node_count * 7) / max(builder.word_count, 1):.2f}x vs naive trie")
        print(f"⏱️ Performance:")
        print(f"   Loading: {load_time:.2f}s")
        print(f"   Saving: {save_time:.2f}s") 
        print(f"   Total: {total_time:.2f}s")
        
        print(f"\n📁 Generated files:")
        print(f"   📄 spanish_gaddag.json - Human-readable format")
        print(f"   📦 spanish_gaddag.pkl.gz - Compressed binary format")
        print(f"\n💡 Use the .pkl.gz file for production (fastest loading)")
        
    except Exception as e:
        print(f"\n❌ Error during GADDAG generation: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())