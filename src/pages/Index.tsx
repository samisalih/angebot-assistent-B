
import { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { QuotePanel } from '@/components/QuotePanel';
import { Header } from '@/components/Header';
import { BookingModal } from '@/components/BookingModal';
import { LoginModal } from '@/components/LoginModal';
import { AdminPanel } from '@/components/AdminPanel';

const Index = () => {
  const [quoteItems, setQuoteItems] = useState([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [user, setUser] = useState(null);

  const addQuoteItem = (item) => {
    setQuoteItems(prev => [...prev, { ...item, id: Date.now() }]);
  };

  const removeQuoteItem = (id) => {
    setQuoteItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-digitalwert-background via-digitalwert-background-light to-digitalwert-background-lighter">
      <Header 
        user={user}
        onLoginOpen={() => setIsLoginOpen(true)}
        onAdminOpen={() => setIsAdminOpen(true)}
        onLogout={() => setUser(null)}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-digitalwert-primary via-digitalwert-primary-light to-digitalwert-accent-light bg-clip-text text-transparent mb-4">
            Digitalwert - KI-Beratung
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Lassen Sie sich von unserer KI zu Webauftritten, Rebrandings, UI Design und 
            technischer Realisierung von Shop-Websites beraten. Erhalten Sie sofort ein 
            detailliertes Angebot.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <ChatInterface onAddQuoteItem={addQuoteItem} />
          <QuotePanel 
            items={quoteItems}
            onRemoveItem={removeQuoteItem}
            onBooking={() => setIsBookingOpen(true)}
            onSaveQuote={() => user ? null : setIsLoginOpen(true)}
            user={user}
          />
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={setUser}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
};

export default Index;
