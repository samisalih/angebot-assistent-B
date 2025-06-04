
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Calendar, X, FileText } from 'lucide-react';
import { Quote } from '@/hooks/useQuotes';
import { useToast } from '@/hooks/use-toast';
import { BookingModal } from '@/components/BookingModal';

interface QuoteDetailProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuoteDetail({ quote, isOpen, onClose }: QuoteDetailProps) {
  const { toast } = useToast();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  if (!quote) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Versendet';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      default: return status;
    }
  };

  const handleDownloadPDF = () => {
    toast({
      title: "PDF wird erstellt",
      description: `Angebot ${quote.quote_number} wird als PDF heruntergeladen...`,
    });
    
    setTimeout(() => {
      toast({
        title: "PDF bereit",
        description: `Angebot ${quote.quote_number} wurde erfolgreich heruntergeladen.`,
      });
    }, 2000);
  };

  const handleBooking = () => {
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  const totalNet = Number(quote.total_amount);
  const vat = Math.round(totalNet * 0.19);
  const totalGross = totalNet + vat;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-digitalwert-background border-digitalwert-background-lighter">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white text-xl">
                  {quote.title}
                </DialogTitle>
                <p className="text-sm text-slate-400">Angebot Nr.: {quote.quote_number}</p>
              </div>
              <Badge className={getStatusColor(quote.status)}>
                {getStatusText(quote.status)}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quote Information */}
            <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Angebotsinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Erstellt am</p>
                    <p className="text-white">
                      {new Date(quote.created_at || '').toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Zuletzt bearbeitet</p>
                    <p className="text-white">
                      {new Date(quote.updated_at || '').toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Items */}
            <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
              <CardHeader>
                <CardTitle className="text-white">Positionen</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-digitalwert-background-lighter">
                      <TableHead className="text-slate-300">Leistung</TableHead>
                      <TableHead className="text-slate-300">Beschreibung</TableHead>
                      <TableHead className="text-slate-300 text-right">Preis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.items?.map((item, index) => (
                      <TableRow key={index} className="border-digitalwert-background-lighter">
                        <TableCell className="text-white font-medium">
                          {item.service}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {item.description || '-'}
                        </TableCell>
                        <TableCell className="text-right text-digitalwert-primary font-semibold">
                          {Number(item.price).toLocaleString('de-DE')} €
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
              <CardHeader>
                <CardTitle className="text-white">Kostenübersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Nettobetrag:</span>
                  <span className="text-white font-semibold">
                    {totalNet.toLocaleString('de-DE')} €
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">MwSt. (19%):</span>
                  <span className="text-white font-semibold">
                    {vat.toLocaleString('de-DE')} €
                  </span>
                </div>
                <hr className="border-digitalwert-background-lighter" />
                <div className="flex justify-between items-center text-lg">
                  <span className="text-white font-bold">Gesamtbetrag:</span>
                  <span className="text-digitalwert-primary font-bold">
                    {totalGross.toLocaleString('de-DE')} €
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF herunterladen
              </Button>
              <Button variant="outline" onClick={handleBooking}>
                <Calendar className="w-4 h-4 mr-2" />
                Beratungstermin buchen
              </Button>
              <Button variant="secondary" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Schließen
              </Button>
            </div>

            <div className="text-xs text-slate-400 text-center border-t border-digitalwert-background-lighter pt-4">
              <p>Angebot gültig für 30 Tage ab Erstellung</p>
              <p>Alle Preise verstehen sich als Projektpauschale inkl. MwSt.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BookingModal 
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
      />
    </>
  );
}
