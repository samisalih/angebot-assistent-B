
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

    // Verbesserter System-Prompt mit detaillierteren Angebotserstellungen
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

ANGEBOTSERSTELLUNG - NUR WENN ALLE KRITERIEN ERFÜLLT SIND:
- Der Kunde hat bereits konkrete Anforderungen genannt
- Es wurden mindestens 2-3 Nachrichten ausgetauscht
- Der Kunde zeigt deutliches Interesse an einer Umsetzung
- Alle wichtigen Details sind geklärt

WICHTIG: Erstelle DETAILLIERTE Angebote mit MEHREREN POSITIONEN. Teile große Projekte in sinnvolle Einzelleistungen auf:

Beispiel für eine Website:
- Konzeption und Wireframes
- Design und Corporate Identity
- Frontend-Entwicklung
- Backend-Entwicklung
- CMS-Integration
- SEO-Optimierung
- Testing und Launch

Wenn ALLE Kriterien erfüllt sind, gib MEHRERE JSON-Empfehlungen am Ende deiner Antwort:
[QUOTE_RECOMMENDATION]{"service": "Konzeption & Wireframes", "description": "Erstellung von Wireframes und technischem Konzept", "estimatedHours": 16, "complexity": "mittel"}[/QUOTE_RECOMMENDATION]
[QUOTE_RECOMMENDATION]{"service": "Design & Corporate Identity", "description": "Visuelles Design und Branding-Elemente", "estimatedHours": 24, "complexity": "mittel"}[/QUOTE_RECOMMENDATION]
[QUOTE_RECOMMENDATION]{"service": "Frontend-Entwicklung", "description": "Responsive Umsetzung mit modernen Technologien", "estimatedHours": 40, "complexity": "hoch"}[/QUOTE_RECOMMENDATION]

Komplexitätsstufen: "niedrig", "mittel", "hoch", "sehr hoch"

Analysiere die Konversation sorgfältig und erstelle nur dann Angebote, wenn der Kunde wirklich bereit ist.`;

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
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Create a ReadableStream for real streaming
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
                  const quoteMatches = fullResponse.match(/\[QUOTE_RECOMMENDATION\](.*?)\[\/QUOTE_RECOMMENDATION\]/g);
                  if (quoteMatches) {
                    console.log('Found', quoteMatches.length, 'quote recommendations');
                    
                    for (const match of quoteMatches) {
                      try {
                        const jsonStr = match.replace(/\[QUOTE_RECOMMENDATION\]/, '').replace(/\[\/QUOTE_RECOMMENDATION\]/, '');
                        const quoteRecommendation = JSON.parse(jsonStr);
                        console.log('Quote recommendation extracted:', quoteRecommendation);
                        
                        // Send quote recommendation separately
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

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    
                    // Verbesserte Filterung: Entferne alle Quote-Tags vollständig
                    let cleanContent = content;
                    
                    // Entferne öffnende Tags
                    cleanContent = cleanContent.replace(/\[QUOTE_RECOMMENDATION\]/g, '');
                    // Entferne schließende Tags
                    cleanContent = cleanContent.replace(/\[\/QUOTE_RECOMMENDATION\]/g, '');
                    // Entferne auch partielle Tags die über Chunks verteilt sein könnten
                    cleanContent = cleanContent.replace(/\[QUOTE_RECOMM[^]]*$/g, '');
                    cleanContent = cleanContent.replace(/^[^]]*ENDATION\]/g, '');
                    
                    // Sende nur sauberen Content
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'content',
                      data: cleanContent
                    })}\n\n`));
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
