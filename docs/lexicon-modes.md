# Modos de lexicón

La aplicación tiene una sola autoridad de modo, compartida por Juez, Anagramas,
Listas y Residuos. La elección se guarda localmente en el navegador.

- **2017** usa el manifiesto histórico y conserva el fallback remoto existente.
- **DLE + DEM** usa el release completo FEMELEX RC4: las 639,293 grafías de
  FILE2017 más 20,590 aportaciones adjudicadas del DEM. No usa el fallback de
  Supabase. Las aportaciones llevan la etiqueta `DEM` y pueden ordenarse
  primero.
- **Híbrido** consulta el índice completo 2027 y le suma únicamente las 214
  grafías exclusivas de 2017. Así evita cargar dos diccionarios completos. Las
  10,975 incorporaciones llevan la etiqueta `2027`; las exclusivas del release
  anterior llevan `2017`.
- **2027** usa sólo los shards del release 2027. No usa el fallback léxico de
  Supabase porque, mientras ese backend siga siendo 2017, mezclarlo produciría
  falsos positivos.

El modo híbrido permite ordenar las incorporaciones primero en Anagramas. La
vista extendida usa la información ya disponible y muestra `Definición muy
pronto` para una incorporación sin definición corta.

## Datos reproducibles

`npm run build:lexicon-2027` verifica tamaño, SHA-256 y cardinalidad de la fuente
versionada antes de regenerar los shards y los índices delta. Los valores
esperados están fijados deliberadamente en el script para impedir publicar una
fuente parcial o distinta por accidente.

`npm run build:lexicon-dem` aplica el mismo contrato al release FEMELEX RC4,
verifica que sea una unión estricta sobre FILE2017 (`+20,590 / -0`) y produce
fragmentos versionados bajo `/lexicon/dem/rc4/`. El Trie se construye con el
release completo en segundo plano; SQLite queda disponible durante esa
promoción.

La futura migración a Supabase puede agregar el release y las definiciones sin
cambiar el contrato visual ni la selección de modo; primero deberá existir una
consulta remota explícitamente acotada por release.
