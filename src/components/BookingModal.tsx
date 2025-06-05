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
import { useQuotes, QuoteItem } from '@/hooks/useQuotes';
import { supabase } from '@/integrations/supabase/client';
import { createQuoteAccessToken } from '@/utils/tokenGenerator';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuoteItems?: QuoteItem[];
}

export function BookingModal({ isOpen, onClose, currentQuoteItems = [] }: BookingModalProps) {
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
  const { quotes, saveQuote } = useQuotes();

  const availableTimes = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
  ];

  // Combine saved quotes with current quote items
  const allQuotes = [
    // Current quote items (if any)
    ...(currentQuoteItems.length > 0 ? [{
      id: 'current',
      title: 'Aktuelles Angebot',
      quote_number: `TEMP-${Date.now().toString().slice(-6)}`,
      total_amount: currentQuoteItems.reduce((sum, item) => sum + (item.price || 0), 0),
      status: 'draft' as const,
      items: currentQuoteItems,
      created_at: new Date().toISOString()
    }] : []),
    // Saved quotes
    ...quotes
  ];

  const selectedQuote = allQuotes.find(quote => quote.id === selectedQuoteId);

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
      let quoteIdForBooking = selectedQuoteId;
      let accessToken = null;

      // If it's the current quote (not saved yet), save it first
      if (selectedQuoteId === 'current' && selectedQuote) {
        // Save the current quote first
        const savedQuote = await saveQuote(currentQuoteItems, selectedQuote.title);
        
        if (savedQuote) {
          quoteIdForBooking = savedQuote.id;
          accessToken = await createQuoteAccessToken(savedQuote.id);
        } else {
          toast({
            title: "Fehler",
            description: "Angebot konnte nicht gespeichert werden.",
            variant: "destructive"
          });
          return;
        }
      } else {
        // Generate access token for existing quote
        accessToken = await createQuoteAccessToken(selectedQuoteId);
      }

      // Insert booking into database
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          quote_id: quoteIdForBooking,
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

      // Prepare data for email sending
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
        }] : [],
        quoteAccessToken: accessToken
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
                  <SelectContent className="bg-white z-[100] max-h-[300px] overflow-y-auto">
                    {allQuotes.length === 0 ? (
                      <SelectItem value="no-quotes" disabled>
                        Keine Angebote verfügbar
                      </SelectItem>
                    ) : (
                      allQuotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id!} className="py-3">
                          <div className="flex flex-col gap-1 min-w-0 w-full">
                            <div className="flex items-center gap-2">
                              {quote.id === 'current' && <span className="text-lg">📝</span>}
                              <span className="font-medium text-sm truncate">
                                {quote.title}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 space-y-1">
                              <div>#{quote.quote_number}</div>
                              <div className="font-medium">
                                {Number(quote.total_amount).toLocaleString('de-DE')} €
                              </div>
                              {quote.id === 'current' && (
                                <div className="text-blue-600 italic">
                                  (wird beim Buchen gespeichert)
                                </div>
                              )}
                            </div>
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
                    {selectedQuote.id === 'current' && (
                      <p className="text-xs text-blue-600 mt-2 italic">
                        Dieses Angebot wird automatisch gespeichert, wenn Sie den Termin buchen.
                      </p>
                    )}
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
