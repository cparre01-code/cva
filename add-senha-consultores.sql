-- ==============================================================================
-- CVA ORÇAMENTOS - MIGRATION SUPABASE
-- Adicionar campo de senha para autenticação de consultores
-- ==============================================================================

-- 1. Adiciona a coluna 'senha' na tabela 'consultores' (caso ainda não exista)
ALTER TABLE public.consultores 
ADD COLUMN IF NOT EXISTS senha VARCHAR(255) DEFAULT '123456';

-- 2. Define senha padrão '123456' para consultores existentes sem senha
UPDATE public.consultores 
SET senha = '123456' 
WHERE senha IS NULL OR TRIM(senha) = '';

-- 3. Documentação da coluna
COMMENT ON COLUMN public.consultores.senha IS 'Senha de acesso do consultor ao sistema comercial CVA';

-- 4. Confirmação dos consultores e status
SELECT id, nome, cargo, senha, ativo, updated_at 
FROM public.consultores 
ORDER BY nome;
