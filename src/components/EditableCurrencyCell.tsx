import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, parseBrlCurrency } from '../utils/calculations';
import { Pencil } from 'lucide-react';

interface EditableCurrencyCellProps {
  value: number;
  isEditable: boolean;
  onCommit: (newValue: number) => void;
  className?: string;
}

export const EditableCurrencyCell: React.FC<EditableCurrencyCellProps> = ({
  value,
  isEditable,
  onCommit,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(
      (Number(value) || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }, [value]);

  if (!isEditable) {
    return <span className={`font-mono ${className}`}>{formatCurrency(value)}</span>;
  }

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setInputValue(
      (Number(value) || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };

  const handleCommit = () => {
    setIsEditing(false);
    const parsed = parseBrlCurrency(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onCommit(parsed);
      setInputValue(
        parsed.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    } else {
      setInputValue(
        (Number(value) || 0).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setInputValue(
        (Number(value) || 0).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-end w-full group ${className}`}>
      {/* Visualização de Impressão — Sempre formatação de moeda pura */}
      <span className="hidden print:inline font-mono font-semibold">
        {formatCurrency(value)}
      </span>

      {/* Visualização em Tela */}
      <div className="print:hidden w-full flex justify-end">
        {isEditing ? (
          <div className="flex items-center justify-end gap-0.5 bg-white border border-blue-500 rounded px-1 py-0.5 shadow-2xs ring-1 ring-blue-300">
            <span className="text-[7.5px] font-bold text-slate-400 select-none">R$</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleCommit}
              onKeyDown={handleKeyDown}
              className="w-16 text-right font-mono text-[8.5px] font-bold text-slate-900 bg-transparent border-0 p-0 focus:outline-none"
              placeholder="0,00"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            className="group/btn py-0.5 px-1 rounded flex items-center justify-end gap-1 font-mono text-[8.5px] font-bold text-slate-800 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Clique para editar o Valor Unitário (máscara de moeda R$)"
          >
            <span>{formatCurrency(value)}</span>
            <Pencil className="w-2.5 h-2.5 text-slate-400 group-hover/btn:text-blue-600 opacity-60 group-hover/btn:opacity-100" />
          </button>
        )}
      </div>
    </div>
  );
};
