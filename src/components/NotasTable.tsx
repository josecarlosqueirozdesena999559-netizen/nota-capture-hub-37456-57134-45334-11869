import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Trash2, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type OcrProgress } from "@/utils/pdfOcr";

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

interface NotasTableProps {
  notas: Nota[];
  sortField: SortField;
  sortOrder: SortOrder;
  downloadingId: string | null;
  ocrProgress: OcrProgress | null;
  onSort: (field: SortField) => void;
  onDownload: (nota: Nota, withOcr: boolean) => void;
  onDelete: (id: string) => void;
}

// Função auxiliar para remover zeros à esquerda
const formatNumeroNota = (numero: string): string => {
  // Remove zeros à esquerda, mas garante que '0' não se torne vazio
  return numero.replace(/^0+/, '') || '0';
};

const NotasTable = ({
  notas,
  sortField,
  sortOrder,
  downloadingId,
  ocrProgress,
  onSort,
  onDownload,
  onDelete,
}: NotasTableProps) => {
  
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '▲' : '▼';
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort('empresa_nome')}
                className="hover:bg-transparent"
              >
                Empresa {getSortIndicator('empresa_nome')}
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort('numero_nota')}
                className="hover:bg-transparent"
              >
                Número {getSortIndicator('numero_nota')}
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort('data_emissao')}
                className="hover:bg-transparent"
              >
                Data Emissão {getSortIndicator('data_emissao')}
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort('valor')}
                className="hover:bg-transparent"
              >
                Valor {getSortIndicator('valor')}
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notas.map((nota) => (
            <TableRow key={nota.id}>
              <TableCell className="font-medium">{nota.empresa_nome}</TableCell>
              <TableCell>{formatNumeroNota(nota.numero_nota)}</TableCell>
              <TableCell>
                {format(new Date(nota.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                R$ {nota.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end items-center">
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onDownload(nota, false)}
                      disabled={downloadingId === nota.id}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {downloadingId === nota.id && !ocrProgress ? "Baixando..." : "DANF (PDF)"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownload(nota, true)}
                      disabled={downloadingId === nota.id}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {downloadingId === nota.id && ocrProgress 
                        ? `OCR ${ocrProgress.progress}%` 
                        : "PDF + OCR"}
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(nota.id)}
                    disabled={downloadingId === nota.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {downloadingId === nota.id && ocrProgress && (
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {ocrProgress.status}
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default NotasTable;