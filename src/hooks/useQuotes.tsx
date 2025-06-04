
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface QuoteItem {
  id?: string;
  service: string;
  description: string;
  price: number;
}

export interface Quote {
  id?: string;
  quote_number: string;
  title: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  total_amount: number;
  items: QuoteItem[];
  created_at?: string;
  updated_at?: string;
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchQuotes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: quotesData, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            id,
            service,
            description,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedQuotes = quotesData?.map(quote => ({
        ...quote,
        items: quote.quote_items || []
      })) || [];

      setQuotes(formattedQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Fehler",
        description: "Angebote konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveQuote = async (items: QuoteItem[], title = 'Angebot') => {
    if (!user || items.length === 0) return null;

    try {
      const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
      const quoteNumber = `DW-${Date.now().toString().slice(-6)}`;

      // Create quote
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          quote_number: quoteNumber,
          title,
          total_amount: totalAmount,
          status: 'draft'
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const quoteItems = items.map(item => ({
        quote_id: quoteData.id,
        service: item.service,
        description: item.description,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Angebot gespeichert",
        description: `Angebot ${quoteNumber} wurde erfolgreich gespeichert.`
      });

      fetchQuotes(); // Refresh quotes list
      return quoteData;
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: "Fehler",
        description: "Angebot konnte nicht gespeichert werden.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Angebot gelöscht",
        description: "Das Angebot wurde erfolgreich gelöscht."
      });

      fetchQuotes(); // Refresh quotes list
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast({
        title: "Fehler",
        description: "Angebot konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchQuotes();
    }
  }, [user]);

  return {
    quotes,
    loading,
    saveQuote,
    deleteQuote,
    fetchQuotes
  };
}
