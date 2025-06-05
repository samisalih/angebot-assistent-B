
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

ANGEBOTSERSTELLUNG - IMMER wenn der Nutzer ein konkretes Projekt beschreibt:
- Erstelle SOFORT detaillierte Angebote
- Verwende IMMER das QUOTE_RECOMMENDATION Format
- JEDES Angebot MUSS mehrere Positionen haben

Format für Angebote (EXAKT so verwenden):
[QUOTE_RECOMMENDATION]{"service": "Konzeption & Wireframes", "description": "Erstellung von Wireframes und Konzept für die Website-Struktur", "estimatedHours": 16, "complexity": "mittel"}[/QUOTE_RECOMMENDATION]
[QUOTE_RECOMMENDATION]{"service": "Design & Branding", "description": "Visuelles Design und Corporate Identity Entwicklung", "estimatedHours": 24, "complexity": "hoch"}[/QUOTE_RECOMMENDATION]
[QUOTE_RECOMMENDATION]{"service": "Frontend-Entwicklung", "description": "Responsive Umsetzung der Website mit modernen Technologien", "estimatedHours": 40, "complexity": "hoch"}[/QUOTE_RECOMMENDATION]

Komplexität: "niedrig", "mittel", "hoch", "sehr hoch"

WICHTIG: Verwende die Quote-Empfehlungen auch bei kleineren Projekten oder Nachfragen!`;

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
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    console.log('OpenAI response received, starting stream');

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
              console.log('Stream completed. Full response length:', fullResponse.length);
              console.log('Full response content for quote processing:', fullResponse);
              
              // Process quote recommendations at the end with improved regex
              const quoteMatches = fullResponse.match(/\[QUOTE_RECOMMENDATION\]\s*({[^}]*})\s*\[\/QUOTE_RECOMMENDATION\]/g);
              
              if (quoteMatches && quoteMatches.length > 0) {
                console.log('Found', quoteMatches.length, 'quote recommendations to process');
                
                for (const match of quoteMatches) {
                  try {
                    // Extract JSON more carefully
                    const jsonMatch = match.match(/\[QUOTE_RECOMMENDATION\]\s*({.*?})\s*\[\/QUOTE_RECOMMENDATION\]/);
                    if (jsonMatch && jsonMatch[1]) {
                      const jsonStr = jsonMatch[1];
                      console.log('Attempting to parse quote JSON:', jsonStr);
                      
                      const quoteRecommendation = JSON.parse(jsonStr);
                      console.log('Successfully parsed quote recommendation:', quoteRecommendation);
                      
                      // Validate that required fields exist
                      if (quoteRecommendation.service && quoteRecommendation.description) {
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                          type: 'quote_recommendation',
                          data: quoteRecommendation
                        })}\n\n`));
                        console.log('Quote recommendation sent successfully');
                      } else {
                        console.warn('Quote recommendation missing required fields:', quoteRecommendation);
                      }
                    }
                  } catch (e) {
                    console.error('Failed to parse quote recommendation:', e, 'Raw match:', match);
                  }
                }
              } else {
                console.log('No quote recommendations found in response');
                console.log('Response text to check:', fullResponse.substring(0, 500), '...');
              }
              
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  continue;
                }

                if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      fullResponse += content;
                      
                      // Clean content for display (remove quote markers from streaming text)
                      let cleanContent = content;
                      // Remove complete quote blocks from the streaming display
                      cleanContent = cleanContent.replace(/\[QUOTE_RECOMMENDATION\].*?\[\/QUOTE_RECOMMENDATION\]/g, '');
                      // Remove partial markers
                      cleanContent = cleanContent.replace(/\[QUOTE_RECOMMENDATION\]/g, '');
                      cleanContent = cleanContent.replace(/\[\/QUOTE_RECOMMENDATION\]/g, '');
                      
                      if (cleanContent.trim()) {
                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                          type: 'content',
                          data: cleanContent
                        })}\n\n`));
                      }
                    }
                  } catch (e) {
                    console.error('Failed to parse streaming data:', e, 'Raw data:', data);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
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
      error: 'Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
