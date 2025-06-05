
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

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `Du bist ein KI-Berater von Digitalwert für digitale Lösungen.

WICHTIGE REGELN:
1. Antworte IMMER auf Deutsch
2. Sei prägnant und direkt - maximal 3-4 Sätze pro Antwort
3. Stelle konkrete, kurze Nachfragen
4. ERWÄHNE NIEMALS Preise
5. Fokus auf Lösungsfindung

ANTWORT-FORMAT:
- Gib ZUERST eine normale, hilfreiche Antwort
- DANN, wenn du ein Angebot erstellen sollst, füge am ENDE deiner Antwort eine separate QUOTES Sektion hinzu

ANGEBOTSERSTELLUNG - NUR wenn der Nutzer ein konkretes Projekt beschreibt:
- Erstelle detaillierte Angebote nach der normalen Antwort
- Verwende das folgende Format am ENDE deiner Antwort:

---QUOTES---
[QUOTE]{"service": "Konzeption & Wireframes", "description": "Erstellung von Wireframes und Konzept für die Website-Struktur", "estimatedHours": 16, "complexity": "mittel"}[/QUOTE]
[QUOTE]{"service": "Design & Branding", "description": "Visuelles Design und Corporate Identity Entwicklung", "estimatedHours": 24, "complexity": "hoch"}[/QUOTE]
[QUOTE]{"service": "Frontend-Entwicklung", "description": "Responsive Umsetzung der Website mit modernen Technologien", "estimatedHours": 40, "complexity": "hoch"}[/QUOTE]
---END-QUOTES---

Komplexität: "niedrig", "mittel", "hoch", "sehr hoch"

WICHTIG: 
- Die QUOTES Sektion kommt NUR am Ende, NACH der normalen Antwort
- Jedes Angebot MUSS mehrere Positionen haben`;

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('Sending request to OpenAI with', fullMessages.length, 'messages');

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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const fullResponse = data.choices[0].message.content;

    console.log('OpenAI response received. Full response length:', fullResponse.length);

    // Trennung der Antwort in Chat-Text und Quotes
    const quotesMatch = fullResponse.match(/---QUOTES---([\s\S]*?)---END-QUOTES---/);
    let cleanChatResponse = fullResponse;
    let quoteRecommendations = [];

    if (quotesMatch && quotesMatch[1]) {
      console.log('Found quotes section, processing...');
      
      // Entferne die gesamte QUOTES-Sektion aus der Chat-Antwort
      cleanChatResponse = fullResponse.replace(/---QUOTES---[\s\S]*?---END-QUOTES---/g, '').trim();
      
      const quotesSection = quotesMatch[1];
      const quoteMatches = quotesSection.match(/\[QUOTE\]\s*({[^}]*})\s*\[\/QUOTE\]/g);
      
      if (quoteMatches && quoteMatches.length > 0) {
        console.log('Found', quoteMatches.length, 'quotes to process');
        
        for (const match of quoteMatches) {
          try {
            const jsonMatch = match.match(/\[QUOTE\]\s*({.*?})\s*\[\/QUOTE\]/);
            if (jsonMatch && jsonMatch[1]) {
              const jsonStr = jsonMatch[1];
              console.log('Attempting to parse quote JSON:', jsonStr);
              
              const quoteRecommendation = JSON.parse(jsonStr);
              console.log('Successfully parsed quote recommendation:', quoteRecommendation);
              
              if (quoteRecommendation.service && quoteRecommendation.description) {
                quoteRecommendations.push(quoteRecommendation);
                console.log('Quote recommendation added successfully');
              } else {
                console.warn('Quote recommendation missing required fields:', quoteRecommendation);
              }
            }
          } catch (e) {
            console.error('Failed to parse quote recommendation:', e, 'Raw match:', match);
          }
        }
      } else {
        console.log('No valid quotes found in quotes section');
      }
    } else {
      console.log('No quotes section found in response');
    }

    // Sende sowohl Chat-Antwort als auch Quote-Empfehlungen zurück
    return new Response(JSON.stringify({
      message: cleanChatResponse,
      quoteRecommendations: quoteRecommendations
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(JSON.stringify({ 
      error: 'Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
