
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Calendar, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuoteItem {
  id: number;
  service: string;
  description: string;
  price: number;
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

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  const handleDownloadPDF = () => {
    toast({
      title: "PDF wird erstellt",
      description: "Ihr Angebot wird als PDF heruntergeladen...",
    });
    
    // Simulate PDF generation
    setTimeout(() => {
      toast({
        title: "PDF bereit",
        description: `Angebot ${quoteNumber} wurde erfolgreich heruntergeladen.`,
      });
    }, 2000);
  };

  const handleSaveQuote = () => {
    if (!user) {
      onSaveQuote();
      return;
    }
    
    toast({
      title: "Angebot gespeichert",
      description: `Angebot ${quoteNumber} wurde in Ihrem Account gespeichert.`,
    });
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Kostenvoranschlag</CardTitle>
        <p className="text-sm text-slate-600">Angebot Nr.: {quoteNumber}</p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <p>Noch keine Positionen hinzugefügt.</p>
              <p className="text-sm mt-2">
                Lassen Sie sich vom KI-Berater passende Angebote erstellen.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">{item.service}</h4>
                      <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg text-slate-800">
                        {item.price.toLocaleString('de-DE')} €
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Gesamtsumme (netto):</span>
                <span className="text-blue-600">{totalPrice.toLocaleString('de-DE')} €</span>
              </div>
              <div className="text-sm text-slate-600">
                <p>+ 19% MwSt.: {Math.round(totalPrice * 0.19).toLocaleString('de-DE')} €</p>
                <p className="font-semibold text-slate-800">
                  Gesamtbetrag: {Math.round(totalPrice * 1.19).toLocaleString('de-DE')} €
                </p>
              </div>

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

              <div className="text-xs text-slate-500 text-center">
                <p>Angebot gültig für 30 Tage ab Erstellung</p>
                <p>Alle Preise verstehen sich als Projektpauschale</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
