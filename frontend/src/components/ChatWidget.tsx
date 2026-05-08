import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, BrainCircuit, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

// Basic markdown parser for bold text, lists, and headers
const formatText = (text: string) => {
  if (!text) return null;
  const parts = text.split('\n');
  return parts.map((part, i) => {
    // Handle bolding **text**
    const boldFormatted = part.split(/(\*\*.*?\*\*)/).map((segment, j) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        return <strong key={j} className="font-bold">{segment.slice(2, -2)}</strong>;
      }
      return segment;
    });

    const trimmed = part.trim();

    if (trimmed.startsWith('### ')) {
      return <h4 key={i} className="text-sm font-bold mt-3 mb-1 text-primary drop-shadow-sm">{trimmed.replace('### ', '')}</h4>;
    }
    if (trimmed.startsWith('## ')) {
      return <h3 key={i} className="text-base font-bold mt-4 mb-2 border-b border-primary/20 pb-1">{trimmed.replace('## ', '')}</h3>;
    }
    if (trimmed.startsWith('# ')) {
      return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{trimmed.replace('# ', '')}</h2>;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const cleanText = part.replace(/^[-*]\s+/, '');
      const listBoldFormatted = cleanText.split(/(\*\*.*?\*\*)/).map((segment, j) => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
          return <strong key={j} className="font-bold">{segment.slice(2, -2)}</strong>;
        }
        return segment;
      });

      return (
        <li key={i} className="ml-4 mb-1 list-disc">
          {listBoldFormatted.map((b, k) => <React.Fragment key={k}>{b}</React.Fragment>)}
        </li>
      );
    }

    // Handle markdown table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Ignore separator rows like |---|---|
      if (trimmed.replace(/[-\s|:]/g, '') === '') {
        return null;
      }

      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      // Make the first row (header) bold
      const isHeader = i > 0 && parts[i + 1] && parts[i + 1].replace(/[-\s|:]/g, '') === '';
      
      return (
        <div key={i} className={`flex gap-2 border-b border-white/10 px-2 py-1.5 text-xs ${isHeader ? 'bg-primary/10 font-bold' : ''}`}>
          {cells.map((cell, j) => (
            <div key={j} className="flex-1 break-words">
              {cell.split(/(\*\*.*?\*\*)/).map((segment, k) => {
                if (segment.startsWith('**') && segment.endsWith('**')) {
                  return <strong key={k} className="font-bold">{segment.slice(2, -2)}</strong>;
                }
                return segment;
              })}
            </div>
          ))}
        </div>
      );
    }

    return (
      <p key={i} className="mb-2 min-h-[1rem]">
        {boldFormatted.map((b, k) => <React.Fragment key={k}>{b}</React.Fragment>)}
      </p>
    );
  });
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I am **CoalNet AI**, your intelligent environmental assistant. I can analyze emissions, interpret forecasts, or suggest reduction strategies based on your mine's data. How can I help you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    
    const newHistory = [...history, { role: 'user' as const, content: userMessage }];
    setHistory(newHistory);
    setIsLoading(true);

    try {
      // In a real app, you would gather context from Redux/ContextAPI or LocalStorage
      // Here we just pass a generic context, but it could be populated dynamically
      const contextData = {
        appState: "User is viewing the dashboard",
        activeMine: "All Mines (Overview)"
      };

      const response = await api.chatAssistant(userMessage, contextData, history);
      
      setHistory([...newHistory, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setHistory([...newHistory, { role: 'assistant', content: "⚠️ Sorry, my cognitive core is currently unavailable. Please check the backend connection or try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center z-50 border border-white/20 overflow-hidden"
          >
            {isHovered ? (
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            ) : (
              <MessageSquare className="w-6 h-6" />
            )}
            
            {/* Ambient glow */}
            <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)] pointer-events-none" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 w-auto sm:w-[420px] h-[min(600px,calc(100vh-2rem))] sm:max-h-[85vh] z-50 flex flex-col"
          >
            <Card className="flex-1 flex flex-col shadow-2xl border-white/20 glass-effect bg-black/80 backdrop-blur-xl overflow-hidden rounded-2xl">
              <CardHeader className="p-4 border-b border-white/10 bg-white/5 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 p-2 rounded-lg border border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground font-bold flex items-center gap-2">
                      CoalNet AI
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">Agentic Intelligence Core</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setIsOpen(false)}>
                    <Minimize2 className="h-4 w-4 text-muted-foreground hover:text-white" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400 text-muted-foreground" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'hsl(var(--primary)) transparent'
                }}
              >
                {history.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-md ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-br-none border border-primary/20' 
                          : 'bg-white/80 dark:bg-black/50 text-foreground rounded-bl-none border border-black/5 dark:border-white/5'
                      }`}
                    >
                      {formatText(msg.content)}
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[80%] rounded-2xl rounded-bl-none bg-white/80 dark:bg-black/50 text-foreground border border-black/5 dark:border-white/5 p-4 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground font-mono animate-pulse">Processing telemetry & analyzing models...</span>
                    </div>
                  </motion.div>
                )}
              </CardContent>

              <CardFooter className="p-3 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <form onSubmit={handleSend} className="flex w-full gap-2 relative">
                  <Input 
                    placeholder="Ask CoalNet AI..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 bg-white/50 dark:bg-black/50 border-black/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground pr-10 focus-visible:ring-1 focus-visible:ring-primary h-11 rounded-xl"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!message.trim() || isLoading}
                    className={`absolute right-1 top-1 bottom-1 h-9 w-9 rounded-lg transition-all ${message.trim() ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
