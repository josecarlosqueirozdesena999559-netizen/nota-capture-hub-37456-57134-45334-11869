import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    
    if (!code) {
      throw new Error('Código não fornecido');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Variáveis de ambiente do Supabase Admin faltando.');
        throw new Error('Configuração de servidor incompleta. Chaves de ambiente ausentes.');
    }

    // 1. Inicializar o cliente Supabase com privilégios de serviço (Service Role Key)
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 2. Buscar e validar o código
    const { data: codeData, error: codeError } = await supabaseAdmin
      .from('login_codes')
      .select('user_id, expires_at')
      .eq('code', code)
      .single();

    if (codeError || !codeData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Código inválido ou não encontrado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const expiresAt = new Date(codeData.expires_at);
    if (expiresAt < new Date()) {
      // 3. Se expirado, deleta o código e retorna erro
      await supabaseAdmin.from('login_codes').delete().eq('code', code);
      return new Response(
        JSON.stringify({ success: false, error: 'Código expirado. Gere um novo no seu computador.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // 4. Deletar o código imediatamente após a validação (uso único)
    await supabaseAdmin.from('login_codes').delete().eq('code', code);

    // 5. Gerar um token JWT para o usuário
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateAuthToken(
      codeData.user_id,
      'mobile_login', // Nome do token
      { expiresIn: 3600 } // 1 hora de validade para o token
    );

    if (tokenError || !tokenData.token) {
      console.error('Erro ao gerar token:', tokenError);
      throw new Error('Erro interno ao gerar token de login.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        token: tokenData.token,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro ao processar login com código:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar login.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});