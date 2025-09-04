#!/usr/bin/env python3
"""
Convert GADDAG from pickle format to JSON for browser loading
"""

import pickle
import gzip
import json
import os

def main():
    # Paths
    pickle_path = "../public/spanish_gaddag.pkl.gz"
    json_path = "../public/spanish_gaddag.json"
    
    if not os.path.exists(pickle_path):
        print(f"❌ Pickle file not found: {pickle_path}")
        return 1
    
    print(f"📂 Loading GADDAG from {pickle_path}...")
    
    # Load pickle
    with gzip.open(pickle_path, 'rb') as f:
        gaddag_data = pickle.load(f)
    
    print(f"✅ GADDAG loaded: {gaddag_data['metadata']['word_count']} words, {gaddag_data['metadata']['node_count']} nodes")
    
    # Save as JSON
    print(f"💾 Saving to JSON: {json_path}...")
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(gaddag_data, f, ensure_ascii=False, separators=(',', ':'))
    
    # Size comparison
    pickle_size = os.path.getsize(pickle_path)
    json_size = os.path.getsize(json_path)
    
    print(f"📦 Size comparison:")
    print(f"   Pickle: {pickle_size:,} bytes")
    print(f"   JSON: {json_size:,} bytes")
    print(f"   Ratio: {json_size / pickle_size:.1f}x larger")
    
    return 0

if __name__ == "__main__":
    exit(main())