import React from 'react';
import { AnagramWordInfo } from '@/utils/anagramWordData';
import { getVerbForms, getVerbTypeLabel, getRegularityLabel, VerbForms } from '@/utils/verbData';

interface VerbWordViewProps {
  word: string;
  wordInfo: AnagramWordInfo;
  highlightedWord?: React.ReactNode;
}

const VerbWordView: React.FC<VerbWordViewProps> = ({
  word,
  wordInfo,
  highlightedWord
}) => {
  const handleRAEClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://dle.rae.es/${word.toLowerCase()}`, '_blank');
  };

  if (!wordInfo.verbInfo) return null;

  const verbInfo = wordInfo.verbInfo;
  const verbForms = getVerbForms(verbInfo);
  const verbTypeLabel = getVerbTypeLabel(verbInfo);
  const regularityLabel = getRegularityLabel(verbInfo.regularity);

  const renderVerbForm = (form: { form: string; isValid: boolean }, label: string) => {
    return (
      <span
        key={form.form}
        className={`inline-block px-2 py-1 text-xs rounded-full mr-1 mb-1 ${
          form.isValid 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700 line-through'
        }`}
        title={form.isValid ? `${label} - Válida para Scrabble` : `${label} - No válida para Scrabble`}
      >
        {form.form.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Clickable word with verb info */}
      <div className="mb-3">
        <span 
          onClick={handleRAEClick}
          className="font-medium text-lg cursor-pointer hover:text-blue-600 transition-colors"
        >
          {highlightedWord || word}
          <span className="text-sm font-normal text-green-600 ml-1">
            ({wordInfo.wordType} de "{verbInfo.norm_lemma}", verbo {verbTypeLabel}, {regularityLabel})
          </span>
        </span>
      </div>

      {/* Verb definition */}
      {verbInfo.prime_sense && (
        <div className="text-xs text-gray-600 italic mb-3 leading-relaxed">
          "{verbInfo.prime_sense}"
        </div>
      )}

      {/* Verb forms */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700 mb-2">
          Formas derivadas:
        </div>
        
        <div className="flex flex-wrap items-center">
          {verbForms.masculineParticiple && 
            renderVerbForm(verbForms.masculineParticiple, 'Participio masculino')
          }
          
          {verbForms.masculinePluralParticiple && 
            renderVerbForm(verbForms.masculinePluralParticiple, 'Participio masculino plural')
          }
          
          {verbForms.feminineParticiple && 
            renderVerbForm(verbForms.feminineParticiple, 'Participio femenino')
          }
          
          {verbForms.pronominalForm && 
            renderVerbForm(verbForms.pronominalForm, 'Forma pronominal')
          }
          
          {verbForms.imperativeForm && 
            renderVerbForm(verbForms.imperativeForm, 'Imperativo voseo')
          }
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 rounded-full"></div>
            <span>Válida para Scrabble</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 rounded-full"></div>
            <span>No válida para Scrabble</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerbWordView;