import { CartItem, FaturamentoTipo, FormaPagamento, ProfitParams, ProfitResult, ProposalData } from '../types';

export function getEffectiveSimplesRate(revenue12m: number): number {
  const r = Math.max(0, Number(revenue12m) || 0);
  const brackets = [
    { max: 180000, rate: 0.04, deduction: 0 },
    { max: 360000, rate: 0.073, deduction: 5940 },
    { max: 720000, rate: 0.095, deduction: 13860 },
    { max: 1800000, rate: 0.107, deduction: 22500 },
    { max: 3600000, rate: 0.143, deduction: 87300 },
    { max: 4800000, rate: 0.19, deduction: 378000 }
  ];
  const bracket = brackets.find(b => r <= b.max) || brackets[brackets.length - 1];
  return r > 0 ? Math.max(0, (r * bracket.rate - bracket.deduction) / r) : 0;
}

export function calculateBudgetTotals(
  items: CartItem[],
  faturamentoTipo: FaturamentoTipo,
  descVistaPercent: number,
  descAplicadoPercent: number,
  isAvista: boolean = true
) {
  const subtotal = items.reduce((acc, item) => acc + item.qtd * item.price, 0);
  const isRevenda = faturamentoTipo === 'revenda';

  const descAplicado = isRevenda ? descAplicadoPercent : 0;
  const descontoNegociado = subtotal * (descAplicado / 100);

  // Total a prazo (base para cálculo de parcelamento, sem desconto à vista)
  const totalPrazo = Math.max(0, subtotal - descontoNegociado);

  const descontoVista = isAvista
    ? totalPrazo * (descVistaPercent / 100)
    : 0;

  const totalDesconto = descontoNegociado + descontoVista;
  const totalFinal = Math.max(0, subtotal - totalDesconto);
  const totalVista = Math.max(0, totalPrazo - (totalPrazo * (descVistaPercent / 100)));

  return {
    subtotal,
    descontoNegociado,
    descontoVista,
    totalDesconto,
    totalFinal,
    totalVista,
    totalPrazo,
  };
}

export interface InstallmentOption {
  n: number;
  parcela: number;
  total: number;
  isSemJuros: boolean;
}

export function calculateInstallments(
  totalBase: number,
  faturamentoTipo: FaturamentoTipo,
  formaPagamento: FormaPagamento = 'cartao',
  jurosRevendaPercent: number = 1.0
): InstallmentOption[] {
  const isRevenda = faturamentoTipo === 'revenda';
  const installments: InstallmentOption[] = [];

  if (formaPagamento === 'a_vista') {
    return [];
  }

  if (formaPagamento === 'cartao') {
    if (isRevenda) {
      // Revenda: até 10x com juros de cartão (default 1% a.m.)
      const i = (jurosRevendaPercent !== undefined && jurosRevendaPercent !== null ? jurosRevendaPercent : 1.0) / 100;
      for (let n = 1; n <= 10; n++) {
        let parcela: number;
        let total: number;
        if (n === 1 || i === 0) {
          parcela = totalBase;
          total = totalBase;
        } else {
          // Tabela Price
          parcela = totalBase * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
          total = parcela * n;
        }
        installments.push({
          n,
          parcela,
          total,
          isSemJuros: n === 1 || i === 0,
        });
      }
    } else {
      // Faturamento Direto: até 10x sem juros
      for (let n = 1; n <= 10; n++) {
        const parcela = totalBase / n;
        installments.push({
          n,
          parcela,
          total: totalBase,
          isSemJuros: true,
        });
      }
    }
  } else if (formaPagamento === 'boleto_pix_parcelado') {
    // Boleto / PIX Parcelado: até 3x sem juros; 4x a 10x com juros de 2% a.m.
    const i = 0.02; // 2% a.m.
    for (let n = 1; n <= 10; n++) {
      let parcela: number;
      let total: number;
      let isSemJuros = false;

      if (n <= 3) {
        parcela = totalBase / n;
        total = totalBase;
        isSemJuros = true;
      } else {
        parcela = totalBase * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
        total = parcela * n;
        isSemJuros = false;
      }

      installments.push({
        n,
        parcela,
        total,
        isSemJuros,
      });
    }
  }

  return installments;
}

export function calculateProfitResult(
  items: CartItem[],
  proposal: ProposalData,
  profitParams: ProfitParams
): ProfitResult {
  const mode = proposal.faturamento_tipo;
  const prazo = profitParams.prazo_fabrica;
  const pagamento = profitParams.pagamento_cliente;

  const grossSuggested = items.reduce((sum, item) => sum + item.qtd * item.price, 0);
  const descAplicado = mode === 'revenda' ? proposal.desc_aplicado_percent : 0;
  const negotiatedDiscount = grossSuggested * (descAplicado / 100);

  const cashDiscount = pagamento === 'avista'
    ? (grossSuggested - negotiatedDiscount) * (proposal.desc_vista_percent / 100)
    : 0;

  const discount = negotiatedDiscount + cashDiscount;
  const saleTotal = Math.max(0, grossSuggested - discount);

  const simplesRate = getEffectiveSimplesRate(profitParams.faturamento_12m);

  const factoryCostField = {
    avista: 'price_vista',
    '28': 'price_28',
    '56': 'price_56',
    '84': 'price_84',
  }[prazo] as keyof CartItem;

  const supplierCost = items.reduce((sum, item) => {
    const cost = (item[factoryCostField] as number) || item.price_revenda || 0;
    return sum + item.qtd * cost;
  }, 0);

  // Venda Direta: Receita bruta da CVA é a comissão de 25% paga pela fábrica
  // Revenda: Receita bruta é o total faturado para o cliente
  const revenue = mode === 'direto' ? saleTotal * 0.25 : saleTotal;
  const simples = revenue * simplesRate;
  const icms = mode === 'revenda' ? saleTotal * 0.13 : 0;

  const sellerCommission = saleTotal * (profitParams.comissao_vendedor / 100);
  const professionalCommission = saleTotal * (profitParams.comissao_profissional / 100);
  const operatingCost = saleTotal * (profitParams.custo_operacional / 100);

  const cost = mode === 'revenda' ? supplierCost : 0;

  const profit = revenue - cost - simples - icms - sellerCommission - professionalCommission - operatingCost;
  const marginPercent = saleTotal > 0 ? (profit / saleTotal) * 100 : 0;

  return {
    mode,
    prazo,
    pagamento,
    grossSuggested,
    discount,
    negotiatedDiscount,
    cashDiscount,
    saleTotal,
    revenue,
    cost,
    simplesRate,
    simples,
    icms,
    sellerCommission,
    professionalCommission,
    operatingCost,
    operatingCostPercent: profitParams.custo_operacional,
    profit,
    marginPercent,
    commissionSeller: profitParams.comissao_vendedor,
    commissionProfessional: profitParams.comissao_profissional,
    revenue12m: profitParams.faturamento_12m,
    itemCount: items.length,
  };
}

export function formatCurrency(value: number): string {
  return (Number(value) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte strings em formato monetário brasileiro (ex: "1.250,50", "1250,50", "R$ 1.250,00")
 * em um número float válido em Javascript.
 */
export function parseBrlCurrency(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  
  const clean = String(value).replace(/[^\d.,]/g, '');
  if (!clean) return 0;

  if (clean.includes(',')) {
    const withoutDots = clean.replace(/\./g, '');
    const withDot = withoutDots.replace(',', '.');
    return parseFloat(withDot) || 0;
  }
  return parseFloat(clean) || 0;
}

/**
 * Calcula o próximo número de orçamento sequencial com base no maior número encontrado
 * entre os orçamentos existentes.
 * Formato padrão: CVA-YYYY/001, CVA-YYYY/002...
 */
export function getNextBudgetNumber(savedBudgets: { num_orc?: string }[]): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;

  for (const b of savedBudgets) {
    if (!b || !b.num_orc) continue;
    const str = String(b.num_orc).trim();

    // Procura número após a barra: Ex: CVA-2026/045 ou 2026/12
    const slashMatch = str.match(/\/(\d+)/);
    if (slashMatch && slashMatch[1]) {
      const val = parseInt(slashMatch[1], 10);
      if (!isNaN(val) && val > maxSeq) {
        maxSeq = val;
      }
    } else {
      // Procura número no final da string: Ex: CVA-045 ou 104
      const endMatch = str.match(/(\d+)$/);
      if (endMatch && endMatch[1]) {
        const val = parseInt(endMatch[1], 10);
        if (!isNaN(val) && val > maxSeq) {
          maxSeq = val;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const formattedSeq = String(nextSeq).padStart(3, '0');
  return `CVA-${currentYear}/${formattedSeq}`;
}
