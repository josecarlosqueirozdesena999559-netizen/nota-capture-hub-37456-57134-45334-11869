import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fetchCompanyNames = async (): Promise<string[]> => {
  const { data, error } = await (supabase as any)
    .from('notas_fiscais')
    .select('empresa_nome')
    .order('empresa_nome', { ascending: true });

  if (error) throw error;

  // Extrai nomes únicos e remove duplicatas
  const uniqueNames = Array.from(new Set(data.map((item: any) => item.empresa_nome).filter(Boolean)));
  return uniqueNames;
};

export function useCompanyNames() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['companyNames'],
    queryFn: fetchCompanyNames,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error: any) => {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}