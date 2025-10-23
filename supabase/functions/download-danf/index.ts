import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chaveAcesso } = await req.json();
    
    if (!chaveAcesso) {
      throw new Error('Chave de acesso não fornecida');
    }

    console.log('Baixando DANF para chave:', chaveAcesso);

    const MEUDANFE_API_KEY = Deno.env.get('MEUDANFE_API_KEY');
    if (!MEUDANFE_API_KEY) {
      console.error('MEUDANFE_API_KEY não configurada');
      throw new Error('API do Meu Danfe não configurada');
    }

    // Primeiro tenta buscar o DANFE diretamente (se já estiver na área do cliente)
    console.log('Tentando buscar DANFE da área do cliente...');
    let response = await fetch(`https://api.meudanfe.com.br/v2/fd/get/da/${chaveAcesso}`, {
      method: 'GET',
      headers: {
        'Api-Key': MEUDANFE_API_KEY,
      },
    });

    // Se não encontrou (404), tenta adicionar primeiro
    if (response.status === 404) {
      console.log('DANF não encontrado, adicionando à área do cliente...');
      const addResponse = await fetch(`https://api.meudanfe.com.br/v2/fd/add/${chaveAcesso}`, {
        method: 'PUT',
        headers: {
          'Api-Key': MEUDANFE_API_KEY,
        },
      });

      if (!addResponse.ok) {
        const addError = await addResponse.text();
        console.error('Erro ao adicionar nota:', addError);
        throw new Error('Erro ao adicionar nota fiscal à área do cliente');
      }

      const addData = await addResponse.json();
      console.log('Nota adicionada, status:', addData.status);

      // Aguarda um pouco se estiver processando
      if (addData.status === 'WAITING' || addData.status === 'SEARCHING') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Tenta buscar o DANFE novamente
      response = await fetch(`https://api.meudanfe.com.br/v2/fd/get/da/${chaveAcesso}`, {
        method: 'GET',
        headers: {
          'Api-Key': MEUDANFE_API_KEY,
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Meu Danfe:', errorText);
      throw new Error('Erro ao buscar DANF na API do Meu Danfe');
    }

    const data = await response.json();
    console.log('DANF obtido com sucesso:', data.name);

    // Converte o PDF Base64 para uma URL de dados
    const pdfDataUrl = `data:application/pdf;base64,${data.data}`;

    return new Response(
      JSON.stringify({
        success: true,
        danfUrl: pdfDataUrl,
        fileName: data.name,
        message: 'DANF recuperado com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro ao buscar DANF:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar DANF'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
