import React, { useState } from 'react';
import { X, ClipboardList, Printer, Check, Tags } from 'lucide-react';
import { CartItem, ProposalData } from '../types';
import { formatCurrency } from '../utils/calculations';

interface BrandOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  proposal: ProposalData;
}

export const BrandOrdersModal: React.FC<BrandOrdersModalProps> = ({
  isOpen,
  onClose,
  cart,
  proposal,
}) => {
  if (!isOpen) return null;

  const isRevenda = proposal.faturamento_tipo === 'revenda';
  const brands = Array.from(new Set(cart.map(item => item.brand || 'Sem Marca')));

  // State for factory negotiated discounts per brand
  const [discounts, setDiscounts] = useState<{ [brand: string]: number }>({});
  const [selectedBrandView, setSelectedBrandView] = useState<string>(brands[0] || '');

  const handleDiscountChange = (brand: string, val: number) => {
    setDiscounts(prev => ({ ...prev, [brand]: val }));
  };

  const currentItems = cart.filter(item => (item.brand || 'Sem Marca') === selectedBrandView);
  const currentDiscount = discounts[selectedBrandView] || 0;

  const computeUnit = (item: CartItem) => {
    if (isRevenda) {
      return item.price_vista || item.price_revenda || 0;
    }
    return item.price_direto || item.price || 0;
  };

  const orderTotal = currentItems.reduce((acc, item) => {
    const base = computeUnit(item);
    const finalUnit = base * (1 - currentDiscount / 100);
    return acc + finalUnit * item.qtd;
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Pedidos de Compra por Marca</h2>
              <p className="text-xs text-slate-500">
                Geração de pedidos específicos para envio à fábrica
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Pedido</span>
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

        {/* Brand Tabs */}
        <div className="flex items-center gap-2 py-3 border-b border-slate-100 overflow-x-auto print:hidden">
          {brands.map(brand => (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrandView(brand)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedBrandView === brand
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {brand} ({cart.filter(i => (i.brand || 'Sem Marca') === brand).length})
            </button>
          ))}
        </div>

        {/* Brand Discount Settings */}
        <div className="py-3 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Tags className="w-4 h-4 text-teal-700" />
              <span>Desconto Negociado com a Fábrica ({selectedBrandView}):</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                step="0.5"
                value={currentDiscount}
                onChange={(e) => handleDiscountChange(selectedBrandView, parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold text-xs"
              />
              <span className="font-bold text-slate-600">%</span>
            </div>
          </div>
        </div>

        {/* Printable Order Document */}
        <div className="flex-1 overflow-y-auto py-4 text-xs">
          <div className="p-6 border border-slate-300 rounded-lg bg-white space-y-4">
            {/* Header */}
            <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-base font-bold text-blue-950">
                  PEDIDO DE COMPRA — {selectedBrandView.toUpperCase()}
                </h1>
                <p className="text-[11px] text-slate-600">CVA COMÉRCIO E SERVIÇOS LTDA</p>
              </div>
              <div className="text-right text-[11px] text-slate-600">
                <div><strong>Nº Orçamento:</strong> {proposal.num_orc}</div>
                <div><strong>Data:</strong> {proposal.data_orc || new Date().toLocaleDateString('pt-BR')}</div>
                <div><strong>Modalidade:</strong> {isRevenda ? 'Revenda' : 'Faturamento Direto'}</div>
              </div>
            </div>

            {/* Customer Details if Direct Billing */}
            {!isRevenda && (
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px] space-y-1">
                <strong className="text-blue-900 block mb-1">Dados para Faturamento Direto ao Cliente:</strong>
                <div><strong>Cliente:</strong> {proposal.cliente.nome}</div>
                <div><strong>CPF/CNPJ:</strong> {proposal.cliente.doc || 'Não informado'} | <strong>Tel:</strong> {proposal.cliente.tel || 'Não informado'}</div>
                <div><strong>E-mail:</strong> {proposal.cliente.email || 'Não informado'}</div>
                <div><strong>Endereço:</strong> {proposal.cliente.endereco || 'Não informado'}, {proposal.cliente.cidade_uf}</div>
              </div>
            )}

            {/* Products Table */}
            <table className="w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-2 border border-blue-900 w-16">Código</th>
                  <th className="p-2 border border-blue-900">Descrição do Produto</th>
                  <th className="p-2 border border-blue-900 text-center w-12">Qtd</th>
                  <th className="p-2 border border-blue-900 text-right w-24">
                    {isRevenda ? 'Custo Base' : 'Preço Fábrica'}
                  </th>
                  <th className="p-2 border border-blue-900 text-right w-20">Desc. (%)</th>
                  <th className="p-2 border border-blue-900 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentItems.map((item, idx) => {
                  const base = computeUnit(item);
                  const finalUnit = base * (1 - currentDiscount / 100);
                  const total = finalUnit * item.qtd;
                  return (
                    <tr key={item.code + idx}>
                      <td className="p-2 border border-slate-200 font-mono font-bold">{item.code}</td>
                      <td className="p-2 border border-slate-200">{item.name}</td>
                      <td className="p-2 border border-slate-200 text-center font-bold">{item.qtd}</td>
                      <td className="p-2 border border-slate-200 text-right font-mono">{formatCurrency(base)}</td>
                      <td className="p-2 border border-slate-200 text-right">{currentDiscount.toFixed(1)}%</td>
                      <td className="p-2 border border-slate-200 text-right font-mono font-bold">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Order Total */}
            <div className="flex justify-end pt-2">
              <div className="text-right space-y-1">
                <div className="text-xs text-slate-500">
                  Desconto aplicado: <strong>{currentDiscount}%</strong>
                </div>
                <div className="text-sm font-bold text-blue-950">
                  Total do Pedido: <span className="text-base font-mono">{formatCurrency(orderTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 print:hidden">
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
