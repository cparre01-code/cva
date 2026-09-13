import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  ClipboardList, 
  DollarSign, 
  ExternalLink, 
  Trash2,
  Save,
  Plus,
  Sliders,
  UserPlus,
  UserCheck,
  PackagePlus,
  Compass,
  Calendar,
  Hash,
  User as UserIcon,
  ChevronDown,
  Info,
  Search,
  Pencil,
  FileText,
  LogOut,
  FilePlus,
  ShieldAlert,
  AlertTriangle,
  CreditCard,
  Percent,
  Lock
} from 'lucide-react';
import { 
  CartItem, 
  ProposalData, 
  ProfitResult,
  Product,
  Client,
  Consultant,
  Profissional,
  FaturamentoTipo,
  FormaPagamento
} from '../types';
import { 
  COMPANY_INFO,
  DEFAULT_CONSULTORES
} from '../data/initialData';
import { 
  calculateBudgetTotals, 
  calculateInstallments, 
  formatCurrency 
} from '../utils/calculations';
import { CvaLogo } from './CvaLogo';
import { ParametersModal } from './ParametersModal';
import { PaymentMethodModal } from './PaymentMethodModal';
import { EditableCurrencyCell } from './EditableCurrencyCell';
import { ProductCatalogModal } from './ProductCatalogModal';
import { ClientModal } from './ClientModal';
import { ConsultantModal } from './ConsultantModal';
import { ProfessionalModal } from './ProfessionalModal';

interface ProposalPreviewProps {
  proposal: ProposalData;
  cart: CartItem[];
  products: Product[];
  clients: Client[];
  consultores: string[];
  consultoresDetalhes?: Consultant[];
  profissionais?: Profissional[];
  profitResult: ProfitResult;
  isOnline?: boolean;
  onAddToCart: (item: CartItem) => void;
  onRemoveItem: (index: number) => void;
  onUpdateCartItemQty: (index: number, qty: number) => void;
  onUpdateCartItemPrice?: (index: number, price: number) => void;
  onOpenProfitModal: () => void;
  onOpenBrandOrders: () => void;
  onSaveToSupabase: () => void;
  savingBudget: boolean;
  onUpdateClientField: (field: string, val: string) => void;
  onUpdateProposal: (updates: Partial<ProposalData>) => void;
  onSaveClient: (client: Partial<Client>) => Promise<void> | void;
  onSaveConsultant?: (consultant: Consultant) => Promise<void> | void;
  onDeleteConsultant?: (idOrNome: string) => Promise<void> | void;
  onSaveProfissional?: (prof: Profissional) => Promise<void> | void;
  onDeleteProfissional?: (idOrNome: string) => Promise<void> | void;
  onRefreshProducts?: () => void;
  onDeleteBudget?: () => void;
  onOpenSavedBudgets?: () => void;
  onNewBudget?: () => void;
}

export const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  proposal,
  cart,
  products,
  clients,
  consultores,
  consultoresDetalhes = [],
  profissionais = [],
  profitResult,
  isOnline = true,
  onAddToCart,
  onRemoveItem,
  onUpdateCartItemQty,
  onUpdateCartItemPrice,
  onOpenProfitModal,
  onOpenBrandOrders,
  onOpenSavedBudgets,
  onSaveToSupabase,
  savingBudget,
  onUpdateClientField,
  onUpdateProposal,
  onSaveClient,
  onSaveConsultant,
  onDeleteConsultant,
  onSaveProfissional,
  onDeleteProfissional,
  onRefreshProducts,
  onDeleteBudget,
  onNewBudget,
}) => {
  const isRevenda = proposal.faturamento_tipo === 'revenda';

  // Modals state
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientModalMode, setClientModalMode] = useState<'new' | 'edit'>('new');
  const [clientSavedFeedback, setClientSavedFeedback] = useState(false);

  const [isConsultantModalOpen, setIsConsultantModalOpen] = useState(false);
  const [consultantModalMode, setConsultantModalMode] = useState<'new' | 'edit'>('new');

  const [isProfissionalModalOpen, setIsProfissionalModalOpen] = useState(false);
  const [profissionalModalMode, setProfissionalModalMode] = useState<'new' | 'edit'>('new');

  // Linha em edição na tabela de produtos (só mostra controles de quantidade ao selecionar)
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Forma de pagamento selecionada (Na revenda, não terá modalidade boleto ou pix parcelado)
  const formaPagamento: FormaPagamento = (isRevenda && proposal.forma_pagamento === 'boleto_pix_parcelado')
    ? 'a_vista'
    : (proposal.forma_pagamento || 'a_vista');
  const isAvista = formaPagamento === 'a_vista';
  const effectiveDescNegociadoPercent = isRevenda ? (proposal.desc_aplicado_percent || 0) : 0;

  // Totals & Installments calculation
  const { 
    subtotal, 
    descontoNegociado, 
    descontoVista, 
    totalDesconto, 
    totalFinal: rawTotalFinal, 
    totalVista,
    totalPrazo 
  } = calculateBudgetTotals(
    cart, 
    proposal.faturamento_tipo, 
    proposal.desc_vista_percent, 
    effectiveDescNegociadoPercent,
    isAvista
  );

  // Base do parcelamento no cartão/boleto: valor a prazo (sem deduzir desconto à vista)
  const installments = calculateInstallments(
    totalPrazo,
    proposal.faturamento_tipo,
    formaPagamento,
    proposal.juros_revenda_percent !== undefined ? proposal.juros_revenda_percent : 1.0
  );

  // Número de parcelas selecionado para a proposta:
  const currentParcelas = proposal.num_parcelas || (formaPagamento === 'cartao' ? 10 : formaPagamento === 'boleto_pix_parcelado' ? 3 : 1);
  const selectedInstallment = installments.find(inst => inst.n === currentParcelas) || installments[installments.length - 1];

  // 1) SE A FORMA DE PAGAMENTO FOR A VISTA, CONSIDERAR o desconto de pagamento a vista na apuracao do total final;
  const displayedTotalFinal = isAvista
    ? totalVista
    : (selectedInstallment && !selectedInstallment.isSemJuros ? selectedInstallment.total : totalPrazo);

  // Lista de consultores disponíveis garantindo todos os consultores cadastrados e os padrões da empresa
  const availableConsultants = useMemo(() => {
    const list = [
      ...(consultores && consultores.length > 0 ? consultores : DEFAULT_CONSULTORES),
      ...DEFAULT_CONSULTORES
    ];
    return Array.from(new Set(list.map(c => (c || '').trim()))).filter(Boolean);
  }, [consultores]);

  // Consultant edit / delete helpers
  const currentConsultantObj = useMemo(() => {
    if (!proposal.consultor) return undefined;
    return consultoresDetalhes.find(c => c.nome.toLowerCase() === proposal.consultor.toLowerCase()) || {
      nome: proposal.consultor,
      cargo: 'vendedor' as const,
      desconto_maximo: 5.0,
      desconto_max_vista: 5.0,
      margem_minima: 15.0,
      pode_aprovar_excecao: false,
    };
  }, [proposal.consultor, consultoresDetalhes]);

  // Validação de alçadas comerciais - Regra 4: SOMENTE GERENTE E DIRETOR PODE DAR DESCONTO ADICIONAL
  const isDireto = proposal.faturamento_tipo === 'direto';
  const cargoConsultor = currentConsultantObj?.cargo || 'vendedor';
  const cargoConsultorLabel = cargoConsultor === 'diretor' ? 'Diretoria' : cargoConsultor === 'gerente' ? 'Gerência' : 'Vendedor';
  const canGiveAdditionalDiscount = cargoConsultor === 'gerente' || cargoConsultor === 'diretor';
  const maxDescNegociado = canGiveAdditionalDiscount
    ? (currentConsultantObj?.desconto_maximo ?? (cargoConsultor === 'diretor' ? 15.0 : 10.0))
    : 0.0;
  const maxDescVista = currentConsultantObj?.desconto_max_vista ?? 5.0;

  const isVendedorWithDiscount = !canGiveAdditionalDiscount && proposal.desc_aplicado_percent > 0;
  const isDescNegociadoExceeded = !isDireto && (
    isVendedorWithDiscount || (proposal.desc_aplicado_percent > maxDescNegociado)
  );
  const isDescVistaExceeded = proposal.desc_vista_percent > maxDescVista;
  const hasAlcadaExceeded = isDescNegociadoExceeded || isDescVistaExceeded;

  // Nome sugerido para arquivo PDF: CVA-2026-001_NOME_CLIENTE_Orcamento
  const suggestedFileName = useMemo(() => {
    const cleanOrcNum = (proposal.num_orc || 'Orcamento').replace(/[\/\\]/g, '-').trim();
    const rawClient = (proposal.cliente.nome || 'Cliente').trim();
    const cleanClient = rawClient
      ? rawClient
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9_\-\s]/g, '')
          .trim()
          .replace(/\s+/g, '_')
      : 'Cliente';
    return `${cleanOrcNum}_${cleanClient}_Orcamento`;
  }, [proposal.num_orc, proposal.cliente.nome]);

  const handleEditCurrentConsultant = () => {
    setConsultantModalMode('edit');
    setIsConsultantModalOpen(true);
  };

  const handleDeleteCurrentConsultant = async () => {
    if (!proposal.consultor) return;
    if (window.confirm(`Deseja realmente excluir o consultor(a) "${proposal.consultor}"?`)) {
      if (onDeleteConsultant) {
        await onDeleteConsultant(currentConsultantObj?.id || proposal.consultor);
      }
      onUpdateProposal({ consultor: '' });
    }
  };

  // Profissional edit / delete helpers
  const currentProfissionalObj = useMemo(() => {
    if (!proposal.arquiteto_parceiro) return undefined;
    return (profissionais || []).find(p => p.nome.toLowerCase() === (proposal.arquiteto_parceiro || '').toLowerCase()) || {
      nome: proposal.arquiteto_parceiro,
      tipo: 'Arquiteto(a)',
    };
  }, [proposal.arquiteto_parceiro, profissionais]);

  const handleEditCurrentProfissional = () => {
    setProfissionalModalMode('edit');
    setIsProfissionalModalOpen(true);
  };

  const handleDeleteCurrentProfissional = async () => {
    if (!proposal.arquiteto_parceiro) return;
    if (window.confirm(`Deseja realmente excluir o cadastro do profissional "${proposal.arquiteto_parceiro}"?`)) {
      if (onDeleteProfissional) {
        await onDeleteProfissional(currentProfissionalObj?.id || proposal.arquiteto_parceiro);
      }
      onUpdateProposal({ arquiteto_parceiro: '' });
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    // Define o title temporariamente para que a janela de impressão do navegador sugira o nome exato
    document.title = suggestedFileName;

    // 1. Tenta acionar a impressão direta do navegador
    try {
      const isIframe = window.self !== window.top;
      if (!isIframe) {
        window.print();
        setTimeout(() => {
          document.title = originalTitle;
        }, 1500);
        return;
      }
    } catch {
      // Ignora e tenta a abordagem de janela/fallback
    }

    // 2. Quando executado em sandbox/iframe (preview), abre uma janela limpa com o orçamento para impressão
    try {
      const paperEl = document.getElementById('orcamento-paper');
      if (paperEl) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const docTitle = suggestedFileName;
          // Clona o HTML e substitui inputs pelo seu valor de texto para não truncar nem exibir bordas
          const clone = paperEl.cloneNode(true) as HTMLElement;
          // Remove botões e elementos que não devem imprimir
          clone.querySelectorAll('.print\\:hidden, button').forEach(el => el.remove());
          
          // Converte inputs e selects em texto simples
          clone.querySelectorAll('input').forEach(inp => {
            const span = document.createElement('span');
            span.textContent = inp.value || inp.placeholder || '';
            span.style.fontWeight = inp.style.fontWeight || 'normal';
            inp.parentNode?.replaceChild(span, inp);
          });
          clone.querySelectorAll('select').forEach(sel => {
            const span = document.createElement('span');
            const selectedText = sel.options[sel.selectedIndex]?.text || '';
            span.textContent = selectedText.startsWith('--') ? '' : selectedText;
            sel.parentNode?.replaceChild(span, sel);
          });

          printWindow.document.open();
          printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
              <head>
                <meta charset="utf-8">
                <title>${docTitle}</title>
                <style>
                  @page { size: A4; margin: 8mm 10mm; }
                  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 12px; background: #fff; color: #0f172a; font-size: 12px; line-height: 1.35; }
                  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px; }
                  th, td { border: 1px solid #cbd5e1; padding: 4px 6px; }
                  th { background-color: #1e3a8a; color: #fff; }
                  .bg-slate-100 { background-color: #f1f5f9; }
                  .bg-slate-50 { background-color: #f8fafc; }
                  .font-bold { font-weight: 700; }
                  .text-right { text-align: right; }
                  .text-center { text-align: center; }
                  .text-slate-900 { color: #0f172a; }
                  .text-slate-700 { color: #334155; }
                  .text-slate-600 { color: #475569; }
                  .text-red-600 { color: #dc2626; }
                  .text-blue-950 { color: #172554; }
                  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
                  @media print {
                    body { padding: 0; }
                    .no-print { display: none !important; }
                  }
                </style>
              </head>
              <body>
                <div class="no-print" style="margin-bottom: 12px; padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 13px; font-weight: bold; color: #1e40af; display: block;">Visualização para Impressão / Salvar em PDF</span>
                    <span style="font-size: 11px; color: #1e3a8a;">Nome do arquivo sugerido: <strong>${docTitle}.pdf</strong></span>
                  </div>
                  <button onclick="window.print()" style="background: #1e40af; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-size: 13px; font-weight: bold; cursor: pointer;">
                    🖨️ Imprimir / Salvar em PDF
                  </button>
                </div>
                ${clone.outerHTML}
                <script>
                  window.addEventListener('load', () => {
                    setTimeout(() => {
                      window.focus();
                      window.print();
                    }, 350);
                  });
                <\/script>
              </body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => {
            document.title = originalTitle;
          }, 1500);
          return;
        }
      }
    } catch (err) {
      console.warn('Janela pop-up bloqueada, acionando fallback de impressão:', err);
    }

    // Fallback final direto
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  // Client fast selection handler
  const handleSelectClient = (clientName: string) => {
    onUpdateClientField('nome', clientName);
    const found = clients.find(c => (c.nome || '').trim().toLowerCase() === clientName.trim().toLowerCase());
    if (found) {
      onUpdateProposal({
        cliente: {
          ...proposal.cliente,
          nome: found.nome,
          doc: found.doc || found.cnpj || found.cpf || '',
          tel: found.tel || '',
          email: found.email || '',
          endereco: found.endereco || '',
          bairro: found.bairro || '',
          cidade_uf: found.cidade_uf || 'Campo Grande / MS',
          cep: found.cep || '',
        },
        ...(proposal.arquiteto_parceiro ? {} : (found.profissional ? { arquiteto_parceiro: found.profissional } : {}))
      });
    }
  };

  // Fast save client to database
  const handleFastSaveClient = async () => {
    if (!proposal.cliente.nome.trim()) return;
    const clientToSave: Partial<Client> = {
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
    await onSaveClient(clientToSave);
    setClientSavedFeedback(true);
    setTimeout(() => setClientSavedFeedback(false), 2000);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Printable Sheet (Standard A4 dimensions) */}
      <div 
        id="orcamento-paper" 
        className="w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 p-[12mm_14mm] text-[9.5px] leading-snug border border-slate-200 shadow-md print:border-none print:shadow-none print:p-0"
      >
        {/* Action bar at top inside A4 sheet */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-200 print:hidden">
          {/* Left: Supabase connection indicator */}
          <div className="flex items-center gap-1.5">
            <span 
              className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
              title={isOnline ? 'Conectado ao Supabase' : 'Trabalhando offline'}
            />
          </div>

          {/* Right: Key tools and triggers */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Botão de Parâmetros Comerciais */}
            <button
              id="btn-open-params"
              type="button"
              onClick={() => setIsParamsModalOpen(true)}
              className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              title="Ajustar descontos, juros e observações comerciais da proposta"
            >
              <Sliders className="w-3 h-3 text-amber-300" />
              <span>Parâmetros</span>
            </button>

            {/* Alerta de Alçada Visual */}
            {hasAlcadaExceeded && (
              <button
                type="button"
                onClick={() => setIsParamsModalOpen(true)}
                className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded text-xs font-bold flex items-center gap-1 animate-pulse transition-colors"
                title={`Alçada de desconto excedida para ${cargoConsultorLabel}! Clique para revisar.`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Alçada Excedida ({cargoConsultorLabel})</span>
                <span className="sm:hidden">Alçada!</span>
              </button>
            )}

            {/* Realtime profit preview badge */}
            <button
              type="button"
              onClick={onOpenProfitModal}
              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border transition-all ${
                profitResult.profit >= 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
              }`}
              title="Análise de lucratividade"
            >
              <DollarSign className="w-3 h-3" />
              <div className="text-left leading-tight">
                <div>{formatCurrency(profitResult.profit)}</div>
                <div className="text-[9px] font-medium opacity-80">
                  {profitResult.marginPercent.toFixed(2)}%
                </div>
              </div>
            </button>

            {/* Generate brand orders */}
            <button
              id="btn-brand-orders"
              type="button"
              onClick={onOpenBrandOrders}
              className="p-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              title="Pedidos"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pedidos</span>
            </button>

            {/* New budget button */}
            {onNewBudget && (
              <button
                id="btn-new-budget"
                type="button"
                onClick={onNewBudget}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                title="Novo Orçamento (Limpar campos e gerar próximo número)"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo</span>
              </button>
            )}

            {/* Save to Supabase */}
            <button
              id="btn-save-inline"
              type="button"
              onClick={onSaveToSupabase}
              disabled={savingBudget}
              className="p-1.5 bg-white hover:bg-amber-50 active:bg-amber-100 text-amber-600 border border-amber-300 rounded text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
              title="Salvar"
            >
              <Save className="w-3.5 h-3.5" />
            </button>

            {/* Delete proposal button */}
            {onDeleteBudget && (
              <button
                id="btn-delete-proposal"
                type="button"
                onClick={onDeleteBudget}
                className="p-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 border border-red-200 rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                title="Apagar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Print / PDF button */}
            <button
              id="btn-print-proposal"
              type="button"
              onClick={handlePrint}
              className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-300 rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
              title="Gerar PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline font-bold">PDF</span>
            </button>

            {/* Exit button */}
            <button
              id="btn-exit-system"
              type="button"
              onClick={() => window.location.reload()}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* 1.a: Title bar com Logo da CVA à esquerda, Título centralizado e Faturamento à direita */}
        <div className="bg-[#1a365d] text-white py-1.5 px-3 rounded-xs mb-2 flex items-center justify-between gap-2 shadow-2xs">
          {/* Logo CVA à esquerda */}
          <div className="flex items-center shrink-0">
            <div className="bg-white px-1.5 py-0.5 rounded shadow-2xs">
              <CvaLogo size="sm" showSubtitle={false} />
            </div>
          </div>

          {/* Título Centralizado */}
          <div className="font-bold text-[12px] tracking-wider text-center flex-1">
            PROPOSTA COMERCIAL / ORÇAMENTO
          </div>

          {/* Botões de Faturamento na DIREITA */}
          <div className="w-[220px] flex items-center justify-end gap-1.5 shrink-0 print:hidden">
            <button
              type="button"
              id="btn-fat-direto"
              onClick={() => onUpdateProposal({ faturamento_tipo: 'direto' })}
              className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide transition-all ${
                proposal.faturamento_tipo === 'direto'
                  ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-white/50'
                  : 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white'
              }`}
              title="Alternar para Faturamento Direto de Fábrica"
            >
              Faturamento Direto
            </button>
            <button
              type="button"
              id="btn-fat-revenda"
              onClick={() => onUpdateProposal({ faturamento_tipo: 'revenda' })}
              className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide transition-all ${
                proposal.faturamento_tipo === 'revenda'
                  ? 'bg-cyan-400 text-slate-950 shadow-xs ring-1 ring-white/50'
                  : 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white'
              }`}
              title="Alternar para Faturamento Revenda CVA"
            >
              Revenda CVA
            </button>
          </div>

          {/* Impressão: Exibe apenas o selo do tipo ativo */}
          <div className="hidden print:block text-[9.5px] font-bold uppercase tracking-wider text-white">
            {proposal.faturamento_tipo === 'direto' ? 'Faturamento Direto' : 'Revenda CVA'}
          </div>
        </div>

        {/* 1.b: Meta Info Grid - Data, Orç. Nº, Consultor e Profissional na mesma linha */}
        <table className="w-full border-collapse mb-2 text-[9px]">
          <tbody>
            <tr>
              {/* 1. Data */}
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[5%] whitespace-nowrap text-slate-800">Data:</td>
              <td className="border border-slate-300 p-1 w-[12%] hover:bg-blue-50/40">
                <input
                  type="date"
                  value={proposal.data_orc || ''}
                  onChange={(e) => onUpdateProposal({ data_orc: e.target.value })}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none text-[9px] font-medium cursor-pointer"
                />
              </td>

              {/* 2. Orç. Nº */}
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[6%] whitespace-nowrap text-slate-800">Orç. Nº:</td>
              <td className="border border-slate-300 p-1 w-[15%] font-bold text-blue-950 hover:bg-blue-50/40">
                <div className="flex items-center justify-between gap-1 w-full">
                  <input
                    id="input-num-orc"
                    type="text"
                    value={proposal.num_orc || ''}
                    onChange={(e) => onUpdateProposal({ num_orc: e.target.value })}
                    placeholder="CVA-2026/001"
                    className="w-full font-bold text-blue-950 bg-transparent border-0 p-0 focus:outline-none text-[9px]"
                  />
                  {onOpenSavedBudgets && (
                    <button
                      id="btn-search-saved-budgets"
                      type="button"
                      onClick={onOpenSavedBudgets}
                      className="px-1 py-0.5 text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded border border-blue-200 text-[8px] font-bold flex items-center gap-0.5 shrink-0 print:hidden transition-colors shadow-2xs"
                      title="Buscar orçamentos salvos"
                    >
                      <Search className="w-2.5 h-2.5 text-blue-700" />
                      <span className="hidden xl:inline">Buscar</span>
                    </button>
                  )}
                </div>
              </td>

              {/* 3. Consultor(a) */}
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[8%] whitespace-nowrap text-slate-800">Consultor:</td>
              <td className="border border-slate-300 p-1 w-[26%] hover:bg-blue-50/40">
                <div className="flex items-center gap-1 w-full print:hidden">
                  <select
                    id="select-consultor"
                    value={proposal.consultor || ''}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        const customName = prompt('Digite o nome do consultor:');
                        if (customName && customName.trim()) {
                          onUpdateProposal({ consultor: customName.trim() });
                        }
                      } else {
                        onUpdateProposal({ consultor: e.target.value });
                      }
                    }}
                    className="w-full font-semibold text-slate-900 bg-transparent border-0 p-0 focus:outline-none text-[9px] cursor-pointer"
                    title="Selecione o consultor responsável"
                  >
                    <option value="" disabled>-- Consultor --</option>
                    {availableConsultants.map((nome) => (
                      <option key={nome} value={nome} className="text-slate-900 bg-white py-1">
                        {nome}
                      </option>
                    ))}
                    {proposal.consultor && !availableConsultants.includes(proposal.consultor) && (
                      <option value={proposal.consultor} className="text-slate-900 bg-white py-1">
                        {proposal.consultor} (Atual)
                      </option>
                    )}
                    <option value="__custom__" className="text-blue-700 font-bold bg-slate-50 py-1">
                      + Digitar outro consultor...
                    </option>
                  </select>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {proposal.consultor && (
                      <>
                        <button
                          type="button"
                          id="btn-editar-consultor"
                          onClick={handleEditCurrentConsultant}
                          className="p-1 text-slate-500 hover:text-blue-800 hover:bg-blue-100/60 rounded transition-colors"
                          title="Editar consultor selecionado"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        {onDeleteConsultant && (
                          <button
                            type="button"
                            id="btn-excluir-consultor"
                            onClick={handleDeleteCurrentConsultant}
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-100/60 rounded transition-colors"
                            title="Excluir consultor selecionado"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </>
                    )}
                    {onSaveConsultant && (
                      <button
                        type="button"
                        id="btn-cadastrar-consultor"
                        onClick={() => {
                          setConsultantModalMode('new');
                          setIsConsultantModalOpen(true);
                        }}
                        className="p-1 text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-[8px] font-bold flex items-center shrink-0 transition-colors shadow-2xs"
                        title="Cadastrar novo consultor e definir alçadas"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="hidden print:block font-semibold text-slate-900 truncate">
                  {proposal.consultor || '-'}
                </div>
              </td>

              {/* 4. Profissional (Substitui Arquiteto/Parceiro) */}
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[8%] whitespace-nowrap text-slate-800">Profissional:</td>
              <td className="border border-slate-300 p-1 w-[28%] hover:bg-purple-50/40">
                <div className="flex items-center gap-1 w-full print:hidden">
                  <select
                    id="select-profissional"
                    value={proposal.arquiteto_parceiro || ''}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        const customName = prompt('Digite o nome do profissional (Arquiteto / Designer):');
                        if (customName && customName.trim()) {
                          onUpdateProposal({ arquiteto_parceiro: customName.trim() });
                        }
                      } else {
                        onUpdateProposal({ arquiteto_parceiro: e.target.value });
                      }
                    }}
                    className="w-full font-semibold text-slate-900 bg-transparent border-0 p-0 focus:outline-none text-[9px] cursor-pointer"
                    title="Selecione o profissional cadastrado"
                  >
                    <option value="">-- Selecione o Profissional --</option>
                    {(profissionais || []).map((p) => (
                      <option key={p.id || p.nome} value={p.nome} className="text-slate-900 bg-white py-1">
                        {p.nome} {p.escritorio ? `(${p.escritorio})` : ''} {p.tipo ? `• ${p.tipo}` : ''}
                      </option>
                    ))}
                    {proposal.arquiteto_parceiro && !(profissionais || []).some(p => p.nome.toLowerCase() === (proposal.arquiteto_parceiro || '').toLowerCase()) && (
                      <option value={proposal.arquiteto_parceiro} className="text-slate-900 bg-white py-1">
                        {proposal.arquiteto_parceiro} (Avulso)
                      </option>
                    )}
                    <option value="__custom__" className="text-purple-700 font-bold bg-slate-50 py-1">
                      + Digitar outro profissional...
                    </option>
                  </select>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {proposal.arquiteto_parceiro && (
                      <>
                        <button
                          type="button"
                          id="btn-editar-profissional"
                          onClick={handleEditCurrentProfissional}
                          className="p-1 text-slate-500 hover:text-purple-800 hover:bg-purple-100/60 rounded transition-colors"
                          title="Editar cadastro do profissional selecionado"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        {onDeleteProfissional && (
                          <button
                            type="button"
                            id="btn-excluir-profissional"
                            onClick={handleDeleteCurrentProfissional}
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-100/60 rounded transition-colors"
                            title="Excluir profissional selecionado"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      id="btn-cadastrar-profissional"
                      onClick={() => {
                        setProfissionalModalMode('new');
                        setIsProfissionalModalOpen(true);
                      }}
                      className="p-1 text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded text-[8px] font-bold flex items-center shrink-0 transition-colors shadow-2xs"
                      title="Cadastrar novo profissional parceiro (Arquiteto, Designer, etc.)"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
                <div className="hidden print:block font-semibold text-slate-900 truncate">
                  {proposal.arquiteto_parceiro || '-'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 1.c: Client Section com Adição, Seleção e Edição Direta */}
        <div className="bg-[#2b6cb0] text-white font-bold px-2 py-0.5 text-[9px] uppercase tracking-wide mb-1 flex items-center justify-between">
          <span>DADOS CADASTRAIS DO CLIENTE</span>
        </div>

        <table className="w-full border-collapse mb-2 text-[9px]">
          <tbody>
            <tr>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[16%]">Nome / Razão:</td>
              <td colSpan={2} className="border border-slate-300 p-1 font-semibold text-slate-900 hover:bg-blue-50/40">
                <div className="flex items-center gap-1.5 w-full">
                  <div className="relative flex-1">
                    <input
                      id="input-cliente-nome"
                      list="clients-list"
                      type="text"
                      value={proposal.cliente.nome || ''}
                      placeholder="Digite ou selecione o cliente cadastrado..."
                      onChange={(e) => handleSelectClient(e.target.value)}
                      className="w-full font-bold text-slate-900 bg-transparent border-0 p-0 focus:outline-none placeholder:text-slate-400 placeholder:font-normal text-[9px]"
                    />
                    <datalist id="clients-list">
                      {clients.map(cli => (
                        <option key={cli.id || cli.nome} value={cli.nome}>
                          {cli.doc ? `(${cli.doc})` : ''} {cli.tel ? `- Tel: ${cli.tel}` : ''}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <button
                    id="btn-add-novo-cliente-inline"
                    type="button"
                    onClick={() => {
                      setClientModalMode('new');
                      setIsClientModalOpen(true);
                    }}
                    className="p-1 text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-[8px] font-bold flex items-center shrink-0 print:hidden shadow-2xs transition-colors"
                    title="Cadastrar Novo Cliente"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </td>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[14%]">CPF / CNPJ:</td>
              <td colSpan={2} className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.cliente.doc || ''}
                  placeholder="000.000.000-00"
                  onChange={(e) => onUpdateClientField('doc', e.target.value)}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none placeholder:text-slate-400 text-[9px]"
                />
              </td>
            </tr>
            <tr>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1">Contato / Tel:</td>
              <td className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.cliente.tel || ''}
                  placeholder="(67) 99999-9999"
                  onChange={(e) => onUpdateClientField('tel', e.target.value)}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none placeholder:text-slate-400 text-[9px]"
                />
              </td>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[10%]">Email:</td>
              <td className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.cliente.email || ''}
                  placeholder="email@cliente.com"
                  onChange={(e) => onUpdateClientField('email', e.target.value)}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none placeholder:text-slate-400 text-[9px]"
                />
              </td>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[10%]">Cidade/UF:</td>
              <td className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.cliente.cidade_uf || 'Campo Grande / MS'}
                  onChange={(e) => onUpdateClientField('cidade_uf', e.target.value)}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none text-[9px]"
                />
              </td>
            </tr>
            <tr>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1">Endereço:</td>
              <td colSpan={2} className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.cliente.endereco || ''}
                  placeholder="Rua, Número..."
                  onChange={(e) => onUpdateClientField('endereco', e.target.value)}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none placeholder:text-slate-400 text-[9px]"
                />
              </td>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[10%]">Bairro:</td>
              <td className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.cliente.bairro || ''}
                  placeholder="Bairro..."
                  onChange={(e) => onUpdateClientField('bairro', e.target.value)}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none placeholder:text-slate-400 text-[9px]"
                />
              </td>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[10%]">CEP:</td>
              <td className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.cliente.cep || ''}
                  placeholder="79000-000"
                  onChange={(e) => onUpdateClientField('cep', e.target.value)}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none placeholder:text-slate-400 text-[9px]"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* 1.d: Products Table com Botão de Adição Diretamente no Local de Adicionar */}
        <div className="mt-2 mb-1 flex items-center justify-between">
          <div className="bg-[#2b6cb0] text-white font-bold px-2 py-0.5 text-[9px] uppercase tracking-wide flex-1">
            DISCRIMINAÇÃO DOS PRODUTOS E EQUIPAMENTOS
          </div>
          {/* Botão de Adição de Produtos no local exato */}
          <button
            type="button"
            id="btn-add-product-local"
            onClick={() => setIsCatalogModalOpen(true)}
            className="ml-2 px-2.5 py-0.5 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white rounded text-[8.5px] font-bold flex items-center gap-1 shadow-xs transition-colors print:hidden"
            title="Abrir catálogo para inserir produtos neste orçamento"
          >
            <PackagePlus className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Adicionar Produto</span>
          </button>
        </div>

        <table className="w-full border-collapse mb-2 text-[8.5px]">
          <thead>
            <tr className="bg-[#2b6cb0] text-white">
              <th className="border border-[#2b6cb0] p-1 text-center w-[3%]">Item</th>
              <th className="border border-[#2b6cb0] p-1 text-center w-[6%]">Qtd.</th>
              <th className="border border-[#2b6cb0] p-1 text-center w-[10%]">Código</th>
              <th className="border border-[#2b6cb0] p-1 text-center w-[10%]">Marca</th>
              <th className="border border-[#2b6cb0] p-1 text-left w-[33%]">Descrição do Produto</th>
              <th className="border border-[#2b6cb0] p-1 text-center w-[5%]">Volt.</th>
              <th className="border border-[#2b6cb0] p-1 text-center w-[5%]">Link</th>
              <th className="border border-[#2b6cb0] p-1 text-right w-[12%]">Valor Unit.</th>
              <th className="border border-[#2b6cb0] p-1 text-right w-[13%]">Valor Total</th>
              <th className="border border-[#2b6cb0] p-1 text-center w-[3%] print:hidden">Ação</th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center text-slate-400 py-6 border border-slate-300">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <span>Nenhum produto adicionado ao orçamento</span>
                    <button
                      type="button"
                      onClick={() => setIsCatalogModalOpen(true)}
                      className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[9px] font-bold flex items-center gap-1 print:hidden"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Abrir Catálogo de Produtos</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              cart.map((item, index) => {
                const totalItem = item.qtd * item.price;
                const isEditingThisRow = editingRowIndex === index;
                return (
                  <tr 
                    key={item.code + index} 
                    className={`${index % 2 === 1 ? 'bg-slate-50' : 'bg-white'} ${isEditingThisRow ? 'ring-1 ring-blue-400 bg-blue-50/30' : ''}`}
                    onClick={() => {
                      if (editingRowIndex !== index) {
                        setEditingRowIndex(index);
                      }
                    }}
                  >
                    <td className="border border-slate-300 p-1 text-center font-bold text-slate-700">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td 
                      className="border border-slate-300 p-1 text-center cursor-pointer hover:bg-blue-50/50 transition-colors"
                      title="Clique para editar a quantidade"
                    >
                      <div className="flex items-center justify-center gap-0.5 print:hidden">
                        {isEditingThisRow ? (
                          <div className="flex items-center justify-center gap-0.5 animate-in fade-in duration-150">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateCartItemQty(index, Math.max(1, item.qtd - 1));
                              }}
                              className="w-3.5 h-3.5 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[9px] font-bold transition-colors"
                              title="Diminuir quantidade"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.qtd}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onFocus={() => setEditingRowIndex(index)}
                              onChange={(e) => onUpdateCartItemQty(index, parseInt(e.target.value, 10) || 1)}
                              onBlur={() => {
                                // Pequeno delay para permitir cliques nos botões + / -
                                setTimeout(() => {
                                  setEditingRowIndex(null);
                                }, 200);
                              }}
                              className="w-6 text-center font-bold text-[8.5px] bg-white border border-blue-400 rounded p-0 focus:outline-none ring-1 ring-blue-300 shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateCartItemQty(index, item.qtd + 1);
                              }}
                              className="w-3.5 h-3.5 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[9px] font-bold transition-colors"
                              title="Aumentar quantidade"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="w-full py-0.5 px-1 rounded flex items-center justify-center gap-1 font-bold text-[8.5px] text-slate-800 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRowIndex(index);
                            }}
                          >
                            <span>{item.qtd}</span>
                            <Pencil className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:opacity-100 hover:text-blue-600" />
                          </div>
                        )}
                      </div>
                      <span className="hidden print:inline font-semibold">{item.qtd}</span>
                    </td>
                    <td className="border border-slate-300 p-1 text-center font-mono font-semibold text-slate-900">
                      {item.code}
                    </td>
                    <td className="border border-slate-300 p-1 text-center font-semibold text-slate-800">
                      {item.brand ? (
                        <span className="inline-block px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[8px] font-bold text-slate-700 tracking-tight">
                          {item.brand}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border border-slate-300 p-1">
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </td>
                    <td className="border border-slate-300 p-1 text-center">{item.voltagem || '-'}</td>
                    <td className="border border-slate-300 p-1 text-center">
                      {item.link ? (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-sky-600 text-white rounded text-[7.5px] font-semibold hover:bg-sky-700"
                        >
                          VER <ExternalLink className="w-2 h-2" />
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border border-slate-300 p-1 text-right font-mono">
                      <EditableCurrencyCell
                        value={item.price}
                        isEditable={Boolean(onUpdateCartItemPrice && isRevenda)}
                        onCommit={(newPrice) => onUpdateCartItemPrice?.(index, newPrice)}
                      />
                    </td>
                    <td className="border border-slate-300 p-1 text-right font-mono font-bold text-slate-950">
                      {formatCurrency(totalItem)}
                    </td>
                    <td className="border border-slate-300 p-1 text-center print:hidden">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveItem(index);
                        }}
                        className="p-0.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Remover produto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Botão de Adição adicional no rodapé da tabela (visível na tela) */}
        <div className="mb-2 flex justify-end print:hidden">
          <button
            type="button"
            onClick={() => setIsCatalogModalOpen(true)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-blue-900 border border-slate-300 hover:border-blue-300 rounded text-[8.5px] font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-blue-700" />
            <span>+ Adicionar Outro Produto</span>
          </button>
        </div>

        {/* Commercial Conditions & Totals Grid */}
        <table className="w-full border-collapse mt-2 text-[9px]">
          <tbody>
            <tr>
              {/* Payment conditions text */}
              <td className="w-[58%] align-top pr-2">
                <div className="bg-slate-50 border border-slate-300 p-2 text-[8.5px] leading-relaxed rounded-xs relative group">
                  <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
                    <strong className="text-slate-900">
                      Condições de Negociação ({isRevenda ? 'Revenda CVA' : 'Faturamento Direto'}):
                    </strong>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => setIsParamsModalOpen(true)}
                        className="text-[8px] text-blue-700 hover:text-blue-900 font-semibold underline print:hidden"
                        title="Editar descontos e prazos"
                      >
                        Alterar Parâmetros
                      </button>
                      {/* Botão para informar forma de pagamento - Logo abaixo de Alterar Parâmetros */}
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="px-2 py-0.5 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white rounded text-[8px] font-bold flex items-center gap-1 shadow-xs print:hidden transition-colors"
                        title="Abrir popup para selecionar a forma de pagamento"
                      >
                        <CreditCard className="w-2.5 h-2.5 text-amber-300" />
                        <span>Forma de Pagamento</span>
                      </button>
                    </div>
                  </div>

                  {/* Textos dinâmicos conforme a forma de pagamento selecionada */}
                  <div className="mt-1 space-y-0.5 text-slate-700">
                    {formaPagamento === 'a_vista' && (
                      <>
                        <div className="font-bold text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                          <span>Forma de Pagamento: <strong>À VISTA (PIX / Transferência Bancária)</strong></span>
                        </div>
                        <div>
                          • Pagamento À Vista com <strong>{proposal.desc_vista_percent}% de Desconto</strong> considerado na apuração do Total Final ={' '}
                          <strong className="text-emerald-900 font-bold">{formatCurrency(totalVista)}</strong>
                        </div>
                      </>
                    )}

                    {formaPagamento === 'cartao' && (
                      <>
                        <div className="font-bold text-blue-900 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                          <span>Forma de Pagamento: <strong>CARTÃO DE CRÉDITO</strong></span>
                          <span className="text-[7.5px] font-normal text-slate-500">(Sem desconto à vista de 5%)</span>
                        </div>
                        <div>
                          • Condição Selecionada:{' '}
                          <strong className="text-blue-950 font-bold">
                            {currentParcelas}x de {formatCurrency(selectedInstallment?.parcela || 0)}
                          </strong>{' '}
                          {selectedInstallment?.isSemJuros ? (
                            <span className="text-emerald-700 font-semibold">(SEM JUROS)</span>
                          ) : (
                            <span className="text-slate-600 font-medium">
                              (com juros de {proposal.juros_revenda_percent !== undefined ? proposal.juros_revenda_percent : 1.0}% a.m. — Total: {formatCurrency(selectedInstallment?.total || 0)})
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[8px]">
                          {isRevenda
                            ? `• Na Revenda CVA: até 10x com juros de ${proposal.juros_revenda_percent !== undefined ? proposal.juros_revenda_percent : 1.0}% ao mês (1x sem juros).`
                            : '• No Faturamento Direto: em até 10x SEM JUROS.'}
                        </div>
                      </>
                    )}

                    {formaPagamento === 'boleto_pix_parcelado' && (
                      <>
                        <div className="font-bold text-purple-900 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block" />
                          <span>Forma de Pagamento: <strong>BOLETO OU PIX PARCELADO</strong></span>
                          <span className="text-[7.5px] font-normal text-slate-500">(Sem desconto à vista de 5%)</span>
                        </div>
                        <div>
                          • Condição Selecionada:{' '}
                          <strong className="text-purple-950 font-bold">
                            {currentParcelas}x de {formatCurrency(selectedInstallment?.parcela || 0)}
                          </strong>{' '}
                          {selectedInstallment?.isSemJuros ? (
                            <span className="text-emerald-700 font-semibold">(SEM JUROS)</span>
                          ) : (
                            <span className="text-slate-600 font-medium">(com juros de 2% a.m. — Total: {formatCurrency(selectedInstallment?.total || 0)})</span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[8px]">
                          • Em até 3x sem juros ou de 4x a 10x com juros de 2% ao mês.
                        </div>
                      </>
                    )}

                    {isRevenda && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1.5 bg-amber-50/60 p-1.5 rounded border border-amber-200">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Percent className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="font-bold text-slate-800 text-[8.5px]">
                            Desconto Adicional:
                          </span>
                          {!canGiveAdditionalDiscount ? (
                            <span className="text-[7.5px] px-1.5 py-0.5 bg-amber-100/90 text-amber-800 border border-amber-300 rounded font-bold inline-flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-amber-700" />
                              0% (Travado para Vendedor — Requer Gerente/Diretor)
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max={maxDescNegociado || 30}
                                step="0.5"
                                value={proposal.desc_aplicado_percent || 0}
                                onChange={(e) => onUpdateProposal({ desc_aplicado_percent: parseFloat(e.target.value) || 0 })}
                                className="w-12 px-1 py-0.5 text-[8.5px] font-bold text-slate-800 bg-white border border-slate-300 rounded text-center focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              />
                              <span className="font-bold text-[8.5px] text-slate-600">%</span>
                              <span className="text-[7.5px] text-slate-500 ml-1">
                                (Alçada {cargoConsultorLabel}: até {maxDescNegociado}%)
                              </span>
                            </div>
                          )}
                        </div>

                        {canGiveAdditionalDiscount && (
                          <div className="flex items-center gap-1 print:hidden">
                            {[0, 2, 5, maxDescNegociado].filter((v, idx, arr) => arr.indexOf(v) === idx && v <= maxDescNegociado).map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => onUpdateProposal({ desc_aplicado_percent: val })}
                                className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold border transition-colors ${
                                  (proposal.desc_aplicado_percent || 0) === val
                                    ? 'bg-amber-500 text-white border-amber-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {val}%
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {hasAlcadaExceeded && (
                      <div className="mt-1.5 p-1.5 bg-red-50 border border-red-300 rounded text-[8px] text-red-900 flex items-start gap-1 font-semibold print:hidden">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-red-950">⚠️ Limite de Alçada Excedido ({cargoConsultorLabel}):</strong>
                          {isVendedorWithDiscount ? (
                            <div>• Desconto Adicional: {proposal.desc_aplicado_percent}% (Não permitido para Vendedor! Somente Gerente ou Diretor pode conceder)</div>
                          ) : (
                            isDescNegociadoExceeded && (
                              <div>• Desconto Adicional: {proposal.desc_aplicado_percent}% (Máx: {maxDescNegociado}%)</div>
                            )
                          )}
                          {isDescVistaExceeded && (
                            <div>• Desconto À Vista: {proposal.desc_vista_percent}% (Máx: {maxDescVista}%)</div>
                          )}
                          <span className="text-[7.5px] text-red-700">Requer aprovação de Gerência ou Diretoria.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Totals table */}
              <td className="w-[42%] align-top">
                <table className="w-full border-collapse text-[9px]">
                  <tbody>
                    <tr>
                      <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[45%]">
                        Soma Total:
                      </td>
                      <td className="border border-slate-300 p-1 text-right font-mono font-bold">
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                    {descontoNegociado > 0 && (
                      <tr>
                        <td className="font-bold bg-slate-100 border border-slate-300 p-1">
                          Desconto Negociado:
                        </td>
                        <td className="border border-slate-300 p-1 text-right font-mono text-red-600">
                          − {formatCurrency(descontoNegociado)}
                        </td>
                      </tr>
                    )}
                    {isAvista && (
                      <tr>
                        <td className="font-bold bg-slate-100 border border-slate-300 p-1 text-emerald-800">
                          Desconto À Vista ({proposal.desc_vista_percent}%):
                        </td>
                        <td className="border border-slate-300 p-1 text-right font-mono text-emerald-700 font-bold">
                          − {formatCurrency(descontoVista)}
                        </td>
                      </tr>
                    )}
                    {!isAvista && selectedInstallment && !selectedInstallment.isSemJuros && (
                      <tr>
                        <td className="font-bold bg-slate-100 border border-slate-300 p-1 text-slate-700">
                          Juros ({selectedInstallment.n}x):
                        </td>
                        <td className="border border-slate-300 p-1 text-right font-mono text-slate-800 font-semibold">
                          + {formatCurrency(selectedInstallment.total - totalPrazo)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-100">
                      <td className="font-bold border border-slate-300 p-1 text-[9.5px]">
                        Total Final:
                      </td>
                      <td className="border border-slate-300 p-1 text-right font-mono font-bold text-[10.5px] text-[#1a365d]">
                        {formatCurrency(displayedTotalFinal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Parcelamento - Exibido na linha de baixo das condições de negociação quando selecionado Cartão ou Boleto/PIX */}
        {(formaPagamento === 'cartao' || formaPagamento === 'boleto_pix_parcelado') && (
          <div className="mt-2 mb-2 border border-slate-300 rounded-xs overflow-hidden">
            <div className="bg-[#1e3a8a] text-white font-bold px-2 py-0.5 text-[8.5px] uppercase tracking-wide flex items-center justify-between">
              <span>
                {formaPagamento === 'cartao'
                  ? `PARCELAMENTO NO CARTÃO DE CRÉDITO (${isRevenda ? `Até 10x com juros de ${proposal.juros_revenda_percent !== undefined ? proposal.juros_revenda_percent : 1.0}% a.m.` : 'Até 10x SEM JUROS'})`
                  : `PARCELAMENTO NO BOLETO / PIX (Até 3x sem juros | 4x a 10x com juros de 2% a.m.)`}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[7.5px] font-normal text-blue-100">
                  Condição Selecionada: <strong>{currentParcelas}x</strong>
                </span>
                <span className="text-[7px] text-blue-200 print:hidden font-normal">
                  (Clique em uma coluna para selecionar)
                </span>
              </div>
            </div>
            <table className="w-full border-collapse text-[8px] text-center">
              <thead>
                <tr className="bg-slate-700 text-white font-bold">
                  {installments.map(inst => {
                    const isSelected = currentParcelas === inst.n;
                    return (
                      <th 
                        key={inst.n} 
                        onClick={() => onUpdateProposal && onUpdateProposal({ num_parcelas: inst.n })}
                        className={`p-0.5 cursor-pointer transition-colors border ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-700 font-extrabold' 
                            : 'border-slate-600 hover:bg-slate-600'
                        }`}
                        title={`Selecionar ${inst.n} parcelas`}
                      >
                        {inst.n}x {isSelected && '✓'}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  {installments.map(inst => {
                    const isSelected = currentParcelas === inst.n;
                    return (
                      <td 
                        key={inst.n} 
                        onClick={() => onUpdateProposal && onUpdateProposal({ num_parcelas: inst.n })}
                        className={`border p-1 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-blue-100/80 border-2 border-blue-600 ring-1 ring-blue-400 font-bold shadow-2xs' 
                            : inst.isSemJuros 
                            ? 'border-slate-300 bg-emerald-50/30 hover:bg-blue-50/50' 
                            : 'border-slate-300 bg-slate-50/30 hover:bg-blue-50/50'
                        }`}
                        title={`Definir proposta com ${inst.n}x de ${formatCurrency(inst.parcela)}`}
                      >
                        <div className={`text-[8.5px] ${isSelected ? 'font-black text-blue-950' : 'font-bold text-slate-900'}`}>
                          {formatCurrency(inst.parcela)}
                        </div>
                        {inst.isSemJuros ? (
                          <div className={`text-[7px] font-semibold ${isSelected ? 'text-emerald-800' : 'text-emerald-700'}`}>
                            Sem juros
                          </div>
                        ) : (
                          <div className="text-[7px] text-slate-500">Total: {formatCurrency(inst.total)}</div>
                        )}
                        {isSelected && (
                          <div className="mt-0.5 inline-block text-[6.5px] font-extrabold text-blue-900 bg-blue-200/90 px-1 py-0.2 rounded">
                            ✓ Selecionada
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 1.e: Commercial Observations com botão de edição via popup de parâmetros */}
        <div className="bg-[#2b6cb0] text-white font-bold px-2 py-0.5 text-[9px] uppercase tracking-wide mt-2 mb-1 flex items-center justify-between">
          <span>OBSERVAÇÕES COMERCIAIS</span>
          <button
            type="button"
            onClick={() => setIsParamsModalOpen(true)}
            className="text-[8px] text-white/90 hover:text-white font-normal underline print:hidden"
          >
            Editar nos Parâmetros
          </button>
        </div>
        <table className="w-full border-collapse text-[8.5px]">
          <tbody>
            <tr>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1 w-[18%]">Instalação:</td>
              <td className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.obs_instalacao || ''}
                  onChange={(e) => onUpdateProposal({ obs_instalacao: e.target.value })}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none text-[8.5px]"
                />
              </td>
            </tr>
            <tr>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1">Entrega:</td>
              <td className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.obs_entrega || ''}
                  onChange={(e) => onUpdateProposal({ obs_entrega: e.target.value })}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none text-[8.5px]"
                />
              </td>
            </tr>
            <tr>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1">Prazo de Entrega:</td>
              <td className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.obs_prazo || ''}
                  onChange={(e) => onUpdateProposal({ obs_prazo: e.target.value })}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none text-[8.5px]"
                />
              </td>
            </tr>
            <tr>
              <td className="font-bold bg-slate-100 border border-slate-300 p-1">Garantia de Fábrica:</td>
              <td className="border border-slate-300 p-1 hover:bg-blue-50/40">
                <input
                  type="text"
                  value={proposal.obs_garantia || ''}
                  onChange={(e) => onUpdateProposal({ obs_garantia: e.target.value })}
                  className="w-full text-slate-800 bg-transparent border-0 p-0 focus:outline-none text-[8.5px]"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bank Details */}
        <div className="bg-[#2b6cb0] text-white font-bold px-2 py-0.5 text-[9px] uppercase tracking-wide mt-2 mb-1">
          DADOS BANCÁRIOS PARA PAGAMENTO
        </div>
        <div className="border border-slate-300 bg-slate-50 p-1.5 text-[8.5px] leading-tight">
          <strong>Banco:</strong> {COMPANY_INFO.bank} &nbsp;|&nbsp; 
          <strong>Agência:</strong> {COMPANY_INFO.agency} &nbsp;|&nbsp; 
          <strong>Conta Corrente:</strong> {COMPANY_INFO.account} &nbsp;|&nbsp; 
          <strong>Chave PIX (CNPJ):</strong> {COMPANY_INFO.pix} &nbsp;|&nbsp; 
          <strong>Favorecido:</strong> {COMPANY_INFO.pixName}
        </div>

        {/* Signatures */}
        <div className="mt-8 pt-4 grid grid-cols-2 gap-12 text-center text-[8.5px] text-slate-600">
          <div>
            <div className="border-t border-slate-400 pt-1 font-semibold text-slate-900">
              CVA COZINHAS E BANHOS
            </div>
            <div>{proposal.consultor || 'Carlos Alberto Parré'}</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1 font-semibold text-slate-900">
              ACEITE DO CLIENTE
            </div>
            <div>{proposal.cliente.nome || 'Nome do Cliente'}</div>
          </div>
        </div>
      </div>

      {/* MODALS INTEGRADOS */}

      {/* 1.e: Modal de Parâmetros Comerciais */}
      <ParametersModal
        isOpen={isParamsModalOpen}
        onClose={() => setIsParamsModalOpen(false)}
        proposal={proposal}
        onUpdateProposal={onUpdateProposal}
        consultant={currentConsultantObj}
      />

      {/* 1.d: Modal de Catálogo de Produtos */}
      <ProductCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        products={products}
        faturamentoTipo={proposal.faturamento_tipo}
        onAddToCart={onAddToCart}
        onRefreshProducts={onRefreshProducts}
      />

      {/* 1.c: Modal de Cadastro / Edição de Cliente */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        mode={clientModalMode}
        initialClient={clientModalMode === 'new' ? undefined : proposal.cliente}
        onSave={async (cli) => {
          await onSaveClient(cli);
          onUpdateProposal({
            cliente: {
              ...proposal.cliente,
              nome: cli.nome,
              doc: cli.doc || cli.cnpj || cli.cpf || '',
              rg: cli.ie || proposal.cliente.rg || '',
              tel: cli.tel || '',
              email: cli.email || '',
              endereco: cli.endereco || '',
              cidade_uf: cli.cidade_uf || 'Campo Grande / MS',
              cep: cli.cep || '',
            },
            ...(cli.profissional ? { arquiteto_parceiro: cli.profissional } : {})
          });
        }}
      />

      {/* 1.b: Modal de Cadastro / Edição de Consultor */}
      {onSaveConsultant && (
        <ConsultantModal
          isOpen={isConsultantModalOpen}
          onClose={() => setIsConsultantModalOpen(false)}
          mode={consultantModalMode}
          initialConsultant={consultantModalMode === 'edit' ? currentConsultantObj : { nome: proposal.consultor }}
          onSave={async (cons) => {
            await onSaveConsultant(cons);
            onUpdateProposal({ consultor: cons.nome });
          }}
          onDelete={onDeleteConsultant ? async (idOrNome) => {
            await onDeleteConsultant(idOrNome);
            onUpdateProposal({ consultor: '' });
          } : undefined}
        />
      )}

      {/* Modal de Cadastro / Edição de Profissional (Arquiteto, Designer, etc.) */}
      <ProfessionalModal
        isOpen={isProfissionalModalOpen}
        onClose={() => setIsProfissionalModalOpen(false)}
        mode={profissionalModalMode}
        initialProfissional={profissionalModalMode === 'edit' ? currentProfissionalObj : undefined}
        onSave={async (prof) => {
          if (onSaveProfissional) {
            await onSaveProfissional(prof);
          }
          onUpdateProposal({ arquiteto_parceiro: prof.nome });
        }}
        onDelete={onDeleteProfissional ? async (idOrNome) => {
          await onDeleteProfissional(idOrNome);
          onUpdateProposal({ arquiteto_parceiro: '' });
        } : undefined}
      />

      {/* Modal de Seleção da Forma de Pagamento */}
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedMethod={formaPagamento}
        selectedParcelas={currentParcelas}
        onSelectMethod={(method, parcelas) => {
          onUpdateProposal({ 
            forma_pagamento: method,
            num_parcelas: parcelas || (method === 'cartao' ? 10 : method === 'boleto_pix_parcelado' ? 3 : 1)
          });
        }}
        faturamentoTipo={proposal.faturamento_tipo}
        totalVista={totalVista}
        totalPrazo={totalPrazo}
        descVistaPercent={proposal.desc_vista_percent}
        jurosRevendaPercent={proposal.juros_revenda_percent !== undefined ? proposal.juros_revenda_percent : 1.0}
        descAplicadoPercent={proposal.desc_aplicado_percent}
        onUpdateDescAplicado={(desc) => onUpdateProposal({ desc_aplicado_percent: desc })}
        canGiveAdditionalDiscount={canGiveAdditionalDiscount}
        maxDescNegociado={maxDescNegociado}
        cargoConsultorLabel={cargoConsultorLabel}
      />
    </div>
  );
};
