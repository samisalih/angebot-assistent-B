
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

    // Kürzerer, prägnanterer System-Prompt
    const systemPrompt = `Du bist ein KI-Berater von Digitalwert für digitale Lösungen.

WICHTIGE REGELN:
1. Antworte IMMER auf Deutsch
2. Sei prägnant und direkt - maximal 3-4 Sätze pro Antwort
3. Stelle konkrete, kurze Nachfragen
4. ERWÄHNE NIEMALS Preise
5. Fokus auf Lösungsfindung

ANGEBOTSERSTELLUNG - nur wenn ALLE Kriterien erfüllt:
- Konkrete Anforderungen genannt
- 2-3 Nachrichten ausgetauscht
- Deutliches Interesse
- Details geklärt

Erstelle DETAILLIERTE Angebote mit MEHREREN Positionen:

[QUOTE_RECOMMENDATION]{"service": "Konzeption & Wireframes", "description": "Erstellung von Wireframes und Konzept", "estimatedHours": 16, "complexity": "mittel"}[/QUOTE_RECOMMENDATION]
[QUOTE_RECOMMENDATION]{"service": "Design & Branding", "description": "Visuelles Design und Corporate Identity", "estimatedHours": 24, "complexity": "hoch"}[/QUOTE_RECOMMENDATION]
[QUOTE_RECOMMENDATION]{"service": "Frontend-Entwicklung", "description": "Responsive Umsetzung", "estimatedHours": 40, "complexity": "hoch"}[/QUOTE_RECOMMENDATION]

Komplexität: "niedrig", "mittel", "hoch", "sehr hoch"`;

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
        max_tokens: 800,
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream finished, full response length:', fullResponse.length);
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  // Verarbeite Quote-Empfehlungen am Ende
                  const quoteMatches = fullResponse.match(/\[QUOTE_RECOMMENDATION\](.*?)\[\/QUOTE_RECOMMENDATION\]/g);
                  if (quoteMatches) {
                    console.log('Processing', quoteMatches.length, 'quote recommendations');
                    
                    for (const match of quoteMatches) {
                      try {
                        const jsonStr = match.replace(/\[QUOTE_RECOMMENDATION\]/, '').replace(/\[\/QUOTE_RECOMMENDATION\]/, '');
                        const quoteRecommendation = JSON.parse(jsonStr);
                        console.log('Quote recommendation:', quoteRecommendation);
                        
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                          type: 'quote_recommendation',
                          data: quoteRecommendation
                        })}\n\n`));
                      } catch (e) {
                        console.error('Failed to parse quote recommendation:', e);
                      }
                    }
                  }
                  
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  controller.close();
                  return;
                }

                if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      fullResponse += content;
                      
                      // Entferne Quote-Tags für die Anzeige
                      let cleanContent = content;
                      cleanContent = cleanContent.replace(/\[QUOTE_RECOMMENDATION\].*?\[\/QUOTE_RECOMMENDATION\]/g, '');
                      cleanContent = cleanContent.replace(/\[QUOTE_RECOMMENDATION\]/g, '');
                      cleanContent = cleanContent.replace(/\[\/QUOTE_RECOMMENDATION\]/g, '');
                      
                      // Sende nur sauberen Content
                      if (cleanContent) {
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                          type: 'content',
                          data: cleanContent
                        })}\n\n`));
                      }
                    }
                  } catch (e) {
                    console.error('Failed to parse streaming data:', e, 'Data:', data);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
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
