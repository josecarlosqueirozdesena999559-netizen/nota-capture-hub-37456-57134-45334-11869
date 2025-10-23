import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserMetadata {
  fullName: string | null;
}

const fetchUserMetadata = async (): Promise<UserMetadata> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { fullName: null };
  }

  // O nome completo é armazenado nos metadados do usuário
  const fullName = user.user_metadata?.full_name as string | undefined;
  
  return { fullName: fullName || user.email?.split('@')[0] || null };
};

export function useUserMetadata() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['userMetadata'],
    queryFn: fetchUserMetadata,
    staleTime: 1000 * 60 * 60, // 1 hour
    onError: (error: any) => {
      toast({
        title: "Erro ao carregar dados do usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}