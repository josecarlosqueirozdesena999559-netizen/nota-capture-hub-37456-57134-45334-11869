import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, FileText, Image } from "lucide-react";
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
      const isXml = file.type === "text/xml" || file.name.endsWith(".xml");
      const isImage = file.type.startsWith("image/");
      
      if (isXml || isImage) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo XML ou imagem da nota fiscal.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      const isImage = selectedFile.type.startsWith("image/");
      
      let requestBody;
      
      if (isImage) {
        // Converter imagem para base64
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        
        requestBody = { imageBase64: base64Data };
      } else {
        // Ler o conteúdo do arquivo XML
        const xmlText = await selectedFile.text();
        requestBody = { xmlContent: xmlText };
      }

      // Enviar para a edge function processar
      const { data, error } = await supabase.functions.invoke('process-nota-fiscal', {
        body: requestBody
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Nota fiscal processada!",
          description: `Nota ${data.numeroNota || data.data?.numero_nota || 'processada'} foi adicionada com sucesso.`,
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
      console.error("Erro ao processar arquivo:", error);
      toast({
        title: "Erro ao processar nota",
        description: error.message || "Não foi possível processar o arquivo.",
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
          <Upload className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Upload de Nota Fiscal</h3>
          <p className="text-sm text-muted-foreground">
            Faça upload de XML ou imagem (foto/captura) da nota fiscal
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="xml-file">Arquivo XML ou Imagem da Nota Fiscal</Label>
          <Input
            id="xml-file"
            type="file"
            accept=".xml,text/xml,image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {selectedFile.type.startsWith("image/") ? (
              <Image className="w-4 h-4 text-muted-foreground" />
            ) : (
              <FileText className="w-4 h-4 text-muted-foreground" />
            )}
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
