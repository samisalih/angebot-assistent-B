
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Save } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    company: ''
  });

  const handleSave = () => {
    // In a real app, this would update the user profile in the backend
    toast({
      title: "Profil gespeichert",
      description: "Ihre Änderungen wurden erfolgreich gespeichert."
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Mein Profil</h1>
        <p className="text-slate-400">Verwalten Sie Ihre persönlichen Informationen</p>
      </div>

      <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Persönliche Informationen
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Abbrechen' : 'Bearbeiten'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-slate-300">Vorname</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={!isEditing}
                className="bg-digitalwert-background border-digitalwert-background-lighter text-white"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-slate-300">Nachname</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={!isEditing}
                className="bg-digitalwert-background border-digitalwert-background-lighter text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-slate-300">E-Mail</Label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-digitalwert-background border-digitalwert-background-lighter text-white"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              E-Mail-Adresse kann nicht geändert werden
            </p>
          </div>

          <div>
            <Label htmlFor="company" className="text-slate-300">Unternehmen (optional)</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              disabled={!isEditing}
              className="bg-digitalwert-background border-digitalwert-background-lighter text-white"
            />
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Abbrechen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
        <CardHeader>
          <CardTitle className="text-white">Account-Statistiken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-digitalwert-primary">5</div>
              <div className="text-sm text-slate-400">Gespeicherte Angebote</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-digitalwert-primary">2</div>
              <div className="text-sm text-slate-400">Gebuchte Termine</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-digitalwert-primary">3</div>
              <div className="text-sm text-slate-400">Abgeschlossene Projekte</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
