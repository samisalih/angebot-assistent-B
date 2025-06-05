
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, FileText, AlertCircle } from 'lucide-react';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface QuoteData {
  id: string;
  quote_number: string;
  title: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  total_amount: number;
  created_at: string;
  items: Array<{
    id: string;
    service: string;
    description: string;
    price: number;
  }>;
}

export default function QuoteViewer() {
  const { token } = useParams<{ token: string }>();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError('Kein gültiger Token gefunden');
      setLoading(false);
      return;
    }

    fetchQuoteByToken();
  }, [token]);

  const fetchQuoteByToken = async () => {
    try {
      setLoading(true);
      
      // First, validate the token and get quote_id
      const { data: tokenData, error: tokenError } = await supabase
        .from('quote_access_tokens')
        .select('quote_id, expires_at, access_count')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        setError('Token ungültig oder abgelaufen');
        setLoading(false);
        return;
      }

      // Update access tracking
      await supabase
        .from('quote_access_tokens')
        .update({ 
          accessed_at: new Date().toISOString(),
          access_count: tokenData.access_count + 1
        })
        .eq('token', token);

      // Fetch quote data with items
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          id,
          quote_number,
          title,
          status,
          total_amount,
          created_at,
          quote_items (
            id,
            service,
            description,
            price
          )
        `)
        .eq('id', tokenData.quote_id)
        .single();

      if (quoteError || !quoteData) {
        setError('Angebot nicht gefunden');
        setLoading(false);
        return;
      }

      // Transform data to match our interface
      const formattedQuote: QuoteData = {
        id: quoteData.id,
        quote_number: quoteData.quote_number,
        title: quoteData.title || 'Angebot',
        status: (quoteData.status as 'draft' | 'sent' | 'accepted' | 'rejected') || 'draft',
        total_amount: Number(quoteData.total_amount),
        created_at: quoteData.created_at,
        items: quoteData.quote_items?.map(item => ({
          id: item.id,
          service: item.service,
          description: item.description || '',
          price: Number(item.price)
        })) || []
      };

      setQuote(formattedQuote);
    } catch (error) {
      console.error('Error fetching quote:', error);
      setError('Fehler beim Laden des Angebots');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!quote) return;
    
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Versendet';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-digitalwert-background flex items-center justify-center">
        <div className="text-white text-lg">Angebot wird geladen...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-digitalwert-background flex items-center justify-center">
        <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Angebot nicht verfügbar</h2>
            <p className="text-slate-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-digitalwert-background">
      {/* Header */}
      <div className="bg-digitalwert-background-light border-b border-digitalwert-background-lighter">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-digitalwert-primary" />
            <h1 className="text-2xl font-bold text-white">Digitalwert</h1>
          </div>
          <p className="text-slate-400">Kostenvoranschlag</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Quote Header */}
        <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white text-2xl mb-2">{quote.title}</CardTitle>
                <p className="text-slate-400">
                  Angebot Nr.: {quote.quote_number} | {new Date(quote.created_at).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-digitalwert-primary mb-2">
                  {quote.total_amount.toLocaleString('de-DE')} €
                </p>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  quote.status === 'draft' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-700/30' :
                  quote.status === 'sent' ? 'bg-blue-900/20 text-blue-400 border border-blue-700/30' :
                  'bg-green-900/20 text-green-400 border border-green-700/30'
                }`}>
                  {getStatusText(quote.status)}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quote Items */}
        <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter mb-6">
          <CardHeader>
            <CardTitle className="text-white">Leistungsübersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quote.items.map((item, index) => (
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

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-digitalwert-background-lighter">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Gesamtbetrag:</span>
                <span className="text-2xl font-bold text-digitalwert-primary">
                  {quote.total_amount.toLocaleString('de-DE')} €
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Alle Preise verstehen sich als Projektpauschalen inkl. 19% MwSt.</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center">
          <Button
            onClick={handleDownloadPDF}
            className="bg-digitalwert-primary hover:bg-digitalwert-primary-light text-white px-8 py-3"
          >
            <Download className="w-5 h-5 mr-2" />
            Als PDF herunterladen
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <Card className="bg-digitalwert-background-light border-digitalwert-background-lighter">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-digitalwert-primary" />
                <span className="text-white font-medium">Gültigkeitsdauer: 30 Tage ab Erstellungsdatum</span>
              </div>
              <p className="text-slate-400 text-sm mb-2">
                Bei Fragen kontaktieren Sie uns gerne unter info@digitalwert.de
              </p>
              <p className="text-digitalwert-primary text-sm font-medium">
                www.digitalwert.de | Tel: +49 (0) 123 456789
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
