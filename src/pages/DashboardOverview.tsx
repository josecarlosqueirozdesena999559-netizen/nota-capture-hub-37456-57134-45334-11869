import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, DollarSign, Users, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { MobileLoginCodeDialog } from "@/components/MobileLoginCodeDialog";

interface Nota {
  id: string;
  empresa_nome: string;
  valor: number;
  data_emissao: string;
}

const fetchAllNotas = async (): Promise<Nota[]> => {
  const { data, error } = await (supabase as any)
    .from('notas_fiscais')
    .select('id, empresa_nome, valor, data_emissao');

  if (error) throw error;
  return data || [];
};

const DashboardOverview = () => {
  const { toast } = useToast();
  const { data: notas = [], isLoading: isLoadingNotas } = useQuery<Nota[], Error>({
    queryKey: ['dashboardMetrics'],
    queryFn: fetchAllNotas,
  });
  
  const { data: userMetadata, isLoading: isLoadingUserMetadata } = useUserMetadata();

  // Cálculo das métricas
  const totalNotas = notas.length;
  const valorTotal = notas.reduce((sum, nota) => sum + nota.valor, 0);
  const fornecedoresUnicos = new Set(notas.map(nota => nota.empresa_nome)).size;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Lógica de Exportação (Exportar PDF com notas colocadas no sistema)
  const handleExport = () => {
    toast({
      title: "Exportação em desenvolvimento",
      description: "A funcionalidade de exportar PDF/CSV com dados filtrados será implementada em breve.",
      variant: "default",
    });
  };

  const userName = userMetadata?.fullName || "Usuário";

  if (isLoadingNotas || isLoadingUserMetadata) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Olá, {userName}!</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo ao seu painel de notas fiscais.</p>
        </div>
        <div className="flex gap-2">
          <MobileLoginCodeDialog />
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Dados
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotas}</div>
            <p className="text-xs text-muted-foreground">Notas cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{formatCurrency(valorTotal)}</div>
            <p className="text-xs text-muted-foreground">Soma de todas as notas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fornecedoresUnicos}</div>
            <p className="text-xs text-muted-foreground">Empresas emitentes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;