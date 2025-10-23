import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Receipt } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          navigate(isMobile ? "/mobile" : "/dashboard");
        }
      }
    );

    // Verificar sessão existente
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        navigate(isMobile ? "/mobile" : "/dashboard");
      }
    };
    checkUser();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta ao sistema.",
        });
        
        // Detectar se é mobile ou desktop
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        navigate(isMobile ? "/mobile" : "/dashboard");
      } else {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const redirectPath = isMobile ? "/mobile" : "/dashboard";
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}${redirectPath}`,
          },
        });

        if (error) throw error;

        // Se a confirmação de email está desabilitada, o usuário é logado automaticamente
        if (data.session) {
          toast({
            title: "Cadastro realizado!",
            description: "Bem-vindo ao NotaFácil!",
          });
          // O listener onAuthStateChange vai redirecionar automaticamente
        } else {
          // Se precisar confirmar email
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar a conta.",
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
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
            Gerenciamento inteligente de notas fiscais
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>{isLogin ? "Entrar" : "Cadastrar"}</>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Faça login"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
