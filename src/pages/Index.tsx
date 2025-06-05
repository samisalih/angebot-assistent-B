
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInterface } from '@/components/ChatInterface';
import { QuotePanel } from '@/components/QuotePanel';
import { Header } from '@/components/Header';
import { BookingModal } from '@/components/BookingModal';
import { useAuth } from '@/hooks/useAuth';
import { useQuotes } from '@/hooks/useQuotes';

const Index = () => {
  const [quoteItems, setQuoteItems] = useState([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { user, loading } = useAuth();
  const { saveQuote } = useQuotes();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    // Redirect authenticated users to dashboard if they try to access auth page
    if (user && window.location.pathname === '/auth') {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const addQuoteItem = (item: any) => {
    setQuoteItems(prev => [...prev, { ...item, id: Date.now() }]);
  };

  const removeQuoteItem = (id: number) => {
    setQuoteItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveQuote = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (quoteItems.length > 0) {
      await saveQuote(quoteItems);
      setQuoteItems([]); // Clear items after saving
    }
  };

  const handleLoginOpen = () => {
    navigate('/auth');
  };

  const handleLogout = () => {
    // Logout is handled in the header component
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-digitalwert-background via-digitalwert-background-light to-digitalwert-background-lighter flex items-center justify-center">
        <div className="text-white">Lade Anwendung...</div>
      </div>
    );
  }

  return (
    <div className="dark h-screen bg-gradient-to-br from-digitalwert-background via-digitalwert-background-light to-digitalwert-background-lighter flex flex-col">
      <Header 
        user={user}
        onLoginOpen={handleLoginOpen}
        onAdminOpen={() => navigate('/dashboard')}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <div className="container mx-auto px-4 py-3 flex-shrink-0">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-digitalwert-primary via-digitalwert-primary-light to-digitalwert-accent-light bg-clip-text text-transparent mb-2">
              Digitalwert - KI-Beratung
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">
              Lassen Sie sich von unserer KI zu Webauftritten, Rebrandings, UI Design und 
              technischer Realisierung von Shop-Websites beraten. Erhalten Sie sofort ein 
              detailliertes Angebot.
            </p>
          </div>
        </div>

        <div className="flex-1 container mx-auto px-4 pb-4 min-h-0">
          <div className="grid lg:grid-cols-2 gap-6 h-full">
            <ChatInterface onAddQuoteItem={addQuoteItem} />
            <QuotePanel 
              items={quoteItems}
              onRemoveItem={removeQuoteItem}
              onBooking={() => setIsBookingOpen(true)}
              onSaveQuote={handleSaveQuote}
              user={user}
            />
          </div>
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
};

export default Index;
