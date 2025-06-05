
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, Settings } from 'lucide-react';
import { AdminPanel } from './AdminPanel';

interface HeaderProps {
  user: any;
  onLoginOpen: () => void;
  onAdminOpen: () => void;
  onLogout: () => void;
}

export function Header({ user, onLoginOpen, onAdminOpen, onLogout }: HeaderProps) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  return (
    <>
      <header className="border-b border-digitalwert-background-lighter bg-digitalwert-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-digitalwert-primary to-digitalwert-accent bg-clip-text text-transparent">
              Digitalwert
            </h1>
          </div>
          
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdminOpen(true)}
                  className="text-slate-300 hover:text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-slate-300 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoginOpen}
                className="text-slate-300 hover:text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            )}
          </nav>
        </div>
      </header>

      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </>
  );
}
