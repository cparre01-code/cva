import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  budgetNum: string;
  clientName?: string;
  total?: number;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  budgetNum,
  clientName,
  total,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-red-100 max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-red-50/80 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-red-800">
            <div className="p-2 bg-red-100 rounded-full text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-950">Confirmar Exclusão</h3>
              <p className="text-[11px] text-red-700">Esta ação não poderá ser desfeita</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 text-slate-700 text-xs sm:text-sm">
          <p>
            Você tem certeza de que deseja apagar o orçamento <strong>{budgetNum}</strong>?
          </p>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Nº Orçamento:</span>
              <span className="font-semibold text-slate-900">{budgetNum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-semibold text-slate-900">{clientName || 'Não identificado'}</span>
            </div>
            {total !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Total:</span>
                <span className="font-bold text-blue-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            O orçamento será removido permanentemente do Supabase e da memória local.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-xs transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sim, Apagar Orçamento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
