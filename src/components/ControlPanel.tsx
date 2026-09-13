import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  UserCheck, 
  FileText, 
  PackagePlus, 
  Tags, 
  Truck, 
  Trash2, 
  Plus, 
  ExternalLink,
  ChevronDown,
  UserPlus,
  RefreshCw,
  Edit3,
  Search,
  X,
  ShieldAlert,
  Award,
  Filter,
  Compass,
  Lock
} from 'lucide-react';
import { 
  Product, 
  Client, 
  CartItem, 
  ProposalData, 
  FaturamentoTipo,
  Consultant 
} from '../types';
import { ClientModal } from './ClientModal';
import { ConsultantModal } from './ConsultantModal';

interface ControlPanelProps {
  proposal: ProposalData;
  onUpdateProposal: (updates: Partial<ProposalData>) => void;
  products: Product[];
  clients: Client[];
  consultores: string[];
  consultoresDetalhes?: Consultant[];
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onRemoveFromCart: (index: number) => void;
  onUpdateCartItemQty: (index: number, newQty: number) => void;
  onSaveClient: (client: Client) => Promise<void> | void;
  onSaveConsultant?: (consultant: Consultant) => Promise<void> | void;
  onRefreshProducts?: () => Promise<void> | void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  proposal,
  onUpdateProposal,
  products,
  clients,
  consultores,
  consultoresDetalhes = [],
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateCartItemQty,
  onSaveClient,
  onSaveConsultant,
  onRefreshProducts,
}) => {
  // Product filtering & searching state
  const [productSearchTerm, setProductSearchTerm] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('TODAS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedProductIndex, setSelectedProductIndex] = useState<string>('');
  const [isRefreshingProds, setIsRefreshingProds] = useState<boolean>(false);
  
  const [itemPreco, setItemPreco] = useState<number>(0);
  const [itemQtd, setItemQtd] = useState<number>(1);
  const [itemVoltagem, setItemVoltagem] = useState<string>('-');
  const [itemMedidas, setItemMedidas] = useState<string>('-');
  const [itemLink, setItemLink] = useState<string>('');

  // Modals state for Client and Consultant CRUD
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [clientModalMode, setClientModalMode] = useState<'new' | 'edit'>('new');
  const [clientToEdit, setClientToEdit] = useState<Partial<Client>>({});

  const [isConsultantModalOpen, setIsConsultantModalOpen] = useState<boolean>(false);
  const [consultantModalMode, setConsultantModalMode] = useState<'new' | 'edit'>('new');
  const [consultantToEdit, setConsultantToEdit] = useState<Partial<Consultant>>({});

  // Client accordion/toggle for detailed view
  const [showClientDetails, setShowClientDetails] = useState<boolean>(false);

  // Extract unique brands and categories with accurate item counts
  const brands = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => (p.brand ? p.brand.trim() : '')).filter(Boolean))).sort();
    return ['TODAS', ...unique];
  }, [products]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => (p.category ? p.category.trim() : '')).filter(Boolean))).sort();
    return ['TODAS', ...unique];
  }, [products]);

  // Smart comprehensive product filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const pBrand = (p.brand || '').trim().toLowerCase();
      const pCat = (p.category || '').trim().toLowerCase();

      const matchBrand = selectedBrand === 'TODAS' || pBrand === selectedBrand.toLowerCase();
      const matchCat = selectedCategory === 'TODAS' || pCat === selectedCategory.toLowerCase();

      if (!matchBrand || !matchCat) return false;

      if (!productSearchTerm.trim()) return true;

      const term = productSearchTerm.trim().toLowerCase();
      const codeStr = String(p.code || '').toLowerCase();
      const nameStr = String(p.name || '').toLowerCase();
      const brandStr = pBrand;
      const lineStr = String(p.line || '').toLowerCase();
      const catStr = pCat;

      return codeStr.includes(term) || nameStr.includes(term) || brandStr.includes(term) || lineStr.includes(term) || catStr.includes(term);
    });
  }, [products, selectedBrand, selectedCategory, productSearchTerm]);

  // Current active consultant details (if mapped)
  const activeConsultantDetails = useMemo(() => {
    return consultoresDetalhes.find(c => c.nome.trim().toLowerCase() === (proposal.consultor || '').trim().toLowerCase());
  }, [consultoresDetalhes, proposal.consultor]);

  // Handle product selection
  const handleProductSelect = (indexStr: string) => {
    setSelectedProductIndex(indexStr);
    if (!indexStr) {
      setItemPreco(0);
      setItemVoltagem('-');
      setItemMedidas('-');
      setItemLink('');
      return;
    }

    const prod = products[parseInt(indexStr, 10)];
    if (prod) {
      const basePrice = (prod.price_direto && prod.price_direto > 0) ? prod.price_direto : prod.price_revenda;
      setItemPreco(basePrice || 0);
      setItemVoltagem(prod.tensao || '-');
      setItemMedidas(prod.medidas || '-');
      setItemLink(prod.link || '');
    }
  };

  const handleAddItem = () => {
    if (!selectedProductIndex) return;
    const prod = products[parseInt(selectedProductIndex, 10)];
    if (!prod) return;

    const newItem: CartItem = {
      code: String(prod.code).trim(),
      name: prod.name,
      brand: prod.brand || '',
      category: prod.category || '',
      line: prod.line || '',
      status: prod.status || '',
      qtd: itemQtd > 0 ? itemQtd : 1,
      price: itemPreco > 0 ? itemPreco : ((prod.price_direto || prod.price_revenda) || 0),
      price_direto: prod.price_direto || 0,
      price_revenda: prod.price_revenda || 0,
      price_vista: prod.price_vista ?? prod.price_revenda ?? 0,
      price_28: prod.price_28 ?? prod.price_vista ?? prod.price_revenda ?? 0,
      price_56: prod.price_56 ?? prod.price_28 ?? prod.price_vista ?? prod.price_revenda ?? 0,
      price_84: prod.price_84 ?? prod.price_56 ?? prod.price_28 ?? prod.price_vista ?? prod.price_revenda ?? 0,
      voltagem: itemVoltagem || '-',
      medidas: itemMedidas || '-',
      link: itemLink || '',
    };

    onAddToCart(newItem);
    // Reset product selection
    setSelectedProductIndex('');
    setItemQtd(1);
    setItemPreco(0);
  };

  const handleSelectClient = (clientName: string) => {
    const found = clients.find(c => c.nome.toLowerCase() === clientName.toLowerCase());
    if (found) {
      onUpdateProposal({
        cliente: {
          nome: found.nome,
          doc: found.doc || found.cnpj || found.cpf || '',
          rg: found.ie || '',
          tel: found.tel || '',
          email: found.email || '',
          endereco: found.endereco || '',
          cidade_uf: found.cidade_uf || 'Campo Grande / MS',
          cep: found.cep || '',
        },
        // Se o orçamento ainda não tiver arquiteto definido e o cliente tiver histórico, preenche como sugestão inicial
        ...(proposal.arquiteto_parceiro ? {} : (found.profissional ? { arquiteto_parceiro: found.profissional } : {}))
      });
    }
  };

  const handleSaveCurrentClientDirect = () => {
    if (!proposal.cliente.nome.trim()) {
      alert('Preencha o nome do cliente antes de salvar.');
      return;
    }
    const cliToSave: Client = {
      nome: proposal.cliente.nome.trim(),
      razao: proposal.cliente.nome.trim(),
      doc: proposal.cliente.doc.trim(),
      tel: proposal.cliente.tel.trim(),
      email: proposal.cliente.email.trim(),
      endereco: proposal.cliente.endereco.trim(),
      cidade_uf: proposal.cliente.cidade_uf.trim() || 'Campo Grande / MS',
      cep: proposal.cliente.cep.trim(),
      status: 'ativado',
    };
    onSaveClient(cliToSave);
  };

  // Trigger modal for New Client
  const handleOpenNewClientModal = () => {
    setClientModalMode('new');
    setClientToEdit({
      nome: proposal.cliente.nome !== 'Cliente não identificado' ? proposal.cliente.nome : '',
      doc: proposal.cliente.doc,
      tel: proposal.cliente.tel,
      email: proposal.cliente.email,
      endereco: proposal.cliente.endereco,
      cidade_uf: proposal.cliente.cidade_uf,
      cep: proposal.cliente.cep,
    });
    setIsClientModalOpen(true);
  };

  // Trigger modal for Edit Client
  const handleOpenEditClientModal = () => {
    const found = clients.find(c => c.nome.toLowerCase() === proposal.cliente.nome.toLowerCase());
    setClientModalMode('edit');
    setClientToEdit(found || proposal.cliente);
    setIsClientModalOpen(true);
  };

  // Trigger modal for New Consultant
  const handleOpenNewConsultantModal = () => {
    setConsultantModalMode('new');
    setConsultantToEdit({
      nome: '',
      cargo: 'vendedor',
      desconto_maximo: 5.0,
      desconto_max_vista: 5.0,
      margem_minima: 15.0,
      comissao_padrao: 2.0,
      pode_alterar_comissao: false,
      pode_aprovar_excecao: false,
      ativo: true,
    });
    setIsConsultantModalOpen(true);
  };

  // Trigger modal for Edit Consultant
  const handleOpenEditConsultantModal = () => {
    const currentName = proposal.consultor || '';
    const found = consultoresDetalhes.find(c => c.nome.toLowerCase() === currentName.toLowerCase());
    setConsultantModalMode('edit');
    setConsultantToEdit(found || {
      nome: currentName,
      cargo: 'vendedor',
    });
    setIsConsultantModalOpen(true);
  };

  const handleRefreshCatalog = async () => {
    if (!onRefreshProducts) return;
    setIsRefreshingProds(true);
    try {
      await onRefreshProducts();
    } finally {
      setIsRefreshingProds(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedBrand('TODAS');
    setSelectedCategory('TODAS');
    setProductSearchTerm('');
    setSelectedProductIndex('');
  };

  return (
    <aside className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-6 text-sm">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-base">
          <Calculator className="w-5 h-5 text-blue-800" />
          <span>Configuração do Orçamento</span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 uppercase">
          {proposal.faturamento_tipo === 'direto' ? 'Venda Direta' : 'Revenda'}
        </span>
      </div>

      {/* Tipo de Faturamento */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-purple-50/70 border border-purple-200">
        <label className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Tags className="w-3.5 h-3.5 text-purple-700" />
          Tipo de Faturamento
        </label>
        <div className="flex items-center gap-2">
          <button
            id="btn-venda-direta"
            type="button"
            onClick={() => onUpdateProposal({ faturamento_tipo: 'direto', desc_aplicado_percent: 0 })}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              proposal.faturamento_tipo === 'direto'
                ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-300'
                : 'bg-purple-100/90 text-purple-900 hover:bg-purple-200 border border-purple-200'
            }`}
            title="Venda Direta"
          >
            Venda Direta
          </button>

          <button
            id="btn-revenda"
            type="button"
            onClick={() => onUpdateProposal({ faturamento_tipo: 'revenda' })}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              proposal.faturamento_tipo === 'revenda'
                ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-300'
                : 'bg-purple-100/90 text-purple-900 hover:bg-purple-200 border border-purple-200'
            }`}
            title="Revenda"
          >
            Revenda
          </button>
        </div>
      </div>

      {/* Dados da Proposta (Meta) */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-800" />
          Dados da Proposta
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nº Orç.</label>
            <input
              type="text"
              value={proposal.num_orc}
              onChange={(e) => onUpdateProposal({ num_orc: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data</label>
            <input
              type="date"
              value={proposal.data_orc}
              onChange={(e) => onUpdateProposal({ data_orc: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-600">Consultor(a)</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="btn-novo-consultor"
                  onClick={handleOpenNewConsultantModal}
                  className="px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                  title="Cadastrar Novo Consultor de Vendas"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Novo</span>
                </button>
                <button
                  type="button"
                  id="btn-editar-consultor"
                  onClick={handleOpenEditConsultantModal}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                  title="Editar Consultor Selecionado"
                >
                  <Edit3 className="w-2.5 h-2.5 text-slate-600" />
                  <span>Editar</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <select
                id="select-consultor"
                value={proposal.consultor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__novo__') {
                    handleOpenNewConsultantModal();
                  } else {
                    onUpdateProposal({ consultor: val });
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-purple-600 focus:outline-none bg-white font-semibold text-slate-800 cursor-pointer truncate shadow-2xs"
              >
                <option value="">-- Selecione o Consultor ({consultores.length} disponíveis) --</option>
                {consultores.map(c => {
                  const details = consultoresDetalhes.find(d => d.nome.trim().toLowerCase() === c.trim().toLowerCase());
                  const cargoTag = details?.cargo ? ` [${details.cargo.toUpperCase()}]` : '';
                  return (
                    <option key={c} value={c}>
                      {c}{cargoTag}
                    </option>
                  );
                })}
                {proposal.consultor && !consultores.some(c => c.trim().toLowerCase() === proposal.consultor.trim().toLowerCase()) && (
                  <option value={proposal.consultor}>
                    {proposal.consultor} (Atual)
                  </option>
                )}
                <option value="__novo__" className="font-bold text-purple-700 bg-purple-50">
                  + Cadastrar Novo Consultor...
                </option>
              </select>
            </div>

            {/* Cargo badge if details are available */}
            {activeConsultantDetails && (
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  activeConsultantDetails.cargo === 'diretor'
                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                    : activeConsultantDetails.cargo === 'gerente'
                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}>
                  {activeConsultantDetails.cargo}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  Alçada: {activeConsultantDetails.desconto_maximo}% desc.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Arquiteto / Designer Parceiro atrelado a este orçamento */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-700" />
              <span>Arquiteto(a) / Profissional Parceiro</span>
              <span className="text-[10px] font-normal text-slate-500">(específico deste orçamento)</span>
            </label>
            {proposal.arquiteto_parceiro && (
              <button
                type="button"
                onClick={() => onUpdateProposal({ arquiteto_parceiro: '' })}
                className="text-[10px] text-slate-400 hover:text-red-500 font-medium transition-colors"
                title="Limpar arquiteto deste orçamento"
              >
                Limpar
              </button>
            )}
          </div>
          <input
            type="text"
            id="orcamento-arquiteto-parceiro"
            value={proposal.arquiteto_parceiro || ''}
            onChange={(e) => onUpdateProposal({ arquiteto_parceiro: e.target.value })}
            placeholder="Nome do Arquiteto(a) ou Designer parceiro deste orçamento..."
            className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-800 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white placeholder:text-slate-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Dados do Cliente */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-800" />
            Dados do Cliente
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-novo-cliente"
              onClick={handleOpenNewClientModal}
              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
              title="Cadastrar Novo Cliente no Supabase"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
              <span>+ Novo</span>
            </button>
            <button
              type="button"
              id="btn-editar-cliente"
              onClick={handleOpenEditClientModal}
              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
              title="Editar Cadastro do Cliente"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-700" />
              <span>Editar</span>
            </button>
          </div>
        </div>

        {/* Input principal para digitar ou selecionar cliente */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Nome do Cliente / Razão Social:
          </label>
          <div className="relative">
            <input
              type="text"
              list="clients-options-datalist"
              value={proposal.cliente.nome}
              onChange={(e) => {
                const val = e.target.value;
                const match = clients.find(c => c.nome.toLowerCase() === val.toLowerCase());
                if (match) {
                  handleSelectClient(match.nome);
                } else {
                  onUpdateProposal({
                    cliente: {
                      ...proposal.cliente,
                      nome: val
                    }
                  });
                }
              }}
              placeholder="Digite o nome do cliente ou selecione..."
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
            />
            <datalist id="clients-options-datalist">
              {clients.map(c => (
                <option key={c.nome} value={c.nome}>
                  {c.doc ? `(${c.doc})` : ''} {c.cidade_uf || ''}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        {/* Resumo visual do cliente e botão para expandir detalhes */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-600">
            <span><strong>Doc:</strong> {proposal.cliente.doc || '--'}</span>
            <span><strong>Tel:</strong> {proposal.cliente.tel || '--'}</span>
            <span><strong>Cidade:</strong> {proposal.cliente.cidade_uf || 'Campo Grande / MS'}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-[11px]">
            <span className="text-slate-500 truncate max-w-[200px]">
              {proposal.cliente.endereco || 'Endereço não informado'}
            </span>
            <button
              type="button"
              onClick={() => setShowClientDetails(!showClientDetails)}
              className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-0.5 shrink-0"
            >
              <span>{showClientDetails ? 'Ocultar campos' : 'Ver campos completos'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showClientDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Detailed Form */}
        {showClientDetails && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">CPF / CNPJ</label>
                <input
                  type="text"
                  value={proposal.cliente.doc}
                  onChange={(e) => onUpdateProposal({ cliente: { ...proposal.cliente, doc: e.target.value } })}
                  placeholder="000.000.000-00"
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">Contato / Tel</label>
                <input
                  type="text"
                  value={proposal.cliente.tel}
                  onChange={(e) => onUpdateProposal({ cliente: { ...proposal.cliente, tel: e.target.value } })}
                  placeholder="(67) 99999-9999"
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">E-mail</label>
              <input
                type="email"
                value={proposal.cliente.email}
                onChange={(e) => onUpdateProposal({ cliente: { ...proposal.cliente, email: e.target.value } })}
                placeholder="cliente@email.com"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">Endereço Completo</label>
              <input
                type="text"
                value={proposal.cliente.endereco}
                onChange={(e) => onUpdateProposal({ cliente: { ...proposal.cliente, endereco: e.target.value } })}
                placeholder="Rua, Nº, Bairro"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">Cidade / UF</label>
                <input
                  type="text"
                  value={proposal.cliente.cidade_uf}
                  onChange={(e) => onUpdateProposal({ cliente: { ...proposal.cliente, cidade_uf: e.target.value } })}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">CEP</label>
                <input
                  type="text"
                  value={proposal.cliente.cep}
                  onChange={(e) => onUpdateProposal({ cliente: { ...proposal.cliente, cep: e.target.value } })}
                  placeholder="79000-000"
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveCurrentClientDirect}
              className="w-full mt-2 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Salvar Cliente no Supabase</span>
            </button>
          </div>
        )}
      </div>

      {/* Adicionar Produtos - Catálogo Completo com Busca & Filtros */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <PackagePlus className="w-3.5 h-3.5 text-blue-800" />
            Catálogo de Produtos ({products.length})
          </label>
          {onRefreshProducts && (
            <button
              type="button"
              onClick={handleRefreshCatalog}
              disabled={isRefreshingProds}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 disabled:opacity-50"
              title="Recarregar catálogo do Supabase"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingProds ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          )}
        </div>

        {/* Barra de Pesquisa de Texto */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
            placeholder="Pesquisar por código, modelo, marca ou nome..."
            className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white font-medium"
          />
          {productSearchTerm && (
            <button
              type="button"
              onClick={() => setProductSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros por Marca e Categoria */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Marca</label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedProductIndex('');
              }}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white font-medium truncate"
            >
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedProductIndex('');
              }}
              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white font-medium truncate"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status de Filtro e botão de limpar filtros */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Exibindo <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> produtos
          </span>
          {(selectedBrand !== 'TODAS' || selectedCategory !== 'TODAS' || productSearchTerm) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-0.5"
            >
              <X className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        {/* Produto Dropdown com Listagem Completa */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Selecione o Produto ({filteredProducts.length} disponíveis):
          </label>
          <select
            id="product-catalog-select"
            value={selectedProductIndex}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white font-medium truncate"
          >
            <option value="">
              {filteredProducts.length === 0 
                ? '-- Nenhum produto encontrado (limpe os filtros) --' 
                : '-- Selecione um produto para adicionar --'}
            </option>
            {filteredProducts.map((p) => {
              const originalIndex = products.indexOf(p);
              const displayPrice = proposal.faturamento_tipo === 'direto'
                ? (p.price_direto || p.price_revenda || 0)
                : (p.price_revenda || p.price_direto || 0);

              return (
                <option key={String(p.id ?? '') + '-' + p.code + '-' + p.name} value={originalIndex}>
                  [{p.brand}] {p.code} - {p.name} (R$ {displayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                </option>
              );
            })}
          </select>
        </div>

        {/* Preço Unitário e Qtd */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Valor Unitário (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={itemPreco || ''}
              readOnly={proposal.faturamento_tipo === 'direto'}
              onChange={(e) => setItemPreco(parseFloat(e.target.value) || 0)}
              className={`w-full px-2.5 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none font-semibold ${
                proposal.faturamento_tipo === 'direto'
                  ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                  : 'bg-white border-slate-300'
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qtd.</label>
            <input
              type="number"
              min="1"
              value={itemQtd}
              onChange={(e) => setItemQtd(parseInt(e.target.value, 10) || 1)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none font-semibold"
            />
          </div>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={handleAddItem}
          disabled={!selectedProductIndex}
          className="w-full py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar ao Orçamento</span>
        </button>
      </div>

      {/* Lista de Itens no Orçamento */}
      {cart.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Itens Adicionados ({cart.length})</span>
            <span className="text-[11px] text-slate-500">Qtd / Excluir</span>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-slate-50">
            {cart.map((item, index) => (
              <div key={item.code + index} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {item.code} - {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Unit: R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="1"
                    value={item.qtd}
                    onChange={(e) => onUpdateCartItemQty(index, parseInt(e.target.value, 10) || 1)}
                    className="w-12 px-1 py-0.5 text-center text-xs border border-slate-300 rounded bg-white font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(index)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remover produto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Condições de Negociação & Descontos */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Tags className="w-3.5 h-3.5 text-blue-800" />
          Descontos & Pagamento
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Desconto À Vista (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={proposal.desc_vista_percent}
              onChange={(e) => onUpdateProposal({ desc_vista_percent: parseFloat(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Juros Cartão Revenda (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={proposal.juros_revenda_percent}
              onChange={(e) => onUpdateProposal({ juros_revenda_percent: parseFloat(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none font-semibold"
            />
          </div>
        </div>

        <div>
          {(() => {
            const currentConsultantObj = consultoresDetalhes.find(
              c => c.nome.toLowerCase() === (proposal.consultor || '').toLowerCase()
            );
            const cargo = currentConsultantObj?.cargo || 'vendedor';
            const canGiveDesc = cargo === 'gerente' || cargo === 'diretor';
            const maxDesc = canGiveDesc ? (currentConsultantObj?.desconto_maximo ?? (cargo === 'diretor' ? 15.0 : 10.0)) : 0.0;
            const isVendedorWithDiscount = !canGiveDesc && proposal.desc_aplicado_percent > 0;
            const isDisabled = proposal.faturamento_tipo === 'direto' || !canGiveDesc;

            return (
              <>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    {proposal.faturamento_tipo === 'direto'
                      ? 'Desconto Adicional (bloqueado em Faturamento Direto)'
                      : !canGiveDesc
                        ? 'Desconto Adicional (Exclusivo Gerente / Diretor)'
                        : `Desconto Adicional Negociado (Máx: ${maxDesc}%)`}
                  </label>
                  {!canGiveDesc && proposal.faturamento_tipo !== 'direto' && (
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                      <Lock className="w-3 h-3 text-amber-700" />
                      Vendedor (0%)
                    </span>
                  )}
                </div>

                {isVendedorWithDiscount && proposal.faturamento_tipo !== 'direto' && (
                  <div className="mb-1.5 p-1.5 bg-red-50 border border-red-200 rounded text-[10.5px] text-red-800 flex items-center justify-between gap-1">
                    <span>Vendedor não pode dar desconto adicional.</span>
                    <button
                      type="button"
                      onClick={() => onUpdateProposal({ desc_aplicado_percent: 0 })}
                      className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[9.5px] font-bold"
                    >
                      Zerar (0%)
                    </button>
                  </div>
                )}

                <input
                  type="number"
                  step="0.1"
                  max={maxDesc || 30}
                  disabled={isDisabled}
                  value={proposal.faturamento_tipo === 'direto' ? 0 : proposal.desc_aplicado_percent}
                  onChange={(e) => onUpdateProposal({ desc_aplicado_percent: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-2.5 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-none font-semibold ${
                    isDisabled
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300'
                  }`}
                  placeholder={!canGiveDesc ? 'Bloqueado para vendedor' : '0%'}
                />
              </>
            );
          })()}
        </div>
      </div>

      {/* Observações Comerciais */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-blue-800" />
          Observações Comerciais
        </label>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Instalação</label>
          <input
            type="text"
            value={proposal.obs_instalacao}
            onChange={(e) => onUpdateProposal({ obs_instalacao: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Entrega</label>
          <input
            type="text"
            value={proposal.obs_entrega}
            onChange={(e) => onUpdateProposal({ obs_entrega: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Prazo de Entrega</label>
          <input
            type="text"
            value={proposal.obs_prazo}
            onChange={(e) => onUpdateProposal({ obs_prazo: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Garantia</label>
          <input
            type="text"
            value={proposal.obs_garantia}
            onChange={(e) => onUpdateProposal({ obs_garantia: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none"
          />
        </div>
      </div>

      {/* Modals for Client and Consultant CRUD */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        mode={clientModalMode}
        initialClient={clientToEdit}
        onSave={async (clientData) => {
          await onSaveClient(clientData);
        }}
      />

      {onSaveConsultant && (
        <ConsultantModal
          isOpen={isConsultantModalOpen}
          onClose={() => setIsConsultantModalOpen(false)}
          mode={consultantModalMode}
          initialConsultant={consultantToEdit}
          onSave={async (consData) => {
            await onSaveConsultant(consData);
          }}
        />
      )}
    </aside>
  );
};
