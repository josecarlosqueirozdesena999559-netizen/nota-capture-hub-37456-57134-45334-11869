import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Copy, RefreshCw, Loader2 } from "lucide-react";
import { useLoginCode } from "@/hooks/use-login-code";
import { useToast } from "@/hooks/use-toast";

export function MobileLoginCodeDialog() {
  const [open, setOpen] = useState(false);
  const { code, isGenerating, generateCode, clearCode } = useLoginCode();
  const { toast } = useToast();

  const handleGenerateCode = async () => {
    await generateCode();
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast({
        title: "Código copiado!",
        description: "Cole no seu celular para fazer login.",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      clearCode();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Smartphone className="w-4 h-4 mr-2" />
          Login Mobile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login Mobile</DialogTitle>
          <DialogDescription>
            Gere um código para fazer login no celular
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!code ? (
            <div className="text-center py-6">
              <Button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Gerar Código
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-6 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Seu código:</p>
                <p className="text-4xl font-bold font-mono tracking-widest">
                  {code}
                </p>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Como usar:</strong>
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Acesse o NotaFácil no celular</li>
                  <li>Digite o código acima</li>
                  <li>Comece a enviar fotos das notas</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código
                </Button>
                <Button
                  onClick={handleGenerateCode}
                  variant="outline"
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Este código expira em 24 horas
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
