
import { supabase } from '@/integrations/supabase/client';

export const generateSecureToken = (): string => {
  // Generate a secure random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const createQuoteAccessToken = async (quoteId: string): Promise<string | null> => {
  try {
    const token = generateSecureToken();
    
    const { data, error } = await supabase
      .from('quote_access_tokens')
      .insert({
        quote_id: quoteId,
        token: token
      })
      .select('token')
      .single();

    if (error) {
      console.error('Error creating access token:', error);
      return null;
    }

    return data.token;
  } catch (error) {
    console.error('Error in createQuoteAccessToken:', error);
    return null;
  }
};
