-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO SUPABASE: POLÍTICAS DE PRAZOS NO FATURAMENTO DIRETO
-- Aplicação: CVA Cozinhas e Banhos - Sistema Comercial e de Orçamentos
-- ==============================================================================
-- Descrição das Políticas de Faturamento Direto:
-- 1. DO CLIENTE FINAL PARA COM A FÁBRICA:
--    - Modalidades aceitas: À Vista (PIX/TED) ou Cartão de Crédito
--    - Regras de Cartão: Quantidade máxima de parcelas, parcelas sem juros e taxa de juros a.m.
--    - Regra À Vista: Percentual de desconto concedido ao cliente final
--
-- 2. DA LOJA (CVA) PARA COM A FÁBRICA:
--    - Modalidades aceitas: À Vista, Cartão ou Boleto Bancário Faturado
--    - Regra À Vista: Desconto concedido pela fábrica à loja
--    - Regra Cartão: Quantidade de parcelas e eventuais juros
--    - Regra Boleto Faturado: Prazos acordados (ex: 28 DDL, 28/56 DDL, 28/56/84 DDL) e máximo de boletos
--    - Repasse de Comissão: Prazo em dias após faturamento para pagamento da comissão de venda direta
-- ==============================================================================

-- 1. ATUALIZAÇÃO DA TABELA: public.fabricantes
-- Adiciona os novos campos sem quebrar dados existentes (usando IF NOT EXISTS)
ALTER TABLE public.fabricantes
    -- --------------------------------------------------------------------------
    -- 1.1 POLÍTICA CLIENTE FINAL -> FÁBRICA (Faturamento Direto ao Consumidor)
    -- --------------------------------------------------------------------------
    ADD COLUMN IF NOT EXISTS cliente_permite_vista BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS cliente_desconto_vista NUMERIC(5, 2) DEFAULT 5.00,
    ADD COLUMN IF NOT EXISTS cliente_permite_cartao BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS cliente_cartao_max_parcelas INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS cliente_cartao_sem_juros_parcelas INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS cliente_cartao_taxa_juros NUMERIC(5, 2) DEFAULT 1.99,

    -- --------------------------------------------------------------------------
    -- 1.2 POLÍTICA LOJA (CVA) -> FÁBRICA (Faturamento, Compras e Prazos)
    -- --------------------------------------------------------------------------
    ADD COLUMN IF NOT EXISTS loja_permite_vista BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS loja_desconto_vista NUMERIC(5, 2) DEFAULT 5.00,
    ADD COLUMN IF NOT EXISTS loja_permite_cartao BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS loja_cartao_max_parcelas INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS loja_cartao_taxa_juros NUMERIC(5, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS loja_permite_boleto BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS loja_boleto_prazos VARCHAR(150) DEFAULT '28/56/84 DDL',
    ADD COLUMN IF NOT EXISTS loja_boleto_max_parcelas INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS loja_prazo_repasse_comissao_dias INTEGER DEFAULT 15;

-- 2. COMENTÁRIOS EXPLICATIVOS NAS COLUNAS (Documentação no Catálogo do PostgreSQL)
COMMENT ON COLUMN public.fabricantes.cliente_permite_vista IS 'Faturamento Direto: Se a fábrica aceita pagamento à vista do cliente final (PIX / TED)';
COMMENT ON COLUMN public.fabricantes.cliente_desconto_vista IS 'Faturamento Direto: % de desconto que a fábrica concede ao cliente final no pagamento à vista';
COMMENT ON COLUMN public.fabricantes.cliente_permite_cartao IS 'Faturamento Direto: Se a fábrica aceita cartão de crédito diretamente do cliente';
COMMENT ON COLUMN public.fabricantes.cliente_cartao_max_parcelas IS 'Faturamento Direto: Quantidade máxima de parcelas aceitas no cartão do cliente pela fábrica';
COMMENT ON COLUMN public.fabricantes.cliente_cartao_sem_juros_parcelas IS 'Faturamento Direto: Quantidade de parcelas sem juros oferecidas pela fábrica ao cliente';
COMMENT ON COLUMN public.fabricantes.cliente_cartao_taxa_juros IS 'Faturamento Direto: Taxa de juros (% ao mês) cobrada nas parcelas acima do limite sem juros';

COMMENT ON COLUMN public.fabricantes.loja_permite_vista IS 'Condições Loja-Fábrica: Se a loja pode pagar a fábrica à vista';
COMMENT ON COLUMN public.fabricantes.loja_desconto_vista IS 'Condições Loja-Fábrica: % de desconto concedido à loja para pagamento à vista com a fábrica';
COMMENT ON COLUMN public.fabricantes.loja_permite_cartao IS 'Condições Loja-Fábrica: Se a fábrica aceita pagamento da loja via cartão corporativo';
COMMENT ON COLUMN public.fabricantes.loja_cartao_max_parcelas IS 'Condições Loja-Fábrica: Quantidade máxima de parcelas no cartão para a loja';
COMMENT ON COLUMN public.fabricantes.loja_cartao_taxa_juros IS 'Condições Loja-Fábrica: % de juros cobrado da loja para parcelamento no cartão';
COMMENT ON COLUMN public.fabricantes.loja_permite_boleto IS 'Condições Loja-Fábrica: Se a fábrica emite boletos faturados para a loja';
COMMENT ON COLUMN public.fabricantes.loja_boleto_prazos IS 'Condições Loja-Fábrica: Prazos padrão de boletos faturados da fábrica (ex: 28/56/84 DDL)';
COMMENT ON COLUMN public.fabricantes.loja_boleto_max_parcelas IS 'Condições Loja-Fábrica: Quantidade máxima de parcelas faturadas em boleto';
COMMENT ON COLUMN public.fabricantes.loja_prazo_repasse_comissao_dias IS 'Faturamento Direto: Prazo em dias corridos após faturamento para a fábrica repassar a comissão da CVA';

-- ------------------------------------------------------------------------------
-- 3. SEED / ATUALIZAÇÃO DAS POLÍTICAS PARA OS PRINCIPAIS FABRICANTES PARCEIROS
-- ------------------------------------------------------------------------------

-- Crissair: Cartão cliente até 10x (6x sem juros, 1.99% a.m.), Loja boleto 28/56/84 DDL, repasse em 15 dias
UPDATE public.fabricantes 
SET 
    cliente_permite_vista = true,
    cliente_desconto_vista = 5.00,
    cliente_permite_cartao = true,
    cliente_cartao_max_parcelas = 10,
    cliente_cartao_sem_juros_parcelas = 6,
    cliente_cartao_taxa_juros = 1.99,
    loja_permite_vista = true,
    loja_desconto_vista = 5.00,
    loja_permite_cartao = false,
    loja_cartao_max_parcelas = 1,
    loja_cartao_taxa_juros = 0.00,
    loja_permite_boleto = true,
    loja_boleto_prazos = '28/56/84 DDL',
    loja_boleto_max_parcelas = 3,
    loja_prazo_repasse_comissao_dias = 15
WHERE LOWER(nome_fantasia) LIKE '%crissair%';

-- Elettromec: Cartão cliente até 12x (6x sem juros, 1.89% a.m.), Loja boleto 28/56/84 DDL, repasse em 20 dias
UPDATE public.fabricantes 
SET 
    cliente_permite_vista = true,
    cliente_desconto_vista = 5.00,
    cliente_permite_cartao = true,
    cliente_cartao_max_parcelas = 12,
    cliente_cartao_sem_juros_parcelas = 6,
    cliente_cartao_taxa_juros = 1.89,
    loja_permite_vista = true,
    loja_desconto_vista = 5.00,
    loja_permite_cartao = false,
    loja_cartao_max_parcelas = 1,
    loja_cartao_taxa_juros = 0.00,
    loja_permite_boleto = true,
    loja_boleto_prazos = '28/56/84 DDL',
    loja_boleto_max_parcelas = 3,
    loja_prazo_repasse_comissao_dias = 20
WHERE LOWER(nome_fantasia) LIKE '%elettromec%';

-- DeBacco: Cartão cliente até 10x (5x sem juros, 1.99% a.m.), Loja boleto 28/56/84 DDL, repasse em 15 dias
UPDATE public.fabricantes 
SET 
    cliente_permite_vista = true,
    cliente_desconto_vista = 5.00,
    cliente_permite_cartao = true,
    cliente_cartao_max_parcelas = 10,
    cliente_cartao_sem_juros_parcelas = 5,
    cliente_cartao_taxa_juros = 1.99,
    loja_permite_vista = true,
    loja_desconto_vista = 5.00,
    loja_permite_cartao = false,
    loja_cartao_max_parcelas = 1,
    loja_cartao_taxa_juros = 0.00,
    loja_permite_boleto = true,
    loja_boleto_prazos = '28/56/84 DDL',
    loja_boleto_max_parcelas = 3,
    loja_prazo_repasse_comissao_dias = 15
WHERE LOWER(nome_fantasia) LIKE '%debacco%';

-- ------------------------------------------------------------------------------
-- 4. TABELA pedidos_fabrica (Garante existência com todos os campos de prazos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos_fabrica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_pedido VARCHAR(100) NOT NULL UNIQUE,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    num_orc VARCHAR(100) NOT NULL,
    fabricante VARCHAR(100) NOT NULL,
    faturamento_tipo VARCHAR(50) DEFAULT 'direto',
    status VARCHAR(50) DEFAULT 'gerado',
    data_emissao DATE DEFAULT CURRENT_DATE,
    prazo_entrega_estimado VARCHAR(100),
    previsao_faturamento DATE,
    data_entrega_efetiva DATE,
    consultor VARCHAR(150),
    arquiteto_parceiro VARCHAR(150),
    cliente_nome TEXT NOT NULL,
    cliente_doc VARCHAR(100),
    cliente_ie VARCHAR(100),
    cliente_tel VARCHAR(100),
    cliente_email VARCHAR(255),
    cliente_logradouro TEXT,
    cliente_num VARCHAR(50),
    cliente_bairro VARCHAR(100),
    cliente_cidade_uf VARCHAR(100) DEFAULT 'Campo Grande / MS',
    cliente_cep VARCHAR(50),
    forma_pagamento_fabrica VARCHAR(150),
    desconto_negociado_percent NUMERIC(5, 2) DEFAULT 0.00,
    desconto_vista_percent NUMERIC(5, 2) DEFAULT 0.00,
    valor_base_bruto NUMERIC(12, 2) DEFAULT 0.00,
    valor_desconto_negociado NUMERIC(12, 2) DEFAULT 0.00,
    valor_desconto_vista NUMERIC(12, 2) DEFAULT 0.00,
    valor_total_liquido NUMERIC(12, 2) DEFAULT 0.00,
    quantidade_total_itens INTEGER DEFAULT 0,
    itens JSONB NOT NULL DEFAULT '[]'::jsonb,
    observacoes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices e RLS para pedidos_fabrica
CREATE INDEX IF NOT EXISTS idx_pedidos_fabrica_num_ped ON public.pedidos_fabrica(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_fabrica_num_orc ON public.pedidos_fabrica(num_orc);
CREATE INDEX IF NOT EXISTS idx_pedidos_fabrica_fabricante ON public.pedidos_fabrica(fabricante);
CREATE INDEX IF NOT EXISTS idx_pedidos_fabrica_status ON public.pedidos_fabrica(status);

ALTER TABLE public.pedidos_fabrica ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pedidos_fabrica' AND policyname = 'Permitir leitura de pedidos_fabrica') THEN
        CREATE POLICY "Permitir leitura de pedidos_fabrica" ON public.pedidos_fabrica FOR SELECT TO public, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pedidos_fabrica' AND policyname = 'Permitir inserção de pedidos_fabrica') THEN
        CREATE POLICY "Permitir inserção de pedidos_fabrica" ON public.pedidos_fabrica FOR INSERT TO public, authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pedidos_fabrica' AND policyname = 'Permitir atualização de pedidos_fabrica') THEN
        CREATE POLICY "Permitir atualização de pedidos_fabrica" ON public.pedidos_fabrica FOR UPDATE TO public, authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pedidos_fabrica' AND policyname = 'Permitir exclusão de pedidos_fabrica') THEN
        CREATE POLICY "Permitir exclusão de pedidos_fabrica" ON public.pedidos_fabrica FOR DELETE TO public, authenticated USING (true);
    END IF;
END $$;

-- Habilita tempo real caso não esteja configurado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'pedidos_fabrica'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_fabrica;
    END IF;
END $$;
