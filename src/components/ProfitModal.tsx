import React from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { ProfitParams, ProfitResult, PagamentoCliente, PrazoFabrica } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ProfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: ProfitParams;
  onUpdateParams: (updates: Partial<ProfitParams>) => void;
  result: ProfitResult;
}

export const ProfitModal: React.FC<ProfitModalProps> = ({
  isOpen,
  onClose,
  params,
  onUpdateParams,
  result,
}) => {
  if (!isOpen) return null;

  const isProfit = result.profit >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-900">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Análise de Lucratividade</h2>
              <p className="text-xs text-slate-500">
                Modalidade atual: <strong className="uppercase">{result.mode}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 py-3 text-xs pr-1">
          {/* Result Card */}
          <div className={`p-4 rounded-xl text-white ${
            isProfit ? 'bg-gradient-to-r from-emerald-700 to-green-600' : 'bg-gradient-to-r from-red-700 to-rose-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs opacity-90 font-medium uppercase tracking-wider block">
                  {isProfit ? 'Operação com Lucro Líquido' : 'Operação com Prejuízo'}
                </span>
                <span className="text-2xl font-black">{formatCurrency(result.profit)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs opacity-90 font-medium block">Margem Líquida</span>
                <span className="text-xl font-bold">{result.marginPercent.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Interactive Parameters Grid */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-3">
            <h3 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
              <span>Parâmetros Comerciais & Fiscais</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Comissão Vendedor (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={params.comissao_vendedor}
                  onChange={(e) => onUpdateParams({ comissao_vendedor: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Comissão Arquiteto/Prof. (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={params.comissao_profissional}
                  onChange={(e) => onUpdateParams({ comissao_profissional: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Custo Operacional (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={params.custo_operacional}
                  onChange={(e) => onUpdateParams({ custo_operacional: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Faturamento 12 Meses (R$)
                </label>
                <input
                  type="number"
                  step="10000"
                  value={params.faturamento_12m}
                  onChange={(e) => onUpdateParams({ faturamento_12m: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Pagamento do Cliente
                </label>
                <select
                  value={params.pagamento_cliente}
                  onChange={(e) => onUpdateParams({ pagamento_cliente: e.target.value as PagamentoCliente })}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="avista">À vista (Aplica desc. à vista)</option>
                  <option value="prazo">A prazo / Cartão</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Prazo Fábrica (Revenda)
                </label>
                <select
                  value={params.prazo_fabrica}
                  onChange={(e) => onUpdateParams({ prazo_fabrica: e.target.value as PrazoFabrica })}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="avista">À vista</option>
                  <option value="28">28 dias</option>
                  <option value="56">56 dias</option>
                  <option value="84">84 dias</option>
                </select>
              </div>
            </div>

            <div className="text-[10px] text-amber-900 leading-tight">
              * Alíquota efetiva do Simples calculada automaticamente: <strong>{(result.simplesRate * 100).toFixed(2)}%</strong>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50">
                  <td className="p-2.5 font-semibold text-slate-700">Valor Bruto Sugerido</td>
                  <td className="p-2.5 text-right font-mono font-semibold">{formatCurrency(result.grossSuggested)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-600">Descontos Concedidos</td>
                  <td className="p-2.5 text-right font-mono text-red-600">− {formatCurrency(result.discount)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="p-2.5 text-blue-900">Valor Final de Venda</td>
                  <td className="p-2.5 text-right font-mono text-blue-900">{formatCurrency(result.saleTotal)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-600">
                    {result.mode === 'direto'
                      ? 'Receita CVA (Comissão 25% da fábrica)'
                      : 'Receita Bruta CVA (Valor total faturado)'}
                  </td>
                  <td className="p-2.5 text-right font-mono font-semibold">{formatCurrency(result.revenue)}</td>
                </tr>
                {result.mode === 'revenda' && (
                  <tr>
                    <td className="p-2.5 text-slate-600">
                      Custo Mercadoria Fábrica ({result.prazo === 'avista' ? 'À vista' : `${result.prazo} dias`})
                    </td>
                    <td className="p-2.5 text-right font-mono text-red-600">− {formatCurrency(result.cost)}</td>
                  </tr>
                )}
                <tr>
                  <td className="p-2.5 text-slate-600">
                    Simples Nacional ({(result.simplesRate * 100).toFixed(2)}%)
                  </td>
                  <td className="p-2.5 text-right font-mono text-red-600">− {formatCurrency(result.simples)}</td>
                </tr>
                {result.mode === 'revenda' && (
                  <tr>
                    <td className="p-2.5 text-slate-600">ICMS Substituto (13,00%)</td>
                    <td className="p-2.5 text-right font-mono text-red-600">− {formatCurrency(result.icms)}</td>
                  </tr>
                )}
                <tr>
                  <td className="p-2.5 text-slate-600">
                    Comissão Vendedor ({result.commissionSeller}%)
                  </td>
                  <td className="p-2.5 text-right font-mono text-red-600">− {formatCurrency(result.sellerCommission)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-600">
                    Comissão Profissional ({result.commissionProfessional}%)
                  </td>
                  <td className="p-2.5 text-right font-mono text-red-600">− {formatCurrency(result.professionalCommission)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-600">
                    Custo Operacional ({result.operatingCostPercent}%)
                  </td>
                  <td className="p-2.5 text-right font-mono text-red-600">− {formatCurrency(result.operatingCost)}</td>
                </tr>
                <tr className={`font-bold text-sm ${isProfit ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                  <td className="p-3">Resultado Líquido Estimado</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(result.profit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
