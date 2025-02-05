// Formato binario para el Trie:
// [número total de nodos (4 bytes)]
// Por cada nodo:
//   [es fin de palabra (1 byte)]
//   [número de hijos (1 byte)]
//   [palabra si es fin de palabra (longitud variable)]
//   Por cada hijo:
//     [caracter (1 byte)]
//     [índice del nodo hijo (4 bytes)]

import { TrieNode } from './types';

export function serializeTrieToBinary(root: TrieNode): ArrayBuffer {
  // Primero hacemos un recorrido para contar nodos y calcular el tamaño total
  const nodes: TrieNode[] = [];
  const nodeToIndex = new Map<TrieNode, number>();
  
  function collectNodes(node: TrieNode) {
    if (nodeToIndex.has(node)) return;
    const index = nodes.length;
    nodes.push(node);
    nodeToIndex.set(node, index);
    for (const child of node.children.values()) {
      collectNodes(child);
    }
  }
  
  collectNodes(root);
  
  // Calculamos el tamaño total necesario
  let totalSize = 4; // Número total de nodos
  for (const node of nodes) {
    totalSize += 1; // isEndOfWord flag
    totalSize += 1; // Número de hijos
    if (node.isEndOfWord) {
      totalSize += 2 + node.word.length; // 2 bytes para longitud + palabra
    }
    totalSize += node.children.size * 5; // 1 byte por caracter + 4 bytes por índice
  }
  
  // Creamos el buffer y lo llenamos
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const textEncoder = new TextEncoder();
  
  let offset = 0;
  
  // Escribimos el número total de nodos
  view.setUint32(offset, nodes.length);
  offset += 4;
  
  // Escribimos cada nodo
  for (const node of nodes) {
    // Flag de fin de palabra
    view.setUint8(offset, node.isEndOfWord ? 1 : 0);
    offset += 1;
    
    // Número de hijos
    view.setUint8(offset, node.children.size);
    offset += 1;
    
    // Si es fin de palabra, escribimos la palabra
    if (node.isEndOfWord) {
      const wordBytes = textEncoder.encode(node.word);
      view.setUint16(offset, wordBytes.length);
      offset += 2;
      new Uint8Array(buffer, offset, wordBytes.length).set(wordBytes);
      offset += wordBytes.length;
    }
    
    // Escribimos los hijos
    for (const [char, child] of node.children.entries()) {
      const charCode = char.charCodeAt(0);
      view.setUint8(offset, charCode);
      offset += 1;
      view.setUint32(offset, nodeToIndex.get(child)!);
      offset += 4;
    }
  }
  
  return buffer;
}

export function deserializeTrieFromBinary(buffer: ArrayBuffer): TrieNode {
  const view = new DataView(buffer);
  const textDecoder = new TextDecoder();
  let offset = 0;
  
  // Leemos el número total de nodos
  const totalNodes = view.getUint32(offset);
  offset += 4;
  
  // Creamos todos los nodos vacíos primero
  const nodes: TrieNode[] = Array(totalNodes).fill(null).map(() => ({
    children: new Map(),
    isEndOfWord: false,
    word: ''
  }));
  
  // Llenamos los nodos
  for (let i = 0; i < totalNodes; i++) {
    const node = nodes[i];
    
    // Flag de fin de palabra
    node.isEndOfWord = view.getUint8(offset) === 1;
    offset += 1;
    
    // Número de hijos
    const numChildren = view.getUint8(offset);
    offset += 1;
    
    // Si es fin de palabra, leemos la palabra
    if (node.isEndOfWord) {
      const wordLength = view.getUint16(offset);
      offset += 2;
      const wordBytes = new Uint8Array(buffer, offset, wordLength);
      node.word = textDecoder.decode(wordBytes);
      offset += wordLength;
    }
    
    // Leemos los hijos
    for (let j = 0; j < numChildren; j++) {
      const char = String.fromCharCode(view.getUint8(offset));
      offset += 1;
      const childIndex = view.getUint32(offset);
      offset += 4;
      node.children.set(char, nodes[childIndex]);
    }
  }
  
  return nodes[0];
}

// Función para pre-procesar el diccionario completo
export async function preprocessDictionary(words: string[]): Promise<ArrayBuffer> {
  // Construimos el trie
  const root: TrieNode = {
    children: new Map(),
    isEndOfWord: false,
    word: ''
  };
  
  for (const word of words) {
    let current = root;
    const upperWord = word.toUpperCase();
    
    for (const char of upperWord) {
      if (!current.children.has(char)) {
        current.children.set(char, {
          children: new Map(),
          isEndOfWord: false,
          word: ''
        });
      }
      current = current.children.get(char)!;
    }
    
    current.isEndOfWord = true;
    current.word = upperWord;
  }
  
  // Lo convertimos a formato binario
  return serializeTrieToBinary(root);
}