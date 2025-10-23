-- Tabela para armazenar códigos de login temporários
CREATE TABLE IF NOT EXISTS public.login_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índice para busca rápida por código
CREATE INDEX IF NOT EXISTS idx_login_codes_code ON public.login_codes (code);

-- RLS (Row Level Security)
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Apenas o Service Role pode acessar (nenhuma política para authenticated/anon)
-- Isso garante que apenas a Edge Function possa interagir com esta tabela.