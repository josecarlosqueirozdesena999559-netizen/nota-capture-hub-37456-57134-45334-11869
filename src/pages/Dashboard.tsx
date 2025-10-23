import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Receipt, Download, Trash2, ArrowUpDown, Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import NotasFilters from "@/components/NotasFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { downloadPdfWithOcr, type OcrProgress } from "@/utils/pdfOcr";
import XmlUploader from "@/components/XmlUploader";
import CameraCapture from "@/components/CameraCapture";

interface Nota {
  id: string;
  empresa_nome: string;
  chave_acesso: string;
  numero_nota: string;
  data_emissao: string;
  valor: number;
  status: string;
  created_at: string;
}

type SortField = 'empresa_nome' | 'numero_nota' | 'data_emissao' | 'valor';
type SortOrder = 'asc' | 'desc';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  
  // Filtros
  const [searchEmpresa, setSearchEmpresa] = useState("");
  const [searchNumero, setSearchNumero] = useState("");
  const [searchDataInicio, setSearchDataInicio] = useState("");
  const [searchDataFim, setSearchDataFim] = useState("");
  const [searchValorMin, setSearchValorMin] = useState("");
  const [searchValorMax, setSearchValorMax] = useState("");
  
  // Ordenação
  const [sortField, setSortField] = useState<SortField>('data_emissao');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  useEffect(() => {
    if (user) {
      fetchNotas();
    }
  }, [user]);

  const fetchNotas = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('notas_fiscais')
        .select('*')
        .order('data_emissao', { ascending: false });

      if (error) throw error;

      setNotas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar notas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDownload = async (nota: Nota, withOcr: boolean = false) => {
    try {
      setDownloadingId(nota.id);
      setOcrProgress(null);

      const { data, error } = await supabase.functions.invoke('download-danf', {
        body: { chaveAcesso: nota.chave_acesso }
      });

      if (error) throw error;

      if (data.success) {
        if (withOcr) {
          // Download com OCR
          await downloadPdfWithOcr(
            data.danfUrl,
            data.fileName || `DANF-${nota.numero_nota}.pdf`,
            (progress) => setOcrProgress(progress)
          );
          
          toast({
            title: "Download concluído",
            description: "DANF e texto extraído foram baixados com sucesso.",
          });
        } else {
          // Download simples
          const link = document.createElement("a");
          link.href = data.danfUrl;
          link.download = data.fileName || `DANF-${nota.numero_nota}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Download iniciado",
            description: "O DANF foi baixado com sucesso.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao baixar DANF",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
      setOcrProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;

    try {
      const { error } = await (supabase as any)
        .from('notas_fiscais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Nota excluída",
        description: "A nota fiscal foi removida do sistema.",
      });
      fetchNotas();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir nota",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClearFilters = () => {
    setSearchEmpresa("");
    setSearchNumero("");
    setSearchDataInicio("");
    setSearchDataFim("");
    setSearchValorMin("");
    setSearchValorMax("");
  };

  const handleImageCapture = async (imageData: string) => {
    console.log("Imagem capturada:", imageData.substring(0, 50) + "...");
    toast({
      title: "Imagem capturada",
      description: "Imagem foi capturada com sucesso. Aqui você pode processar a imagem.",
    });
    setShowCamera(false);
  };

  // Filtrar e ordenar notas
  const filteredAndSortedNotas = useMemo(() => {
    let filtered = [...notas];

    // Aplicar filtros
    if (searchEmpresa) {
      filtered = filtered.filter(nota => 
        nota.empresa_nome.toLowerCase().includes(searchEmpresa.toLowerCase())
      );
    }

    if (searchNumero) {
      filtered = filtered.filter(nota => 
        nota.numero_nota.toLowerCase().includes(searchNumero.toLowerCase())
      );
    }

    if (searchDataInicio) {
      filtered = filtered.filter(nota => 
        nota.data_emissao >= searchDataInicio
      );
    }

    if (searchDataFim) {
      filtered = filtered.filter(nota => 
        nota.data_emissao <= searchDataFim
      );
    }

    if (searchValorMin) {
      filtered = filtered.filter(nota => 
        nota.valor >= parseFloat(searchValorMin)
      );
    }

    if (searchValorMax) {
      filtered = filtered.filter(nota => 
        nota.valor <= parseFloat(searchValorMax)
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'valor') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [notas, searchEmpresa, searchNumero, searchDataInicio, searchDataFim, searchValorMin, searchValorMax, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header Desktop */}
      <header className="bg-card border-b border-border shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">NotaFácil</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Desktop */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Gerenciar Notas Fiscais</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedNotas.length} {filteredAndSortedNotas.length === 1 ? 'nota encontrada' : 'notas encontradas'}
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <XmlUploader onUploadSuccess={fetchNotas} />
          <Button onClick={() => setShowCamera(true)} size="lg">
            <Camera className="w-5 h-5 mr-2" />
            Testar Upload de Imagem
          </Button>
        </div>

        <NotasFilters
          searchEmpresa={searchEmpresa}
          searchNumero={searchNumero}
          searchDataInicio={searchDataInicio}
          searchDataFim={searchDataFim}
          searchValorMin={searchValorMin}
          searchValorMax={searchValorMax}
          onSearchEmpresaChange={setSearchEmpresa}
          onSearchNumeroChange={setSearchNumero}
          onSearchDataInicioChange={setSearchDataInicio}
          onSearchDataFimChange={setSearchDataFim}
          onSearchValorMinChange={setSearchValorMin}
          onSearchValorMaxChange={setSearchValorMax}
          onClearFilters={handleClearFilters}
        />

        {filteredAndSortedNotas.length === 0 ? (
          <Card className="p-12 text-center">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {notas.length === 0 ? "Nenhuma nota cadastrada" : "Nenhuma nota encontrada"}
            </h3>
            <p className="text-muted-foreground">
              {notas.length === 0 
                ? "As notas capturadas no celular aparecerão aqui"
                : "Tente ajustar os filtros de pesquisa"
              }
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('empresa_nome')}
                        className="hover:bg-transparent"
                      >
                        Empresa
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('numero_nota')}
                        className="hover:bg-transparent"
                      >
                        Número
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('data_emissao')}
                        className="hover:bg-transparent"
                      >
                        Data Emissão
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('valor')}
                        className="hover:bg-transparent"
                      >
                        Valor
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedNotas.map((nota) => (
                    <TableRow key={nota.id}>
                      <TableCell className="font-medium">{nota.empresa_nome}</TableCell>
                      <TableCell>{nota.numero_nota}</TableCell>
                      <TableCell>
                        {format(new Date(nota.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        R$ {nota.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(nota, false)}
                            disabled={downloadingId === nota.id}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {downloadingId === nota.id && !ocrProgress ? "Baixando..." : "Baixar PDF"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(nota, true)}
                            disabled={downloadingId === nota.id}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {downloadingId === nota.id && ocrProgress 
                              ? `${ocrProgress.progress}%` 
                              : "DANF + OCR"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(nota.id)}
                            disabled={downloadingId === nota.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {downloadingId === nota.id && ocrProgress && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {ocrProgress.status}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>

      {showCamera && (
        <CameraCapture
          onCapture={handleImageCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
