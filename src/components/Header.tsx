import React from 'react';
import { User } from '@supabase/supabase-js';
import { 
  FileText, 
  Save, 
  FolderOpen, 
  Trash2, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  Wifi, 
  WifiOff, 
  PlusCircle 
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  isOnline: boolean;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onNewBudget: () => void;
  onSaveBudget: () => void;
  onOpenSavedBudgets: () => void;
  onDeleteBudget: () => void;
  savingBudget: boolean;
  onOpenExcelModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isOnline,
  onOpenAuth,
  onSignOut,
  onNewBudget,
  onSaveBudget,
  onOpenSavedBudgets,
  onDeleteBudget,
  savingBudget,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & Connection Status */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 leading-tight text-base sm:text-lg">
                CVA Cozinhas & Banhos
              </h1>
              {/* Ícone de conexão verde (ou âmbar se offline) */}
              <span 
                className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-50 text-emerald-600"
                title={isOnline ? "Supabase Conectado" : "Sincronização Offline / Local"}
                aria-label={isOnline ? "Supabase Conectado" : "Conexão Offline"}
              >
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-500" />
                )}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Sistema de Orçamentos Comerciais
            </div>
          </div>
        </div>

        {/* Right: Actions and User */}
        <div className="flex items-center gap-2">
          {/* Botão Novo Orçamento */}
          <button
            id="btn-new-budget"
            type="button"
            onClick={onNewBudget}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors"
            title="Iniciar um novo orçamento limpo"
          >
            <PlusCircle className="w-4 h-4 text-slate-600" />
            <span>Novo</span>
          </button>

          {/* Botão Orçamentos Salvos */}
          <button
            id="btn-open-saved"
            type="button"
            onClick={onOpenSavedBudgets}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
            title="Carregar orçamentos gravados no Supabase"
          >
            <FolderOpen className="w-4 h-4 text-blue-800" />
            <span className="hidden sm:inline">Orçamentos Salvos</span>
          </button>

          {/* Botão Salvar com ícone na cor amarela tradicional */}
          <button
            id="btn-save-header"
            type="button"
            onClick={onSaveBudget}
            disabled={savingBudget}
            className="p-2 rounded-lg bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-amber-950 border border-amber-500 transition-colors shadow-xs flex items-center justify-center disabled:opacity-50"
            title={savingBudget ? "Salvando orçamento..." : "Salvar Orçamento"}
            aria-label="Salvar Orçamento"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Botão Apagar Orçamento */}
          <button
            id="btn-delete-header"
            type="button"
            onClick={onDeleteBudget}
            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 border border-red-200 transition-colors shadow-xs flex items-center justify-center"
            title="Apagar este orçamento"
            aria-label="Apagar Orçamento"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* User Auth state */}
          <div className="h-6 w-px bg-slate-200 mx-1" />

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right leading-none">
                <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                  {user.email}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">Autenticado</span>
              </div>
              <button
                id="btn-signout"
                type="button"
                onClick={onSignOut}
                className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-signin"
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4 text-blue-900" />
              <span>Entrar / Cadastrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
