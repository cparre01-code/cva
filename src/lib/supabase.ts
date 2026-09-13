import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BudgetRecord, Client, Consultant, Product, Profissional } from '../types';

// The user provided:
// SUPABASE_URL="https://aphtumfkwnsohsgdzofi.supabase.co/rest/v1/"
// SUPABASE_KEY="sb_publishable_X5V5n6aDRI9hNwugmdE-CA_nMd3Xxkk"
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || "https://aphtumfkwnsohsgdzofi.supabase.co/rest/v1/").trim();
const rawKey = (import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_X5V5n6aDRI9hNwugmdE-CA_nMd3Xxkk").trim();

// Normalize URL for Supabase JS client which expects base URL e.g. "https://xxxx.supabase.co"
export function cleanSupabaseUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export const SUPABASE_URL = cleanSupabaseUrl(rawUrl);
export const SUPABASE_KEY = rawKey;

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  }
});

// Storage fallback keys
const LOCAL_BUDGETS_KEY = 'cva_local_budgets_fallback';
const LOCAL_CLIENTS_KEY = 'cva_local_clients_fallback';

export function getLocalBudgets(): BudgetRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_BUDGETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalBudget(budget: BudgetRecord): BudgetRecord[] {
  try {
    const list = getLocalBudgets();
    const existingIdx = list.findIndex(b => b.num_orc === budget.num_orc || (budget.id && b.id === budget.id));
    const toSave = {
      ...budget,
      id: budget.id || 'loc_' + Date.now(),
      updated_at: new Date().toISOString(),
      created_at: budget.created_at || new Date().toISOString(),
    };
    if (existingIdx !== -1) {
      list[existingIdx] = toSave;
    } else {
      list.unshift(toSave);
    }
    localStorage.setItem(LOCAL_BUDGETS_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function deleteLocalBudget(id: string): BudgetRecord[] {
  try {
    const list = getLocalBudgets().filter(b => b.id !== id && b.num_orc !== id);
    localStorage.setItem(LOCAL_BUDGETS_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

// Database helper functions with automatic graceful fallback
export async function saveBudgetToSupabase(budget: BudgetRecord): Promise<{ data: BudgetRecord | null; error: Error | null; isLocalFallback?: boolean }> {
  // Always update local cache
  saveLocalBudget(budget);

  try {
    const payload: any = {
      num_orc: budget.num_orc,
      client_name: budget.client_name,
      client_doc: budget.client_doc || '',
      client_data: {
        ...budget.client_data,
        arquiteto_parceiro: budget.arquiteto_parceiro || '',
      },
      consultor: budget.consultor,
      arquiteto_parceiro: budget.arquiteto_parceiro || '',
      faturamento_tipo: budget.faturamento_tipo,
      date_orc: budget.date_orc,
      items: budget.items,
      subtotal: budget.subtotal,
      discount: budget.discount,
      total_final: budget.total_final,
      profit_estimate: budget.profit_estimate || 0,
      user_id: budget.user_id || null,
      user_email: budget.user_email || null,
      updated_at: new Date().toISOString(),
    };

    if (budget.id && !budget.id.startsWith('loc_')) {
      payload.id = budget.id;
    }

    let { data, error } = await supabase
      .from('budgets')
      .upsert(payload)
      .select()
      .single();

    // Caso a coluna arquiteto_parceiro ainda não exista no schema do Supabase, retenta sem a coluna raiz (mantendo no client_data)
    if (error && error.message?.includes('arquiteto_parceiro')) {
      delete payload.arquiteto_parceiro;
      const retry = await supabase
        .from('budgets')
        .upsert(payload)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('Supabase upsert warning (using local fallback sync):', error.message);
      return { data: budget, error: null, isLocalFallback: true };
    }

    return { data: data as BudgetRecord, error: null };
  } catch (err: any) {
    console.warn('Network error saving to Supabase, saved locally:', err.message);
    return { data: budget, error: null, isLocalFallback: true };
  }
}

export async function fetchBudgetsFromSupabase(): Promise<{ data: BudgetRecord[]; isLive: boolean }> {
  const localList = getLocalBudgets();

  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      console.info('Using local budgets list:', error?.message);
      return { data: localList, isLive: false };
    }

    // Merge Supabase data with any local-only budgets
    const remoteList = (data as any[]).map(b => ({
      ...b,
      arquiteto_parceiro: b.arquiteto_parceiro || b.client_data?.arquiteto_parceiro || b.client_data?.profissional || '',
    })) as BudgetRecord[];
    const remoteNums = new Set(remoteList.map(b => b.num_orc));
    const merged = [...remoteList, ...localList.filter(b => !remoteNums.has(b.num_orc))];

    return { data: merged, isLive: true };
  } catch (err) {
    return { data: localList, isLive: false };
  }
}

export async function deleteBudgetFromSupabase(id: string): Promise<boolean> {
  deleteLocalBudget(id);
  try {
    if (!id.startsWith('loc_')) {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) console.warn('Supabase delete error:', error.message);
    }
    return true;
  } catch {
    return true;
  }
}

// Client persistence
export async function saveClientToSupabase(client: Client): Promise<{ data: Client | null; error: Error | null }> {
  try {
    const payload: any = {
      nome: client.nome,
      razao: client.razao || client.nome,
      doc: client.doc,
      cnpj: client.cnpj || '',
      cpf: client.cpf || '',
      ie: client.ie || '',
      tel: client.tel || '',
      email: client.email || '',
      cep: client.cep || '',
      cidade_uf: client.cidade_uf || 'Campo Grande / MS',
      endereco: client.endereco || '',
      num: client.num || '',
      bairro: client.bairro || '',
      profissional: client.profissional || '',
      status: client.status || 'ativado',
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('clients')
      .upsert(payload, { onConflict: 'nome' })
      .select()
      .single();

    // Se as colunas num ou bairro ainda não existirem no Supabase, tenta salvar sem elas no banco
    if (error && (error.message?.includes('num') || error.message?.includes('bairro') || error.message?.includes('column'))) {
      delete payload.num;
      delete payload.bairro;
      const retry = await supabase
        .from('clients')
        .upsert(payload, { onConflict: 'nome' })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('Supabase client upsert:', error.message);
      return { data: client, error: null };
    }
    return { data: (data ? { ...client, ...data } : client) as Client, error: null };
  } catch (err: any) {
    return { data: client, error: null };
  }
}

export async function fetchClientsFromSupabase(): Promise<Client[]> {
  try {
    const { data, error } = await supabase.from('clients').select('*').order('nome', { ascending: true });
    if (error || !data) return [];
    return data as Client[];
  } catch {
    return [];
  }
}

export async function fetchConsultoresFromSupabase(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('consultores')
      .select('nome, ativo')
      .order('nome', { ascending: true });

    if (error || !data || data.length === 0) return [];
    return data
      .filter((c: { nome: string; ativo?: boolean | null }) => c.ativo !== false)
      .map((c: { nome: string }) => c.nome?.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function fetchConsultoresDetalhesFromSupabase(): Promise<Consultant[]> {
  try {
    const { data, error } = await supabase
      .from('consultores')
      .select('*')
      .order('nome', { ascending: true });

    if (error || !data) return [];
    return (data as Consultant[]).filter(c => c.ativo !== false && Boolean(c.nome));
  } catch {
    return [];
  }
}

export async function saveConsultorToSupabase(consultant: Consultant): Promise<{ data: Consultant | null; error: Error | null }> {
  try {
    const payload: any = {
      nome: consultant.nome.trim(),
      cargo: consultant.cargo || 'vendedor',
      email: consultant.email || '',
      telefone: consultant.telefone || '',
      cpf: consultant.cpf || '',
      desconto_maximo: consultant.desconto_maximo ?? 5.0,
      desconto_max_vista: consultant.desconto_max_vista ?? 5.0,
      margem_minima: consultant.margem_minima ?? 15.0,
      comissao_padrao: consultant.comissao_padrao ?? 2.0,
      pode_alterar_comissao: Boolean(consultant.pode_alterar_comissao),
      pode_aprovar_excecao: Boolean(consultant.pode_aprovar_excecao),
      ativo: consultant.ativo !== undefined ? Boolean(consultant.ativo) : true,
      updated_at: new Date().toISOString()
    };

    if (consultant.id && !consultant.id.startsWith('loc_')) {
      payload.id = consultant.id;
    }

    const { data, error } = await supabase
      .from('consultores')
      .upsert(payload, { onConflict: 'nome' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase consultor upsert error:', error.message);
      return { data: consultant, error: null };
    }
    return { data: data as Consultant, error: null };
  } catch (err: any) {
    return { data: consultant, error: null };
  }
}

export async function deleteConsultorFromSupabase(idOrNome: string): Promise<boolean> {
  try {
    // Tenta primeiro por id ou se for nome
    if (idOrNome.includes('-') && idOrNome.length > 20) {
      const { error } = await supabase.from('consultores').delete().eq('id', idOrNome);
      if (error) {
        await supabase.from('consultores').update({ ativo: false }).eq('id', idOrNome);
      }
    } else {
      const { error } = await supabase.from('consultores').delete().eq('nome', idOrNome);
      if (error) {
        await supabase.from('consultores').update({ ativo: false }).eq('nome', idOrNome);
      }
    }
    return true;
  } catch (err) {
    console.warn('Erro ao excluir consultor:', err);
    return true;
  }
}

// ==============================================================================
// PROFISSIONAIS (ARQUITETOS, DESIGNERS DE INTERIORES, ENGENHEIROS, PARCEIROS)
// ==============================================================================
const LOCAL_PROFISSIONAIS_KEY = 'cva_local_profissionais_fallback';

export function getLocalProfissionais(): Profissional[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROFISSIONAIS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalProfissional(prof: Profissional): Profissional[] {
  try {
    const list = getLocalProfissionais();
    const idx = list.findIndex(p => 
      (prof.id && p.id === prof.id) || 
      (p.nome && prof.nome && p.nome.trim().toLowerCase() === prof.nome.trim().toLowerCase())
    );
    const toSave: Profissional = {
      ...prof,
      id: prof.id || 'prof_loc_' + Date.now(),
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      list[idx] = toSave;
    } else {
      list.push(toSave);
    }
    localStorage.setItem(LOCAL_PROFISSIONAIS_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function deleteLocalProfissional(idOrNome: string): Profissional[] {
  try {
    const list = getLocalProfissionais().filter(p => 
      p.id !== idOrNome && 
      p.nome?.trim().toLowerCase() !== idOrNome.trim().toLowerCase()
    );
    localStorage.setItem(LOCAL_PROFISSIONAIS_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export async function fetchProfissionaisFromSupabase(): Promise<Profissional[]> {
  const localList = getLocalProfissionais();
  try {
    const { data, error } = await supabase
      .from('profissionais')
      .select('*')
      .order('nome', { ascending: true });

    if (error || !data) {
      // Caso a tabela ainda não exista no Supabase ou offline, retorna fallback local
      console.info('Usando lista local de profissionais:', error?.message);
      return localList;
    }

    const remoteList = (data as Profissional[]).filter(p => p.status !== 'inativo');
    // Mescla remotos com locais não existentes
    const remoteNames = new Set(remoteList.map(p => p.nome.trim().toLowerCase()));
    const merged = [...remoteList, ...localList.filter(p => !remoteNames.has(p.nome.trim().toLowerCase()))];
    return merged;
  } catch {
    return localList;
  }
}

export async function saveProfissionalToSupabase(prof: Profissional): Promise<{ data: Profissional | null; error: Error | null }> {
  saveLocalProfissional(prof);
  try {
    const payload: any = {
      nome: prof.nome.trim(),
      escritorio: prof.escritorio?.trim() || '',
      tipo: prof.tipo || 'Arquiteto(a)',
      registro_profissional: prof.registro_profissional?.trim() || '',
      cpf_cnpj: prof.cpf_cnpj?.trim() || '',
      telefone: prof.telefone?.trim() || '',
      email: prof.email?.trim() || '',
      instagram: prof.instagram?.trim() || '',
      endereco: prof.endereco?.trim() || '',
      cidade: prof.cidade?.trim() || 'Campo Grande',
      uf: prof.uf?.trim() || 'MS',
      cep: prof.cep?.trim() || '',
      percentual_rt: prof.percentual_rt !== undefined ? Number(prof.percentual_rt) : 0,
      chave_pix: prof.chave_pix?.trim() || '',
      favorecido_pix: prof.favorecido_pix?.trim() || '',
      banco_info: prof.banco_info?.trim() || '',
      status: prof.status || 'ativo',
      observacoes: prof.observacoes?.trim() || '',
      updated_at: new Date().toISOString()
    };

    if (prof.id && !prof.id.startsWith('prof_loc_')) {
      payload.id = prof.id;
    }

    const { data, error } = await supabase
      .from('profissionais')
      .upsert(payload, { onConflict: 'nome' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase profissional upsert warning (salvo localmente):', error.message);
      return { data: prof, error: null };
    }
    return { data: data as Profissional, error: null };
  } catch (err: any) {
    return { data: prof, error: null };
  }
}

export async function deleteProfissionalFromSupabase(idOrNome: string): Promise<boolean> {
  deleteLocalProfissional(idOrNome);
  try {
    if (idOrNome.includes('-') && idOrNome.length > 20) {
      const { error } = await supabase.from('profissionais').delete().eq('id', idOrNome);
      if (error) {
        await supabase.from('profissionais').update({ status: 'inativo' }).eq('id', idOrNome);
      }
    } else {
      const { error } = await supabase.from('profissionais').delete().eq('nome', idOrNome);
      if (error) {
        await supabase.from('profissionais').update({ status: 'inativo' }).eq('nome', idOrNome);
      }
    }
    return true;
  } catch {
    return true;
  }
}

// Products persistence and catalog query
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('brand', { ascending: true })
      .order('name', { ascending: true })
      .limit(5000);

    if (error || !data || data.length === 0) {
      return [];
    }
    return data as Product[];
  } catch {
    return [];
  }
}

export async function saveProductToSupabase(product: Product): Promise<{ data: Product | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .upsert({
        brand: product.brand,
        category: product.category || '',
        code: product.code,
        name: product.name,
        line: product.line || '',
        tensao: product.tensao || '',
        status: product.status || 'DISPONÍVEL',
        price_direto: product.price_direto || 0,
        price_revenda: product.price_revenda || 0,
        price_vista: product.price_vista || 0,
        price_28: product.price_28 || 0,
        price_56: product.price_56 || 0,
        price_84: product.price_84 || 0,
        medidas: product.medidas || '',
        link: product.link || '',
      }, { onConflict: 'code' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase product upsert:', error.message);
      return { data: product, error: null };
    }
    return { data: data as Product, error: null };
  } catch (err: any) {
    return { data: product, error: null };
  }
}

