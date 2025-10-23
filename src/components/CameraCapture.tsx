import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X, Upload } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = () => {
    if (imagePreview) {
      onCapture(imagePreview);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Capturar Nota Fiscal</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {!imagePreview ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Tire uma foto ou selecione uma imagem
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Fotografe a nota fiscal ou faça upload de uma imagem
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Tirar Foto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.capture = undefined as any;
                      fileInputRef.current.click();
                    }
                  }}
                  size="lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Nota Fiscal"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setImagePreview(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Tirar Outra Foto
                </Button>
                <Button onClick={handleConfirm} className="flex-1">
                  Processar Nota
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CameraCapture;
