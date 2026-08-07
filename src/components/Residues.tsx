import { useMemo, useState } from "react";
import {
  getBatchLeaveValues,
  getBatchGenerationLeaveValues,
  formatLeaveTokensFromInternalLetters
} from "@/utils/leavesData";
import { processDigraphs } from "@/utils/digraphs";
import { HybridTrieService } from "@/services/HybridTrieService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResidueResult {
  leave: string;
  seedValue: number | null;
  generationValue: number | null;
  complement: string;
  complementTokens: string[];
  complementInternal: string;
}

const COMPARISON_GENERATION = 6;

interface ResiduesProps {
  trie: HybridTrieService;
}

const normalizeInput = (input: string): string => {
  let result = input.toUpperCase();

  // Preserve Ñ while stripping diacritics from other letters
  result = result.replace(/Ñ/g, "#");
  result = result
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z#?]/g, "")
    .replace(/#/g, "Ñ")
    .normalize("NFC");

  return result;
};

const generateLeaveCombinations = (
  letters: string[]
): Array<{
  leave: string;
  complement: string;
  complementTokens: string[];
  complementInternal: string;
}> => {
  const n = letters.length;

  if (n === 0) {
    return [];
  }

  const combinations = new Map<
    string,
    { complement: string; complementTokens: string[]; complementInternal: string }
  >();
  const totalMasks = 1 << n;

  for (let mask = 1; mask < totalMasks; mask++) {
    const subset: string[] = [];
    const complementSubset: string[] = [];

    for (let idx = 0; idx < n; idx++) {
      if (mask & (1 << idx)) {
        subset.push(letters[idx]);
      } else {
        complementSubset.push(letters[idx]);
      }
    }

    if (subset.length === 0) {
      continue;
    }

    const leaveTokens = formatLeaveTokensFromInternalLetters(subset);
    if (leaveTokens.length > 0) {
      const leaveStr = leaveTokens.join("");
      const complementTokens = formatLeaveTokensFromInternalLetters(complementSubset);
      const complementStr = complementTokens.join("");
      if (!combinations.has(leaveStr)) {
        combinations.set(leaveStr, {
          complement: complementStr,
          complementTokens,
          complementInternal: complementSubset.join("")
        });
      }
    }
  }

  return Array.from(combinations.entries()).map(([leave, info]) => ({
    leave,
    complement: info.complement,
    complementTokens: info.complementTokens,
    complementInternal: info.complementInternal
  }));
};

const EXTRA_LETTER_TOKENS = [
  "A",
  "B",
  "C",
  "[CH]",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "[LL]",
  "M",
  "N",
  "Ñ",
  "O",
  "P",
  "Q",
  "R",
  "[RR]",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z"
];

const tokenToRackValue = (token: string): string => {
  switch (token) {
    case "[CH]":
      return "CH";
    case "[LL]":
      return "LL";
    case "[RR]":
      return "RR";
    default:
      return token;
  }
};

const tokenToDisplay = (token: string): string => {
  switch (token) {
    case "[CH]":
      return "CH";
    case "[LL]":
      return "LL";
    case "[RR]":
      return "RR";
    default:
      return token;
  }
};

const tokensToRackString = (tokens: string[]) => tokens.map(tokenToRackValue).join("");

const Residues = ({ trie }: ResiduesProps) => {
  const [rack, setRack] = useState("");
  const [results, setResults] = useState<ResidueResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{
    leave: string;
    complementDisplay: string;
    exactWords: string[];
    plusOneWords: Array<{ letter: string; words: string[] }>;
    isLoading: boolean;
    error: string | null;
  }>({
    leave: "",
    complementDisplay: "",
    exactWords: [],
    plusOneWords: [],
    isLoading: false,
    error: null
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await calculateResidues();
  };

  const calculateResidues = async () => {
    const trimmed = rack.trim();

    if (!trimmed) {
      setError("Ingresa hasta siete fichas para calcular sus residuos.");
      setResults([]);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const sanitized = normalizeInput(trimmed);

      if (!sanitized) {
        setError("No se detectaron letras válidas en el atril ingresado.");
        setResults([]);
        setIsLoading(false);
        return;
      }

      const internal = processDigraphs(sanitized);
      const letters = Array.from(internal);

      if (letters.length > 7) {
        setError("El cálculo admite como máximo siete fichas (incluyendo dígrafos y comodines).");
        setResults([]);
        setIsLoading(false);
        return;
      }

      const leavesCombinations = generateLeaveCombinations(letters);
      const leavesToQuery = leavesCombinations.map(({ leave }) => leave);
      const combinationDetails = new Map(
        leavesCombinations.map(({ leave, complement, complementTokens, complementInternal }) => [
          leave,
          { complement, complementTokens, complementInternal }
        ])
      );

      if (leavesToQuery.length === 0) {
        setResults([]);
        setError("No hay residuos posibles con el atril ingresado.");
        setIsLoading(false);
        return;
      }

      const [seedValues, generationValues] = await Promise.all([
        getBatchLeaveValues(leavesToQuery),
        getBatchGenerationLeaveValues(COMPARISON_GENERATION, leavesToQuery)
      ]);
      const mappedResults: ResidueResult[] = leavesToQuery.map((leave) => {
        const info = combinationDetails.get(leave);
        return {
          leave,
          seedValue: seedValues.get(leave) ?? null,
          generationValue: generationValues.get(leave) ?? null,
          complement: info?.complement ?? "",
          complementTokens: info?.complementTokens ?? [],
          complementInternal: info?.complementInternal ?? ""
        };
      });

      mappedResults.sort((a, b) => {
        const valueA = a.generationValue ?? a.seedValue ?? Number.NEGATIVE_INFINITY;
        const valueB = b.generationValue ?? b.seedValue ?? Number.NEGATIVE_INFINITY;
        return valueB - valueA;
      });

      setResults(mappedResults);
    } catch (fetchError) {
      console.error("Error calculando residuos:", fetchError);
      setError("No fue posible recuperar los valores de residuos. Intenta nuevamente.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = async (result: ResidueResult) => {
    if (result.complementTokens.length === 0 || result.complementTokens.includes("?")) {
      return;
    }

    const complementDisplay = result.complementTokens.join("");
    const rackString = tokensToRackString(result.complementTokens);

    setDialogState({
      leave: result.leave,
      complementDisplay,
      exactWords: [],
      plusOneWords: [],
      isLoading: true,
      error: null
    });
    setIsDialogOpen(true);

    try {
      const exactWords = Array.from(new Set(await trie.findAnagramsAsync(rackString))).sort();
      const exactSet = new Set(exactWords);

      const plusOneWords: Array<{ letter: string; words: string[] }> = [];

      for (const token of EXTRA_LETTER_TOKENS) {
        const extendedRack = tokensToRackString([...result.complementTokens, token]);
        const rawWords = await trie.findAnagramsAsync(extendedRack);
        const filtered = Array.from(new Set(rawWords.filter((word) => !exactSet.has(word)))).sort();

        if (filtered.length > 0) {
          plusOneWords.push({
            letter: tokenToDisplay(token),
            words: filtered
          });
        }
      }

      setDialogState({
        leave: result.leave,
        complementDisplay,
        exactWords,
        plusOneWords,
        isLoading: false,
        error: null
      });
    } catch (dialogError) {
      console.error("Error obteniendo jugadas del complemento:", dialogError);
      setDialogState({
        leave: result.leave,
        complementDisplay,
        exactWords: [],
        plusOneWords: [],
        isLoading: false,
        error: "No fue posible obtener las jugadas para este complemento."
      });
    }
  };

  const totalPlusOneWords = useMemo(
    () => dialogState.plusOneWords.reduce((acc, group) => acc + group.words.length, 0),
    [dialogState.plusOneWords]
  );

  return (
    <>
      <div className="h-full max-w-3xl mx-auto overflow-y-auto px-4 py-8">
        <div className="bg-white shadow-sm rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Residuos del atril</h2>
          <p className="text-sm text-gray-600 mb-6">
            Ingresa hasta siete letras (incluyendo comodines con «?»). El sistema calculará el valor de todos los
            residuos posibles y comparará la semilla KLV2 con la generación 6 del ejercicio del 30 de julio de 2026.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="rack" className="block text-sm font-medium text-gray-700 mb-2">
                Letras disponibles
              </label>
              <input
                id="rack"
                type="text"
                value={rack}
                onChange={(event) => setRack(event.target.value.toUpperCase())}
                maxLength={14}
                placeholder="Ej. CASERON, ?LUCIDO, CHANFLE"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-widest"
              />
              <p className="text-xs text-gray-500 mt-1">Se permiten dígrafos (`CH`, `LL`, `RR`) y comodines (`?`).</p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Calculando..." : "Calcular"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRack("");
                  setResults([]);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!error && results.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Valores encontrados</h3>
                <span className="text-sm text-gray-500">{results.length} residuos únicos</span>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Residuo → complemento
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Semilla
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Gen. 6
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Δ
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Jugadas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {results.map((result) => {
                      const { leave, seedValue, generationValue, complementTokens } = result;
                      const complementDisplay = complementTokens.length > 0 ? complementTokens.join("") : "∅";
                      const containsWildcard = complementTokens.includes("?");
                      const canInspect = complementTokens.length > 0 && !containsWildcard;
                      const delta = seedValue !== null && generationValue !== null
                        ? generationValue - seedValue
                        : null;

                      return (
                        <tr key={`${leave}-${complementDisplay}`}>
                          <td className="px-4 py-2 font-mono text-sm text-gray-800">
                            <span>{leave}</span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span>{complementDisplay}</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {seedValue !== null ? seedValue.toFixed(3) : "—"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {generationValue !== null ? generationValue.toFixed(3) : "—"}
                          </td>
                          <td
                            className={`px-4 py-2 text-sm font-medium ${
                              delta === null
                                ? "text-gray-400"
                                : delta > 0
                                  ? "text-emerald-600"
                                  : delta < 0
                                    ? "text-red-600"
                                    : "text-gray-500"
                            }`}
                          >
                            {delta !== null ? `${delta > 0 ? "+" : ""}${delta.toFixed(3)}` : "—"}
                          </td>
                          <td className="px-4 py-2 text-sm text-right">
                            {canInspect ? (
                              <Button
                                variant="link"
                                className="px-0 text-sm"
                                onClick={() => handleOpenDialog(result)}
                              >
                                Ver jugadas
                              </Button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setDialogState({
              leave: "",
              complementDisplay: "",
              exactWords: [],
              plusOneWords: [],
              isLoading: false,
              error: null
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Jugadas con residuo {dialogState.leave} → {dialogState.complementDisplay || "∅"}
            </DialogTitle>
            <DialogDescription>
              Palabras formables con las fichas que sueltas y con esas mismas fichas más una letra adicional.
            </DialogDescription>
          </DialogHeader>

          {dialogState.isLoading ? (
            <p className="text-sm text-gray-500">Calculando jugadas…</p>
          ) : dialogState.error ? (
            <p className="text-sm text-red-600">{dialogState.error}</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Exactas ({dialogState.exactWords.length})
                </h4>
                {dialogState.exactWords.length === 0 ? (
                  <p className="text-sm text-gray-500">No se encontraron palabras exactas.</p>
                ) : (
                  <ScrollArea className="h-40 border border-gray-200 rounded-md p-3">
                    <div className="flex flex-wrap gap-2">
                      {dialogState.exactWords.map((word) => (
                        <span key={word} className="text-sm font-mono text-gray-800">
                          {word}
                        </span>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Con una letra adicional ({totalPlusOneWords})
                </h4>
                {dialogState.plusOneWords.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No se encontraron palabras al añadir una letra adicional.
                  </p>
                ) : (
                  <ScrollArea className="h-48 border border-gray-200 rounded-md p-3 space-y-4">
                    {dialogState.plusOneWords.map(({ letter, words }) => (
                      <div key={letter}>
                        <div className="text-xs font-semibold text-blue-600 mb-1">+ {letter}</div>
                        <div className="flex flex-wrap gap-2">
                          {words.map((word) => (
                            <span key={`${letter}_${word}`} className="text-sm font-mono text-gray-800">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Residues;
