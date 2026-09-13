import React, { useState } from 'react';
import { X, Search, FolderOpen, Trash2, Calendar, User, DollarSign, RefreshCw } from 'lucide-react';
import { BudgetRecord } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SavedBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: BudgetRecord[];
  onLoadBudget: (budget: BudgetRecord) => void;
  onDeleteBudget: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export const SavedBudgetsModal: React.FC<SavedBudgetsModalProps> = ({
  isOpen,
  onClose,
  budgets,
  onLoadBudget,
  onDeleteBudget,
  loading,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = budgets.filter(b => {
    const term = searchTerm.toLowerCase();
    const matchName = (b.client_name || '').toLowerCase().includes(term);
    const matchNum = (b.num_orc || '').toLowerCase().includes(term);
    const matchConsultor = (b.consultor || '').toLowerCase().includes(term);
    const matchArq = (b.arquiteto_parceiro || '').toLowerCase().includes(term);
    return matchName || matchNum || matchConsultor || matchArq;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Orçamentos Salvos no Supabase</h2>
              <p className="text-xs text-slate-500">Persistência em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Atualizar lista do Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="py-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por cliente, número ou consultor..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Budgets List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
              <span>Sincronizando com o Supabase...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhum orçamento encontrado.
            </div>
          ) : (
            filtered.map((budget) => (
              <div
                key={budget.id || budget.num_orc}
                className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {budget.client_name || 'Cliente sem nome'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800">
                      {budget.num_orc}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-600">
                      {budget.faturamento_tipo}
                    </span>
                    {budget.arquiteto_parceiro && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 truncate max-w-[150px]" title={`Arquiteto(a) Parceiro: ${budget.arquiteto_parceiro}`}>
                        Arq: {budget.arquiteto_parceiro}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {budget.date_orc || 'Sem data'}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {budget.consultor}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {budget.items?.length || 0} {(budget.items?.length || 0) === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-blue-900 text-xs sm:text-sm font-mono">
                      {formatCurrency(budget.total_final || 0)}
                    </div>
                    {budget.profit_estimate !== undefined && (
                      <div className="text-[10px] text-emerald-700 font-medium">
                        Lucro: {formatCurrency(budget.profit_estimate)}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadBudget(budget);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    Carregar
                  </button>

                  <button
                    type="button"
                    onClick={() => budget.id && onDeleteBudget(budget.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir orçamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>Total: {filtered.length} orçamentos</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
