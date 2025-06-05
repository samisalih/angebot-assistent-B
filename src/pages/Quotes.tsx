
import { useQuotes } from '@/hooks/useQuotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Trash2 } from 'lucide-react';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/PageLayout';

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
      <PageLayout title="Meine Angebote" subtitle="Übersicht über alle gespeicherten Kostenvoranschläge">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Lade Angebote...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meine Angebote" subtitle="Übersicht über alle gespeicherten Kostenvoranschläge">
      {quotes.length === 0 ? (
        <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
          <CardContent className="p-8 text-center">
            <div className="text-slate-400">
              <p className="mb-2">Noch keine Angebote gespeichert.</p>
              <p className="text-sm">
                Erstellen Sie Ihr erstes Angebot über den KI-Berater.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="grid gap-6">
            {quotes.map((quote) => (
              <Card key={quote.id} className="bg-digitalwert-background-light border-digitalwert-background-lighter">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-xl mb-2">{quote.title}</CardTitle>
                      <p className="text-sm text-slate-400">
                        Angebot Nr.: {quote.quote_number} | {new Date(quote.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-digitalwert-primary mb-2">
                        {quote.total_amount.toLocaleString('de-DE')} €
                      </p>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        quote.status === 'draft' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-700/30' :
                        quote.status === 'sent' ? 'bg-blue-900/20 text-blue-400 border border-blue-700/30' :
                        'bg-green-900/20 text-green-400 border border-green-700/30'
                      }`}>
                        {quote.status === 'draft' ? 'Entwurf' :
                         quote.status === 'sent' ? 'Gesendet' : 'Angenommen'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {quote.items.map((item: any, index: number) => (
                      <div key={index} className="bg-digitalwert-background border border-digitalwert-background-lighter rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-white mb-2">{item.service}</h4>
                            <p className="text-sm text-slate-300">{item.description}</p>
                          </div>
                          <div className="text-right ml-6">
                            <p className="text-lg font-semibold text-digitalwert-primary">
                              {item.price.toLocaleString('de-DE')} €
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-digitalwert-background-lighter">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(quote)}
                      className="border-digitalwert-primary text-digitalwert-primary hover:bg-digitalwert-primary hover:text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF herunterladen
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
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
    </PageLayout>
  );
}
