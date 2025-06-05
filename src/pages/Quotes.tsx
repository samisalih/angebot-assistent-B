
import { useQuotes } from '@/hooks/useQuotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Calendar, Trash2 } from 'lucide-react';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

export default function Quotes() {
  const { quotes, deleteQuote, loading } = useQuotes();
  const { toast } = useToast();

  const handleDownloadPDF = (quote: any) => {
    try {
      generateQuotePDF(quote);
      toast({
        title: "PDF erstellt",
        description: `Angebot ${quote.quote_number} wurde erfolgreich heruntergeladen.`
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuote = async (id: string) => {
    try {
      await deleteQuote(id);
      toast({
        title: "Angebot gelöscht",
        description: "Das Angebot wurde erfolgreich gelöscht."
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Angebot konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Lade Angebote...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Meine Angebote</h1>
        <p className="text-slate-400">Übersicht über alle gespeicherten Kostenvoranschläge</p>
      </div>

      {quotes.length === 0 ? (
        <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
          <CardContent className="p-8 text-center">
            <div className="text-slate-400">
              <p>Noch keine Angebote gespeichert.</p>
              <p className="text-sm mt-2">
                Erstellen Sie Ihr erstes Angebot über den KI-Berater.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid gap-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="bg-digitalwert-background-light border-digitalwert-background-lighter">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{quote.title}</CardTitle>
                      <p className="text-sm text-slate-400">
                        Angebot Nr.: {quote.quote_number} | {new Date(quote.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-digitalwert-primary">
                        {quote.total_amount.toLocaleString('de-DE')} €
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        quote.status === 'draft' ? 'bg-yellow-900/20 text-yellow-400' :
                        quote.status === 'sent' ? 'bg-blue-900/20 text-blue-400' :
                        'bg-green-900/20 text-green-400'
                      }`}>
                        {quote.status === 'draft' ? 'Entwurf' :
                         quote.status === 'sent' ? 'Gesendet' : 'Angenommen'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quote.items.map((item: any, index: number) => (
                      <div key={index} className="border border-digitalwert-background-lighter rounded p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{item.service}</h4>
                            <p className="text-sm text-slate-300 mt-1">{item.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-digitalwert-primary">
                              {item.price.toLocaleString('de-DE')} €
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-digitalwert-background-lighter">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(quote)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Löschen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
