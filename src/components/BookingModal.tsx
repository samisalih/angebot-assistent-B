
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, User, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const availableTimes = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !formData.name || !formData.email) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Fehler",
        description: "Sie müssen angemeldet sein, um einen Termin zu buchen.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message || null,
          preferred_date: selectedDate.toISOString().split('T')[0],
          preferred_time: selectedTime,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating booking:', error);
        toast({
          title: "Fehler",
          description: "Es gab einen Fehler beim Buchen des Termins. Bitte versuchen Sie es erneut.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Termin gebucht!",
        description: `Ihr Beratungstermin am ${selectedDate.toLocaleDateString('de-DE')} um ${selectedTime} Uhr wurde bestätigt. Sie erhalten eine Bestätigungsmail.`,
      });

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime('');
      setFormData({ name: '', email: '', phone: '', message: '' });
      onClose();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    const dayOfWeek = date.getDay();
    return date >= today && dayOfWeek !== 0 && dayOfWeek !== 6; // No weekends
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Beratungstermin buchen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar Section */}
            <div>
              <Label className="text-base font-semibold">Wunschtermin wählen</Label>
              <Card className="mt-2">
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => !isDateAvailable(date)}
                    className="pointer-events-auto"
                  />
                </CardContent>
              </Card>

              {selectedDate && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Verfügbare Zeiten</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="h-10"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                    placeholder="Ihr vollständiger Name"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-Mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    placeholder="ihre@email.de"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefon</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                    placeholder="+49 123 456789"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Nachricht</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Beschreiben Sie kurz Ihr Projekt oder Ihre Fragen..."
                  rows={4}
                />
              </div>

              {selectedDate && selectedTime && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Terminübersicht</h4>
                    <p className="text-sm text-blue-700">
                      <strong>Datum:</strong> {selectedDate.toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Uhrzeit:</strong> {selectedTime} Uhr
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Dauer:</strong> ca. 60 Minuten
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird gebucht...' : 'Termin bestätigen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
