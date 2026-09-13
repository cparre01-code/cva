import React, { useState } from 'react';
import { FormaPagamento, FaturamentoTipo } from '../types';
import { formatCurrency, calculateInstallments } from '../utils/calculations';
import { X, CheckCircle2, CreditCard, Banknote, CalendarRange, Sparkles, Percent, Lock } from 'lucide-react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod: FormaPagamento;
  selectedParcelas?: number;
  onSelectMethod: (method: FormaPagamento, parcelas?: number) => void;
  faturamentoTipo: FaturamentoTipo;
  totalVista: number;
  totalPrazo: number;
  descVistaPercent: number;
  jurosRevendaPercent: number;
  descAplicadoPercent?: number;
  onUpdateDescAplicado?: (desc: number) => void;
  canGiveAdditionalDiscount?: boolean;
  maxDescNegociado?: number;
  cargoConsultorLabel?: string;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  selectedMethod,
  selectedParcelas = 10,
  onSelectMethod,
  faturamentoTipo,
  totalVista,
  totalPrazo,
  descVistaPercent = 5,
  jurosRevendaPercent = 1,
  descAplicadoPercent = 0,
  onUpdateDescAplicado,
  canGiveAdditionalDiscount = false,
  maxDescNegociado = 0,
  cargoConsultorLabel = 'Vendedor',
}) => {
  const isRevenda = faturamentoTipo === 'revenda';
  const initialMethod = (isRevenda && selectedMethod === 'boleto_pix_parcelado') ? 'a_vista' : selectedMethod;
  const [currentMethod, setCurrentMethod] = useState<FormaPagamento>(initialMethod);
  const [currentParcelas, setCurrentParcelas] = useState<number>(selectedParcelas || 10);

  if (!isOpen) return null;

  const economiaVista = Math.max(0, totalPrazo - totalVista);

  const cartaoInstallments = calculateInstallments(
    totalPrazo,
    faturamentoTipo,
    'cartao',
    jurosRevendaPercent
  );

  const boletoInstallments = calculateInstallments(
    totalPrazo,
    faturamentoTipo,
    'boleto_pix_parcelado',
    jurosRevendaPercent
  );

  const handleApply = (method: FormaPagamento, parcelas?: number) => {
    const finalMethod = (isRevenda && method === 'boleto_pix_parcelado') ? 'a_vista' : method;
    const finalParcelas = parcelas !== undefined ? parcelas : (finalMethod === 'cartao' ? currentParcelas : finalMethod === 'boleto_pix_parcelado' ? (currentParcelas > 10 ? 10 : currentParcelas) : 1);
    onSelectMethod(finalMethod, finalParcelas);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Condições de Pagamento da Proposta ({isRevenda ? 'Revenda CVA' : 'Faturamento Direto'})
              </h2>
              <p className="text-xs text-slate-300">
                Selecione a condição comercial{isRevenda ? ', desconto adicional' : ''} e o número de parcelas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Escolha do Desconto Adicional - Exclusivo da Modalidade Revenda */}
          {isRevenda && onUpdateDescAplicado && (
            <div className="rounded-xl p-4 border-2 border-amber-200 bg-amber-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Desconto Adicional Negociado (Revenda CVA)
                    </h3>
                    <p className="text-xs text-slate-600">
                      {!canGiveAdditionalDiscount 
                        ? 'Alçada exclusiva para Gerente ou Diretor. Vendedor não pode conceder desconto adicional.'
                        : `Alçada autorizada para ${cargoConsultorLabel}: até ${maxDescNegociado}%.`}
                    </p>
                  </div>
                </div>
                {!canGiveAdditionalDiscount ? (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold inline-flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Travado (Vendedor)
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-amber-300 bg-white text-amber-800">
                    {descAplicadoPercent}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="0"
                  max={maxDescNegociado || 30}
                  step="0.5"
                  disabled={!canGiveAdditionalDiscount}
                  value={descAplicadoPercent}
                  onChange={(e) => onUpdateDescAplicado(parseFloat(e.target.value) || 0)}
                  className={`w-28 px-3 py-1.5 text-sm font-semibold rounded-md border focus:outline-none ${
                    !canGiveAdditionalDiscount
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-300 focus:ring-2 focus:ring-amber-500'
                  }`}
                  placeholder={!canGiveAdditionalDiscount ? '0%' : '0%'}
                />
                <span className="text-slate-600 font-bold text-sm">%</span>

                {canGiveAdditionalDiscount && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 ml-2">
                    <span>Atalhos:</span>
                    {[0, 2, 5, maxDescNegociado].filter((v, idx, arr) => arr.indexOf(v) === idx && v <= maxDescNegociado).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onUpdateDescAplicado(val)}
                        className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                          descAplicadoPercent === val
                            ? 'bg-amber-500 text-white border-amber-600 font-bold'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            A forma de pagamento escolhida atualizará o texto de condições comerciais, o cálculo do total final e destacará o parcelamento correspondente.
          </p>

          {/* Opção 1: À Vista */}
          <div
            onClick={() => {
              setCurrentMethod('a_vista');
              handleApply('a_vista', 1);
            }}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all relative ${
              currentMethod === 'a_vista'
                ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-400/20'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                  currentMethod === 'a_vista' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      1) Pagamento À Vista (PIX / Transferência Bancária)
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {descVistaPercent}% de Desconto Incluso no Total Final
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Tanto no faturamento direto quanto na revenda CVA, aplica <strong>{descVistaPercent}% de desconto</strong> na apuração do total final.
                  </p>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-xs text-slate-500">Valor à vista (Total Final):</span>
                    <span className="text-base font-extrabold text-emerald-700 font-mono">
                      {formatCurrency(totalVista)}
                    </span>
                    {economiaVista > 0 && (
                      <span className="text-[11px] text-emerald-600 font-medium">
                        (Economia de {formatCurrency(economiaVista)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 mt-1">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  currentMethod === 'a_vista' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                }`}>
                  {currentMethod === 'a_vista' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>
          </div>

          {/* Opção 2: Pagamento no Cartão */}
          <div
            className={`rounded-xl p-4 border-2 transition-all relative ${
              currentMethod === 'cartao'
                ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-400/20'
                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
            }`}
          >
            <div 
              className="flex items-start justify-between gap-3 cursor-pointer"
              onClick={() => {
                setCurrentMethod('cartao');
                handleApply('cartao', currentParcelas);
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                  currentMethod === 'cartao' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      2) Pagamento no Cartão de Crédito
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-bold">
                      Sem desconto à vista de 5%
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-1 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${!isRevenda ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                      <span className={!isRevenda ? 'font-bold text-slate-900' : 'text-slate-600'}>
                        Faturamento Direto:
                      </span>
                      <span>Até <strong>10 vezes SEM JUROS</strong></span>
                      {!isRevenda && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold">
                          Modo Atual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isRevenda ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                      <span className={isRevenda ? 'font-bold text-slate-900' : 'text-slate-600'}>
                        Revenda CVA:
                      </span>
                      <span>Até <strong>10 vezes com juros de {jurosRevendaPercent || 1}% ao mês</strong> (1x sem juros)</span>
                      {isRevenda && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold">
                          Modo Atual
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-xs text-slate-500">Valor base:</span>
                    <span className="text-base font-extrabold text-blue-900 font-mono">
                      {formatCurrency(totalPrazo)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 mt-1">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  currentMethod === 'cartao' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                }`}>
                  {currentMethod === 'cartao' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>

            {/* Seletor de Parcelas no Cartão */}
            <div className="mt-3 pt-3 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Selecione o número de parcelas no Cartão de Crédito (1x a 10x):
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {cartaoInstallments.map((inst) => {
                  const isSelected = currentMethod === 'cartao' && currentParcelas === inst.n;
                  return (
                    <button
                      key={inst.n}
                      type="button"
                      onClick={() => {
                        setCurrentMethod('cartao');
                        setCurrentParcelas(inst.n);
                        handleApply('cartao', inst.n);
                      }}
                      className={`p-1.5 rounded-md border text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400/30 shadow-xs font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{inst.n}x</div>
                      <div className="text-[9px] font-mono leading-tight">{formatCurrency(inst.parcela)}</div>
                      <div className={`text-[7.5px] mt-0.5 ${isSelected ? 'text-blue-100' : inst.isSemJuros ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                        {inst.isSemJuros ? 's/ juros' : 'c/ juros'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Opção 3: Boleto ou PIX Parcelado - SOMENTE PARA FATURAMENTO DIRETO (Na Revenda não terá boleto ou pix parcelado) */}
          {!isRevenda && (
            <div
              className={`rounded-xl p-4 border-2 transition-all relative ${
                currentMethod === 'boleto_pix_parcelado'
                  ? 'border-purple-600 bg-purple-50/40 shadow-sm ring-2 ring-purple-400/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div 
                className="flex items-start justify-between gap-3 cursor-pointer"
                onClick={() => {
                  setCurrentMethod('boleto_pix_parcelado');
                  const p = currentParcelas > 10 ? 10 : (currentParcelas || 3);
                  handleApply('boleto_pix_parcelado', p);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                    currentMethod === 'boleto_pix_parcelado' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
                  }`}>
                    <CalendarRange className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        3) Pagamento no Boleto ou PIX Parcelado
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-bold">
                        Sem desconto à vista de 5%
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      Permite parcelamento em até <strong>3 vezes SEM JUROS</strong>. Acima deste número (de 4x até 10 vezes), com <strong>juros de 2% ao mês</strong> (tabela Price).
                    </p>

                    <div className="mt-2.5 flex items-baseline gap-2">
                      <span className="text-xs text-slate-500">Valor base:</span>
                      <span className="text-base font-extrabold text-purple-900 font-mono">
                        {formatCurrency(totalPrazo)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    currentMethod === 'boleto_pix_parcelado' ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                  }`}>
                    {currentMethod === 'boleto_pix_parcelado' && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>

              {/* Seletor de Parcelas no Boleto / PIX */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Selecione o número de parcelas no Boleto / PIX (1x a 3x sem juros | 4x a 10x com juros):
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {boletoInstallments.map((inst) => {
                    const isSelected = currentMethod === 'boleto_pix_parcelado' && currentParcelas === inst.n;
                    return (
                      <button
                        key={inst.n}
                        type="button"
                        onClick={() => {
                          setCurrentMethod('boleto_pix_parcelado');
                          setCurrentParcelas(inst.n);
                          handleApply('boleto_pix_parcelado', inst.n);
                        }}
                        className={`p-1.5 rounded-md border text-center transition-all ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-400/30 shadow-xs font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{inst.n}x</div>
                        <div className="text-[9px] font-mono leading-tight">{formatCurrency(inst.parcela)}</div>
                        <div className={`text-[7.5px] mt-0.5 ${isSelected ? 'text-purple-100' : inst.isSemJuros ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                          {inst.isSemJuros ? 's/ juros' : 'c/ juros'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <div className="text-right">
            <span className="text-[11px] text-slate-500">
              Clique em qualquer opção ou parcela para aplicar diretamente na proposta.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
