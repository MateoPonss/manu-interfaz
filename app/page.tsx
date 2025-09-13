"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Brain,
  Cpu,
  Zap,
  Volume2,
  Sun,
  Moon,
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

// --- Constantes de la API ---
const API_BASE_URL = "https://web-production-db25e.up.railway.app";
const ROBOT_ID = "77a2ca9f-b7b0-46cb-b732-3cf011b0a867";

const voiceOptions = {
  "masculina-profesional": {name: "Masculina", id: "ByVRQtaK1WDOvTmP1PKO",},
  "femenina-suave": { name: "Femenina", id: "bN1bDXgDIGX5lw0rtY2B" }
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
  const [selectedVoiceKey, setSelectedVoiceKey] = useState("femenina-suave");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- (MODIFICADO 1) El historial es ahora un arreglo de strings ---
  const [chatHistory, setChatHistory] = useState<string[]>([
    `Manu: ${initialBotMessageContent}`,
  ]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

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

    const voiceId =
      voiceOptions[selectedVoiceKey as keyof typeof voiceOptions].id;

    // --- (MODIFICADO 2) Preparar el historial de strings para la API ---
    const historyForAPI: string[] = [
      ...chatHistory,
      `Usuario: ${currentInputValue}`,
    ];

    try {
      const textResponse = await fetch(`${API_BASE_URL}/generate-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robot_id: ROBOT_ID,
          history: historyForAPI, // <-- Se envía el array de strings
          voice_id: voiceId,
        }),
      });

      if (!textResponse.ok) {
        const errorBody = await textResponse.text();
        throw new Error(
          `Error en Paso 1 (${textResponse.status}): ${errorBody}`
        );
      }

      const data = await textResponse.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.text,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // --- (MODIFICADO 3) Actualizar el historial con las nuevas strings ---
      setChatHistory((prev) => [
        ...prev,
        `Usuario: ${currentInputValue}`,
        `Manu: ${data.text}`,
      ]);

      if (data.audio_url) {
        try {
          console.log(`Paso 2: Pidiendo audio desde ${data.audio_url}`);
          const audioResponse = await fetch(`${API_BASE_URL}${data.audio_url}`);

          if (!audioResponse.ok) {
            console.error(
              `Error en Paso 2 al obtener el audio (${audioResponse.status})`
            );
          } else {
            const audioBlob = await audioResponse.blob();
            const audio = new Audio(URL.createObjectURL(audioBlob));
            console.log("Reproduciendo audio...");
            await audio.play();
          }
        } catch (audioError) {
          console.error("Error al procesar o reproducir el audio:", audioError);
        }
      } else {
        console.log("No se recibió URL de audio, se mostrará solo el texto.");
      }
    } catch (error) {
      console.error("Error durante el proceso completo:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Lo siento, ha ocurrido un error al contactar al servidor. Por favor, intenta de nuevo más tarde.",
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ... El resto de tu JSX permanece exactamente igual ... */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-accent/30 neural-network">
          <Brain size={50} />
        </div>
        <div
          className="absolute top-32 right-16 text-muted-foreground/25 data-flow"
          style={{ animationDelay: "1s" }}
        >
          <Cpu size={45} />
        </div>
        <div
          className="absolute bottom-40 left-16 text-accent/20 floating-particles"
          style={{ animationDelay: "2s" }}
        >
          <Sparkles size={40} />
        </div>
        <div
          className="absolute bottom-24 right-12 text-muted-foreground/30 neural-network"
          style={{ animationDelay: "0.5s" }}
        >
          <Zap size={35} />
        </div>
        <div
          className="absolute top-1/2 left-1/4 text-accent/15 data-flow"
          style={{ animationDelay: "3s" }}
        >
          <Brain size={30} />
        </div>
        <div
          className="absolute top-1/3 right-1/4 text-muted-foreground/20 floating-particles"
          style={{ animationDelay: "1.5s" }}
        >
          <Sparkles size={25} />
        </div>
      </div>
      <header
        className={`border-b border-border/50 sticky top-0 z-10 backdrop-blur-md rounded-b-2xl ${
          isDarkMode ? "dark-theme-glass" : "light-theme-glass"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full enhanced-gradient flex items-center justify-center shadow-md logo-pulse-glow">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full border-2 border-background soft-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Manu</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Brain className="w-3 h-3 text-accent neural-network" />
                  IA • LuminaLab
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="sm"
                className="theme-toggle-button gap-2 h-8 px-3 bg-transparent"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span className="text-xs">Día</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span className="text-xs">Noche</span>
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full enhanced-gradient flex items-center justify-center logo-pulse-glow">
                  <Sparkles className="w-4 h-4 text-white sparkle-dance" />
                </div>
                <div className="text-sm font-semibold text-primary">
                  LuminaLab
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={selectedVoiceKey}
                  onValueChange={setSelectedVoiceKey}
                >
                  <SelectTrigger
                    className={`w-32 h-8 text-xs border-border/50 ${
                      isDarkMode ? "dark-theme-glass" : "light-theme-glass"
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(voiceOptions).map(([key, { name }]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <ScrollArea className="h-[calc(100vh-260px)]" ref={scrollAreaRef}>
          <div className="space-y-6 pb-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                } slide-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {message.sender === "bot" && (
                  <div className="w-10 h-10 rounded-full enhanced-gradient flex items-center justify-center flex-shrink-0 mt-1 logo-pulse-glow">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <Card
                  className={`max-w-[80%] p-4 shadow-sm interactive-card ${
                    message.sender === "user"
                      ? isDarkMode
                        ? "message-gradient-user"
                        : "message-gradient-user-light"
                      : isDarkMode
                      ? "message-gradient-bot"
                      : "message-gradient-bot-light"
                  }`}
                >
                  <p className="text-sm leading-relaxed text-pretty">
                    {message.content}
                  </p>
                  <div
                    className={`text-xs mt-3 flex items-center gap-2 ${
                      message.sender === "user"
                        ? "text-current/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-current opacity-60 soft-pulse"></div>
                    {message.timestamp.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {message.sender === "bot" && (
                      <div className="flex items-center gap-1 ml-2">
                        <div className="flex gap-1">
                          <div className="w-1 h-3 bg-accent/60 rounded voice-wave"></div>
                          <div className="w-1 h-3 bg-accent/60 rounded voice-wave"></div>
                          <div className="w-1 h-3 bg-accent/60 rounded voice-wave"></div>
                          <div className="w-1 h-3 bg-accent/60 rounded voice-wave"></div>
                        </div>
                        <span className="text-xs text-accent/70">
                          {
                            voiceOptions[
                              selectedVoiceKey as keyof typeof voiceOptions
                            ].name
                          }
                        </span>
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
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <Card className="message-gradient-bot p-4 shadow-sm interactive-card">
                  <div className="flex items-center gap-3">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Manu está generando una respuesta...
                    </span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div
        className={`border-t border-border ${
          isDarkMode ? "dark-theme-glass" : "light-theme-glass"
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta aquí..."
                className={`pr-12 h-12 text-sm border-border/50 ${
                  isDarkMode ? "dark-theme-glass" : "light-theme-glass"
                }`}
                disabled={isLoading}
              />
              {inputValue && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Brain className="w-4 h-4 text-accent neural-network" />
                </div>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="gap-2 h-12 px-6 enhanced-gradient hover-lift premium-button"
            >
              <Send className="w-4 h-4" />
              Enviar
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-2">
            <Cpu className="w-3 h-3 neural-network" />
            Manu utiliza inteligencia artificial. Verifica información
            importante para tu investigación.
            <Sparkles className="w-3 h-3 floating-particles" />
          </div>
        </div>
      </div>
    </div>
  );
}
