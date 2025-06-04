
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onAddQuoteItem: (item: any) => void;
}

export function ChatInterface({ onAddQuoteItem }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hallo! Ich bin Ihr KI-Berater von Digitalwert. Gerne berate ich Sie zu Webauftritten, Rebrandings, UI Design und der technischen Realisierung von Shop-Websites. Wie kann ich Ihnen heute helfen?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage: string) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('website') || message.includes('webauftritt')) {
      // Add quote item for website
      setTimeout(() => {
        onAddQuoteItem({
          service: 'Professioneller Webauftritt',
          description: 'Responsive Website mit modernem Design',
          price: 2500
        });
      }, 1000);
      
      return "Gerne erstelle ich Ihnen ein Angebot für einen professionellen Webauftritt. Basierend auf Ihren Anforderungen schlage ich eine responsive Website mit modernem Design vor. Benötigen Sie zusätzliche Funktionen wie einen Online-Shop, ein Content-Management-System oder spezielle Integrationen?";
    }
    
    if (message.includes('shop') || message.includes('e-commerce')) {
      setTimeout(() => {
        onAddQuoteItem({
          service: 'E-Commerce Shop-System',
          description: 'Vollständiges Online-Shop System mit Zahlungsabwicklung',
          price: 4500
        });
      }, 1000);
      
      return "Für einen E-Commerce Shop empfehle ich ein vollständiges System mit Produktkatalog, Warenkorb, Zahlungsabwicklung und Bestellverwaltung. Das Angebot wurde zu Ihrem Kostenvoranschlag hinzugefügt. Wie viele Produkte sollen ungefähr verkauft werden?";
    }
    
    if (message.includes('rebranding') || message.includes('design')) {
      setTimeout(() => {
        onAddQuoteItem({
          service: 'Corporate Rebranding',
          description: 'Komplettes Rebranding inkl. Logo, Farben und Styleguide',
          price: 3200
        });
      }, 1000);
      
      return "Ein Rebranding ist eine ausgezeichnete Investition in die Zukunft Ihres Unternehmens. Ich habe ein Paket für ein komplettes Corporate Rebranding zu Ihrem Angebot hinzugefügt. Dies umfasst Logo-Design, Farbpalette, Typografie und einen umfassenden Styleguide. Haben Sie bereits konkrete Vorstellungen für die neue Markenrichtung?";
    }
    
    if (message.includes('ui') || message.includes('interface')) {
      setTimeout(() => {
        onAddQuoteItem({
          service: 'UI/UX Design',
          description: 'Benutzerfreundliches Interface Design',
          price: 1800
        });
      }, 1000);
      
      return "UI/UX Design ist entscheidend für den Erfolg digitaler Produkte. Ich habe ein Angebot für professionelles Interface Design hinzugefügt. Dies umfasst Wireframes, Prototyping und das finale Design. Für welche Art von Anwendung benötigen Sie das Design?";
    }
    
    if (message.includes('beratung') || message.includes('hilfe')) {
      return "Gerne berate ich Sie umfassend! Ich kann Ihnen bei folgenden Bereichen helfen: \n\n• Webauftritte und Corporate Websites\n• E-Commerce und Online-Shops\n• Rebranding und Corporate Design\n• UI/UX Design für digitale Produkte\n• Technische Realisierung und Entwicklung\n\nWas interessiert Sie am meisten?";
    }

    if (message.includes('preis') || message.includes('kosten')) {
      return "Unsere Preise sind transparent und fair kalkuliert. Sie sehen alle Positionen live in Ihrem Kostenvoranschlag rechts. Jedes Projekt wird individuell bewertet - sprechen Sie einfach Ihre konkreten Anforderungen an, dann kann ich Ihnen passende Angebote erstellen.";
    }

    // Default response
    return "Das ist eine interessante Anfrage! Können Sie mir mehr Details dazu geben? Je spezifischer Sie Ihre Wünsche beschreiben, desto besser kann ich Ihnen passende Lösungen und Angebote erstellen. Geht es um einen Webauftritt, E-Commerce, Design oder etwas anderes?";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: getAIResponse(input),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          KI-Berater Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isBot
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'bg-slate-800 text-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.isBot ? (
                    <Bot className="w-4 h-4 mt-1 text-blue-600" />
                  ) : (
                    <User className="w-4 h-4 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-line">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Beschreiben Sie Ihr Projekt..."
            className="flex-1"
          />
          <Button onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
