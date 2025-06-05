
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

    // System prompt - fokussiert auf Beratung ohne Preise
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
4. ERWÄHNE NIEMALS konkrete Preise - das übernimmt das Angebotssystem
5. Fokussiere dich auf technische Beratung und Lösungsfindung
6. Wenn ein Kunde Interesse an einem Service zeigt, gib eine JSON-Empfehlung am Ende deiner Antwort in diesem Format:
   [QUOTE_RECOMMENDATION]{"service": "Service Name", "description": "Detaillierte Beschreibung der Leistung", "estimatedHours": 40, "complexity": "medium"}[/QUOTE_RECOMMENDATION]

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
        stream: true, // Enable streaming
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Process final response for quote recommendations
                  let quoteRecommendation = null;
                  const quoteMatch = fullResponse.match(/\[QUOTE_RECOMMENDATION\](.*?)\[\/QUOTE_RECOMMENDATION\]/);
                  if (quoteMatch) {
                    try {
                      quoteRecommendation = JSON.parse(quoteMatch[1]);
                      console.log('Quote recommendation extracted:', quoteRecommendation);
                    } catch (e) {
                      console.error('Failed to parse quote recommendation:', e);
                    }
                  }

                  // Send final message with quote recommendation
                  if (quoteRecommendation) {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'quote_recommendation',
                      data: quoteRecommendation
                    })}\n\n`));
                  }
                  
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    // Remove quote recommendation tags from streamed content
                    const cleanContent = content.replace(/\[QUOTE_RECOMMENDATION\].*?\[\/QUOTE_RECOMMENDATION\]/g, '');
                    if (cleanContent) {
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                        type: 'content',
                        data: cleanContent
                      })}\n\n`));
                    }
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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
