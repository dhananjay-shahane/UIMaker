import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Settings, Bot, RotateCcw, Send, Circle, Square, GripVertical, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ChatMessage, LLMModel } from "@/types/mcp";

interface LeftSidebarProps {
  width: number;
  config: any;
  models: LLMModel[];
  messages: ChatMessage[];
  toggleTheme: () => void;
  sendMessage: (message: string) => void;
  updateConfig: (updates: any) => void;
  isSending: boolean;
  onWidthChange: (width: number) => void;
}

export function LeftSidebar({
  width,
  config,
  models,
  messages,
  toggleTheme,
  sendMessage,
  updateConfig,
  isSending,
  onWidthChange
}: LeftSidebarProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Handle sidebar resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(280, Math.min(600, e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim());
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date | string) => {
    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    const diff = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return dateObj.toLocaleTimeString();
  };

  return (
    <div 
      ref={sidebarRef}
      className="bg-card border-r border-border flex flex-col relative"
      style={{ width, minWidth: 280, maxWidth: 600 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground" data-testid="app-title">MCP Client</h1>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {config.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Model Context Protocol Interface</p>
      </div>

      {/* LLM Chat Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">LLM Chat</h2>
          <Button variant="ghost" size="sm" className="ml-auto" data-testid="button-refresh-chat">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <Select 
            value={config.selectedModel} 
            onValueChange={(value) => updateConfig({ selectedModel: value })}
          >
            <SelectTrigger className="h-10" data-testid="select-llm-model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ollama-llama3.2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Local LLM (Ollama)
                </div>
              </SelectItem>
              <SelectItem value="openai-gpt4">OpenAI GPT-4</SelectItem>
              <SelectItem value="anthropic-claude">Anthropic Claude</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              data-testid="button-start-chat"
            >
              <Circle className="h-3 w-3 mr-1" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1"
              data-testid="button-stop-chat"
            >
              <Square className="h-3 w-3 mr-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-hidden">
        <div className="space-y-4 pr-2">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`p-4 rounded-lg animate-in fade-in-0 slide-in-from-bottom-2 max-w-full ${
                message.type === "user" 
                  ? "bg-primary text-primary-foreground ml-8" 
                  : "bg-muted mr-8"
              }`}
              data-testid={`message-${message.type}-${message.id}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === "user" 
                    ? "bg-primary-foreground/20" 
                    : "bg-primary/20"
                }`}>
                  {message.type === "user" ? (
                    <span className="text-xs font-bold">U</span>
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-2 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {/* AI Thinking Indicator */}
          {isSending && (
            <div className="p-4 rounded-lg bg-muted mr-8 animate-in fade-in-0 slide-in-from-bottom-2">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-3">
          <Input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1 h-12"
            data-testid="input-chat-message"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isSending || !inputMessage.trim()}
            className="h-12 px-4"
            data-testid="button-send-message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-1 bg-border hover:bg-primary/50 cursor-col-resize group ${
          isResizing ? 'bg-primary' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2">
          <div className="bg-background border border-border rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
