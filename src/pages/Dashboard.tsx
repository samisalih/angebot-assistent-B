
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuotes, Quote } from '@/hooks/useQuotes';
import { FileText, Calendar, User, Download, Eye, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { QuoteDetail } from '@/components/QuoteDetail';
import { BookingModal } from '@/components/BookingModal';
import { generateQuotePDF } from '@/utils/pdfGenerator';

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { quotes, loading, deleteQuote } = useQuotes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

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

  const handleDownloadPDF = (quote: Quote) => {
    try {
      generateQuotePDF(quote);
      toast({
        title: "PDF erstellt",
        description: `Angebot ${quote.quote_number} wurde erfolgreich heruntergeladen.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedQuote(null);
  };

  const handleBooking = () => {
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-digitalwert-background via-digitalwert-background-light to-digitalwert-background-lighter flex items-center justify-center">
        <div className="text-white">Lade Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-digitalwert-background via-digitalwert-background-light to-digitalwert-background-lighter">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Startseite
          </Button>
          <Button 
            variant="outline" 
            onClick={() => signOut()}
            className="border-digitalwert-primary text-digitalwert-primary hover:bg-digitalwert-primary hover:text-white"
          >
            Abmelden
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Willkommen, {profile?.full_name || user?.email}!
          </h1>
          <p className="text-slate-300">Verwalten Sie Ihre Angebote und Termine</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-digitalwert-background border-digitalwert-background-lighter">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Gesamt Angebote
              </CardTitle>
              <FileText className="h-4 w-4 text-digitalwert-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{quotes.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-digitalwert-background border-digitalwert-background-lighter">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Angenommene Angebote
              </CardTitle>
              <Calendar className="h-4 w-4 text-digitalwert-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {quotes.filter(q => q.status === 'accepted').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-digitalwert-background border-digitalwert-background-lighter">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Gesamtwert
              </CardTitle>
              <User className="h-4 w-4 text-digitalwert-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {quotes.reduce((sum, quote) => sum + Number(quote.total_amount), 0).toLocaleString('de-DE')} €
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-digitalwert-background border-digitalwert-background-lighter">
          <CardHeader>
            <CardTitle className="text-white">Ihre Angebote</CardTitle>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Noch keine Angebote erstellt.</p>
                <Button onClick={() => navigate('/')}>
                  Erstes Angebot erstellen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map((quote) => (
                  <div key={quote.id} className="border border-digitalwert-background-lighter bg-digitalwert-background-light rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{quote.title}</h3>
                        <p className="text-sm text-slate-400">#{quote.quote_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(quote.status)}>
                          {getStatusText(quote.status)}
                        </Badge>
                        <span className="text-lg font-bold text-digitalwert-primary">
                          {Number(quote.total_amount).toLocaleString('de-DE')} €
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-slate-300 mb-2">Leistungen:</p>
                      <div className="space-y-1">
                        {quote.items?.map((item: any, index: number) => (
                          <div key={index} className="text-sm text-slate-400">
                            • {item.service} - {Number(item.price).toLocaleString('de-DE')} €
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        Erstellt: {new Date(quote.created_at || '').toLocaleDateString('de-DE')}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewQuote(quote)}
                          className="text-digitalwert-primary hover:text-white hover:bg-digitalwert-primary"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(quote)}>
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleBooking}
                          className="text-digitalwert-primary hover:text-white hover:bg-digitalwert-primary"
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Termin
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => deleteQuote(quote.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <QuoteDetail 
        quote={selectedQuote}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />

      <BookingModal 
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
      />
    </div>
  );
};

export default Dashboard;
