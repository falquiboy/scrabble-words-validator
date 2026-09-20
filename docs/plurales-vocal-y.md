# Plurales en vocal + Y: criterio normativo y aplicación programática

## 1. La respuesta breve

`ACROY` es voz francesa del XVI que la Academia arrastra por inercia: ocho
apariciones documentadas en CORDE/CREA/NTLLE, tres o cuatro autores menores y
nada después de 1656. Pero el scrabble no decide el diccionario, solo lo aplica,
así que hay que darle plural.

La norma general de la NGLE reparte así los nombres en vocal + Y:

- **Patrimoniales o plenamente castellanizados → `-es`**: *buey/bueyes*,
  *virrey/virreyes*, *bocoy/bocoyes*, *convoy/convoyes*.
- **Extranjerismos no castellanizados → la Y muda en I y se añade `-s`**:
  *jersey/jerséis*, *espray/espráis*, *gay/gais*, *samurái/samuráis*.
- **Doble plural**, solo en la lista cerrada que la gramática enumera:
  *coy/cois o coyes*, *estay*, *guirigay*, *noray*.

`acroy` es francesa: por regla le corresponde **`acrois` y nada más**. Que
`acroyes` sea válido hoy no viene de la norma, sino de una consulta a la RAE que
respondió en términos descriptivos —"se registra tanto *acrois* como
*acroyes*"— para una pregunta que en scrabble es binaria. Filología con
decimales, reglamento con ceros y unos.

De ahí la propuesta para el próximo lexicón: ceñirse a la norma general, admitir
fuera de ella **solo** las excepciones explícitas de la Nueva gramática (con el
Panhispánico revisado como suplente) y dejar cada caso restante documentado como
decisión, no como herencia. Con ese criterio `acroyes` sobra.

## 2. Por qué esto no se puede resolver palabra por palabra

El lexicón es una bolsa plana de grafías. `ACROYES` está dentro y `COICOIS`
fuera, pero el fichero no dice **por qué**: no distingue una forma admitida por
regla de una admitida por una consulta puntual de hace años, ni de una que está
ahí por un homógrafo verbal. `BOYES` es válida por *boyar*, no como plural de
*boy*; `HOYES` por *hoyar*; `REIS` por *reír*. Sin esa información, quitar
`acroyes` es una edición manual sin red, y detectar que falta `coicois` depende
de que alguien se acuerde.

La consecuencia práctica: **no hay manera de revisar 160 lemas en vocal + Y a
mano de forma reproducible**. Sí la hay si se separan dos cosas que hoy están
mezcladas.

## 3. El modelo: separar la decisión de la lista

```
anotación por lema  →  motor de reglas  →  plurales previstos
                                              ↓  diff
lexicón (bolsa plana)  ──────────────────→  informe
```

1. **La anotación** (`scripts/lexicon/plurales-vocal-y.json`) recoge lo único
   que un humano tiene que aportar: si el lema está en una lista explícita de la
   gramática, si es extranjerismo, si no flexiona, y qué formas del lexicón se
   justifican por otra vía. Cada marca lleva su nota y su fuente.
2. **El motor** (`scripts/lexicon/plural-vocal-y.mjs`) es determinista: de la
   anotación deduce el conjunto cerrado de plurales. No consulta el lexicón.
3. **El auditor** compara previsión y lexicón y produce cuatro cubos:
   `conformes`, `sobran`, `faltan`, `sin anotar`.

Lo importante del reparto: la lógica binaria del jugador se conserva intacta en
la salida —una palabra vale o no vale—, mientras que los grises del filólogo
viven en la entrada, donde se pueden discutir, fechar y citar.

## 4. El árbol de decisión

Las reglas se evalúan en orden y la primera que reconoce el lema lo resuelve.
Esto es lo que garantiza que la norma explícita gane siempre a la regla general,
y la regla general a la analogía.

| Orden | Regla | Condición | Plural | Evidencia |
|---|---|---|---|---|
| R0 | `NO-LEMA` | forma verbal, no sustantivo | — | excluido |
| R1 | `SIN-PLURAL` | solo en locución, cursiva en DLE, no flexiona | — | normativa |
| R2 | `NGLE-DOBLE` | en la lista cerrada de dobles | `-is` + `-es` | normativa |
| R3 | `NGLE-ES` | en la lista cerrada de `-es` | `-es` | normativa |
| R4 | `NGLE-IS` | en la lista cerrada de `-is` | `-is` | normativa |
| R5 | `EXTRANJERISMO` | voz no castellanizada | `-is` | regla |
| R6 | `DOBLE-USO` | uso documentado de ambas | `-is` + `-es` | documentada |
| R7 | `ANALOGIA` | remite a un lema modelo | el del modelo | analógica |
| R8 | `PATRIMONIAL` | todo lo demás | `-es` | regla |

R8 es la única regla que resuelve **sin evidencia**. Por eso todo lema que llega
hasta ella sin marca propia se reporta como *pendiente de anotar*: el motor no
finge saber lo que nadie ha decidido.

R7 hereda del modelo **la forma del plural, no sus letras**: `COICOY` copia de
`CHOROY` el hecho de llevar doble plural, y de ahí salen `coicois` y `coicoyes`.
Toda analogía nace con `revision: pendiente` y aparece marcada en el informe
hasta que alguien la confirme o la sustituya por una regla.

## 5. El índice de justificaciones

Una grafía es válida si **al menos una** vía la justifica. La anotación declara
las vías ajenas al plural:

```json
"REY": { "marca": "lista", "homografos": { "REIS": "2PL.PRES.IND de reir" } }
```

Sin esto, el auditor reclamaría la retirada de `reis`, `balais`, `mamais`,
`gayes` y `mereis`, que son formas verbales legítimas. Con esto, el cubo
`sobran` contiene solo lo que de verdad no tiene padre. En el lexicón definitivo
este índice no debería escribirse a mano: debería salir del propio proceso de
construcción, que ya sabe de qué lema viene cada forma que añade.

## 6. Qué encuentra hoy sobre FILE2027-RC1

```
npm run audit:plurales-vocal-y            # los 160 lemas en vocal + Y
npm run audit:plurales-vocal-y -- --grupo=OY
```

Con la anotación actual (los veinte lemas en `-oy`, las tres listas cerradas de
la NGLE y ocho homógrafos declarados):

| Cubo | Casos |
|---|---|
| Conformes | 53 |
| **Sobran** | `ACROYES`, `VERDEGAIS` |
| **Faltan** | `COICOIS`, `PITOITOIS`, `TIMBOYES` |
| Excluidos (formas verbales) | 5 |
| Sin anotar | 114 |

Las tres formas que faltan son exactamente las asimetrías conocidas: si se
admite `chorois`, `coicois` y `pitoitois` van detrás, que son el mismo caso
—fauna americana sin respaldo en la gramática—; y si se admite `tipoyes` junto a
`tipois`, `timboyes` debería acompañar a `timbois`.

`VERDEGAIS` no estaba en la lista de sospechosos y lo encontró la auditoría:
*verdegay* figura **explícitamente** en la NGLE con plural único en `-es`, y no
existe ningún verbo *verdegar* que justifique la forma por otra vía (el verbo
del lexicón es *verdeguear*). Es el mismo defecto que `acroyes`, en espejo.

## 7. Lo que queda

Los 114 lemas sin anotar de `-ay`, `-ey` y `-uy` son el trabajo real, y es
trabajo acotado y repartible: cada uno necesita una marca y una nota, no una
discusión. El motor y los tests ya están; lo que falta es el criterio caso por
caso, que es lo único que no se puede automatizar.

Tres decisiones previas condicionan el resto:

1. **Fauna y flora americanas sin respaldo normativo** (`choroy`, `coicoy`,
   `pitoitoy`, y sus equivalentes en `-ay` y `-uy`): o doble plural para todas o
   `-es` para todas. Conviene oír antes a hablantes de los países de origen.
2. **Extranjerismos con `-es` heredado**: aplicar R5 sin excepciones dejaría
   caer varias formas que hoy están dentro. Es la parte cara de la limpieza.
3. **Voces en cursiva y de locución** (`playboy`, `troy`): hoy sin plural. Es
   defendible, pero conviene que sea una regla escrita y no una costumbre.

Nada de esto toca el build ni los assets publicados. El auditor produce un
informe; la decisión de qué entra en el próximo lexicón sigue siendo humana.
