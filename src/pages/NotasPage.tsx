import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import NotasFilters from "@/components/NotasFilters";
import NotasTable from "@/components/NotasTable";
import { downloadPdfWithOcr, type OcrProgress } from "@/utils/pdfOcr";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCompanyNames } from "@/hooks/use-company-names";

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

const fetchNotas = async (): Promise<Nota[]> => {
  const { data, error } = await (supabase as any)
    .from('notas_fiscais')
    .select('*')
    .order('data_emissao', { ascending: false });

  if (error) throw error;
  return data || [];
};

const NotasPage = () => {
  const { toast } = useToast();
  const { data: notas = [], isLoading: isLoadingNotas, refetch: refetchNotas } = useQuery({
    queryKey: ['notasFiscais'],
    queryFn: fetchNotas,
  });
  
  const { data: companyNames = [], isLoading: isLoadingCompanies } = useCompanyNames();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  
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
      refetchNotas();
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

  // Preparar opções para o Combobox
  const companyOptions = useMemo(() => 
    companyNames.map(name => ({ value: name, label: name }))
  , [companyNames]);

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
      filtered = filtered.filter(nota => {
        const valorMin = parseFloat(searchValorMin);
        return !isNaN(valorMin) && nota.valor >= valorMin;
      });
    }

    if (searchValorMax) {
      filtered = filtered.filter(nota => {
        const valorMax = parseFloat(searchValorMax);
        return !isNaN(valorMax) && nota.valor <= valorMax;
      });
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

  if (isLoadingNotas || isLoadingCompanies) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Minhas Notas Fiscais</h2>
        <p className="text-muted-foreground mb-4">
          {filteredAndSortedNotas.length} {filteredAndSortedNotas.length === 1 ? 'nota encontrada' : 'notas encontradas'}
        </p>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            📱 <strong>Captura pelo celular:</strong> Use o app mobile para fotografar e processar notas fiscais
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            💻 <strong>Gerenciamento:</strong> Aqui você visualiza, filtra e baixa DANF (PDF) e OCR (texto extraído)
          </p>
        </div>
      </div>

      <NotasFilters
        searchEmpresa={searchEmpresa}
        searchNumero={searchNumero}
        searchDataInicio={searchDataInicio}
        searchDataFim={searchDataFim}
        searchValorMin={searchValorMin}
        searchValorMax={searchValorMax}
        companyOptions={companyOptions}
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
          <p className="text-muted-foreground mb-4">
            {notas.length === 0 
              ? "Capture suas primeiras notas fiscais usando o app mobile"
              : "Tente ajustar os filtros de pesquisa"
            }
          </p>
          {notas.length === 0 && (
            <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-muted-foreground">
                <strong>Como começar:</strong><br />
                1. Acesse o app pelo celular<br />
                2. Tire foto da nota fiscal<br />
                3. Confirme os dados extraídos<br />
                4. Volte aqui para baixar DANF e OCR
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <NotasTable
            notas={filteredAndSortedNotas}
            sortField={sortField}
            sortOrder={sortOrder}
            downloadingId={downloadingId}
            ocrProgress={ocrProgress}
            onSort={handleSort}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        </Card>
      )}
    </div>
  );
};

export default NotasPage;