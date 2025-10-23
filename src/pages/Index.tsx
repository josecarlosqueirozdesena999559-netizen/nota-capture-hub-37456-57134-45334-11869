import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Receipt, Camera, FileText, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Detectar se é mobile ou desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    navigate(isMobile ? "/mobile" : "/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-8 shadow-elevated">
            <Receipt className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            NotaFácil
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Gerencie suas notas fiscais com inteligência artificial
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="text-lg">
              Começar Agora
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Fazer Login
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          <div className="bg-card p-8 rounded-2xl shadow-card border border-border hover:shadow-elevated transition-all">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Captura Inteligente</h3>
            <p className="text-muted-foreground">
              Tire foto da nota fiscal pelo celular e extraia os dados automaticamente com IA
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card border border-border hover:shadow-elevated transition-all">
            <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">Organização Total</h3>
            <p className="text-muted-foreground">
              Todas suas notas organizadas por data, empresa e valor em um só lugar
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-card border border-border hover:shadow-elevated transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Download Rápido</h3>
            <p className="text-muted-foreground">
              Acesse e baixe o DANF de qualquer nota com apenas um clique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
