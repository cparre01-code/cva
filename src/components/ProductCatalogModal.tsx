import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Check, 
  ExternalLink, 
  Filter, 
  Package, 
  RefreshCw,
  Sparkles,
  Edit3
} from 'lucide-react';
import { Product, CartItem, FaturamentoTipo } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  faturamentoTipo: FaturamentoTipo;
  onAddToCart: (item: CartItem) => void;
  onRefreshProducts?: () => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  faturamentoTipo,
  onAddToCart,
  onRefreshProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('TODAS');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [addedItemCode, setAddedItemCode] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  // Manual custom item mode
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('CVA');
  const [manualPrice, setManualPrice] = useState<number>(0);
  const [manualQtd, setManualQtd] = useState<number>(1);
  const [manualVoltagem, setManualVoltagem] = useState('-');

  // Extract unique brands
  const brands = useMemo(() => {
    const unique = Array.from(
      new Set(products.map(p => (p.brand ? p.brand.trim() : '')).filter(Boolean))
    ).sort();
    return ['TODAS', ...unique];
  }, [products]);

  // Extract unique categories
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.map(p => (p.category ? p.category.trim() : '')).filter(Boolean))
    ).sort();
    return ['TODAS', ...unique];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const pBrand = (p.brand || '').trim().toLowerCase();
      const pCat = (p.category || '').trim().toLowerCase();

      const matchBrand = selectedBrand === 'TODAS' || pBrand === selectedBrand.toLowerCase();
      const matchCat = selectedCategory === 'TODAS' || pCat === selectedCategory.toLowerCase();

      if (!matchBrand || !matchCat) return false;

      if (!searchTerm.trim()) return true;

      const term = searchTerm.trim().toLowerCase();
      const codeStr = String(p.code || '').toLowerCase();
      const nameStr = String(p.name || '').toLowerCase();
      const brandStr = pBrand;
      const lineStr = String(p.line || '').toLowerCase();
      const catStr = pCat;

      return (
        codeStr.includes(term) ||
        nameStr.includes(term) ||
        brandStr.includes(term) ||
        lineStr.includes(term) ||
        catStr.includes(term)
      );
    });
  }, [products, selectedBrand, selectedCategory, searchTerm]);

  if (!isOpen) return null;

  const handleAddProduct = (prod: Product) => {
    const qty = quantities[String(prod.code)] || 1;
    const basePrice = faturamentoTipo === 'direto'
      ? (prod.price_direto && prod.price_direto > 0 ? prod.price_direto : prod.price_revenda)
      : (prod.price_revenda && prod.price_revenda > 0 ? prod.price_revenda : prod.price_direto);

    const newItem: CartItem = {
      code: String(prod.code).trim(),
      name: prod.name,
      brand: prod.brand || '',
      category: prod.category || '',
      line: prod.line || '',
      status: prod.status || 'DISPONÍVEL',
      qtd: qty > 0 ? qty : 1,
      price: basePrice || 0,
      price_direto: prod.price_direto || 0,
      price_revenda: prod.price_revenda || 0,
      price_vista: prod.price_vista ?? prod.price_revenda ?? 0,
      price_28: prod.price_28 ?? prod.price_vista ?? prod.price_revenda ?? 0,
      price_56: prod.price_56 ?? prod.price_28 ?? prod.price_vista ?? prod.price_revenda ?? 0,
      price_84: prod.price_84 ?? prod.price_56 ?? prod.price_28 ?? prod.price_vista ?? prod.price_revenda ?? 0,
      voltagem: prod.tensao || '-',
      medidas: prod.medidas || '-',
      link: prod.link || '',
    };

    onAddToCart(newItem);
    setAddedItemCode(String(prod.code));
    setTimeout(() => {
      setAddedItemCode(null);
    }, 1500);
  };

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || manualPrice <= 0) return;

    const newItem: CartItem = {
      code: manualCode.trim() || 'AVULSO',
      name: manualName.trim(),
      brand: manualBrand.trim() || 'CVA',
      category: 'Diversos',
      line: 'Personalizado',
      status: 'DISPONÍVEL',
      qtd: manualQtd > 0 ? manualQtd : 1,
      price: manualPrice,
      price_direto: manualPrice,
      price_revenda: manualPrice,
      price_vista: manualPrice,
      price_28: manualPrice,
      price_56: manualPrice,
      price_84: manualPrice,
      voltagem: manualVoltagem || '-',
      medidas: '-',
      link: '',
    };

    onAddToCart(newItem);
    setManualName('');
    setManualCode('');
    setManualPrice(0);
    setManualQtd(1);
    setShowManualForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1a365d] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-cyan-300">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  Catálogo de Produtos
                </h3>
                <span className="text-[11px] bg-white/20 text-cyan-100 font-semibold px-2 py-0.5 rounded-full">
                  {products.length} itens cadastrados
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Selecione os produtos para inserir diretamente na proposta ({faturamentoTipo === 'direto' ? 'Faturamento Direto' : 'Revenda CVA'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
              title="Inserir produto avulso ou não cadastrado"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Item Personalizado</span>
            </button>

            {onRefreshProducts && (
              <button
                type="button"
                onClick={onRefreshProducts}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Sincronizar produtos"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Manual item form if opened */}
        {showManualForm && (
          <form onSubmit={handleAddManualItem} className="bg-blue-50/80 border-b border-blue-200 p-4 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                Cadastrar Item Avulso / Não Catalogado
              </span>
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Fechar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Código</label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: CVA-01"
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Descrição *</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Ex: Coifa Ilha Especial 90cm"
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Marca</label>
                <input
                  type="text"
                  value={manualBrand}
                  onChange={(e) => setManualBrand(e.target.value)}
                  placeholder="Marca"
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">Valor Unit. (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={manualPrice || ''}
                  onChange={(e) => setManualPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-semibold"
                />
              </div>
              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded flex items-center justify-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Inserir
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, nome, marca, categoria..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Brand Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-slate-600 hidden sm:inline">Marca:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
              >
                {brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-slate-600 hidden sm:inline">Categoria:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(selectedBrand !== 'TODAS' || selectedCategory !== 'TODAS' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand('TODAS');
                  setSelectedCategory('TODAS');
                  setSearchTerm('');
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold px-2 py-1"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-2 text-xs text-slate-500 font-medium">
            Exibindo <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> produtos
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-slate-600">Nenhum produto encontrado com os filtros selecionados.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand('TODAS');
                  setSelectedCategory('TODAS');
                  setSearchTerm('');
                }}
                className="mt-2 text-xs text-blue-700 font-bold hover:underline"
              >
                Limpar busca e filtros
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
              {filteredProducts.map((p) => {
                const isAdded = addedItemCode === String(p.code);
                const currentQty = quantities[String(p.code)] || 1;
                const unitPrice = faturamentoTipo === 'direto'
                  ? (p.price_direto && p.price_direto > 0 ? p.price_direto : p.price_revenda)
                  : (p.price_revenda && p.price_revenda > 0 ? p.price_revenda : p.price_direto);

                return (
                  <div
                    key={String(p.id ?? '') + '-' + p.code}
                    className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Left: Code, Name, Brand, Line, Voltage */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-blue-950 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {p.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.brand}
                        </span>
                        {p.category && (
                          <span className="text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            {p.category}
                          </span>
                        )}
                        {p.tensao && p.tensao !== '-' && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {p.tensao}
                          </span>
                        )}
                        {p.status && (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            • {p.status}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                        {p.name}
                      </h4>

                      {p.line && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Linha: {p.line} {p.medidas && p.medidas !== '-' ? `• Medidas: ${p.medidas}` : ''}
                        </p>
                      )}

                      {p.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-semibold mt-1"
                        >
                          <span>Ver especificações completas</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Right: Price, Qty, Add button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-bold text-slate-950 font-mono">
                          {formatCurrency(unitPrice || 0)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {faturamentoTipo === 'direto' ? 'Tabela Fábrica' : 'Preço Revenda'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = quantities[String(p.code)] || 1;
                              if (curr > 1) {
                                setQuantities(prev => ({ ...prev, [String(p.code)]: curr - 1 }));
                              }
                            }}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold font-mono">
                            {currentQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const curr = quantities[String(p.code)] || 1;
                              setQuantities(prev => ({ ...prev, [String(p.code)]: curr + 1 }));
                            }}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddProduct(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                            isAdded
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-blue-900 hover:bg-blue-800 text-white shadow-xs'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Adicionado!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Dica: você pode adicionar múltiplos produtos sucessivamente sem fechar esta janela.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Fechar Catálogo
          </button>
        </div>
      </div>
    </div>
  );
};
