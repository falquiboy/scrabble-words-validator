# Handoff para Codex en macOS: +Léxico en iPhone

Fecha del handoff: 30 de julio de 2026.

## Objetivo

Terminar de diagnosticar y corregir el anagramador de `https://maslexico.app/`
en un iPhone real, conservando estas condiciones:

- Web/PWA, sin depender de la App Store.
- Funcionamiento offline.
- Diccionario completo local con SQLite/WASM.
- Búsquedas rápidas mediante índices SQLite y, donde la memoria lo permita, Trie.
- Producción en Cloudflare Pages, no en Netlify.

## Repositorio y producción

- Repositorio: `https://github.com/falquiboy/scrabble-words-validator.git`
- Rama de trabajo: `main`
- Cloudflare Pages project: `maslexico-juez`
- Dominio canónico: `https://maslexico.app/`
- Último despliegue directo: `https://7c9e981b.maslexico-juez.pages.dev`
- Último commit publicado: `a6406c0 [skip netlify] Shard offline SQLite for iPhone Safari`

Commits relevantes, del más reciente hacia atrás:

```text
a6406c0 [skip netlify] Shard offline SQLite for iPhone Safari
87dddd9 [skip netlify] Prevent stale asset fallback caching
1028a39 [skip netlify] Version offline worker bundle
0879e3d [skip netlify] Refresh offline app shell assets
0b7e21d [skip netlify] Bust stale service worker cache
```

Los mensajes contienen `[skip netlify]` deliberadamente para no volver a
consumir builds de Netlify.

## Estado comprobado

El dominio raíz ya abre desde Cloudflare. Después del despliegue `a6406c0` se
comprobó desde la red que producción entrega:

- `/assets/index-Bzo6L5FQ.js` como `application/javascript`.
- `/sql-wasm.wasm` como `application/wasm`.
- `/lexicon/manifest.json` como `application/json`.
- `/lexicon/length-4.dbpack` como `application/octet-stream`.
- `/sw.js?v=4` como `application/javascript`.

El manifiesto suma **639,293 palabras**. En una prueba directa contra el
fragmento SQLite de cuatro letras, el alfagrama de `AMOR` devolvió:

```text
AMOR, ARMO, MARO, MORA, RAMO, ROMA
```

El build pasó y el Service Worker pasó `node --check`.

Todavía **no se completó una prueba funcional en el Safari del iPhone real**
después del último despliegue. La sesión de depuración por USB llegó a detectar
la pestaña:

```text
Safari — https://maslexico.app/
```

pero la pestaña dejaba de ser inspeccionable cuando se bloqueaba el teléfono.
El intento final de captura fue interrumpido para trasladar el trabajo a macOS.
No asumir que el problema ya quedó resuelto hasta ejecutar la prueba real.

## Cambio de arquitectura ya publicado

La base SQLite monolítica anterior expandía unos 39 MB y el `.dbpack` comprimido
pesaba unos 15 MB. `sql.js` conserva la base abierta en memoria, lo que podía
provocar picos grandes en WebKit al descomprimir, copiar y abrir la base.

Ahora el diccionario está dividido por longitud:

- 14 fragmentos, longitudes 2 a 15.
- 10.7 MB comprimidos en total.
- 31.8 MB SQLite expandidos en total, pero nunca se abren todos a la vez.
- El fragmento comprimido más grande mide aproximadamente 1.76 MB.
- `SQLiteWordDatabase` mantiene como máximo cuatro fragmentos abiertos y aplica
  expulsión LRU.
- En iPhone/iPad no se construye el Trie completo de objetos JavaScript; SQLite
  es el índice rápido principal.
- En equipos con memoria suficiente se conserva la opción de construir el Trie
  en segundo plano.

Archivos principales:

- `src/services/SQLiteWordDatabase.ts`
- `src/services/SqliteAnagramService.ts`
- `src/services/HybridTrieService.ts`
- `src/hooks/useBackgroundTrie.ts`
- `src/hooks/useHybridAnagramSearch.ts`
- `scripts/build-offline-dictionary.mjs`
- `public/sw.js`
- `public/_headers`
- `public/lexicon/manifest.json`

El Service Worker usa actualmente el caché `maslexico-offline-v3`, precarga el
shell y descarga secuencialmente los fragmentos del diccionario durante la
instalación. El registro se solicita como `/sw.js?v=4`.

## Hipótesis que deben verificarse en Safari

1. Confirmar que el iPhone ejecuta el bundle nuevo y no un Service Worker viejo.
2. Confirmar que `sql-wasm.wasm`, el manifiesto y los fragmentos cargan sin
   errores de MIME, red, cuota o caché.
3. Confirmar que `DecompressionStream('gzip')` funciona; existe un fallback con
   `fflate`.
4. Ejecutar `AMOR` y revisar tanto los resultados exactos como la búsqueda de
   una letra adicional, que carga también el fragmento de cinco letras.
5. Revisar errores o promesas pendientes en `useHybridAnagramSearch`.
6. Comprobar una segunda búsqueda de otra longitud para validar la apertura y
   expulsión de fragmentos.
7. Probar offline sólo después de que el Service Worker termine de instalar y
   almacenar todos los fragmentos.

Hay reportes Jetsam del iPhone del 29 de julio, pero los dos inspeccionados
tenían a TikTok como proceso de mayor memoria y no demuestran que Safari o
+Léxico hayan sido terminados. No usar esos reportes como causa concluyente.

## Preparación recomendada en macOS

Clonar o actualizar el repositorio:

```bash
git clone https://github.com/falquiboy/scrabble-words-validator.git
cd scrabble-words-validator
git pull --ff-only
npm ci
npm run build
```

Para inspeccionar el iPhone, la vía preferida en macOS es Safari:

1. En el iPhone: `Ajustes → Apps → Safari → Avanzado → Inspector web`.
2. Conectar por USB, confiar en la Mac y mantener el iPhone desbloqueado.
3. En Safari de macOS, activar el menú Desarrollo en sus ajustes avanzados.
4. Abrir `https://maslexico.app/` en el iPhone.
5. En la Mac: `Desarrollo → [iPhone] → maslexico.app`.

Herramientas CLI opcionales:

```bash
brew install libimobiledevice ios-webkit-debug-proxy pipx
pipx install pymobiledevice3
pymobiledevice3 webinspector opened-tabs
```

Si el comando instalado por `pipx` no queda expuesto con ese nombre:

```bash
python3 -m pymobiledevice3 webinspector opened-tabs
```

## Prueba mínima en el iPhone

Con la consola y la pestaña Network abiertas:

1. Recargar `maslexico.app` ignorando caché.
2. Abrir **Anagramas**.
3. Buscar `AMOR`.
4. Esperar los seis exactos esperados.
5. Confirmar que aparecen solicitudes o respuestas en caché para:
   - `/sql-wasm.wasm`
   - `/lexicon/manifest.json`
   - `/lexicon/length-2.dbpack` (chequeo interno de disponibilidad)
   - `/lexicon/length-4.dbpack`
   - `/lexicon/length-5.dbpack`
6. Revisar Console por errores de WASM, memoria, descompresión, `fetch`, SQLite
   o Service Worker.

Lectura rápida desde la consola:

```js
({
  url: location.href,
  userAgent: navigator.userAgent,
  controlled: Boolean(navigator.serviceWorker?.controller),
  wasm: typeof WebAssembly,
  decompressionStream: typeof DecompressionStream,
  cacheKeys: await caches.keys()
})
```

Para eliminar únicamente los cachés de +Léxico durante una prueba controlada:

```js
await Promise.all(
  (await caches.keys())
    .filter(key => key.startsWith('maslexico-offline-'))
    .map(key => caches.delete(key))
);
await (await navigator.serviceWorker.getRegistrations())
  .reduce(async (previous, registration) => {
    await previous;
    await registration.unregister();
  }, Promise.resolve());
location.reload();
```

Después de validar online:

1. Esperar a que el Service Worker quede `activated`.
2. Confirmar que el caché contiene los 14 `length-N.dbpack`.
3. Activar modo avión.
4. Cerrar y volver a abrir Safari o la PWA.
5. Repetir `AMOR` y una búsqueda de otra longitud.

## Posibles correcciones siguientes

No aplicar a ciegas; decidir después de leer el error real:

- Si queda un Service Worker viejo: agregar una migración de actualización y una
  recarga única al cambiar de controlador.
- Si falla la instalación por cuota: dejar de precargar los 14 fragmentos y
  descargarlos bajo demanda, mostrando progreso y ofreciendo un botón explícito
  de “Descargar diccionario offline”.
- Si `DecompressionStream` falla pese a existir: envolver esa ruta en
  `try/catch` y reintentar con `fflate`.
- Si la búsqueda se queda esperando Supabase: hacer que SQLite sea autoritativo
  una vez inicializado y poner timeout corto al chequeo remoto.
- Si el error sólo aparece como toast fugaz: mostrar un estado persistente dentro
  del anagramador con el mensaje técnico resumido.

## Despliegue

Después de modificar y verificar:

```bash
npm run build
npx wrangler pages deploy dist \
  --project-name maslexico-juez \
  --branch main \
  --commit-dirty=true
```

Antes de desplegar, comprobar si existe `.openai/hosting.json`. En este checkout
no estaba presente durante el handoff; el sitio se ha publicado directamente
con Wrangler.

Confirmar después:

```bash
curl -I https://maslexico.app/
curl -I https://maslexico.app/sql-wasm.wasm
curl -I https://maslexico.app/lexicon/manifest.json
curl -I https://maslexico.app/lexicon/length-4.dbpack
curl -I 'https://maslexico.app/sw.js?v=4'
```

Conservar `[skip netlify]` en los commits mientras Netlify siga conectado al
repositorio.

