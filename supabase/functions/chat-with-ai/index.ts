
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages }: ChatRequest = await req.json();

    console.log('Chat request received with', messages.length, 'messages');

    // System prompt für den Digitalwert KI-Berater
    const systemPrompt = `Du bist ein professioneller KI-Berater von Digitalwert, einem Unternehmen für digitale Lösungen. Du hilfst Kunden bei:

- Webauftritten und Corporate Websites
- E-Commerce und Online-Shop Systemen  
- Rebranding und Corporate Design
- UI/UX Design für digitale Produkte
- Technischer Realisierung von Web-Projekten

WICHTIGE REGELN:
1. Antworte IMMER auf Deutsch
2. Sei professionell, freundlich und beratend
3. Stelle konkrete Nachfragen zu Anforderungen
4. Wenn ein Kunde Interesse an einem Service zeigt, gib eine JSON-Empfehlung am Ende deiner Antwort in diesem Format:
   [QUOTE_RECOMMENDATION]{"service": "Service Name", "description": "Beschreibung", "price": 2500}[/QUOTE_RECOMMENDATION]

PREISE (als Richtwerte):
- Einfache Website: 1500-3000€
- Professioneller Webauftritt: 2500-5000€
- E-Commerce Shop: 4000-8000€
- Corporate Rebranding: 3000-6000€
- UI/UX Design: 1500-3500€
- Logo Design: 800-2000€
- Content Management System: 2000-4000€

Analysiere die Kundenanfrage sorgfältig und empfehle passende Services nur wenn der Kunde konkretes Interesse zeigt.`;

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    // Prüfe auf Quote-Empfehlungen
    let quoteRecommendation = null;
    const quoteMatch = aiResponse.match(/\[QUOTE_RECOMMENDATION\](.*?)\[\/QUOTE_RECOMMENDATION\]/);
    if (quoteMatch) {
      try {
        quoteRecommendation = JSON.parse(quoteMatch[1]);
        console.log('Quote recommendation extracted:', quoteRecommendation);
      } catch (e) {
        console.error('Failed to parse quote recommendation:', e);
      }
    }

    // Entferne die Quote-Tags aus der Antwort
    const cleanResponse = aiResponse.replace(/\[QUOTE_RECOMMENDATION\].*?\[\/QUOTE_RECOMMENDATION\]/g, '').trim();

    return new Response(JSON.stringify({ 
      response: cleanResponse,
      quoteRecommendation: quoteRecommendation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(JSON.stringify({ 
      error: 'Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
