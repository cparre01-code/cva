-- ==============================================================================
-- SCRIPT DE CRIAÇÃO DE TABELAS, RLS E TEMPO REAL - SUPABASE
-- Aplicação: CVA Cozinhas e Banhos - Sistema de Orçamentos
-- ==============================================================================

-- 1. HABILITA EXTENSÃO PARA GERAÇÃO DE UUID (CASO NÃO ESTEJA HABILITADA)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELA: budgets (Orçamentos e Propostas Comerciais)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    num_orc VARCHAR(100) NOT NULL,
    client_name TEXT NOT NULL,
    client_doc VARCHAR(100),
    client_data JSONB DEFAULT '{}'::jsonb,
    consultor VARCHAR(150),
    faturamento_tipo VARCHAR(50) DEFAULT 'direto', -- 'direto' ou 'revenda'
    date_orc DATE DEFAULT CURRENT_DATE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    total_final NUMERIC(12, 2) DEFAULT 0.00,
    profit_estimate NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'aberto',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índice para pesquisas rápidas por número de orçamento e cliente
CREATE INDEX IF NOT EXISTS idx_budgets_num_orc ON public.budgets(num_orc);
CREATE INDEX IF NOT EXISTS idx_budgets_client_name ON public.budgets(client_name);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_updated_at ON public.budgets(updated_at DESC);

-- ==============================================================================
-- 3. TABELA: clients (Cadastro de Clientes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    razao TEXT,
    doc VARCHAR(100),
    cnpj VARCHAR(100),
    cpf VARCHAR(100),
    ie VARCHAR(100),
    tel VARCHAR(100),
    email VARCHAR(255),
    cep VARCHAR(50),
    cidade_uf VARCHAR(100) DEFAULT 'Campo Grande / MS',
    endereco TEXT,
    status VARCHAR(50) DEFAULT 'ativado',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_nome ON public.clients(nome);
CREATE INDEX IF NOT EXISTS idx_clients_doc ON public.clients(doc);

-- ==============================================================================
-- 4. TABELA: consultores (Consultores de Vendas com Níveis de Alçada e Negociação)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.consultores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL UNIQUE,
    cargo VARCHAR(20) NOT NULL DEFAULT 'vendedor' CHECK (cargo IN ('diretor', 'gerente', 'vendedor')),
    email VARCHAR(255),
    telefone VARCHAR(50),
    cpf VARCHAR(50),
    
    -- Acesso e Autenticação
    senha VARCHAR(255) DEFAULT '123456', -- Senha de acesso do consultor ao sistema

    -- Poder de Negociação e Alçadas Comerciais
    desconto_maximo NUMERIC(5, 2) NOT NULL DEFAULT 5.00,    -- % máximo de desconto negociado permitido
    desconto_max_vista NUMERIC(5, 2) NOT NULL DEFAULT 5.00, -- % máximo de desconto à vista permitido
    margem_minima NUMERIC(5, 2) NOT NULL DEFAULT 15.00,     -- % de margem mínima de lucro exigida na proposta
    comissao_padrao NUMERIC(5, 2) DEFAULT 2.00,             -- % comissão padrão do vendedor
    pode_alterar_comissao BOOLEAN NOT NULL DEFAULT false,   -- Se tem autonomia para negociar comissão
    pode_aprovar_excecao BOOLEAN NOT NULL DEFAULT false,    -- Se tem autoridade para aprovação de exceções comerciais
    
    ativo BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consultores_nome ON public.consultores(nome);
CREATE INDEX IF NOT EXISTS idx_consultores_cargo ON public.consultores(cargo);
CREATE INDEX IF NOT EXISTS idx_consultores_ativo ON public.consultores(ativo);
CREATE INDEX IF NOT EXISTS idx_consultores_email ON public.consultores(email);

-- ==============================================================================
-- 5. TABELA: products (Catálogo Consolidado de Produtos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    code VARCHAR(100) NOT NULL,
    name TEXT NOT NULL,
    line VARCHAR(100),
    tensao VARCHAR(50),
    status VARCHAR(100) DEFAULT 'DISPONÍVEL',
    price_direto NUMERIC(12, 2) DEFAULT 0.00,
    price_revenda NUMERIC(12, 2) DEFAULT 0.00,
    price_vista NUMERIC(12, 2) DEFAULT 0.00,
    price_28 NUMERIC(12, 2) DEFAULT 0.00,
    price_56 NUMERIC(12, 2) DEFAULT 0.00,
    price_84 NUMERIC(12, 2) DEFAULT 0.00,
    medidas VARCHAR(100),
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- ==============================================================================
-- 6. TABELA: fabricantes (Fabricantes, Marcas e Condições Comerciais)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fabricantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_fantasia VARCHAR(150) NOT NULL UNIQUE,
    razao_social VARCHAR(255),
    cnpj VARCHAR(50),
    estado_origem VARCHAR(2) DEFAULT 'SP',
    contato_pedidos VARCHAR(255),
    telefone_representante VARCHAR(50),
    permite_faturamento_direto BOOLEAN DEFAULT true,
    comissao_direta_percent NUMERIC(5, 2) DEFAULT 25.00,
    permite_revenda BOOLEAN DEFAULT true,
    desconto_maximo_permitido NUMERIC(5, 2) DEFAULT 10.00,
    fator_markup_padrao NUMERIC(5, 2) DEFAULT 1.60,
    condicao_pagamento_padrao VARCHAR(100) DEFAULT '28/56/84 DDL',
    desconto_vista_fabrica NUMERIC(5, 2) DEFAULT 5.00,
    prazo_faturamento_dias INTEGER DEFAULT 7,
    -- Novas Políticas de Faturamento Direto (Prazos e Juros)
    -- 1. Política do Cliente Final com a Fábrica
    cliente_permite_vista BOOLEAN DEFAULT true,
    cliente_desconto_vista NUMERIC(5, 2) DEFAULT 5.00,
    cliente_permite_cartao BOOLEAN DEFAULT true,
    cliente_cartao_max_parcelas INTEGER DEFAULT 10,
    cliente_cartao_sem_juros_parcelas INTEGER DEFAULT 6,
    cliente_cartao_taxa_juros NUMERIC(5, 2) DEFAULT 1.99,
    -- 2. Política da Loja (CVA) com a Fábrica
    loja_permite_vista BOOLEAN DEFAULT true,
    loja_desconto_vista NUMERIC(5, 2) DEFAULT 5.00,
    loja_permite_cartao BOOLEAN DEFAULT false,
    loja_cartao_max_parcelas INTEGER DEFAULT 1,
    loja_cartao_taxa_juros NUMERIC(5, 2) DEFAULT 0.00,
    loja_permite_boleto BOOLEAN DEFAULT true,
    loja_boleto_prazos VARCHAR(150) DEFAULT '28/56/84 DDL',
    loja_boleto_max_parcelas INTEGER DEFAULT 3,
    loja_prazo_repasse_comissao_dias INTEGER DEFAULT 15,
    prazo_entrega_padrao VARCHAR(100) DEFAULT '30 a 45 dias úteis',
    garantia_meses INTEGER DEFAULT 36,
    tipo_frete_padrao VARCHAR(10) DEFAULT 'CIF',
    obs_frete TEXT DEFAULT 'Frete incluso para Campo Grande / MS',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fabricantes_nome ON public.fabricantes(nome_fantasia);

-- ==============================================================================
-- 5. FUNÇÃO E TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE `updated_at`
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_budgets_updated_at ON public.budgets;
CREATE TRIGGER trigger_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_consultores_updated_at ON public.consultores;
CREATE TRIGGER trigger_consultores_updated_at
    BEFORE UPDATE ON public.consultores
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_fabricantes_updated_at ON public.fabricantes;
CREATE TRIGGER trigger_fabricantes_updated_at
    BEFORE UPDATE ON public.fabricantes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. HABILITAÇÃO DO ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabricantes ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 8. POLÍTICAS DE RLS (Row Level Security)
-- ==============================================================================

-- Política para a tabela `budgets`:
-- Permite leitura, criação e atualização por consultores autenticados.
-- Também permite acesso com a chave de API pública/anônima (para visualização no aplicativo).
CREATE POLICY "Permitir leitura de orçamentos" 
ON public.budgets FOR SELECT 
TO public, authenticated 
USING (true);

CREATE POLICY "Permitir inserção de orçamentos" 
ON public.budgets FOR INSERT 
TO public, authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de orçamentos" 
ON public.budgets FOR UPDATE 
TO public, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de orçamentos" 
ON public.budgets FOR DELETE 
TO public, authenticated 
USING (true);

-- Política para a tabela `clients`:
CREATE POLICY "Permitir leitura de clientes" 
ON public.clients FOR SELECT 
TO public, authenticated 
USING (true);

CREATE POLICY "Permitir inserção de clientes" 
ON public.clients FOR INSERT 
TO public, authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de clientes" 
ON public.clients FOR UPDATE 
TO public, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de clientes" 
ON public.clients FOR DELETE 
TO public, authenticated 
USING (true);

-- Política para a tabela `consultores`:
CREATE POLICY "Permitir leitura de consultores" 
ON public.consultores FOR SELECT 
TO public, authenticated 
USING (true);

CREATE POLICY "Permitir inserção de consultores" 
ON public.consultores FOR INSERT 
TO public, authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de consultores" 
ON public.consultores FOR UPDATE 
TO public, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de consultores" 
ON public.consultores FOR DELETE 
TO public, authenticated 
USING (true);

-- Política para a tabela `profissionais`:
CREATE POLICY "Permitir leitura de profissionais" 
ON public.profissionais FOR SELECT 
TO public, authenticated 
USING (true);

CREATE POLICY "Permitir inserção de profissionais" 
ON public.profissionais FOR INSERT 
TO public, authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de profissionais" 
ON public.profissionais FOR UPDATE 
TO public, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de profissionais" 
ON public.profissionais FOR DELETE 
TO public, authenticated 
USING (true);

-- Política para a tabela `products`:
CREATE POLICY "Permitir leitura de produtos para todos" 
ON public.products FOR SELECT 
TO public, authenticated 
USING (true);

CREATE POLICY "Permitir escrita de produtos" 
ON public.products FOR ALL 
TO public, authenticated 
USING (true) 
WITH CHECK (true);

-- Política para a tabela `fabricantes`:
CREATE POLICY "Permitir leitura de fabricantes" 
ON public.fabricantes FOR SELECT 
TO public, authenticated 
USING (true);

CREATE POLICY "Permitir inserção de fabricantes" 
ON public.fabricantes FOR INSERT 
TO public, authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir atualização de fabricantes" 
ON public.fabricantes FOR UPDATE 
TO public, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de fabricantes" 
ON public.fabricantes FOR DELETE 
TO public, authenticated 
USING (true);

-- ==============================================================================
-- 9. HABILITAR SINCRONIZAÇÃO EM TEMPO REAL (REALTIME)
-- ==============================================================================
-- Permite que o Supabase notifique o frontend automaticamente quando houver INSERT, UPDATE ou DELETE
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profissionais;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fabricantes;

-- ==============================================================================
-- 10. DADOS INICIAIS (SEED) PARA CONSULTORES DE VENDA
-- ==============================================================================
INSERT INTO public.consultores (
    nome, 
    cargo, 
    email, 
    telefone, 
    desconto_maximo, 
    desconto_max_vista, 
    margem_minima, 
    comissao_padrao, 
    pode_alterar_comissao, 
    pode_aprovar_excecao, 
    ativo
)
VALUES 
    -- Diretores: Autonomia ampla para grandes negociações e fechamento de parcerias
    ('Carlos Alberto Parré', 'diretor', 'cparre01@gmail.com', '(67) 99988-7766', 25.00, 15.00, 5.00, 3.00, true, true, true),
    
    -- Gerente: Autonomia tática para alçadas intermediárias e apoio à equipe
    ('Fernando Guerra', 'gerente', 'fernando.guerra@cva.com.br', '(67) 99911-2233', 12.00, 8.00, 10.00, 2.50, true, true, true),
    
    -- Vendedores: Autonomia operacional do dia a dia
    ('Mateus Veronese', 'vendedor', 'mateus.veronese@cva.com.br', '(67) 99922-3344', 5.00, 5.00, 15.00, 2.00, false, false, true),
    ('Glauco de Oliveira', 'vendedor', 'glauco.oliveira@cva.com.br', '(67) 99933-4455', 5.00, 5.00, 15.00, 2.00, false, false, true)
ON CONFLICT (nome) DO UPDATE SET
    cargo = EXCLUDED.cargo,
    desconto_maximo = EXCLUDED.desconto_maximo,
    desconto_max_vista = EXCLUDED.desconto_max_vista,
    margem_minima = EXCLUDED.margem_minima,
    comissao_padrao = EXCLUDED.comissao_padrao,
    pode_alterar_comissao = EXCLUDED.pode_alterar_comissao,
    pode_aprovar_excecao = EXCLUDED.pode_aprovar_excecao;

-- ==============================================================================
-- 11. TABELA: pedidos_fabrica (Gestão e Controle de Ordens de Compra por Marca)
-- ==============================================================================
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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'pedidos_fabrica'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_fabrica;
    END IF;
END $$;

