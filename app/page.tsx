"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Send,
  User,
  Sparkles,
  Brain,
  Cpu,
  Zap,
  Volume2,
  Sun,
  Moon,
  Menu,
  Square
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const API_BASE_URL = "https://web-production-db25e.up.railway.app";
const ROBOT_ID = "77a2ca9f-b7b0-46cb-b732-3cf011b0a867";

const voiceOptions = {
  "masculina-profesional": { name: "Masculina", id: "gBTPbHzRd0ZmV75Z5Zk4" },
  "femenina-suave": { name: "Femenina", id: "9rvdnhrYoXoUt4igKpBw" }
};

const initialBotMessageContent =
  "¡Hola! Soy Manu, tu asistente de inteligencia artificial desarrollado por LuminaLab. Estoy aquí para ayudarte con cualquier pregunta o problema que tengas. Mi objetivo es brindarte respuestas precisas y útiles de manera clara y profesional. ¿En qué puedo asistirte hoy?";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: initialBotMessageContent,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoiceKey, setSelectedVoiceKey] = useState("masculina-profesional");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [chatHistory, setChatHistory] = useState<string[]>([
    `Manu: ${initialBotMessageContent}`,
  ]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Auto-scroll al final del chat
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isLoading]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isAudioPlaying) return;
    stopCurrentAudio();

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInputValue = inputValue;
    setInputValue("");
    setIsLoading(true);

    const voiceId = voiceOptions[selectedVoiceKey as keyof typeof voiceOptions].id;
    const historyForAPI: string[] = [...chatHistory, `Usuario: ${currentInputValue}`];

    try {
      const textResponse = await fetch(`${API_BASE_URL}/generate-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robot_id: ROBOT_ID,
          history: historyForAPI,
          voice_id: voiceId,
        }),
      });

      if (!textResponse.ok) throw new Error(`Error en la API: ${textResponse.statusText}`);

      const data = await textResponse.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.text,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setChatHistory((prev) => [...prev, `Usuario: ${currentInputValue}`, `Manu: ${data.text}`]);

      if (data.audio_url) {
        const audioResponse = await fetch(`${API_BASE_URL}${data.audio_url}`);
        if (audioResponse.ok) {
          const audioBlob = await audioResponse.blob();
          const audio = new Audio(URL.createObjectURL(audioBlob));
          audioRef.current = audio;
          
          audio.onplay = () => setIsAudioPlaying(true);
          audio.onended = () => setIsAudioPlaying(false);
          audio.onpause = () => setIsAudioPlaying(false);

          await audio.play();
        }
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const HeaderControls = () => (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="sm"
        className="theme-toggle-button gap-2 h-9 px-4 bg-transparent w-full sm:w-auto"
      >
        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        <span className="text-sm">{isDarkMode ? "Día" : "Noche"}</span>
      </Button>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Volume2 className="w-5 h-5 text-muted-foreground" />
        <Select value={selectedVoiceKey} onValueChange={setSelectedVoiceKey}>
          <SelectTrigger className="w-full sm:w-36 h-9 text-sm border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(voiceOptions).map(([key, { name }]) => (
              <SelectItem key={key} value={key}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 text-accent/30 neural-network"><Brain size={50} /></div>
        <div className="absolute top-32 right-16 text-muted-foreground/25 data-flow" style={{ animationDelay: "1s" }}><Cpu size={45} /></div>
        <div className="absolute bottom-40 left-16 text-accent/20 floating-particles" style={{ animationDelay: "2s" }}><Sparkles size={40} /></div>
        <div className="absolute bottom-24 right-12 text-muted-foreground/30 neural-network" style={{ animationDelay: "0.5s" }}><Zap size={35} /></div>
      </div>

      <header className={`border-b border-border/50 sticky top-0 z-20 backdrop-blur-md ${isDarkMode ? "dark-theme-glass" : "light-theme-glass"}`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full enhanced-gradient flex items-center justify-center shadow-md logo-pulse-glow">
                  <Image src="/robot-avatar.png" alt="Robot Avatar" width={32} height={32} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full border-2 border-background soft-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Manu</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Brain className="w-3 h-3 text-accent neural-network" />IA • LuminaLab
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <HeaderControls />
            </div>

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                  <div className="flex flex-col gap-6 mt-8 items-center">
                    <HeaderControls />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto h-full">
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                  <div className="space-y-6 px-4 py-8 sm:px-6">
                      {messages.map((message, index) => (
                          <div key={message.id} className={`flex gap-4 ${message.sender === "user" ? "justify-end" : "justify-start"} slide-in`} style={{ animationDelay: `${index * 100}ms` }}>
                              {message.sender === "bot" && (
                                  <div className="w-10 h-10 rounded-full enhanced-gradient flex items-center justify-center flex-shrink-0 mt-1 logo-pulse-glow">
                                      <Image src="/robot-avatar.png" alt="Robot Avatar" width={24} height={24} />
                                  </div>
                              )}
                              <Card className={`max-w-[85%] sm:max-w-[80%] p-4 shadow-sm interactive-card ${message.sender === "user" ? (isDarkMode ? "message-gradient-user" : "message-gradient-user-light") : (isDarkMode ? "message-gradient-bot" : "message-gradient-bot-light")}`}>
                                  <p className="text-sm leading-relaxed text-pretty">{message.content}</p>
                                  <div className={`text-xs mt-3 flex items-center gap-2 ${message.sender === "user" ? "text-current/70" : "text-muted-foreground"}`}>
                                      <div className="w-2 h-2 rounded-full bg-current opacity-60 soft-pulse"></div>
                                      {message.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                      {message.sender === "bot" && (
                                          <div className="flex items-center gap-2 ml-2">
                                              {isAudioPlaying && (
                                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-accent/80 hover:bg-accent/20" onClick={stopCurrentAudio}>
                                                      <Square className="w-3 h-3" />
                                                  </Button>
                                              )}
                                              <div className="flex gap-1 items-center">
                                                  <div className="w-1 h-3 bg-accent/60 rounded voice-wave"></div>
                                                  <div className="w-1 h-3 bg-accent/60 rounded voice-wave" style={{animationDelay: '0.2s'}}></div>
                                                  <div className="w-1 h-3 bg-accent/60 rounded voice-wave" style={{animationDelay: '0.4s'}}></div>
                                              </div>
                                              <span className="text-xs text-accent/70">{voiceOptions[selectedVoiceKey as keyof typeof voiceOptions].name}</span>
                                          </div>
                                      )}
                                  </div>
                              </Card>
                              {message.sender === "user" && (
                                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                                      <User className="w-5 h-5 text-muted-foreground" />
                                  </div>
                              )}
                          </div>
                      ))}
                      {isLoading && (
                          <div className="flex gap-4 justify-start slide-in">
                              <div className="w-10 h-10 rounded-full enhanced-gradient flex items-center justify-center flex-shrink-0 mt-1 logo-pulse-glow">
                                  <Image src="/robot-avatar.png" alt="Robot Avatar" width={24} height={24} />
                              </div>
                              <Card className="message-gradient-bot p-4 shadow-sm interactive-card">
                                  <div className="flex items-center gap-3">
                                      <div className="typing-indicator">
                                          <div className="typing-dot"></div>
                                          <div className="typing-dot"></div>
                                          <div className="typing-dot"></div>
                                      </div>
                                      <span className="text-sm text-muted-foreground">Manu está generando una respuesta...</span>
                                  </div>
                              </Card>
                          </div>
                      )}
                  </div>
              </ScrollArea>
          </div>
      </main>

      <footer className={`border-t border-border/50 sticky bottom-0 z-10 ${isDarkMode ? "dark-theme-glass" : "light-theme-glass"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta aquí..."
                className="pr-12 h-12 text-sm border-border/50"
                disabled={isLoading || isAudioPlaying}
              />
              {inputValue && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Brain className="w-4 h-4 text-accent neural-network" /></div>}
            </div>
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading || isAudioPlaying} className="gap-2 h-12 px-6 enhanced-gradient hover-lift premium-button">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-2">
            <Cpu className="w-3 h-3 neural-network" />
            <span>Manu utiliza IA. Verifica información importante.</span>
            <Sparkles className="w-3 h-3 floating-particles" />
          </p>
        </div>
      </footer>
    </div>
  );
}