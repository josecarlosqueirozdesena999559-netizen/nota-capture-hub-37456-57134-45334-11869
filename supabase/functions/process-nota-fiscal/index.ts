import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('Imagem não fornecida');
    }

    console.log('Processando nota fiscal com IA...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Usar Gemini 2.5 Pro para análise de imagem (melhor para extração de dados complexos)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em extrair dados de notas fiscais brasileiras (NF-e/DANF). 
Analise a imagem e extraia EXATAMENTE as seguintes informações:
- Nome da empresa emitente (razão social completa)
- Chave de acesso da NF-e (44 dígitos)
- Número da nota fiscal
- Data de emissão (formato YYYY-MM-DD)
- Valor total da nota

Retorne APENAS um objeto JSON válido com estas chaves: empresa_nome, chave_acesso, numero_nota, data_emissao, valor.
Não inclua texto adicional, apenas o JSON.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia os dados desta nota fiscal:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API de IA:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns instantes.');
      }
      if (response.status === 402) {
        throw new Error('Créditos insuficientes. Adicione créditos no workspace.');
      }
      
      throw new Error('Erro ao processar imagem com IA');
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content;

    if (!extractedText) {
      throw new Error('Nenhum dado extraído da imagem');
    }

    console.log('Dados extraídos:', extractedText);

    // Parse do JSON retornado
    let extractedData;
    try {
      // Limpar possível markdown ou texto extra
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : extractedText;
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      throw new Error('Não foi possível extrair dados estruturados da nota fiscal');
    }

    // Validar dados obrigatórios
    if (!extractedData.empresa_nome || !extractedData.chave_acesso || 
        !extractedData.numero_nota || !extractedData.data_emissao || 
        !extractedData.valor) {
      throw new Error('Dados incompletos extraídos da nota fiscal');
    }

    // Validar formato da chave de acesso (44 dígitos)
    const chaveAcesso = extractedData.chave_acesso.replace(/\D/g, '');
    if (chaveAcesso.length !== 44) {
      console.warn('Chave de acesso com formato incorreto:', chaveAcesso);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          empresa_nome: extractedData.empresa_nome,
          chave_acesso: chaveAcesso,
          numero_nota: extractedData.numero_nota,
          data_emissao: extractedData.data_emissao,
          valor: parseFloat(extractedData.valor.toString().replace(',', '.'))
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro ao processar nota fiscal:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar nota fiscal'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
