import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface XmlUploaderProps {
  onUploadSuccess: () => void;
}

export default function XmlUploader({ onUploadSuccess }: XmlUploaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/xml" || file.name.endsWith(".xml")) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo XML da nota fiscal.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      // Ler o conteúdo do arquivo XML
      const xmlText = await selectedFile.text();

      // Enviar para a edge function processar
      const { data, error } = await supabase.functions.invoke('process-nota-fiscal', {
        body: { xmlContent: xmlText }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Nota fiscal processada!",
          description: `Nota ${data.numeroNota} foi adicionada com sucesso.`,
        });
        
        setSelectedFile(null);
        // Limpar o input
        const fileInput = document.getElementById('xml-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Notificar sucesso para atualizar a lista
        onUploadSuccess();
      } else {
        throw new Error(data.error || "Erro ao processar nota fiscal");
      }
    } catch (error: any) {
      console.error("Erro ao processar XML:", error);
      toast({
        title: "Erro ao processar nota",
        description: error.message || "Não foi possível processar o arquivo XML.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Upload de Nota Fiscal</h3>
          <p className="text-sm text-muted-foreground">
            Faça upload do arquivo XML para baixar DANF e OCR
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="xml-file">Arquivo XML da Nota Fiscal</Label>
          <Input
            id="xml-file"
            type="file"
            accept=".xml,text/xml"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm flex-1">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Processar Nota Fiscal
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
