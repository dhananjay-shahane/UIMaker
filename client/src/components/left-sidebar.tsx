import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Settings, Bot, RotateCcw, Send, Circle, Square, GripVertical, Loader2, Copy, Code, StopCircle } from "lucide-react";
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
  stopChat: () => void;
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
  onWidthChange,
  stopChat
}: LeftSidebarProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useTextarea, setUseTextarea] = useState(true); // Always use textarea for better UX
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
    if (e.key === "Enter" && e.shiftKey) {
      // Allow shift+enter for new lines, switch to textarea
      setUseTextarea(true);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);
    
    // Always use textarea for better UX - removed switching logic
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

  const renderMarkdownText = (text: string) => {
    // Handle bold text (**text** or __text__)
    let result = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Handle italic text (*text* or _text_)
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    result = result.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Handle inline code (`code`)
    result = result.replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-300 px-1 py-0.5 rounded text-sm font-mono text-black dark:text-gray-800">$1</code>');
    
    return result;
  };

  const renderMessageContent = (content: string, isAssistant: boolean, isThinking?: boolean) => {
    if (isThinking) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm text-blue-600 dark:text-blue-500 italic">{content}</span>
        </div>
      );
    }

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
              return <div key={index} className="text-sm leading-relaxed break-words whitespace-pre-wrap max-w-full overflow-hidden" dangerouslySetInnerHTML={{ __html: renderMarkdownText(part) }} />;
            }
          })}
        </div>
      );
    }
    
    // For assistant messages without code blocks, render markdown
    if (isAssistant) {
      return <div className="text-sm leading-relaxed break-words whitespace-pre-wrap max-w-full overflow-hidden" dangerouslySetInnerHTML={{ __html: renderMarkdownText(content) }} />;
    }
    
    // For user messages, keep as plain text
    return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap max-w-full overflow-hidden">{content}</p>;
  };

  return (
    <div 
      ref={sidebarRef}
      className="bg-white dark:bg-gray-200 border-r border-gray-200 dark:border-gray-400 flex flex-col relative"
      style={{ width, minWidth: 280, maxWidth: 600 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-400">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-black dark:text-gray-800" data-testid="app-title">MCP Client</h1>
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
        <p className="text-sm text-gray-600 dark:text-gray-700">Model Context Protocol Interface</p>
      </div>

      {/* LLM Chat Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-400">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg text-black dark:text-gray-800">LLM Chat</h2>
          <Button variant="ghost" size="sm" className="ml-auto" data-testid="button-refresh-chat">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <Select 
            value={config.selectedModel} 
            onValueChange={(value) => updateConfig({ selectedModel: value })}
          >
            <SelectTrigger className="h-10 bg-white dark:bg-gray-50 border-gray-300 dark:border-gray-500 text-black dark:text-gray-800" data-testid="select-llm-model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="z-50 border-2 bg-white dark:bg-gray-50 border-gray-300 dark:border-gray-500">
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
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-hidden no-scrollbar">
        <div className="space-y-4 pr-2 max-w-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-blue-600 dark:text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-black dark:text-gray-800 mb-2">Welcome to MCP Client</h3>
              <p className="text-sm text-gray-600 dark:text-gray-700 max-w-64">
                Connect and interact with Model Context Protocol servers. Start by typing a message below!
              </p>
            </div>
          )}
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`chat-message group relative p-4 rounded-lg animate-in fade-in-0 slide-in-from-bottom-2 ${
                message.type === "user" 
                  ? "bg-gray-100 dark:bg-gray-200 text-black dark:text-gray-800 ml-8 mr-2 shadow-md border-2 border-gray-300 dark:border-gray-400" 
                  : "bg-white dark:bg-gray-50 text-black dark:text-gray-800 mr-8 ml-2 border-2 border-gray-200 dark:border-gray-300 shadow-sm"
              }`}
              data-testid={`message-${message.type}-${message.id}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                  message.type === "user" 
                    ? "bg-white dark:bg-gray-50 border-gray-300 dark:border-gray-400" 
                    : "bg-gray-100 dark:bg-gray-200 border-gray-300 dark:border-gray-400"
                }`}>
                  {message.type === "user" ? (
                    <span className="text-sm font-bold text-black dark:text-gray-800">U</span>
                  ) : (
                    <Bot className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  {renderMessageContent(message.content, message.type === "assistant", message.isThinking)}
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${
                      message.type === "user" ? "text-gray-600 dark:text-gray-700" : "text-gray-500 dark:text-gray-600"
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.type === "assistant" && !message.isThinking && (
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
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t-2 border-gray-200 dark:border-gray-400 bg-white dark:bg-gray-200">
        <div className="flex gap-3">
          {useTextarea ? (
            <Textarea
              placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              disabled={isSending}
              className="chat-input-glass flex-1 min-h-[48px] max-h-32 bg-white dark:bg-gray-100 border-gray-300 dark:border-gray-400 text-black dark:text-gray-800 focus:border-blue-500 border-2 shadow-sm focus:shadow-md transition-shadow resize-none"
              data-testid="textarea-chat-message"
              rows={Math.min(4, Math.max(1, inputMessage.split('\n').length))}
            />
          ) : (
            <Input
              type="text"
              placeholder="Type a message... (Shift+Enter for multiline)"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="chat-input-glass flex-1 h-12 bg-white dark:bg-gray-100 border-gray-300 dark:border-gray-400 text-black dark:text-gray-800 focus:border-blue-500 border-2 shadow-sm focus:shadow-md transition-shadow"
              data-testid="input-chat-message"
            />
          )}
          {isSending && (
            <Button 
              onClick={stopChat}
              variant="outline"
              className="h-12 px-4 shadow-sm hover:shadow-md transition-all duration-200 border-red-300 hover:border-red-400 text-red-600 hover:text-red-700"
              data-testid="button-stop-chat"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          )}
          <Button 
            onClick={handleSendMessage}
            disabled={isSending || !inputMessage.trim()}
            className="h-12 px-4 bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200"
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
