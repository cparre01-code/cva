import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  supabase, 
  saveBudgetToSupabase, 
  fetchBudgetsFromSupabase, 
  deleteBudgetFromSupabase,
  saveClientToSupabase,
  fetchClientsFromSupabase,
  fetchConsultoresFromSupabase,
  fetchConsultoresDetalhesFromSupabase,
  saveConsultorToSupabase,
  deleteConsultorFromSupabase,
  fetchProfissionaisFromSupabase,
  saveProfissionalToSupabase,
  deleteProfissionalFromSupabase,
  fetchProductsFromSupabase
} from './lib/supabase';
import { 
  Product, 
  Client, 
  CartItem, 
  ProposalData, 
  ProfitParams, 
  BudgetRecord,
  Consultant,
  Profissional
} from './types';
import { 
  DEFAULT_PRODUCTS, 
  DEFAULT_CLIENTS, 
  DEFAULT_CONSULTORES,
  DEFAULT_CONSULTORES_DETALHES,
  DEFAULT_PROFISSIONAIS
} from './data/initialData';
import { calculateProfitResult, calculateBudgetTotals, calculateInstallments, getNextBudgetNumber } from './utils/calculations';
import { Header } from './components/Header';
import { ProposalPreview } from './components/ProposalPreview';
import { AuthModal } from './components/AuthModal';
import { ProfitModal } from './components/ProfitModal';
import { SavedBudgetsModal } from './components/SavedBudgetsModal';
import { BrandOrdersModal } from './components/BrandOrdersModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { NewBudgetModal } from './components/NewBudgetModal';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Active budget tracking
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profitModalOpen, setProfitModalOpen] = useState(false);
  const [savedBudgetsModalOpen, setSavedBudgetsModalOpen] = useState(false);
  const [brandOrdersModalOpen, setBrandOrdersModalOpen] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [newBudgetModalOpen, setNewBudgetModalOpen] = useState(false);

  // Data collections
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem('cva_products_cache');
    return cached ? JSON.parse(cached) : DEFAULT_PRODUCTS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const cached = localStorage.getItem('cva_clients_cache');
    return cached ? JSON.parse(cached) : DEFAULT_CLIENTS;
  });

  const [consultores, setConsultores] = useState<string[]>(() => {
    const cached = localStorage.getItem('cva_consultores_cache');
    return cached ? JSON.parse(cached) : DEFAULT_CONSULTORES;
  });

  const [consultoresDetalhes, setConsultoresDetalhes] = useState<Consultant[]>(() => {
    const cached = localStorage.getItem('cva_consultores_detalhes_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_CONSULTORES_DETALHES;
  });

  const [profissionais, setProfissionais] = useState<Profissional[]>(() => {
    const cached = localStorage.getItem('cva_profissionais_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_PROFISSIONAIS;
  });

  // Saved budgets from Supabase
  const [savedBudgets, setSavedBudgets] = useState<BudgetRecord[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Proposal State
  const [proposal, setProposal] = useState<ProposalData>(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      num_orc: 'CVA-2026/001',
      data_orc: today,
      consultor: '',
      arquiteto_parceiro: '',
      faturamento_tipo: 'direto',
      forma_pagamento: 'a_vista',
      num_parcelas: 10,
      cliente: {
        nome: '',
        doc: '',
        rg: '',
        num: '',
        bairro: '',
        tel: '',
        email: '',
        endereco: '',
        cidade_uf: 'Campo Grande / MS',
        cep: '',
      },
      desc_vista_percent: 5,
      juros_revenda_percent: 1,
      desc_aplicado_percent: 0,
      obs_instalacao: 'Não Incluso',
      obs_entrega: 'Incluso (Dentro da cidade de Campo Grande / MS)',
      obs_prazo: 'Sob consulta - verificar a disponibilidade do produto.',
      obs_garantia: '03 ANOS',
    };
  });

  // Cart / Items in current proposal (inicia vazio / zerado)
  const [cart, setCart] = useState<CartItem[]>([]);

  // Profit analysis parameters
  const [profitParams, setProfitParams] = useState<ProfitParams>({
    comissao_vendedor: 2,
    comissao_profissional: 5,
    custo_operacional: 10,
    faturamento_12m: 1200000,
    pagamento_cliente: 'avista',
    prazo_fabrica: 'avista',
  });

  // Check Supabase session on mount & subscribe to auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setAuthModalOpen(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setAuthModalOpen(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch budgets from Supabase & set up real-time listener
  const loadBudgets = async () => {
    setLoadingBudgets(true);
    const { data, isLive } = await fetchBudgetsFromSupabase();
    setSavedBudgets(data);
    setIsOnline(isLive);
    setLoadingBudgets(false);
    return data;
  };

  useEffect(() => {
    const initBudgets = async () => {
      const data = await loadBudgets();
      // Inicializa o número de orçamento com o próximo número disponível e campos em branco
      const nextNum = getNextBudgetNumber(data || []);
      const today = new Date().toISOString().split('T')[0];
      setProposal(prev => ({
        ...prev,
        num_orc: nextNum,
        data_orc: today,
        consultor: '',
        cliente: {
          nome: '',
          doc: '',
          rg: '',
          num: '',
          bairro: '',
          tel: '',
          email: '',
          endereco: '',
          cidade_uf: 'Campo Grande / MS',
          cep: '',
        }
      }));

      // Carrega catálogo completo de produtos do Supabase
      try {
        const remoteProds = await fetchProductsFromSupabase();
        if (remoteProds && remoteProds.length > 0) {
          setProducts(remoteProds);
        }
      } catch (err) {
        console.warn('Erro ao carregar produtos remotos:', err);
      }

      // Carrega lista de clientes cadastrados no Supabase
      try {
        const remoteClients = await fetchClientsFromSupabase();
        if (remoteClients && remoteClients.length > 0) {
          setClients(remoteClients);
        }
      } catch (err) {
        console.warn('Erro ao carregar clientes remotos:', err);
      }

      // Tenta carregar lista dinâmica de consultores e seus cargos/regras de negociação do Supabase
      try {
        const remoteConsDetalhes = await fetchConsultoresDetalhesFromSupabase();
        const remoteCons = await fetchConsultoresFromSupabase();

        const consMap = new Map<string, Consultant>();

        // 1. Sempre inclui os consultores padrão da empresa com seus cargos e alçadas
        DEFAULT_CONSULTORES_DETALHES.forEach(c => {
          consMap.set(c.nome.trim().toLowerCase(), c);
        });

        // 2. Mescla com os consultores vindos do Supabase (prioridade para dados salvos no banco)
        (remoteConsDetalhes || []).forEach(c => {
          if (c.nome && c.nome.trim()) {
            const key = c.nome.trim().toLowerCase();
            const existing = consMap.get(key) || {};
            consMap.set(key, { ...existing, ...c });
          }
        });

        // 3. Mescla com nomes simples de consultores do banco caso não estejam no mapa
        (remoteCons || []).forEach(nome => {
          if (nome && nome.trim()) {
            const key = nome.trim().toLowerCase();
            if (!consMap.has(key)) {
              consMap.set(key, {
                nome: nome.trim(),
                cargo: 'vendedor',
                desconto_maximo: 5.0,
                desconto_max_vista: 5.0,
                margem_minima: 15.0,
                comissao_padrao: 2.0,
                pode_alterar_comissao: false,
                pode_aprovar_excecao: false,
                ativo: true,
              });
            }
          }
        });

        // 4. Mescla qualquer consultor presente nos orçamentos salvos
        (data || []).forEach(b => {
          if (b.consultor && b.consultor.trim()) {
            const key = b.consultor.trim().toLowerCase();
            if (!consMap.has(key)) {
              consMap.set(key, {
                nome: b.consultor.trim(),
                cargo: 'vendedor',
                desconto_maximo: 5.0,
                desconto_max_vista: 5.0,
                margem_minima: 15.0,
                comissao_padrao: 2.0,
                pode_alterar_comissao: false,
                pode_aprovar_excecao: false,
                ativo: true,
              });
            }
          }
        });

        const mergedDetails = Array.from(consMap.values());
        const mergedNomes = mergedDetails.map(c => c.nome);

        setConsultoresDetalhes(mergedDetails);
        setConsultores(mergedNomes);

        // Se o Supabase tiver menos de 2 consultores gravados, sincroniza os padrões em segundo plano
        if (!remoteConsDetalhes || remoteConsDetalhes.length < 2) {
          for (const c of DEFAULT_CONSULTORES_DETALHES) {
            saveConsultorToSupabase(c).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar consultores:', err);
      }

      // Carrega lista de profissionais parceiros (arquitetos, designers, etc.) do Supabase
      try {
        const remoteProfs = await fetchProfissionaisFromSupabase();
        if (remoteProfs && remoteProfs.length > 0) {
          setProfissionais(remoteProfs);
        }
      } catch (err) {
        console.warn('Erro ao carregar profissionais parceiros:', err);
      }
    };

    initBudgets();

    // Supabase Real-time Channel
    const channel = supabase
      .channel('budgets-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets' },
        () => {
          loadBudgets();
        }
      )
      .subscribe((status) => {
        setIsOnline(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Save caches locally
  useEffect(() => {
    localStorage.setItem('cva_products_cache', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cva_clients_cache', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('cva_consultores_cache', JSON.stringify(consultores));
  }, [consultores]);

  useEffect(() => {
    localStorage.setItem('cva_consultores_detalhes_cache', JSON.stringify(consultoresDetalhes));
  }, [consultoresDetalhes]);

  useEffect(() => {
    localStorage.setItem('cva_profissionais_cache', JSON.stringify(profissionais));
  }, [profissionais]);

  // Live Profit Calculation
  const profitResult = useMemo(() => {
    return calculateProfitResult(cart, proposal, profitParams);
  }, [cart, proposal, profitParams]);

  // Handlers for cart
  const handleAddToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
    showToast(`"${item.name}" adicionado ao orçamento!`);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    showToast('Item removido do orçamento.');
  };

  const handleUpdateCartItemQty = (index: number, newQty: number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, qtd: Math.max(1, newQty) } : item));
  };

  const handleUpdateCartItemPrice = (index: number, newPrice: number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, price: newPrice } : item));
  };

  const handleUpdateProposal = (updates: Partial<ProposalData>) => {
    setProposal(prev => ({ ...prev, ...updates }));
  };

  const handleUpdateClientField = (field: string, val: string) => {
    setProposal(prev => ({
      ...prev,
      cliente: {
        ...prev.cliente,
        [field]: val.trim() === '--' ? '' : val.trim(),
      }
    }));
  };

  // Save budget to Supabase
  const handleSaveBudget = async () => {
    setSavingBudget(true);
    const formaPagamento = proposal.forma_pagamento || 'a_vista';
    const isAvista = formaPagamento === 'a_vista';
    const { subtotal, totalDesconto, totalVista, totalPrazo } = calculateBudgetTotals(
      cart,
      proposal.faturamento_tipo,
      proposal.desc_vista_percent,
      proposal.desc_aplicado_percent,
      isAvista
    );

    const installments = calculateInstallments(
      totalPrazo,
      proposal.faturamento_tipo,
      formaPagamento,
      proposal.juros_revenda_percent !== undefined ? proposal.juros_revenda_percent : 1.0
    );
    const numParcelas = proposal.num_parcelas || (formaPagamento === 'cartao' ? 10 : formaPagamento === 'boleto_pix_parcelado' ? 3 : 1);
    const selectedInst = installments.find(i => i.n === numParcelas) || installments[installments.length - 1];

    const finalTotalValue = isAvista
      ? totalVista
      : (selectedInst && !selectedInst.isSemJuros ? selectedInst.total : totalPrazo);

    const budgetRecord: BudgetRecord = {
      num_orc: proposal.num_orc,
      client_name: proposal.cliente.nome || 'Cliente não identificado',
      client_doc: proposal.cliente.doc,
      client_data: proposal.cliente,
      arquiteto_parceiro: proposal.arquiteto_parceiro || '',
      consultor: proposal.consultor,
      faturamento_tipo: proposal.faturamento_tipo,
      forma_pagamento: formaPagamento,
      num_parcelas: numParcelas,
      date_orc: proposal.data_orc,
      items: cart,
      subtotal,
      discount: totalDesconto,
      total_final: finalTotalValue,
      profit_estimate: profitResult.profit,
      user_id: user?.id,
      user_email: user?.email,
      desc_vista_percent: proposal.desc_vista_percent,
      juros_revenda_percent: proposal.juros_revenda_percent,
      desc_aplicado_percent: proposal.desc_aplicado_percent,
      obs_instalacao: proposal.obs_instalacao,
      obs_entrega: proposal.obs_entrega,
      obs_prazo: proposal.obs_prazo,
      obs_garantia: proposal.obs_garantia,
    };

    if (activeBudgetId && !activeBudgetId.startsWith('loc_')) {
      budgetRecord.id = activeBudgetId;
    }

    const { data, error, isLocalFallback } = await saveBudgetToSupabase(budgetRecord);
    setSavingBudget(false);

    if (error) {
      showToast('Falha ao salvar orçamento: ' + error.message, 'error');
    } else if (isLocalFallback) {
      if (data?.id) setActiveBudgetId(data.id);
      showToast(`Orçamento ${proposal.num_orc} salvo com sucesso no cache local!`);
      loadBudgets();
    } else {
      if (data?.id) setActiveBudgetId(data.id);
      showToast(`Orçamento ${proposal.num_orc} sincronizado em tempo real no Supabase!`);
      loadBudgets();
    }
  };

  // Load selected budget into active editor
  const handleLoadBudget = (b: BudgetRecord) => {
    // 1. Extração segura de client_data caso venha como string JSON ou objeto
    let clientObj: any = {};
    if (b.client_data) {
      if (typeof b.client_data === 'string') {
        try {
          clientObj = JSON.parse(b.client_data);
        } catch {
          clientObj = {};
        }
      } else if (typeof b.client_data === 'object') {
        clientObj = b.client_data;
      }
    }

    // 2. Determinação precisa do nome do cliente
    let resolvedName = '';
    if (clientObj.nome && typeof clientObj.nome === 'string' && clientObj.nome.trim() && clientObj.nome.trim() !== 'Cliente não identificado') {
      resolvedName = clientObj.nome.trim();
    } else if (b.client_name && b.client_name.trim() && b.client_name.trim() !== 'Cliente não identificado') {
      resolvedName = b.client_name.trim();
    }

    // 3. Busca cliente já cadastrado no banco para enriquecer informações
    const regClient = clients.find(c => 
      (resolvedName && c.nome && c.nome.trim().toLowerCase() === resolvedName.toLowerCase()) ||
      (c.doc && b.client_doc && c.doc.trim() === b.client_doc.trim()) ||
      (c.doc && clientObj.doc && c.doc.trim() === clientObj.doc.trim())
    );

    if (!resolvedName && regClient?.nome) {
      resolvedName = regClient.nome;
    }

    const finalClientName = resolvedName || (b.client_name && b.client_name !== 'Cliente não identificado' ? b.client_name : '');

    const clientFullData = {
      nome: finalClientName,
      doc: clientObj.doc || b.client_doc || regClient?.doc || regClient?.cnpj || regClient?.cpf || '',
      rg: clientObj.rg || regClient?.ie || '',
      tel: clientObj.tel || regClient?.tel || '',
      email: clientObj.email || regClient?.email || '',
      endereco: clientObj.endereco || regClient?.endereco || '',
      num: clientObj.num || regClient?.num || '',
      bairro: clientObj.bairro || regClient?.bairro || '',
      cidade_uf: clientObj.cidade_uf || regClient?.cidade_uf || 'Campo Grande / MS',
      cep: clientObj.cep || regClient?.cep || '',
      profissional: clientObj.profissional || regClient?.profissional || '',
    };

    setProposal({
      num_orc: b.num_orc || proposal.num_orc,
      data_orc: b.date_orc || proposal.data_orc,
      consultor: b.consultor || proposal.consultor,
      arquiteto_parceiro: b.arquiteto_parceiro || (b.client_data as any)?.arquiteto_parceiro || (b.client_data as any)?.profissional || '',
      faturamento_tipo: b.faturamento_tipo || 'direto',
      forma_pagamento: b.forma_pagamento || 'a_vista',
      num_parcelas: b.num_parcelas || 10,
      cliente: clientFullData,
      desc_vista_percent: b.desc_vista_percent !== undefined ? Number(b.desc_vista_percent) : 5,
      juros_revenda_percent: b.juros_revenda_percent !== undefined ? Number(b.juros_revenda_percent) : 1,
      desc_aplicado_percent: b.desc_aplicado_percent !== undefined ? Number(b.desc_aplicado_percent) : 0,
      obs_instalacao: b.obs_instalacao || 'Não Incluso',
      obs_entrega: b.obs_entrega || 'Incluso (Dentro da cidade de Campo Grande / MS)',
      obs_prazo: b.obs_prazo || 'Sob consulta - verificar a disponibilidade do produto.',
      obs_garantia: b.obs_garantia || '03 ANOS',
    });

    setCart(b.items || []);
    setActiveBudgetId(b.id || null);
    showToast(`Orçamento ${b.num_orc} carregado para o cliente: ${finalClientName || 'Sem nome'}`);
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      await deleteBudgetFromSupabase(id);
      showToast('Orçamento excluído.');
      loadBudgets();
    }
  };

  // Cria um novo orçamento trazendo como número um acima do maior salvo
  const handleNewBudget = (overrideList?: BudgetRecord[]) => {
    const listToUse = overrideList || savedBudgets;
    const nextNum = getNextBudgetNumber(listToUse);
    const today = new Date().toISOString().split('T')[0];

    setActiveBudgetId(null);
    setProposal({
      num_orc: nextNum,
      data_orc: today,
      consultor: '',
      arquiteto_parceiro: '',
      faturamento_tipo: 'direto',
      forma_pagamento: 'a_vista',
      num_parcelas: 10,
      cliente: {
        nome: '',
        doc: '',
        rg: '',
        num: '',
        bairro: '',
        tel: '',
        email: '',
        endereco: '',
        cidade_uf: 'Campo Grande / MS',
        cep: '',
      },
      desc_vista_percent: 5,
      juros_revenda_percent: 1,
      desc_aplicado_percent: 0,
      obs_instalacao: 'Não Incluso',
      obs_entrega: 'Incluso (Dentro da cidade de Campo Grande / MS)',
      obs_prazo: 'Sob consulta - verificar a disponibilidade do produto.',
      obs_garantia: '03 ANOS',
    });
    setCart([]);
    showToast(`Novo orçamento ${nextNum} criado.`);
  };

  // Dispara o fluxo de abertura de novo orçamento:
  // Se houver dados (itens ou cliente preenchido), pergunta se deseja salvar o orçamento atual antes
  const handleRequestNewBudget = () => {
    const hasData = cart.length > 0 || (proposal.cliente.nome && proposal.cliente.nome.trim().length > 0);
    if (hasData) {
      setNewBudgetModalOpen(true);
    } else {
      // Já está em branco, apenas gera e garante a próxima numeração
      handleNewBudget();
    }
  };

  const handleSaveAndStartNewBudget = async () => {
    try {
      await handleSaveBudget();
      setNewBudgetModalOpen(false);
      // Busca lista atualizada para garantir a numeração sequencial exata após salvar
      const { data: updatedList } = await fetchBudgetsFromSupabase();
      if (updatedList && updatedList.length > 0) {
        setSavedBudgets(updatedList);
        handleNewBudget(updatedList);
      } else {
        handleNewBudget();
      }
      showToast('Orçamento atual salvo e novo orçamento iniciado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar e iniciar novo:', err);
      setNewBudgetModalOpen(false);
      handleNewBudget();
    }
  };

  const handleDiscardAndStartNewBudget = () => {
    setNewBudgetModalOpen(false);
    handleNewBudget();
  };

  // Confirma e apaga o orçamento atual
  const handleConfirmDeleteCurrentBudget = async () => {
    const budgetToDelete = activeBudgetId 
      ? savedBudgets.find(b => b.id === activeBudgetId) 
      : savedBudgets.find(b => b.num_orc === proposal.num_orc);

    if (budgetToDelete?.id) {
      await deleteBudgetFromSupabase(budgetToDelete.id);
      showToast(`Orçamento ${proposal.num_orc} apagado com sucesso.`);
      const remainingBudgets = savedBudgets.filter(b => b.id !== budgetToDelete.id);
      setSavedBudgets(remainingBudgets);
      handleNewBudget(remainingBudgets);
    } else {
      showToast(`Orçamento ${proposal.num_orc} limpo.`);
      handleNewBudget();
    }
  };

  const handleSaveClient = async (cli: Client) => {
    const { data, error } = await saveClientToSupabase(cli);
    const saved = data || cli;

    // Atualiza lista local de clientes
    setClients(prev => {
      const idx = prev.findIndex(c => 
        c.nome.toLowerCase() === saved.nome.toLowerCase() || 
        (saved.doc && c.doc && c.doc === saved.doc)
      );
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });

    // Atualiza dados do cliente na proposta ativa
    setProposal(prev => ({
      ...prev,
      cliente: {
        nome: saved.nome,
        doc: saved.doc || saved.cnpj || saved.cpf || '',
        rg: saved.ie || prev.cliente.rg,
        tel: saved.tel || prev.cliente.tel,
        email: saved.email || prev.cliente.email,
        endereco: saved.endereco || prev.cliente.endereco,
        cidade_uf: saved.cidade_uf || prev.cliente.cidade_uf || 'Campo Grande / MS',
        cep: saved.cep || prev.cliente.cep,
        profissional: saved.profissional || prev.cliente.profissional,
      }
    }));

    if (error) {
      showToast(`Cliente "${saved.nome}" salvo no cache local.`);
    } else {
      showToast(`Cliente "${saved.nome}" sincronizado no Supabase!`);
    }
  };

  const handleSaveConsultant = async (cons: Consultant) => {
    const { data, error } = await saveConsultorToSupabase(cons);
    const saved = data || cons;

    setConsultoresDetalhes(prev => {
      const idx = prev.findIndex(c => c.nome.toLowerCase() === saved.nome.toLowerCase());
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });

    setConsultores(prev => {
      if (!prev.some(c => c.toLowerCase() === saved.nome.toLowerCase())) {
        return [...prev, saved.nome];
      }
      return prev;
    });

    setProposal(prev => ({
      ...prev,
      consultor: saved.nome,
    }));

    if (error) {
      showToast(`Consultor "${saved.nome}" salvo no cache local.`);
    } else {
      showToast(`Consultor(a) "${saved.nome}" (${saved.cargo}) salvo no Supabase!`);
    }
  };

  const handleDeleteConsultant = async (idOrNome: string) => {
    await deleteConsultorFromSupabase(idOrNome);
    setConsultores(prev => prev.filter(c => c.toLowerCase() !== idOrNome.toLowerCase()));
    setConsultoresDetalhes(prev => prev.filter(c => c.id !== idOrNome && c.nome.toLowerCase() !== idOrNome.toLowerCase()));
    if (proposal.consultor && (proposal.consultor.toLowerCase() === idOrNome.toLowerCase() || idOrNome.includes('-'))) {
      setProposal(prev => ({
        ...prev,
        consultor: '',
      }));
    }
    showToast(`Consultor(a) "${idOrNome}" excluído.`);
  };

  const handleSaveProfissional = async (prof: Profissional) => {
    const { data, error } = await saveProfissionalToSupabase(prof);
    const saved = data || prof;

    setProfissionais(prev => {
      const idx = prev.findIndex(p => 
        (saved.id && p.id === saved.id) || 
        (p.nome && saved.nome && p.nome.trim().toLowerCase() === saved.nome.trim().toLowerCase())
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });

    setProposal(prev => ({
      ...prev,
      arquiteto_parceiro: saved.nome,
    }));

    if (error) {
      showToast(`Profissional "${saved.nome}" salvo no cache local.`);
    } else {
      showToast(`Profissional "${saved.nome}" (${saved.tipo}) salvo com sucesso!`);
    }
  };

  const handleDeleteProfissional = async (idOrNome: string) => {
    await deleteProfissionalFromSupabase(idOrNome);
    setProfissionais(prev => prev.filter(p => p.id !== idOrNome && p.nome?.toLowerCase() !== idOrNome.toLowerCase()));
    if (proposal.arquiteto_parceiro && (proposal.arquiteto_parceiro.toLowerCase() === idOrNome.toLowerCase() || idOrNome.includes('-'))) {
      setProposal(prev => ({
        ...prev,
        arquiteto_parceiro: '',
      }));
    }
    showToast(`Profissional "${idOrNome}" excluído.`);
  };

  const handleRefreshProducts = async () => {
    const remoteProds = await fetchProductsFromSupabase();
    if (remoteProds && remoteProds.length > 0) {
      setProducts(remoteProds);
      showToast(`Catálogo atualizado: ${remoteProds.length} produtos disponíveis!`);
    } else {
      showToast(`Catálogo verificado: ${products.length} produtos disponíveis.`);
    }
  };

  const handleImportExcelData = (newProds: Product[], newClients: Client[], newCons: string[]) => {
    if (newProds.length > 0) setProducts(newProds);
    if (newClients.length > 0) setClients(newClients);
    if (newCons.length > 0) setConsultores(newCons);
    showToast('Dados da planilha integrados ao sistema.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast message */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold text-white ${
            toast.type === 'success' ? 'bg-slate-900 border-l-4 border-emerald-500' : 'bg-red-800 border-l-4 border-red-400'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Layout (Página Única Full-Width com Edição Direta) */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 lg:p-8">
        <ProposalPreview
          proposal={proposal}
          cart={cart}
          products={products}
          clients={clients}
          consultores={consultores}
          consultoresDetalhes={consultoresDetalhes}
          profissionais={profissionais}
          profitResult={profitResult}
          isOnline={isOnline}
          onAddToCart={handleAddToCart}
          onRemoveItem={handleRemoveFromCart}
          onUpdateCartItemQty={handleUpdateCartItemQty}
          onUpdateCartItemPrice={handleUpdateCartItemPrice}
          onOpenProfitModal={() => setProfitModalOpen(true)}
          onOpenBrandOrders={() => setBrandOrdersModalOpen(true)}
          onOpenSavedBudgets={() => {
            loadBudgets();
            setSavedBudgetsModalOpen(true);
          }}
          onSaveToSupabase={handleSaveBudget}
          savingBudget={savingBudget}
          onUpdateClientField={handleUpdateClientField}
          onUpdateProposal={handleUpdateProposal}
          onSaveClient={handleSaveClient}
          onSaveConsultant={handleSaveConsultant}
          onDeleteConsultant={handleDeleteConsultant}
          onSaveProfissional={handleSaveProfissional}
          onDeleteProfissional={handleDeleteProfissional}
          onRefreshProducts={handleRefreshProducts}
          onDeleteBudget={() => setConfirmDeleteModalOpen(true)}
          onNewBudget={handleRequestNewBudget}
        />
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={() => {
          loadBudgets();
          showToast('Autenticado com sucesso no Supabase!');
        }}
      />

      <ProfitModal
        isOpen={profitModalOpen}
        onClose={() => setProfitModalOpen(false)}
        params={profitParams}
        onUpdateParams={(updates) => setProfitParams(prev => ({ ...prev, ...updates }))}
        result={profitResult}
      />

      <SavedBudgetsModal
        isOpen={savedBudgetsModalOpen}
        onClose={() => setSavedBudgetsModalOpen(false)}
        budgets={savedBudgets}
        onLoadBudget={handleLoadBudget}
        onDeleteBudget={handleDeleteBudget}
        loading={loadingBudgets}
        onRefresh={loadBudgets}
      />

      <BrandOrdersModal
        isOpen={brandOrdersModalOpen}
        onClose={() => setBrandOrdersModalOpen(false)}
        cart={cart}
        proposal={proposal}
      />

      {/* Modal de Confirmação de Exclusão do Orçamento Atual */}
      <ConfirmDeleteModal
        isOpen={confirmDeleteModalOpen}
        onClose={() => setConfirmDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteCurrentBudget}
        budgetNum={proposal.num_orc}
        clientName={proposal.cliente.nome}
        total={profitResult.saleTotal}
      />

      {/* Modal de Confirmação para Iniciar Novo Orçamento */}
      <NewBudgetModal
        isOpen={newBudgetModalOpen}
        onClose={() => setNewBudgetModalOpen(false)}
        onSaveAndNew={handleSaveAndStartNewBudget}
        onDiscardAndNew={handleDiscardAndStartNewBudget}
        budgetNum={proposal.num_orc}
        clientName={proposal.cliente.nome}
        itemCount={cart.reduce((acc, i) => acc + i.qtd, 0)}
        total={profitResult.saleTotal}
        saving={savingBudget}
      />
    </div>
  );
}
