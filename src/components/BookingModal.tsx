
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, User, Mail, Phone, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuotes } from '@/hooks/useQuotes';
import { supabase } from '@/integrations/supabase/client';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { quotes } = useQuotes();

  const availableTimes = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
  ];

  const selectedQuote = quotes.find(quote => quote.id === selectedQuoteId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !formData.name || !formData.email || !selectedQuoteId) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus und wählen Sie ein Angebot.",
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
      // Insert booking into database
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          quote_id: selectedQuoteId,
          preferred_date: selectedDate.toISOString().split('T')[0],
          preferred_time: selectedTime,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        toast({
          title: "Fehler",
          description: "Es gab einen Fehler beim Buchen des Termins. Bitte versuchen Sie es erneut.",
          variant: "destructive"
        });
        return;
      }

      // Prepare data for email sending that matches the edge function validation
      const emailData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone || '',
        service: selectedQuote?.title || 'Beratung',
        preferredDate: selectedDate.toISOString().split('T')[0],
        preferredTime: selectedTime,
        message: `Terminbuchung für Angebot ${selectedQuote?.quote_number}`,
        totalAmount: selectedQuote?.total_amount || 0,
        items: selectedQuote ? [{
          service: selectedQuote.title,
          description: `Angebot ${selectedQuote.quote_number}`,
          price: selectedQuote.total_amount
        }] : []
      };

      console.log('Sending email data:', emailData);

      // Send confirmation email
      try {
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-booking-confirmation', {
          body: emailData
        });

        console.log('Email function response:', emailResponse);

        if (emailError) {
          console.error('Error sending email:', emailError);
          // Don't fail the booking if email fails, just log it
          toast({
            title: "Termin gebucht!",
            description: `Ihr Beratungstermin am ${selectedDate.toLocaleDateString('de-DE')} um ${selectedTime} Uhr wurde bestätigt. (E-Mail-Versand fehlgeschlagen)`,
          });
        } else {
          toast({
            title: "Termin gebucht!",
            description: `Ihr Beratungstermin am ${selectedDate.toLocaleDateString('de-DE')} um ${selectedTime} Uhr wurde bestätigt. Sie erhalten eine Bestätigungsmail.`,
          });
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        toast({
          title: "Termin gebucht!",
          description: `Ihr Beratungstermin am ${selectedDate.toLocaleDateString('de-DE')} um ${selectedTime} Uhr wurde bestätigt. (E-Mail-Versand fehlgeschlagen)`,
        });
      }

      // Reset form
      setSelectedDate(undefined);
      setSelectedTime('');
      setSelectedQuoteId('');
      setFormData({ name: '', email: '', phone: '' });
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
                <Label htmlFor="quote">Angebot *</Label>
                <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId} required>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Angebot auswählen" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {quotes.length === 0 ? (
                      <SelectItem value="no-quotes" disabled>
                        Keine Angebote verfügbar
                      </SelectItem>
                    ) : (
                      quotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id!}>
                          <div className="flex flex-col">
                            <span className="font-medium">{quote.title}</span>
                            <span className="text-sm text-slate-500">
                              #{quote.quote_number} - {Number(quote.total_amount).toLocaleString('de-DE')} €
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedQuote && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Ausgewähltes Angebot</h4>
                    <p className="text-sm text-blue-700">
                      <strong>Titel:</strong> {selectedQuote.title}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Angebotsnummer:</strong> {selectedQuote.quote_number}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Gesamtbetrag:</strong> {Number(selectedQuote.total_amount).toLocaleString('de-DE')} €
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedDate && selectedTime && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Terminübersicht</h4>
                    <p className="text-sm text-green-700">
                      <strong>Datum:</strong> {selectedDate.toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>Uhrzeit:</strong> {selectedTime} Uhr
                    </p>
                    <p className="text-sm text-green-700">
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
