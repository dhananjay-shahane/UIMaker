import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Settings, Bot, RotateCcw, Send, Circle, Square } from "lucide-react";
import { useState } from "react";
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
}

export function LeftSidebar({
  width,
  config,
  models,
  messages,
  toggleTheme,
  sendMessage,
  updateConfig,
  isSending
}: LeftSidebarProps) {
  const [inputMessage, setInputMessage] = useState("");

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

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-card border-r border-border flex flex-col" style={{ width }}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold" data-testid="app-title">MCP Client</h1>
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
        <p className="text-xs text-muted-foreground">Model Context Protocol Interface</p>
      </div>

      {/* LLM Chat Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-primary" />
          <h2 className="font-medium">LLM Chat</h2>
          <Button variant="ghost" size="sm" className="ml-auto" data-testid="button-refresh-chat">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <Select 
            value={config.selectedModel} 
            onValueChange={(value) => updateConfig({ selectedModel: value })}
          >
            <SelectTrigger data-testid="select-llm-model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ollama-llama3.2">Local LLM (Ollama)</SelectItem>
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
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`p-3 rounded-lg animate-in fade-in-0 slide-in-from-bottom-2 ${
                message.type === "user" 
                  ? "bg-primary/10 border border-primary/20" 
                  : "bg-muted"
              }`}
              data-testid={`message-${message.type}-${message.id}`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs text-muted-foreground mt-2 block">
                {formatTime(message.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            data-testid="input-chat-message"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isSending || !inputMessage.trim()}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
