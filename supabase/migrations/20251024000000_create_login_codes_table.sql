-- Tabela para armazenar códigos de login temporários
CREATE TABLE public.login_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índice para busca rápida por código
CREATE INDEX idx_login_codes_code ON public.login_codes (code);

-- RLS (Row Level Security)
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;

-- Apenas a função de servidor (Service Role) deve ser capaz de inserir, ler e deletar.
-- Usuários autenticados não precisam de acesso direto a esta tabela.
-- Portanto, não criamos políticas de RLS para 'select', 'insert', 'update', 'delete' para 'authenticated'.
-- A Edge Function usará a Service Role Key para acessar esta tabela.