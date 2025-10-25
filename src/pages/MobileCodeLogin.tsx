import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Receipt, Smartphone } from "lucide-react";

const MobileCodeLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginCode, setLoginCode] = useState("");

  useEffect(() => {
    // Verificar se já está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/mobile");
      }
    };
    checkUser();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          navigate("/mobile");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (loginCode.length !== 6) {
        throw new Error("O código deve ter 6 dígitos.");
      }

      console.log("Enviando código:", loginCode);

      // Chamar a função de servidor para validar o código
      const { data, error } = await supabase.functions.invoke('login-with-code', {
        body: { code: loginCode }
      });

      console.log("Resposta da função:", { data, error });

      if (error) {
        console.error("Erro na função:", error);
        throw error;
      }

      if (!data?.success || !data?.action_link) {
        throw new Error(data?.error || "Falha na validação do código.");
      }

      // Redireciona para o magic link para criar a sessão automaticamente
      window.location.href = data.action_link;
      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao NotaFácil Mobile.",
      });

      // Navegar para a página mobile
      navigate("/mobile");
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no Login",
        description: error.message || "Código inválido ou expirado. Gere um novo código no computador.",
        variant: "destructive",
      });
      setLoginCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md p-8 shadow-elevated">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">NotaFácil</h1>
          <p className="text-muted-foreground mt-2 text-center">
            Login Mobile
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg mb-6 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Como fazer login:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Acesse o painel no computador</li>
              <li>Clique em "Login Mobile"</li>
              <li>Digite o código gerado aqui</li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleCodeLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="loginCode" className="text-base">
              Código de Login
            </Label>
            <Input
              id="loginCode"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="text-2xl text-center tracking-widest font-mono"
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Digite o código de 6 dígitos
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || loginCode.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verificando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Código válido por 24 horas
          </p>
        </div>
      </Card>
    </div>
  );
};

export default MobileCodeLogin;
