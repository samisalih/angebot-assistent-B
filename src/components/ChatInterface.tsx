
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, AlertTriangle, Loader2 } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onAddQuoteItem: (item: any) => void;
}

// Improved input sanitization function that preserves spaces
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"'&]/g, '') // Remove dangerous HTML characters but keep spaces
    .substring(0, 2000);
};

// Rate limiting configuration
const RATE_LIMIT = {
  maxMessages: 10,
  timeWindow: 60000,
};

// Markdown-to-JSX renderer for basic formatting
const renderMarkdown = (text: string) => {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts = text.split(boldRegex);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-semibold">{part}</strong>;
    }
    return part;
  });
};

// Calculate price based on estimated hours and complexity
const calculatePrice = (estimatedHours: number, complexity: string): number => {
  const baseHourlyRate = 120;
  const complexityMultipliers = {
    'niedrig': 1.0,
    'mittel': 1.3,
    'hoch': 1.6,
    'sehr hoch': 2.0
  };
  
  const multiplier = complexityMultipliers[complexity as keyof typeof complexityMultipliers] || 1.3;
  return Math.round(estimatedHours * baseHourlyRate * multiplier);
};

export function ChatInterface({ onAddQuoteItem }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hallo! Ich bin Ihr KI-Berater von Digitalwert. Gerne berate ich Sie zu Webauftritten, Rebrandings, UI Design und der technischen Realisierung von Shop-Websites. Beschreiben Sie mir Ihr Projekt und ich helfe Ihnen bei der Konzeption!",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Rate limiting check
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const recentMessages = messageTimestamps.filter(
      timestamp => now - timestamp < RATE_LIMIT.timeWindow
    );
    
    if (recentMessages.length >= RATE_LIMIT.maxMessages) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), RATE_LIMIT.timeWindow);
      return false;
    }
    
    setMessageTimestamps([...recentMessages, now]);
    return true;
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      const chatHistory = messages.map(msg => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text
      }));
      
      chatHistory.push({
        role: 'user',
        content: userMessage
      });

      console.log('Sending chat request to AI...');
      
      const response = await fetch(`https://rtxvbdvhzjsktmhdfdfv.supabase.co/functions/v1/chat-with-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0eHZiZHZoempza3RtaGRmZGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMzAwNzAsImV4cCI6MjA2NDYwNjA3MH0.JJpcbEVIvKmA2Z-nG231PF-R1O8NTh2zjEolm_vzxn0`,
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      console.log('AI response received:', data);

      // Verarbeite Quote-Empfehlungen
      if (data.quoteRecommendations && data.quoteRecommendations.length > 0) {
        console.log('Processing', data.quoteRecommendations.length, 'quote recommendations');
        
        data.quoteRecommendations.forEach((recommendation: any) => {
          console.log('Processing quote recommendation:', recommendation);
          
          if (recommendation && recommendation.service) {
            const price = recommendation.estimatedHours && recommendation.complexity 
              ? calculatePrice(recommendation.estimatedHours, recommendation.complexity)
              : 0;
            
            const quoteItem = {
              service: recommendation.service,
              description: recommendation.description || 'Detaillierte Beschreibung folgt',
              estimatedHours: recommendation.estimatedHours || 0,
              complexity: recommendation.complexity || 'mittel',
              price: price,
              id: Date.now() + Math.random()
            };
            
            console.log('Adding quote item to panel:', quoteItem);
            onAddQuoteItem(quoteItem);
          }
        });
      }

      return data.message || 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage.';

    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut.';
    }
  };

  const handleSend = async () => {
    const sanitizedInput = sanitizeInput(input.trim());
    
    if (!sanitizedInput.trim()) return;
    
    if (!checkRateLimit()) {
      const errorMessage: Message = {
        id: Date.now(),
        text: "Sie senden zu viele Nachrichten. Bitte warten Sie einen Moment, bevor Sie eine weitere Nachricht senden.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      text: sanitizedInput,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await getAIResponse(sanitizedInput);
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        text: aiResponse,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in handleSend:', error);
      const errorResponse: Message = {
        id: Date.now() + 1,
        text: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value.substring(0, 2000));
  };

  return (
    <Card className="h-full flex flex-col bg-digitalwert-background border-digitalwert-background-lighter">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-white">
          <Bot className="w-5 h-5 text-digitalwert-primary" />
          KI-Berater Chat
          {isRateLimited && (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-digitalwert-background-lighter border border-digitalwert-primary/20 text-slate-200'
                      : 'bg-gradient-to-b from-digitalwert-primary-light to-digitalwert-primary text-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.isBot ? (
                      <Bot className="w-4 h-4 mt-1 text-digitalwert-primary flex-shrink-0" />
                    ) : (
                      <User className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="whitespace-pre-line break-words leading-relaxed">
                        {message.isBot ? renderMarkdown(message.text) : message.text}
                      </div>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-digitalwert-background-lighter border border-digitalwert-primary/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-digitalwert-primary" />
                    <Loader2 className="w-4 h-4 text-digitalwert-primary animate-spin" />
                    <span className="text-slate-300 text-sm">KI denkt nach...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="flex gap-2 mt-4 flex-shrink-0">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Beschreiben Sie Ihr Projekt..."
            className="flex-1 bg-digitalwert-background-lighter border-digitalwert-background-lighter text-white placeholder:text-slate-400"
            disabled={isTyping || isRateLimited}
            maxLength={2000}
          />
          <Button 
            onClick={handleSend} 
            disabled={isTyping || isRateLimited || !input.trim()}
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        {isRateLimited && (
          <p className="text-yellow-500 text-xs mt-2">
            Rate Limit erreicht. Bitte warten Sie einen Moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
