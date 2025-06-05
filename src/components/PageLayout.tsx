
import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function PageLayout({ children, title, subtitle }: PageLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLoginOpen = () => {
    navigate('/auth');
  };

  const handleLogout = () => {
    // Logout is handled in the header component
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="dark min-h-screen bg-gradient-to-br from-digitalwert-background via-digitalwert-background-light to-digitalwert-background-lighter flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <Header 
            user={user}
            onLoginOpen={handleLoginOpen}
            onAdminOpen={() => navigate('/dashboard')}
            onLogout={handleLogout}
          />
          
          <div className="flex-1 container mx-auto px-6 py-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
              {subtitle && <p className="text-slate-400">{subtitle}</p>}
            </div>
            
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
