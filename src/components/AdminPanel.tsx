
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, FileText, DollarSign, Database, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [services, setServices] = useState([
    { id: 1, name: 'Webauftritt Basic', description: 'Einfache responsive Website', price: 1500 },
    { id: 2, name: 'Webauftritt Professional', description: 'Professionelle Website mit CMS', price: 2500 },
    { id: 3, name: 'E-Commerce Shop', description: 'Vollständiges Shop-System', price: 4500 },
    { id: 4, name: 'Corporate Rebranding', description: 'Komplettes Rebranding Paket', price: 3200 },
    { id: 5, name: 'UI/UX Design', description: 'Interface Design und Prototyping', price: 1800 },
  ]);
  const [newService, setNewService] = useState({ name: '', description: '', price: 0 });
  const { toast } = useToast();

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      toast({
        title: "Admin-Zugang gewährt",
        description: "Sie sind jetzt im Admin-Bereich angemeldet.",
      });
    } else {
      toast({
        title: "Fehler",
        description: "Falsches Passwort.",
        variant: "destructive"
      });
    }
  };

  const handleAddService = () => {
    if (!newService.name || !newService.description || newService.price <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder korrekt aus.",
        variant: "destructive"
      });
      return;
    }

    const service = {
      id: Date.now(),
      ...newService
    };

    setServices(prev => [...prev, service]);
    setNewService({ name: '', description: '', price: 0 });
    
    toast({
      title: "Service hinzugefügt",
      description: `${service.name} wurde erfolgreich hinzugefügt.`,
    });
  };

  const handleDeleteService = (id: number) => {
    setServices(prev => prev.filter(service => service.id !== id));
    toast({
      title: "Service gelöscht",
      description: "Der Service wurde erfolgreich entfernt.",
    });
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admin-Bereich
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-password">Admin-Passwort</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben..."
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Anmelden
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Demo-Passwort: admin123
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin-Panel
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="agb">AGB</TabsTrigger>
            <TabsTrigger value="knowledge">Wissensbasis</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Service Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Service Name"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Beschreibung"
                    value={newService.description}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Preis (€)"
                      value={newService.price || ''}
                      onChange={(e) => setNewService(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    />
                    <Button onClick={handleAddService}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-slate-600">{service.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{service.price.toLocaleString('de-DE')} €</span>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agb" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  AGB Verwaltung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="AGB-Text hier eingeben..."
                  rows={10}
                  defaultValue="Allgemeine Geschäftsbedingungen der Digitalwert GmbH..."
                />
                <Button className="mt-4">AGB speichern</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  KI-Wissensbasis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Wissensbasis für die KI-Beratung..."
                  rows={10}
                  defaultValue="Digitalwert ist eine Agentur für digitale Wertschöpfung. Wir bieten professionelle Webentwicklung, E-Commerce-Lösungen, Corporate Design und UI/UX Services..."
                />
                <Button className="mt-4">Wissensbasis aktualisieren</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chat-Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">47</div>
                  <p className="text-sm text-slate-600">Heute</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Angebote erstellt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">23</div>
                  <p className="text-sm text-slate-600">Diese Woche</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Termine gebucht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">8</div>
                  <p className="text-sm text-slate-600">Diesen Monat</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
            Abmelden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
