
import { Button } from '@/components/ui/button';
import { Settings, User, LogOut } from 'lucide-react';

interface HeaderProps {
  user: any;
  onLoginOpen: () => void;
  onAdminOpen: () => void;
  onLogout: () => void;
}

export function Header({ user, onLoginOpen, onAdminOpen, onLogout }: HeaderProps) {
  return (
    <header className="bg-digitalwert-background-light/80 backdrop-blur-sm shadow-lg border-b border-digitalwert-background-lighter">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-digitalwert-primary to-digitalwert-accent-light rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-digitalwert-primary to-digitalwert-accent-light bg-clip-text text-transparent">
                Digitalwert
              </h1>
              <p className="text-sm text-slate-400">Agentur für digitale Wertschöpfung</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-slate-300">Willkommen, {user.name}</span>
                <Button variant="ghost" size="sm" onClick={onLogout} className="text-slate-300 hover:text-white hover:bg-digitalwert-background-lighter">
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onLoginOpen} className="border-digitalwert-primary text-digitalwert-primary hover:bg-digitalwert-primary hover:text-white">
                <User className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onAdminOpen} className="text-slate-300 hover:text-white hover:bg-digitalwert-background-lighter">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
