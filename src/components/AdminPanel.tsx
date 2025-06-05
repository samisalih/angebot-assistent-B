
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, FileText, DollarSign, Database, Plus, Edit, Trash2, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [services, setServices] = useState([
    { id: 1, name: 'Webauftritt Basic', description: 'Einfache responsive Website', baseHours: 30, hourlyRate: 85 },
    { id: 2, name: 'Webauftritt Professional', description: 'Professionelle Website mit CMS', baseHours: 50, hourlyRate: 85 },
    { id: 3, name: 'E-Commerce Shop', description: 'Vollständiges Shop-System', baseHours: 80, hourlyRate: 85 },
    { id: 4, name: 'Corporate Rebranding', description: 'Komplettes Rebranding Paket', baseHours: 60, hourlyRate: 90 },
    { id: 5, name: 'UI/UX Design', description: 'Interface Design und Prototyping', baseHours: 40, hourlyRate: 95 },
  ]);
  const [newService, setNewService] = useState({ name: '', description: '', baseHours: 0, hourlyRate: 85 });
  const [agbText, setAgbText] = useState(`Allgemeine Geschäftsbedingungen der Digitalwert GmbH

1. Geltungsbereich
Diese AGB gelten für alle Dienstleistungen der Digitalwert GmbH.

2. Vertragsabschluss
Der Vertrag kommt durch schriftliche Bestätigung des Angebots zustande.

3. Zahlungsbedingungen
- 30% Anzahlung bei Projektstart
- 70% bei Projektabschluss
- Zahlungsziel: 14 Tage netto

4. Leistungsumfang
Der Leistungsumfang ergibt sich aus dem individuellen Angebot.

5. Urheberrecht
Alle Rechte verbleiben bis zur vollständigen Bezahlung bei Digitalwert.`);
  
  const [knowledgeBase, setKnowledgeBase] = useState(`Digitalwert ist eine spezialisierte Agentur für digitale Wertschöpfung mit Fokus auf:

KERNKOMPETENZEN:
- Webentwicklung (React, Vue.js, WordPress)
- E-Commerce Lösungen (Shopify, WooCommerce, Custom)
- Corporate Design & Branding
- UI/UX Design und Prototyping
- Technische Beratung und Konzeption

ARBEITSWEISE:
- Agile Projektmethodik
- Intensive Kundenbetreuung
- Fokus auf Performance und Usability
- Responsive Design als Standard
- SEO-optimierte Entwicklung

ZIELGRUPPEN:
- Mittelständische Unternehmen
- Startups und Scale-ups
- Etablierte Firmen mit Digitalisierungsbedarf

BESONDERHEITEN:
- Ganzheitliche Betreuung von Konzept bis Launch
- Langfristige Partnerschaften
- Technologie-agnostischer Ansatz
- Faire und transparente Preisgestaltung`);

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
    if (!newService.name || !newService.description || newService.baseHours <= 0 || newService.hourlyRate <= 0) {
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
    setNewService({ name: '', description: '', baseHours: 0, hourlyRate: 85 });
    
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

  const saveAgb = () => {
    toast({
      title: "AGB gespeichert",
      description: "Die AGB wurden erfolgreich aktualisiert.",
    });
  };

  const saveKnowledgeBase = () => {
    toast({
      title: "Wissensbasis gespeichert", 
      description: "Die KI-Wissensbasis wurde erfolgreich aktualisiert.",
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
            Admin-Panel - Digitalwert Verwaltung
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="services">Services & Preise</TabsTrigger>
            <TabsTrigger value="agb">AGB</TabsTrigger>
            <TabsTrigger value="knowledge">KI-Wissensbasis</TabsTrigger>
            <TabsTrigger value="processes">Prozesse</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Service & Preismanagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
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
                  <Input
                    type="number"
                    placeholder="Basis Stunden"
                    value={newService.baseHours || ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, baseHours: parseInt(e.target.value) || 0 }))}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Stundensatz (€)"
                      value={newService.hourlyRate || ''}
                      onChange={(e) => setNewService(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 85 }))}
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
                        <p className="text-xs text-slate-500">
                          {service.baseHours}h × {service.hourlyRate}€/h = ca. {(service.baseHours * service.hourlyRate).toLocaleString('de-DE')}€
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
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
                  rows={12}
                  value={agbText}
                  onChange={(e) => setAgbText(e.target.value)}
                />
                <Button onClick={saveAgb} className="mt-4">AGB speichern</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  KI-Wissensbasis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Diese Informationen werden der KI bereitgestellt, um bessere und spezifischere Beratung zu ermöglichen.
                  </p>
                  <Textarea
                    placeholder="Wissensbasis für die KI-Beratung..."
                    rows={12}
                    value={knowledgeBase}
                    onChange={(e) => setKnowledgeBase(e.target.value)}
                  />
                  <Button onClick={saveKnowledgeBase} className="mt-4">Wissensbasis aktualisieren</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Geschäftsprozesse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Projektablauf</h4>
                    <Textarea
                      rows={6}
                      defaultValue="1. Erstberatung und Anforderungsanalyse&#10;2. Angebotserstellung&#10;3. Projektstart mit 30% Anzahlung&#10;4. Konzeption und Design&#10;5. Entwicklung und Tests&#10;6. Review und Feedback&#10;7. Launch und Übergabe&#10;8. Endabrechnung"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Kommunikationsrichtlinien</h4>
                    <Textarea
                      rows={6}
                      defaultValue="- Wöchentliche Status-Updates&#10;- Feste Ansprechpartner&#10;- 24h Reaktionszeit bei Anfragen&#10;- Transparente Projektdokumentation&#10;- Regelmäßige Abstimmungstermine"
                    />
                  </div>
                </div>
                <Button>Prozesse speichern</Button>
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
