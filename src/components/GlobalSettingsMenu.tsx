import React, { useState } from 'react';
import { Menu, X, Info, Anchor, ChevronDown, Copy, Settings, BookOpen, ArrowUp, List, ChartNoAxesCombined } from 'lucide-react';
import { LEXICON_MODE_OPTIONS } from '@/lexicon/releases';
import type { LexiconMode } from '@/lexicon/types';
import type { AnagramResultView } from '@/components/anagramador/viewTypes';

interface GlobalSettingsMenuProps {
  activeModule: 'judge' | 'anagram' | 'lists' | 'residues' | 'training';
  lexiconMode: LexiconMode;
  onLexiconModeChange: (mode: LexiconMode) => void;
  newWordsFirst: boolean;
  onNewWordsFirstChange: (value: boolean) => void;
  // Anagram-specific props (only used when activeModule === 'anagram')
  anagramSettings?: {
    showShorter: boolean;
    onShowShorterChange: (show: boolean) => void;
    view: AnagramResultView;
    onViewChange: (view: AnagramResultView) => void;
    hasActiveSearch: boolean;
    onCopyAll?: () => void;
    isPatternSearch?: boolean;
  };
}

const GlobalSettingsMenu: React.FC<GlobalSettingsMenuProps> = ({
  activeModule,
  anagramSettings,
  lexiconMode,
  onLexiconModeChange,
  newWordsFirst,
  onNewWordsFirstChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleToggleChange = (toggleFn: (value: boolean) => void, currentValue: boolean) => {
    toggleFn(!currentValue);
  };

  const renderToggle = (
    label: string,
    value: boolean,
    onChange: (value: boolean) => void,
    icon: React.ReactNode,
    disabled = false
  ) => (
    <div className={`flex items-center justify-between py-3 px-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center space-x-3">
        {icon}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <button
        onClick={() => !disabled && handleToggleChange(onChange, value)}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const renderAnagramSettings = () => {
    if (!anagramSettings) return null;

    const {
      showShorter,
      onShowShorterChange,
      view,
      onViewChange,
      hasActiveSearch,
      onCopyAll,
      isPatternSearch = false
    } = anagramSettings;

    const viewOptions: Array<{
      value: AnagramResultView;
      label: string;
      help: string;
      icon: React.ReactNode;
      disabled?: boolean;
    }> = [
      { value: 'anagrams', label: 'Anagramas', help: 'Lista limpia de palabras', icon: <List size={16} className="text-slate-600" /> },
      { value: 'extended', label: 'Vista extendida', help: 'Información lingüística', icon: <Info size={16} className="text-blue-500" /> },
      { value: 'hooks', label: 'Ganchos', help: 'Extensiones y ficha adicional', icon: <Anchor size={16} className="text-green-500" /> },
      {
        value: 'residues',
        label: 'Equity / residuos',
        help: isPatternSearch ? 'Solo disponible para subanagramas' : 'Equity y residuo, solo palabras más cortas',
        icon: <ChartNoAxesCombined size={16} className="text-purple-500" />,
        disabled: isPatternSearch,
      },
    ];

    return (
      <div className="space-y-1">
        {/* Shorter Words Toggle */}
        {renderToggle(
          isPatternSearch ? 'Palabras de más de 8 letras' : 'Palabras más cortas',
          showShorter,
          onShowShorterChange,
          <ChevronDown size={16} className="text-orange-500" />,
          !hasActiveSearch
        )}

        <div className="border-t border-gray-100" />

        <div className="px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Presentación</p>
          <div className="space-y-1" role="radiogroup" aria-label="Vista de resultados">
            {viewOptions.map((option) => {
              const disabled = !hasActiveSearch || option.disabled;
              const selected = view === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onViewChange(option.value)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                    selected ? 'border-blue-300 bg-blue-50' : 'border-transparent hover:bg-white'
                  } ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
                >
                  <span className="mt-0.5">{option.icon}</span>
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                    <span className="block text-xs text-gray-500">{option.help}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Copy Button */}
        {hasActiveSearch && onCopyAll && (
          <>
            <div className="border-t border-gray-100" />
            <div className="py-3 px-4">
              <button
                onClick={() => {
                  onCopyAll();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 text-left hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <Copy size={16} className="text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Copiar resultados</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'anagram':
        return renderAnagramSettings();
      
      case 'judge':
        return (
          <div className="py-8 text-center">
            <Settings size={24} className="text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No hay más opciones para el módulo de validación
            </p>
          </div>
        );
      
      case 'lists':
      case 'residues':
      case 'training':
        return (
          <div className="py-8 text-center">
            <Settings size={24} className="text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No hay más opciones para este módulo
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderStatusSection = () => {
    if (activeModule !== 'anagram' || !anagramSettings?.hasActiveSearch) {
      return null;
    }

    const { view, showShorter } = anagramSettings;
    const viewLabels: Record<AnagramResultView, string> = {
      anagrams: '📝 Anagramas',
      extended: '📖 Vista extendida',
      hooks: '🎣 Ganchos',
      residues: '📊 Equity / residuos',
    };

    return (
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Vista actual:</h3>
        <p className="text-xs text-blue-600">
          {viewLabels[view]}
        </p>
        {showShorter && (
          <p className="text-xs text-orange-600 mt-1">
            📏 Incluyendo palabras más cortas
          </p>
        )}
      </div>
    );
  };

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'judge': return 'Configuración - Juez';
      case 'anagram': return 'Configuración - Anagramas';
      case 'residues': return 'Configuración - Residuos';
      case 'lists': return 'Configuración - Listas';
      default: return 'Configuración';
    }
  };

  return (
    <>
      {/* Hamburger Button - Always present, aligned with tabs */}
      <div className="fixed top-0 right-4 h-16 flex items-center z-50">
        <button
          onClick={toggleMenu}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
          aria-label="Abrir menú de configuración"
        >
          {isOpen ? (
            <X size={20} className="text-gray-600" />
          ) : (
            <Menu size={20} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMenu}
        />
      )}

      {/* Side Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">{getModuleTitle()}</h2>
            <button
              onClick={toggleMenu}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Module-specific content */}
          <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
              <BookOpen size={16} className="text-amber-600" />
              Lexicón de juego
            </div>
            <div className="space-y-2" role="radiogroup" aria-label="Lexicón de juego">
              {LEXICON_MODE_OPTIONS.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-white">
                  <input
                    type="radio"
                    name="lexicon-mode"
                    value={option.value}
                    checked={lexiconMode === option.value}
                    onChange={() => onLexiconModeChange(option.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                    <span className="block text-xs text-gray-500">{option.help}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {activeModule === 'anagram' && lexiconMode === 'hybrid' && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50">
              {renderToggle(
                'Palabras nuevas primero',
                newWordsFirst,
                onNewWordsFirstChange,
                <ArrowUp size={16} className="text-amber-600" />,
                !anagramSettings?.hasActiveSearch
              )}
              <p className="px-4 pb-3 text-xs text-amber-800">
                Agrupa primero las voces nuevas; cada grupo conserva el orden alfabético tradicional.
              </p>
            </div>
          )}

          {renderModuleContent()}

          {/* Info Section for anagram module when no active search */}
          {activeModule === 'anagram' && !anagramSettings?.hasActiveSearch && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                Realiza una búsqueda para activar las opciones de visualización
              </p>
            </div>
          )}

          {/* Current Status */}
          {renderStatusSection()}
        </div>
      </div>
    </>
  );
};

export default GlobalSettingsMenu;
