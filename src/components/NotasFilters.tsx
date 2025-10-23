import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

interface NotasFiltersProps {
  searchEmpresa: string;
  searchNumero: string;
  searchDataInicio: string;
  searchDataFim: string;
  companyOptions: { value: string; label: string }[];
  onSearchEmpresaChange: (value: string) => void;
  onSearchNumeroChange: (value: string) => void;
  onSearchDataInicioChange: (value: string) => void;
  onSearchDataFimChange: (value: string) => void;
  onClearFilters: () => void;
}

const NotasFilters = ({
  searchEmpresa,
  searchNumero,
  searchDataInicio,
  searchDataFim,
  companyOptions,
  onSearchEmpresaChange,
  onSearchNumeroChange,
  onSearchDataInicioChange,
  onSearchDataFimChange,
  onClearFilters,
}: NotasFiltersProps) => {
  const hasActiveFilters = 
    searchEmpresa || searchNumero || searchDataInicio || 
    searchDataFim;

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Filtros de Pesquisa</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-1" />
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="filterEmpresa">Nome da Empresa</Label>
          <Combobox
            options={companyOptions}
            value={searchEmpresa}
            onChange={onSearchEmpresaChange}
            placeholder="Selecione ou pesquise a empresa..."
            searchPlaceholder="Buscar empresa..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filterNumero">Número da Nota</Label>
          <Input
            id="filterNumero"
            placeholder="Pesquisar número..."
            value={searchNumero}
            onChange={(e) => onSearchNumeroChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filterDataInicio">Data Início</Label>
          <Input
            id="filterDataInicio"
            type="date"
            value={searchDataInicio}
            onChange={(e) => onSearchDataInicioChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filterDataFim">Data Fim</Label>
          <Input
            id="filterDataFim"
            type="date"
            value={searchDataFim}
            onChange={(e) => onSearchDataFimChange(e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
};

export default NotasFilters;