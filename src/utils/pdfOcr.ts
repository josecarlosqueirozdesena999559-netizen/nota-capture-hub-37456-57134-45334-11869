import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { PDFDocument, rgb } from "pdf-lib";

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
    onProgress?.({ status: "Carregando PDF...", progress: 0 });
    
    // Converte data URL para Blob
    const response = await fetch(pdfDataUrl);
    const pdfBlob = await response.blob();
    const arrayBuffer = await pdfBlob.arrayBuffer();

    // Carrega o PDF original e extrai texto
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    onProgress?.({ status: "Processando OCR...", progress: 10 });

    // Carrega o PDF com pdf-lib para adicionar texto
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    // Processa cada página
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Renderiza em canvas
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
      const progressBase = 10 + ((pageNum - 1) / totalPages) * 80;
      
      const { data } = await Tesseract.recognize(canvas, "por", {
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress != null) {
            const pageProgress = progressBase + (m.progress * 80) / totalPages;
            onProgress?.({
              status: `OCR página ${pageNum}/${totalPages}...`,
              progress: Math.round(pageProgress),
            });
          }
        },
      });

      // Adiciona o texto como camada invisível no PDF
      const pdfPage = pages[pageNum - 1];
      const { height } = pdfPage.getSize();
      
      // Adiciona texto em fonte muito pequena e transparente
      pdfPage.drawText(data.text, {
        x: 0,
        y: height,
        size: 0.1,
        color: rgb(1, 1, 1),
        opacity: 0,
      });
    }

    onProgress?.({ status: "Gerando PDF pesquisável...", progress: 95 });

    // Salva o PDF modificado
    const pdfBytes = await pdfDoc.save();
    const searchablePdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    const searchablePdfUrl = URL.createObjectURL(searchablePdfBlob);

    // Download do PDF pesquisável
    const link = document.createElement("a");
    link.href = searchablePdfUrl;
    link.download = fileName.replace(".pdf", "_pesquisavel.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(searchablePdfUrl);

    onProgress?.({ status: "Concluído!", progress: 100 });

  } catch (error) {
    console.error("Erro ao baixar PDF com OCR:", error);
    throw error;
  }
}
