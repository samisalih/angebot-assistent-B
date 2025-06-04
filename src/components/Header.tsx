
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
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Digitalwert</h1>
              <p className="text-sm text-slate-600">Agentur für digitale Wertschöpfung</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-slate-600">Willkommen, {user.name}</span>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onLoginOpen}>
                <User className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onAdminOpen}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
