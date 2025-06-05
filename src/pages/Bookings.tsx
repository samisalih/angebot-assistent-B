
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Plus } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { BookingModal } from '@/components/BookingModal';
import { useQuotes } from '@/hooks/useQuotes';
import { useState } from 'react';

export default function Bookings() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { quotes } = useQuotes();
  
  // Placeholder data - in a real app this would come from a backend
  const bookings = [
    {
      id: 1,
      date: '2024-06-10',
      time: '14:00',
      type: 'Erstberatung',
      status: 'confirmed',
      consultant: 'Max Mustermann'
    },
    {
      id: 2,
      date: '2024-06-15',
      time: '10:30',
      type: 'Projektbesprechung',
      status: 'pending',
      consultant: 'Anna Schmidt'
    }
  ];

  const hasQuotes = quotes && quotes.length > 0;

  return (
    <>
      <PageLayout title="Meine Terminanfragen" subtitle="Übersicht über alle gebuchten und angefragten Termine">
        {hasQuotes && (
          <div className="mb-6">
            <Button
              onClick={() => setIsBookingOpen(true)}
              className="bg-gradient-to-r from-digitalwert-primary to-digitalwert-primary-light hover:from-digitalwert-primary-light hover:to-digitalwert-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neue Terminanfrage
            </Button>
          </div>
        )}

        {bookings.length === 0 ? (
          <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
            <CardContent className="p-8 text-center">
              <div className="text-slate-400">
                <p className="mb-2">Noch keine Termine gebucht.</p>
                {hasQuotes ? (
                  <div>
                    <p className="text-sm mb-4">
                      Sie haben bereits Angebote erstellt. Buchen Sie jetzt einen Beratungstermin.
                    </p>
                    <Button
                      onClick={() => setIsBookingOpen(true)}
                      variant="outline"
                      className="border-digitalwert-primary text-digitalwert-primary hover:bg-digitalwert-primary hover:text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ersten Termin buchen
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm">
                    Erstellen Sie erst ein Angebot über den KI-Berater, um einen Beratungstermin zu buchen.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="bg-digitalwert-background-light border-digitalwert-background-lighter">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-white text-xl">{booking.type}</CardTitle>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-900/20 text-green-400 border border-green-700/30' :
                      booking.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-700/30' :
                      'bg-red-900/20 text-red-400 border border-red-700/30'
                    }`}>
                      {booking.status === 'confirmed' ? 'Bestätigt' :
                       booking.status === 'pending' ? 'Ausstehend' : 'Abgesagt'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Calendar className="w-5 h-5 text-digitalwert-primary" />
                      <span>{new Date(booking.date).toLocaleDateString('de-DE')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Clock className="w-5 h-5 text-digitalwert-primary" />
                      <span>{booking.time} Uhr</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <User className="w-5 h-5 text-digitalwert-primary" />
                      <span>{booking.consultant}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageLayout>

      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </>
  );
}
