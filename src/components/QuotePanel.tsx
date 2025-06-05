
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Calendar, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateQuotePDF } from '@/utils/pdfGenerator';

interface QuoteItem {
  id: number;
  service: string;
  description: string;
  price: number;
  estimatedHours?: number;
  complexity?: string;
}

interface QuotePanelProps {
  items: QuoteItem[];
  onRemoveItem: (id: number) => void;
  onBooking: () => void;
  onSaveQuote: () => void;
  user: any;
}

export function QuotePanel({ items, onRemoveItem, onBooking, onSaveQuote, user }: QuotePanelProps) {
  const { toast } = useToast();
  const [quoteNumber] = useState(`DW-${Date.now().toString().slice(-6)}`);

  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleDownloadPDF = () => {
    if (items.length === 0) {
      toast({
        title: "Keine Positionen",
        description: "Fügen Sie erst Positionen hinzu, bevor Sie ein PDF erstellen.",
        variant: "destructive",
      });
      return;
    }

    try {
      const quoteForPDF = {
        quote_number: quoteNumber,
        title: 'Kostenvoranschlag',
        status: 'draft' as const,
        total_amount: totalPrice,
        items: items.map(item => ({
          service: item.service,
          description: item.description,
          price: item.price || 0
        })),
        created_at: new Date().toISOString()
      };

      generateQuotePDF(quoteForPDF);
      toast({
        title: "PDF erstellt",
        description: `Angebot ${quoteNumber} wurde erfolgreich heruntergeladen.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const handleSaveQuote = () => {
    onSaveQuote();
  };

  return (
    <Card className="h-[600px] flex flex-col bg-digitalwert-background border-digitalwert-background-lighter">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-white">Kostenvoranschlag</CardTitle>
        <p className="text-sm text-slate-400">Angebot Nr.: {quoteNumber}</p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-4">
        <ScrollArea className="flex-1 pr-4">
          {items.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p>Noch keine Positionen hinzugefügt.</p>
              <p className="text-sm mt-2">
                Lassen Sie sich vom KI-Berater passende Angebote erstellen.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {items.map((item) => (
                <div key={item.id} className="border border-digitalwert-background-lighter bg-digitalwert-background-light rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">{item.service}</h4>
                      <p className="text-sm text-slate-300 mt-1 break-words">{item.description}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                        {item.estimatedHours && (
                          <span>Stunden: {item.estimatedHours}</span>
                        )}
                        {item.complexity && (
                          <span>Komplexität: {item.complexity}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="font-bold text-lg text-digitalwert-primary">
                        {item.price ? `${item.price.toLocaleString('de-DE')} €` : 'Auf Anfrage'}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <div className="flex-shrink-0 pt-4 border-t border-digitalwert-background-lighter">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-white">Gesamtsumme (netto):</span>
                <span className="text-digitalwert-primary">
                  {totalPrice > 0 ? `${totalPrice.toLocaleString('de-DE')} €` : 'Auf Anfrage'}
                </span>
              </div>
              {totalPrice > 0 && (
                <div className="text-sm text-slate-300">
                  <p>+ 19% MwSt.: {Math.round(totalPrice * 0.19).toLocaleString('de-DE')} €</p>
                  <p className="font-semibold text-white">
                    Gesamtbetrag: {Math.round(totalPrice * 1.19).toLocaleString('de-DE')} €
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                <Button onClick={handleDownloadPDF} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  PDF herunterladen
                </Button>
                <Button variant="outline" onClick={handleSaveQuote} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {user ? 'Angebot speichern' : 'Registrieren & speichern'}
                </Button>
                <Button variant="outline" onClick={onBooking} className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Beratungstermin buchen
                </Button>
              </div>

              <div className="text-xs text-slate-400 text-center">
                <p>Angebot gültig für 30 Tage ab Erstellung</p>
                <p>Alle Preise verstehen sich als Projektpauschale</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
