import { useState, useEffect } from "react";
import { useNavigate, Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Receipt, Menu, X, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { User } from "@supabase/supabase-js";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, icon, label, isActive, onClick }: NavItemProps) => (
  <Link to={to} onClick={onClick}>
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start text-base h-12"
    >
      {icon}
      <span className="ml-3">{label}</span>
    </Button>
  </Link>
);

const SidebarContent = ({ onLogout, currentPath, onNavigate, userEmail }: { onLogout: () => void, currentPath: string, onNavigate?: () => void, userEmail: string | undefined }) => (
  <div className="flex flex-col h-full p-4">
    <div className="flex items-center gap-3 mb-8">
      <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
        <Receipt className="w-5 h-5 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">NotaFácil</h1>
        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
      </div>
    </div>

    <nav className="flex-grow space-y-2">
      <NavItem
        to="/dashboard/notas"
        icon={<Receipt className="w-5 h-5" />}
        label="Notas Fiscais"
        isActive={currentPath.startsWith("/dashboard/notas")}
        onClick={onNavigate}
      />
      {/* Futuros itens de menu aqui */}
    </nav>

    <div className="mt-auto pt-4 border-t border-border">
      <Button variant="ghost" onClick={onLogout} className="w-full justify-start">
        <LogOut className="w-5 h-5 mr-3" />
        Sair
      </Button>
    </div>
  </div>
);

const DashboardLayout = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const currentPath = window.location.pathname;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleMobileNavigate = () => {
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        {/* Mobile Header */}
        <header className="bg-card border-b border-border shadow-card sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] p-0">
                <SidebarContent 
                  onLogout={handleLogout} 
                  currentPath={currentPath} 
                  onNavigate={handleMobileNavigate}
                  userEmail={user?.email}
                />
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-bold text-foreground">NotaFácil</h1>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>
        
        {/* Mobile Content */}
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border shadow-lg flex-shrink-0 sticky top-0 h-screen">
        <SidebarContent onLogout={handleLogout} currentPath={currentPath} userEmail={user?.email} />
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 max-w-full">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;