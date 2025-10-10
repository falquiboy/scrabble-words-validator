import { useState } from "react";
import { getBatchLeaveValues, formatLeaveTokensFromInternalLetters } from "@/utils/leavesData";
import { processDigraphs } from "@/utils/digraphs";

interface ResidueResult {
  leave: string;
  value: number | null;
  complement: string;
  complementTokens: string[];
}

const normalizeInput = (input: string): string => {
  return input
    .toUpperCase()
    .normalize("NFD")
    .replace(/[^A-ZÁÉÍÓÚÜÑ?]/g, "")
    .normalize("NFC");
};

const generateLeaveCombinations = (
  letters: string[]
): Array<{ leave: string; complement: string; complementTokens: string[] }> => {
  const n = letters.length;

  if (n === 0) {
    return [];
  }

  const combinations = new Map<string, { complement: string; complementTokens: string[] }>();
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
      const leaveStr = leaveTokens.join('');
      const complementTokens = formatLeaveTokensFromInternalLetters(complementSubset);
      const complementStr = complementTokens.join('');
      if (!combinations.has(leaveStr)) {
        combinations.set(leaveStr, { complement: complementStr, complementTokens });
      }
    }
  }

  return Array.from(combinations.entries()).map(([leave, info]) => ({
    leave,
    complement: info.complement,
    complementTokens: info.complementTokens
  }));
};

const Residues = () => {
  const [rack, setRack] = useState("");
  const [results, setResults] = useState<ResidueResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        leavesCombinations.map(({ leave, complement, complementTokens }) => [leave, { complement, complementTokens }])
      );

      if (leavesToQuery.length === 0) {
        setResults([]);
        setError("No hay residuos posibles con el atril ingresado.");
        setIsLoading(false);
        return;
      }

      const valuesMap = await getBatchLeaveValues(leavesToQuery);
      const mappedResults: ResidueResult[] = Array.from(valuesMap.entries()).map(([leave, value]) => {
        const info = combinationDetails.get(leave);
        return {
          leave,
          value,
          complement: info?.complement ?? "",
          complementTokens: info?.complementTokens ?? []
        };
      });

      mappedResults.sort((a, b) => {
        const valueA = a.value ?? Number.NEGATIVE_INFINITY;
        const valueB = b.value ?? Number.NEGATIVE_INFINITY;
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white shadow-sm rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Residuos del atril</h2>
        <p className="text-sm text-gray-600 mb-6">
          Ingresa hasta siete letras (incluyendo comodines con «?»). El sistema calculará el valor de todos los
          residuos posibles, desde {"n"} letras (atril completo) hasta 1 letra, usando la tabla de equity más reciente.
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
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Residuo → complemento
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {results.map(({ leave, value, complement, complementTokens }) => {
                    const complementDisplay = complementTokens.length > 0 ? complementTokens.join('') : '∅';

                    return (
                      <tr key={`${leave}-${complementDisplay}`}>
                        <td className="px-4 py-2 font-mono text-sm text-gray-800">
                          <span>{leave}</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span>{complementDisplay}</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {value !== null ? value.toFixed(3) : "—"}
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
  );
};

export default Residues;
