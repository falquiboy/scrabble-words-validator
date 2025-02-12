
export async function compressData(data: ArrayBuffer): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const compressed = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    compressed.set(chunk, offset);
    offset += chunk.length;
  }
  
  return compressed;
}

export async function decompressData(compressed: Uint8Array): Promise<ArrayBuffer> {
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(compressed);
  writer.close();
  
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const decompressed = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    decompressed.set(chunk, offset);
    offset += chunk.length;
  }
  
  return decompressed.buffer;
}

export async function calculateChecksum(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
