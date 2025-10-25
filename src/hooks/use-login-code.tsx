import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLoginCode() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const { toast } = useToast();

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Gera um código de 6 dígitos usando a função do banco
      const { data: newCode, error: rpcError } = await (supabase as any)
        .rpc('generate_login_code');
      
      if (rpcError || !newCode) {
        throw new Error("Erro ao gerar código");
      }

      // Insere o código no banco
      const { error } = await (supabase as any)
        .from('login_codes')
        .insert({
          user_id: user.id,
          code: newCode,
          is_active: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      setCode(newCode as string);
      
      toast({
        title: "Código gerado!",
        description: "Use este código no celular para fazer login.",
      });

      return newCode as string;
    } catch (error: any) {
      console.error("Erro ao gerar código:", error);
      toast({
        title: "Erro ao gerar código",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearCode = () => {
    setCode(null);
  };

  return {
    code,
    isGenerating,
    generateCode,
    clearCode,
  };
}

