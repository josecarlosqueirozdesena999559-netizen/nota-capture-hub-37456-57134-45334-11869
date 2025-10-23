import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { X, CheckCircle } from "lucide-react";

interface ConfirmNotaDialogProps {
  data: {
    empresa_nome: string;
    chave_acesso: string;
    numero_nota: string;
    data_emissao: string;
    valor: number;
  };
  onConfirm: (data: any) => void;
  onCancel: () => void;
}

const ConfirmNotaDialog = ({ data, onConfirm, onCancel }: ConfirmNotaDialogProps) => {
  const [formData, setFormData] = useState(data);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-secondary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Confirme os Dados</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empresa">Nome da Empresa</Label>
            <Input
              id="empresa"
              value={formData.empresa_nome}
              onChange={(e) => handleChange('empresa_nome', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chave">Chave de Acesso</Label>
            <Input
              id="chave"
              value={formData.chave_acesso}
              onChange={(e) => handleChange('chave_acesso', e.target.value)}
              maxLength={44}
            />
            <p className="text-xs text-muted-foreground">
              44 dígitos da chave de acesso da NF-e
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número da Nota</Label>
              <Input
                id="numero"
                value={formData.numero_nota}
                onChange={(e) => handleChange('numero_nota', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data de Emissão</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_emissao}
                onChange={(e) => handleChange('data_emissao', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor Total (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => handleChange('valor', parseFloat(e.target.value))}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={() => onConfirm(formData)} className="flex-1">
              Confirmar e Salvar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmNotaDialog;
