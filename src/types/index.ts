export interface Product {
  id: number;
  brand: string;
  category: string;
  code: string;
  name: string;
  line: string;
  tensao: string;
  status: string;
  price_direto: number;
  price_revenda: number;
  price_vista?: number;
  price_28?: number;
  price_56?: number;
  price_84?: number;
  medidas: string;
  link: string;
}

export interface Client {
  id?: string;
  nome: string;
  razao?: string;
  doc: string;
  cnpj?: string;
  cpf?: string;
  ie?: string;
  tel: string;
  email: string;
  cep: string;
  cidade_uf: string;
  endereco: string;
  num?: string;
  bairro?: string;
  logradouro?: string;
  status?: string;
  profissional?: string;
  created_at?: string;
}

export type CargoConsultor = 'diretor' | 'gerente' | 'vendedor';

export interface Profissional {
  id?: string;
  nome: string;
  escritorio?: string;
  tipo?: string;
  registro_profissional?: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  instagram?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  percentual_rt?: number;
  chave_pix?: string;
  favorecido_pix?: string;
  banco_info?: string;
  status?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Consultant {
  id?: string;
  nome: string;
  cargo: CargoConsultor;
  email?: string;
  telefone?: string;
  cpf?: string;
  desconto_maximo?: number; // % máximo de desconto negociado
  desconto_max_vista?: number; // % máximo de desconto à vista
  margem_minima?: number; // % margem mínima exigida
  comissao_padrao?: number;
  pode_alterar_comissao?: boolean;
  pode_aprovar_excecao?: boolean;
  ativo?: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  code: string;
  name: string;
  brand: string;
  category: string;
  line: string;
  status: string;
  qtd: number;
  price: number;
  price_direto: number;
  price_revenda: number;
  price_vista: number;
  price_28: number;
  price_56: number;
  price_84: number;
  voltagem: string;
  medidas: string;
  link: string;
}

export type FaturamentoTipo = 'direto' | 'revenda';
export type PagamentoCliente = 'avista' | 'prazo';
export type PrazoFabrica = 'avista' | '28' | '56' | '84';
export type FormaPagamento = 'a_vista' | 'cartao' | 'boleto_pix_parcelado';

export interface ProposalData {
  num_orc: string;
  data_orc: string;
  consultor: string;
  arquiteto_parceiro?: string; // Profissional arquiteto/designer parceiro atrelado a este orçamento
  faturamento_tipo: FaturamentoTipo;
  forma_pagamento?: FormaPagamento;
  num_parcelas?: number;
  cliente: {
    nome: string;
    doc: string;
    rg: string;
    ie?: string;
    tel: string;
    email: string;
    endereco: string;
    logradouro?: string;
    num?: string;
    bairro?: string;
    cidade_uf: string;
    cep: string;
    profissional?: string; // Opcional para retrocompatibilidade
  };
  desc_vista_percent: number;
  juros_revenda_percent: number;
  desc_aplicado_percent: number;
  obs_instalacao: string;
  obs_entrega: string;
  obs_prazo: string;
  obs_garantia: string;
}

export interface ProfitParams {
  comissao_vendedor: number;
  comissao_profissional: number;
  custo_operacional: number;
  faturamento_12m: number;
  pagamento_cliente: PagamentoCliente;
  prazo_fabrica: PrazoFabrica;
}

export interface ProfitResult {
  mode: FaturamentoTipo;
  prazo: PrazoFabrica;
  pagamento: PagamentoCliente;
  grossSuggested: number;
  discount: number;
  negotiatedDiscount: number;
  cashDiscount: number;
  saleTotal: number;
  revenue: number;
  cost: number;
  simplesRate: number;
  simples: number;
  icms: number;
  sellerCommission: number;
  professionalCommission: number;
  operatingCost: number;
  operatingCostPercent: number;
  profit: number;
  marginPercent: number;
  commissionSeller: number;
  commissionProfessional: number;
  revenue12m: number;
  itemCount: number;
}

export interface BudgetRecord {
  id?: string;
  num_orc: string;
  client_name: string;
  client_doc?: string;
  client_data: ProposalData['cliente'];
  consultor: string;
  arquiteto_parceiro?: string; // Profissional arquiteto/designer parceiro do orçamento
  faturamento_tipo: FaturamentoTipo;
  forma_pagamento?: FormaPagamento;
  num_parcelas?: number;
  date_orc: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total_final: number;
  profit_estimate?: number;
  user_id?: string;
  user_email?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  desc_vista_percent?: number;
  juros_revenda_percent?: number;
  desc_aplicado_percent?: number;
  obs_instalacao?: string;
  obs_entrega?: string;
  obs_prazo?: string;
  obs_garantia?: string;
}
