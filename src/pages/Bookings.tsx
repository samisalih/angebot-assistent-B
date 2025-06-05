
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User } from 'lucide-react';

export default function Bookings() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Meine Terminanfragen</h1>
        <p className="text-slate-400">Übersicht über alle gebuchten und angefragten Termine</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
          <CardContent className="p-8 text-center">
            <div className="text-slate-400">
              <p>Noch keine Termine gebucht.</p>
              <p className="text-sm mt-2">
                Buchen Sie Ihren ersten Beratungstermin über das Angebot-Panel.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="bg-digitalwert-background-light border-digitalwert-background-lighter">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">{booking.type}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded ${
                    booking.status === 'confirmed' ? 'bg-green-900/20 text-green-400' :
                    booking.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' :
                    'bg-red-900/20 text-red-400'
                  }`}>
                    {booking.status === 'confirmed' ? 'Bestätigt' :
                     booking.status === 'pending' ? 'Ausstehend' : 'Abgesagt'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(booking.date).toLocaleDateString('de-DE')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4" />
                    <span>{booking.time} Uhr</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-4 h-4" />
                    <span>{booking.consultant}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
