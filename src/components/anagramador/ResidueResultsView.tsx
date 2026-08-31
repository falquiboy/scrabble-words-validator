import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader } from 'lucide-react';
import LexiconBadge from '@/components/LexiconBadge';
import { getInternalLength, toDisplayFormat } from '@/utils/digraphs';
import { calculateWordScore } from '@/utils/scrabbleScore';
import {
  calculateLeave,
  CURRENT_LEAVE_GENERATION,
  getBatchGenerationLeaveValues,
} from '@/utils/leavesData';
import { parseUserQuery } from '@/utils/queryLanguage.mjs';
import { compareSpanishTiles, compareSpanishWords } from '@/lexicon/policy.mjs';
import { getWildcardWordSortKeys } from '@/utils/wildcardSubanagrams';
import DefinitionTooltipLink from './results/DefinitionTooltipLink';

interface ResidueResultsViewProps {
  searchTerm: string;
  results: {
    wildcardMatches: string[];
    shorterMatches: string[];
  };
  highlightWildcardLetter: (word: string, originalWord: string) => React.ReactNode;
}

interface ResidueRow {
  word: string;
  displayWord: string;
  length: number;
  leave: string;
  leaveValue: number | null;
  score: number;
  equity: number;
  usesWildcard: boolean;
}

const formatNumber = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

const ResidueResultsView: React.FC<ResidueResultsViewProps> = ({
  searchTerm,
  results,
  highlightWildcardLetter,
}) => {
  const [rows, setRows] = useState<ResidueRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set(['wildcard', 'plain']));
  const [expandedLengths, setExpandedLengths] = useState(new Set<string>());
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  const candidates = useMemo(() => [
    ...results.wildcardMatches.map((word) => ({ word, usesWildcard: true })),
    ...results.shorterMatches.map((word) => ({ word, usesWildcard: false })),
  ], [results.shorterMatches, results.wildcardMatches]);
  const rack = useMemo(() => {
    const query = parseUserQuery(searchTerm);
    return query.kind === 'anagram' ? query.letters : '';
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;

    const loadRows = async () => {
      if (!searchTerm || candidates.length === 0) {
        setRows([]);
        return;
      }

      setIsLoading(true);
      const baseRows = candidates.map(({ word, usesWildcard }) => {
        const displayWord = toDisplayFormat(word);
        return {
          word,
          displayWord,
          length: getInternalLength(word),
          leave: calculateLeave(rack, displayWord, rack),
          score: calculateWordScore(displayWord, rack),
          usesWildcard,
        };
      });
      const plainRows = baseRows.filter((row) => !row.usesWildcard);

      try {
        const leaveValues = await getBatchGenerationLeaveValues(
          CURRENT_LEAVE_GENERATION,
          plainRows.map((row) => row.leave),
        );
        if (cancelled) return;

        setRows(baseRows.map((row) => {
          if (row.usesWildcard) {
            return { ...row, leaveValue: null, equity: row.score };
          }
          const leaveValue = leaveValues.get(row.leave) ?? null;
          return {
            ...row,
            leaveValue,
            equity: Math.round((row.score + (leaveValue ?? 0)) * 100) / 100,
          };
        }));
      } catch (error) {
        console.error('Error calculando la vista de residuos:', error);
        if (!cancelled) {
          setRows(baseRows.map((row) => ({ ...row, leaveValue: null, equity: row.score })));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadRows();
    return () => { cancelled = true; };
  }, [candidates, rack, searchTerm]);

  useEffect(() => {
    const lengths = [...new Set(candidates.map(({ word }) => getInternalLength(word)))]
      .sort((left, right) => right - left)
      .slice(0, 2);
    setExpandedLengths(new Set(
      ['wildcard', 'plain'].flatMap((section) => lengths.map((length) => `${section}:${length}`)),
    ));
    setExpandedSections(new Set(['wildcard', 'plain']));
    setIsSummaryExpanded(true);
  }, [candidates]);

  const compareRowsByEquity = (left: ResidueRow, right: ResidueRow) =>
    right.equity - left.equity || compareSpanishWords(left.word, right.word);

  const compareRowsForDisplay = (left: ResidueRow, right: ResidueRow) => {
    if (left.usesWildcard && right.usesWildcard) {
      const leftKeys = getWildcardWordSortKeys(left.word, rack);
      const rightKeys = getWildcardWordSortKeys(right.word, rack);
      return compareSpanishTiles(leftKeys.wildcardTile, rightKeys.wildcardTile)
        || compareSpanishWords(leftKeys.remainingWord, rightKeys.remainingWord)
        || compareSpanishWords(left.word, right.word);
    }
    return compareRowsByEquity(left, right);
  };

  const toggleSetValue = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) => setter((current) => {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  });

  const plainRows = rows.filter((row) => !row.usesWildcard);
  const plainLengths = [...new Set(plainRows.map((row) => row.length))]
    .sort((left, right) => right - left);
  const bestByLength = plainLengths.map((length) => ({
    length,
    row: plainRows
      .filter((row) => row.length === length)
      .sort(compareRowsByEquity)[0] ?? null,
  }));

  const renderSection = (id: 'wildcard' | 'plain', title: string, sectionRows: ResidueRow[]) => {
    if (sectionRows.length === 0) return null;
    const sectionExpanded = expandedSections.has(id);
    const grouped = sectionRows.reduce<Record<number, ResidueRow[]>>((groups, row) => {
      (groups[row.length] ||= []).push(row);
      return groups;
    }, {});
    Object.values(grouped).forEach((group) => group.sort(compareRowsForDisplay));

    return (
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSetValue(setExpandedSections, id)}
          className="flex w-full items-center gap-2 text-left text-base font-semibold text-gray-800"
          aria-expanded={sectionExpanded}
        >
          {sectionExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          {title} ({sectionRows.length})
        </button>
        {sectionExpanded && Object.keys(grouped).map(Number).sort((a, b) => b - a).map((length) => {
          const lengthId = `${id}:${length}`;
          const lengthExpanded = expandedLengths.has(lengthId);
          return (
            <div key={lengthId} className="ml-3 space-y-2">
              <button
                type="button"
                onClick={() => toggleSetValue(setExpandedLengths, lengthId)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600"
                aria-expanded={lengthExpanded}
              >
                {lengthExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                {length} fichas ({grouped[length].length})
              </button>
              {lengthExpanded && (
                <div className="ml-5 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                  {grouped[length].map((row) => (
                    <div key={`${id}:${row.word}`} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0 text-lg">
                        <DefinitionTooltipLink word={row.word}>
                          {highlightWildcardLetter(row.displayWord, searchTerm)}
                        </DefinitionTooltipLink>
                        <LexiconBadge word={row.word} className="ml-1" />
                      </div>
                      {!row.usesWildcard && (
                        <div className="shrink-0 text-right text-xs text-gray-500">
                          <div>residuo {row.leave || '∅'}</div>
                          <div>
                            {row.score} + {row.leaveValue === null ? '—' : formatNumber(row.leaveValue)} ={' '}
                            <span className="font-semibold text-purple-700">{formatNumber(row.equity)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-gray-600">
        <Loader className="animate-spin" size={20} />
        Calculando residuos de generación {CURRENT_LEAVE_GENERATION}…
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="py-8 text-center text-gray-500">No hay subanagramas para evaluar.</p>;
  }

  return (
    <div className="space-y-6 pb-6">
      {bestByLength.length > 0 && <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
        <button
          type="button"
          onClick={() => setIsSummaryExpanded((expanded) => !expanded)}
          aria-expanded={isSummaryExpanded}
          className="mb-2 flex w-full items-center gap-2 text-left font-semibold text-purple-900"
        >
          {isSummaryExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          Mayor equity por longitud
        </button>
        {isSummaryExpanded && <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-purple-700">
              <tr>
                <th className="pb-2 pr-3">Fichas</th>
                <th className="pb-2 pr-3">Palabra</th>
                <th className="pb-2 pr-3">Residuo</th>
                <th className="pb-2 text-right">Equity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {bestByLength.map(({ length, row }) => row && (
                <tr key={length}>
                  <th className="py-2 pr-3 font-semibold text-purple-900">{length}</th>
                  <td className="py-2 pr-3 font-semibold text-gray-900">
                    <DefinitionTooltipLink word={row.word}>{row.displayWord}</DefinitionTooltipLink>
                    <LexiconBadge word={row.word} className="ml-1" />
                  </td>
                  <td className="py-2 pr-3 text-gray-600">{row.leave || '∅'}</td>
                  <td className="py-2 text-right font-semibold text-purple-800">{formatNumber(row.equity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
        {isSummaryExpanded && (
          <p className="mt-2 text-xs text-purple-700">Valores de residuo: generación {CURRENT_LEAVE_GENERATION}.</p>
        )}
      </div>}

      {renderSection('wildcard', 'Resultados con comodín', rows.filter((row) => row.usesWildcard))}
      {renderSection('plain', 'Resultados sin comodín', rows.filter((row) => !row.usesWildcard))}
    </div>
  );
};

export default ResidueResultsView;
