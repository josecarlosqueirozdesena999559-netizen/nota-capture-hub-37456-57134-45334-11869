import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export type OcrProgress = {
  status: string;
  progress: number;
};

export async function extractTextFromPdf(
  pdfBlob: Blob,
  lang: string = "por",
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  try {
    onProgress?.({ status: "Carregando PDF...", progress: 0 });

    // 1) Carrega o PDF
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    onProgress?.({ status: "Extraindo texto nativo...", progress: 10 });

    // 2) Primeiro tenta extrair TEXTO nativo (mais rápido e preciso que OCR)
    let extractedText = "";
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      extractedText += pageText + "\n\n";
    }

    const cleanText = extractedText.trim();

    // Se encontrou texto suficiente, retorna sem fazer OCR
    if (cleanText.length > 50) {
      onProgress?.({ status: "Texto nativo encontrado!", progress: 100 });
      return cleanText;
    }

    // 3) Se não há texto, faz OCR página a página
    onProgress?.({ status: "Iniciando OCR...", progress: 20 });

    let fullText = "";
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Renderiza em canvas com boa resolução
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      
      if (!context) {
        throw new Error("Não foi possível criar contexto do canvas");
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      } as any).promise;

      // Faz OCR nessa página
      const progressBase = 20 + ((pageNum - 1) / totalPages) * 70;
      
      const { data } = await Tesseract.recognize(canvas, lang, {
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress != null) {
            const pageProgress = progressBase + (m.progress * 70) / totalPages;
            onProgress?.({
              status: `OCR página ${pageNum}/${totalPages}...`,
              progress: Math.round(pageProgress),
            });
          }
        },
      });

      fullText += data.text + "\n\n";
    }

    onProgress?.({ status: "OCR concluído!", progress: 100 });
    return fullText.trim();
  } catch (error) {
    console.error("Erro no OCR:", error);
    throw new Error("Erro ao processar PDF: " + (error instanceof Error ? error.message : "Erro desconhecido"));
  }
}

export async function downloadPdfWithOcr(
  pdfDataUrl: string,
  fileName: string,
  onProgress?: (progress: OcrProgress) => void
): Promise<void> {
  try {
    // Converte data URL para Blob
    const response = await fetch(pdfDataUrl);
    const pdfBlob = await response.blob();

    // Extrai texto com OCR
    const extractedText = await extractTextFromPdf(pdfBlob, "por", onProgress);

    // Cria um arquivo de texto com o conteúdo extraído
    const textBlob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    const textFileName = fileName.replace(".pdf", "_texto.txt");

    // Download do PDF original
    const pdfLink = document.createElement("a");
    pdfLink.href = pdfDataUrl;
    pdfLink.download = fileName;
    document.body.appendChild(pdfLink);
    pdfLink.click();
    document.body.removeChild(pdfLink);

    // Download do texto extraído
    const textUrl = URL.createObjectURL(textBlob);
    const textLink = document.createElement("a");
    textLink.href = textUrl;
    textLink.download = textFileName;
    document.body.appendChild(textLink);
    textLink.click();
    document.body.removeChild(textLink);
    URL.revokeObjectURL(textUrl);

  } catch (error) {
    console.error("Erro ao baixar PDF com OCR:", error);
    throw error;
  }
}
