import React from 'react';
import { FilePlus, Save, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface NewBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndNew: () => void;
  onDiscardAndNew: () => void;
  budgetNum: string;
  clientName: string;
  itemCount: number;
  total: number;
  saving?: boolean;
}

export const NewBudgetModal: React.FC<NewBudgetModalProps> = ({
  isOpen,
  onClose,
  onSaveAndNew,
  onDiscardAndNew,
  budgetNum,
  clientName,
  itemCount,
  total,
  saving = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-200">
              <FilePlus className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Iniciar Novo Orçamento</h3>
              <p className="text-xs text-blue-200">Confirmação de abertura de novo orçamento</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold block text-amber-950 mb-1">
                Deseja salvar o orçamento atual antes de iniciar um novo?
              </span>
              Você está trabalhando no orçamento <strong className="font-semibold">{budgetNum || 'Sem número'}</strong>.
              Ao iniciar um novo, os campos serão zerados e o sistema gerará o próximo número sequencial.
            </div>
          </div>

          {/* Current Budget Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Orçamento Atual:</span>
              <span className="font-bold text-slate-900 font-mono">{budgetNum || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                {clientName || 'Cliente não identificado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Itens no Orçamento:</span>
              <span className="font-medium text-slate-800">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="font-semibold text-slate-800">Total:</span>
              <span className="font-bold text-blue-900 font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col gap-2">
          {/* Option 1: Salvar e Novo */}
          <button
            type="button"
            onClick={onSaveAndNew}
            disabled={saving}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Salvando...' : 'Salvar Orçamento Atual e Iniciar Novo (+1)'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </button>

          {/* Option 2: Descartar e Novo */}
          <button
            type="button"
            onClick={onDiscardAndNew}
            className="w-full py-2 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Não Salvar e Iniciar Novo (+1)</span>
          </button>

          {/* Option 3: Cancelar */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-slate-500 hover:text-slate-700 text-[11px] font-medium transition-colors text-center"
          >
            Cancelar e Continuar Editando
          </button>
        </div>
      </div>
    </div>
  );
};
