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
  const textEncoder = new TextEncoder();
  
  // Pre-calculamos los tamaños de las palabras codificadas
  const encodedWords = new Map<TrieNode, Uint8Array>();
  for (const node of nodes) {
    if (node.isEndOfWord) {
      const encoded = textEncoder.encode(node.word);
      encodedWords.set(node, encoded);
      totalSize += 1 + 2 + encoded.length; // isEndOfWord + wordLength + word
    } else {
      totalSize += 1; // solo isEndOfWord
    }
    totalSize += 1 + (node.children.size * 5); // numChildren + (char + nodeIndex) por hijo
  }
  
  // Creamos el buffer y lo llenamos
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
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
      const encoded = encodedWords.get(node)!;
      view.setUint16(offset, encoded.length);
      offset += 2;
      new Uint8Array(buffer, offset, encoded.length).set(encoded);
      offset += encoded.length;
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
  console.log('Iniciando pre-procesamiento del diccionario...');
  
  // Construimos el trie
  const root: TrieNode = {
    children: new Map(),
    isEndOfWord: false,
    word: ''
  };
  
  console.log(`Pre-procesando ${words.length} palabras...`);
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
  console.log('Convirtiendo a formato binario...');
  const startTime = performance.now();
  const binaryData = serializeTrieToBinary(root);
  const endTime = performance.now();
  
  console.log(`Conversión completada en ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`Tamaño del binario: ${(binaryData.byteLength / 1024 / 1024).toFixed(2)}MB`);
  
  return binaryData;
}