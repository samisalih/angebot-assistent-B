
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Save, Building } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';

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
    <PageLayout title="Mein Profil" subtitle="Verwalten Sie Ihre persönlichen Informationen">
      <div className="space-y-6">
        <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2 text-xl">
                <User className="w-5 h-5 text-digitalwert-primary" />
                Persönliche Informationen
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="border-digitalwert-primary text-digitalwert-primary hover:bg-digitalwert-primary hover:text-white"
              >
                {isEditing ? 'Abbrechen' : 'Bearbeiten'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName" className="text-slate-300 mb-2 block">Vorname</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!isEditing}
                  className="bg-digitalwert-background border-digitalwert-background-lighter text-white disabled:opacity-75"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-slate-300 mb-2 block">Nachname</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!isEditing}
                  className="bg-digitalwert-background border-digitalwert-background-lighter text-white disabled:opacity-75"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-300 mb-2 block">E-Mail</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-digitalwert-primary absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-digitalwert-background border-digitalwert-background-lighter text-white pl-10 disabled:opacity-75"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                E-Mail-Adresse kann nicht geändert werden
              </p>
            </div>

            <div>
              <Label htmlFor="company" className="text-slate-300 mb-2 block">Unternehmen (optional)</Label>
              <div className="relative">
                <Building className="w-4 h-4 text-digitalwert-primary absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  disabled={!isEditing}
                  className="bg-digitalwert-background border-digitalwert-background-lighter text-white pl-10 disabled:opacity-75"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave}
                  className="bg-digitalwert-primary hover:bg-digitalwert-primary-dark text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="border-digitalwert-background-lighter text-slate-300 hover:bg-digitalwert-background-lighter"
                >
                  Abbrechen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
          <CardHeader>
            <CardTitle className="text-white text-xl">Account-Statistiken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-digitalwert-background border border-digitalwert-background-lighter rounded-lg p-6">
                <div className="text-3xl font-bold text-digitalwert-primary mb-2">5</div>
                <div className="text-sm text-slate-400">Gespeicherte Angebote</div>
              </div>
              <div className="bg-digitalwert-background border border-digitalwert-background-lighter rounded-lg p-6">
                <div className="text-3xl font-bold text-digitalwert-primary mb-2">2</div>
                <div className="text-sm text-slate-400">Gebuchte Termine</div>
              </div>
              <div className="bg-digitalwert-background border border-digitalwert-background-lighter rounded-lg p-6">
                <div className="text-3xl font-bold text-digitalwert-primary mb-2">3</div>
                <div className="text-sm text-slate-400">Abgeschlossene Projekte</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
