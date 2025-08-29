import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Settings, Bot, RotateCcw, Send, Circle, Square, GripVertical, Loader2, Copy, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [showSettings, setShowSettings] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Message content copied successfully",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const detectCodeBlocks = (content: string) => {
    const codeBlockRegex = /```[\s\S]*?```/g;
    return codeBlockRegex.test(content);
  };

  const renderMessageContent = (content: string, isAssistant: boolean) => {
    if (isAssistant && detectCodeBlocks(content)) {
      const parts = content.split(/(```[\s\S]*?```)/g);
      return (
        <div className="space-y-2">
          {parts.map((part, index) => {
            if (part.startsWith('```') && part.endsWith('```')) {
              const code = part.slice(3, -3).trim();
              const lines = code.split('\n');
              const language = lines[0] || '';
              const codeContent = lines.slice(1).join('\n') || lines[0];
              
              return (
                <div key={index} className="code-block">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Code className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-400">{language || 'code'}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(codeContent)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white flex-shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="text-sm text-slate-100 whitespace-pre overflow-x-auto">
                    <code className="block">{codeContent}</code>
                  </pre>
                </div>
              );
            } else {
              return <p key={index} className="text-sm leading-relaxed break-words whitespace-pre-wrap">{part}</p>;
            }
          })}
        </div>
      );
    }
    
    return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{content}</p>;
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
          <div className="flex items-center gap-1 relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {config.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              data-testid="button-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            {/* Settings Popup */}
            {showSettings && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowSettings(false)}
                />
                <div className="settings-popup w-80 p-4 z-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Settings</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSettings(false)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Theme</p>
                        <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={toggleTheme}
                        className="flex items-center gap-2"
                      >
                        {config.darkMode ? (
                          <>
                            <Sun className="h-3 w-3" />
                            Light
                          </>
                        ) : (
                          <>
                            <Moon className="h-3 w-3" />
                            Dark
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="font-medium mb-2">Current Model</p>
                      <p className="text-sm text-muted-foreground">
                        {models.find(m => m.id === config.selectedModel)?.name || 'Unknown Model'}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="font-medium mb-2">App Version</p>
                      <p className="text-sm text-muted-foreground">MCP Client v1.0.0</p>
                    </div>
                  </div>
                </div>
              </>
            )}
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
            <SelectTrigger className="h-10 bg-background border-input" data-testid="select-llm-model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="z-50 border-2">
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {model.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-hidden">
        <div className="space-y-4 pr-2">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`chat-message group relative p-4 rounded-lg animate-in fade-in-0 slide-in-from-bottom-2 max-w-full ${
                message.type === "user" 
                  ? "bg-primary text-primary-foreground ml-8 shadow-md border-2 border-primary/20" 
                  : "bg-card text-card-foreground mr-8 border-2 border-border shadow-sm"
              }`}
              data-testid={`message-${message.type}-${message.id}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                  message.type === "user" 
                    ? "bg-primary-foreground/20 border-primary-foreground/30" 
                    : "bg-muted border-muted-foreground/30"
                }`}>
                  {message.type === "user" ? (
                    <span className="text-sm font-bold text-primary-foreground">U</span>
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {renderMessageContent(message.content, message.type === "assistant")}
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${
                      message.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.type === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* AI Thinking Indicator */}
          {isSending && (
            <div className="chat-message p-4 rounded-lg bg-card text-card-foreground mr-8 border-2 border-border shadow-sm animate-in fade-in-0 slide-in-from-bottom-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted border-2 border-muted-foreground/30">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t-2 border-border bg-card">
        <div className="flex gap-3">
          <Input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="chat-input-glass flex-1 h-12 focus:border-primary border-2"
            data-testid="input-chat-message"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isSending || !inputMessage.trim()}
            className="h-12 px-4 bg-primary hover:bg-primary/90"
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
