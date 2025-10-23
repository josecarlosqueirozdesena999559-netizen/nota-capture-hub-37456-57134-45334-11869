import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, QrCode, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface GenerateCodeDialogProps {
  userId: string;
  onClose: () => void;
}

const CODE_EXPIRATION_MINUTES = 5;

const GenerateCodeDialog = ({ userId, onClose }: GenerateCodeDialogProps) => {
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState(CODE_EXPIRATION_MINUTES * 60);

  // Função para gerar um código aleatório de 6 dígitos
  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateAndSaveCode = async () => {
    setLoading(true);
    setCode(null);
    setTimer(CODE_EXPIRATION_MINUTES * 60);

    const newCode = generateRandomCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000).toISOString();

    try {
      // 1. Deletar códigos antigos do usuário (garantir que só haja um ativo)
      await (supabase as any)
        .from('login_codes')
        .delete()
        .eq('user_id', userId);

      // 2. Inserir o novo código
      const { error } = await (supabase as any)
        .from('login_codes')
        .insert({
          user_id: userId,
          code: newCode,
          expires_at: expiresAt,
        });

      if (error) throw error;

      setCode(newCode);
      toast({
        title: "Código Gerado!",
        description: `Use o código ${newCode} para logar no celular. Expira em ${CODE_EXPIRATION_MINUTES} minutos.`,
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar código",
        description: error.message,
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAndSaveCode();
  }, [userId]);

  // Lógica do Timer
  useEffect(() => {
    if (code && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCode(null);
      toast({
        title: "Código Expirado",
        description: "O código de login expirou. Gere um novo.",
        variant: "destructive",
      });
    }
  }, [code, timer, toast]);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "Código copiado para a área de transferência.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Login Mobile Rápido</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="text-center space-y-6">
          <p className="text-muted-foreground">
            Use este código de 6 dígitos no aplicativo mobile para fazer login instantâneo.
          </p>

          {loading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : code ? (
            <>
              <div className="flex flex-col items-center space-y-4">
                <InputOTP maxLength={6} value={code} disabled>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <div className="mx-2 text-2xl font-bold">-</div>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                
                <p className="text-sm font-medium text-destructive">
                  Expira em: {formatTime(timer)}
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleCopy} 
                  variant="outline" 
                  className="flex-1"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copiado!" : "Copiar Código"}
                </Button>
                <Button 
                  onClick={generateAndSaveCode} 
                  className="flex-1"
                  variant="secondary"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar Novo
                </Button>
              </div>
            </>
          ) : (
            <p className="text-red-500">Falha ao gerar código. Tente novamente.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GenerateCodeDialog;