# Regras de IA e Diretrizes do Projeto NotaFácil

Este documento descreve as tecnologias centrais e as regras arquitetônicas para o aplicativo NotaFácil, garantindo consistência, manutenibilidade e adesão às melhores práticas.

## 1. Visão Geral do Stack Tecnológico

O aplicativo NotaFácil é construído com uma arquitetura moderna e baseada em componentes:

*   **Framework Frontend:** React (com TypeScript).
*   **Estilização:** Tailwind CSS para um design responsivo e utilitário.
*   **Biblioteca de UI:** shadcn/ui (baseada em Radix UI) para componentes acessíveis e de alta qualidade.
*   **Roteamento:** React Router DOM para navegação no lado do cliente.
*   **Backend/Auth/DB:** Supabase (`@supabase/supabase-js`) para autenticação, banco de dados (PostgreSQL) e funções serverless.
*   **Gerenciamento de Estado de Servidor:** React Query (`@tanstack/react-query`) para caching e sincronização de dados.
*   **Ícones:** Lucide React.
*   **Processamento de PDF/OCR:** Uso de `pdfjs-dist`, `tesseract.js` e `pdf-lib` para extração de texto e manipulação de PDFs.
*   **Datas:** `date-fns` para formatação e manipulação de datas.

## 2. Regras de Uso de Bibliotecas

| Funcionalidade | Biblioteca/Ferramenta Recomendada | Regra/Diretriz |
| :--- | :--- | :--- |
| **Componentes & UI** | shadcn/ui, Tailwind CSS | **DEVE** usar componentes shadcn/ui. Toda estilização customizada deve ser feita usando classes do Tailwind CSS. Componentes novos devem ser pequenos e colocados em `src/components/`. |
| **Roteamento** | React Router DOM | Todas as rotas devem ser definidas em `src/App.tsx`. Páginas devem residir em `src/pages/`. |
| **Autenticação & DB** | `@supabase/supabase-js` | Use o cliente `supabase` de `src/integrations/supabase/client.ts` para todas as operações de autenticação e banco de dados. |
| **Notificações** | `useToast` (Radix) / `Sonner` | Use o hook `useToast` existente para notificações padrão e o componente `<Sonner />` para mensagens globais. |
| **Processamento de PDF** | `pdfjs-dist`, `tesseract.js`, `pdf-lib` | Use estas bibliotecas conforme implementado em `src/utils/pdfOcr.ts` para garantir a funcionalidade de OCR e download de PDFs pesquisáveis. |
| **Ícones** | `lucide-react` | Use ícones exclusivamente do pacote `lucide-react`. |