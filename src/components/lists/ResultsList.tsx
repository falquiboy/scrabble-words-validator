
import React from 'react';
import WordResult from './WordResult';

interface ResultsListProps {
  results: string[];
}

const ResultsList = ({ results }: ResultsListProps) => {
  if (results.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Resultados ({results.length})</h3>
      <div className="max-h-[400px] overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {results.map((word, index) => (
            <WordResult key={index} word={word} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsList;
