import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Receipt, Camera } from "lucide-react";

const DashboardIndex = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Bem-vindo ao NotaFácil</h2>
      <p className="text-muted-foreground">Selecione uma opção no menu lateral para começar.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col items-start">
          <Receipt className="w-8 h-8 text-primary mb-3" />
          <h3 className="text-xl font-semibold mb-2">Minhas Notas Fiscais</h3>
          <p className="text-muted-foreground mb-4">Visualize, filtre e gerencie todas as notas cadastradas.</p>
          <Link to="/dashboard/notas">
            <Button>Acessar Notas</Button>
          </Link>
        </Card>
        
        <Card className="p-6 flex flex-col items-start">
          <Camera className="w-8 h-8 text-secondary mb-3" />
          <h3 className="text-xl font-semibold mb-2">Captura Mobile</h3>
          <p className="text-muted-foreground mb-4">Use seu celular para capturar novas notas rapidamente.</p>
          <Link to="/mobile">
            <Button variant="outline">Ir para Captura Mobile</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default DashboardIndex;