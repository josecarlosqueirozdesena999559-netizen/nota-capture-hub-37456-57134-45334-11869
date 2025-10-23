-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS na tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para perfis - usuários podem ver e editar apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Criar tabela de notas fiscais
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_nome TEXT NOT NULL,
  chave_acesso TEXT NOT NULL,
  numero_nota TEXT NOT NULL,
  data_emissao DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  imagem_url TEXT,
  danf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX idx_notas_fiscais_user_id ON public.notas_fiscais(user_id);
CREATE INDEX idx_notas_fiscais_data_emissao ON public.notas_fiscais(data_emissao DESC);
CREATE INDEX idx_notas_fiscais_chave_acesso ON public.notas_fiscais(chave_acesso);

-- Habilitar RLS na tabela de notas fiscais
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notas fiscais - usuários podem ver e gerenciar apenas suas próprias notas
CREATE POLICY "Usuários podem ver suas próprias notas"
  ON public.notas_fiscais FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias notas"
  ON public.notas_fiscais FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notas"
  ON public.notas_fiscais FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias notas"
  ON public.notas_fiscais FOR DELETE
  USING (auth.uid() = user_id);

-- Função para criar perfil automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_notas
  BEFORE UPDATE ON public.notas_fiscais
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Criar bucket de storage para imagens das notas
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-fiscais', 'notas-fiscais', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage - usuários podem acessar apenas suas próprias imagens
CREATE POLICY "Usuários podem fazer upload de suas imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'notas-fiscais' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem ver suas próprias imagens"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'notas-fiscais' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem deletar suas próprias imagens"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'notas-fiscais' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );