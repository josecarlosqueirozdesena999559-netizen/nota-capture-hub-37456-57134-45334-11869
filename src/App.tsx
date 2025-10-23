import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardLayout from "./components/DashboardLayout"; // Novo Layout
import DashboardIndex from "./pages/DashboardIndex"; // Nova página inicial do Dashboard
import NotasPage from "./pages/NotasPage"; // Nova página de Notas
import MobileCapture from "./pages/MobileCapture";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Rota protegida com Layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<NotasPage />} /> {/* Define NotasPage como a rota padrão do /dashboard */}
            <Route path="notas" element={<NotasPage />} />
            {/* Adicione outras rotas do dashboard aqui */}
          </Route>
          
          <Route path="/mobile" element={<MobileCapture />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;