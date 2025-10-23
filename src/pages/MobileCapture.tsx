import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Receipt, Camera, CheckCircle2 } from "lucide-react";
import CameraCapture from "@/components/CameraCapture";
import ConfirmNotaDialog from "@/components/ConfirmNotaDialog";

interface ExtractedData {
  empresa_nome: string;
  chave_acesso: string;
  numero_nota: string;
  data_emissao: string;
  valor: number;
}

const MobileCapture = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleImageCapture = async (imageData: string) => {
    try {
      setLoading(true);
      toast({
        title: "Processando nota fiscal...",
        description: "Aguarde enquanto extraímos os dados.",
      });

      const fileName = `${user?.id}/${Date.now()}.jpg`;
      const base64Data = imageData.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(r => r.blob());
      
      const { error: uploadError } = await supabase.storage
        .from('notas-fiscais')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('notas-fiscais')
        .getPublicUrl(fileName);

      const { data, error } = await supabase.functions.invoke('process-nota-fiscal', {
        body: { imageBase64: base64Data }
      });

      if (error) throw error;

      if (data.success) {
        setExtractedData(data.data);
        setImageUrl(publicUrl);
        setShowCamera(false);
        toast({
          title: "Dados extraídos!",
          description: "Confirme os dados da nota fiscal.",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar nota",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmNota = async (data: ExtractedData) => {
    try {
      setLoading(true);

      const { error } = await (supabase as any)
        .from('notas_fiscais')
        .insert({
          user_id: user?.id,
          empresa_nome: data.empresa_nome,
          chave_acesso: data.chave_acesso,
          numero_nota: data.numero_nota,
          data_emissao: data.data_emissao,
          valor: data.valor,
          imagem_url: imageUrl,
          status: 'confirmada'
        });

      if (error) throw error;

      toast({
        title: "Nota fiscal salva!",
        description: "Acesse o sistema no computador para visualizar.",
        duration: 5000,
      });
      
      setExtractedData(null);
      setImageUrl(null);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar nota",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header Mobile */}
      <header className="bg-card border-b border-border shadow-card">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">NotaFácil</h1>
                <p className="text-xs text-muted-foreground">Versão Mobile</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Mobile */}
      <main className="px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Captura de Notas</h2>
            <p className="text-muted-foreground">
              Fotografe suas notas fiscais aqui no celular
            </p>
          </div>

          <Button
            onClick={() => setShowCamera(true)}
            className="w-full h-16"
            size="lg"
          >
            <Camera className="w-6 h-6 mr-3" />
            Capturar Nota Fiscal
          </Button>

          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Como funciona</h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li>1. Tire uma foto da nota fiscal</li>
                  <li>2. A IA extrai os dados automaticamente</li>
                  <li>3. Confirme as informações</li>
                  <li>4. Acesse no computador para visualizar tudo</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Para visualizar, filtrar e baixar suas notas,</p>
            <p className="font-semibold text-primary">acesse o sistema no computador</p>
          </div>
        </div>
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Confirm Dialog */}
      {extractedData && (
        <ConfirmNotaDialog
          data={extractedData}
          onConfirm={handleConfirmNota}
          onCancel={() => setExtractedData(null)}
        />
      )}
    </div>
  );
};

export default MobileCapture;
