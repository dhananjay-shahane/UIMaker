import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MCPService, MCPTool, ChatMessage, LLMModel, MCPConfiguration, PermissionRequest } from "@/types/mcp";

const STORAGE_KEY = "mcp-client-config";

export function useMCPClient() {
  const queryClient = useQueryClient();
  
  const [config, setConfig] = useState<MCPConfiguration>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      selectedModel: "ollama-llama3.2",
      selectedService: "configuration",
      selectedTools: {},
      darkMode: false,
    };
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);

  // Load services data
  const { data: services = [], isLoading: servicesLoading } = useQuery<MCPService[]>({
    queryKey: ["/api/services"],
  });

  // Load LLM models
  const { data: models = [], isLoading: modelsLoading } = useQuery<LLMModel[]>({
    queryKey: ["/api/models"],
  });

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("localStorageChange", {
      detail: { 
        key: STORAGE_KEY,
        newValue: JSON.stringify(config)
      }
    }));
  }, [config]);

  // Apply dark mode
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (config.darkMode) {
      htmlElement.classList.add("dark");
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      htmlElement.classList.remove("dark");
      htmlElement.setAttribute('data-theme', 'light');
    }
  }, [config.darkMode]);

  // AbortController for stopping chat requests
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; attachments: File[] }) => {
      const controller = new AbortController();
      setAbortController(controller);
      
      // Create FormData if we have attachments
      let requestBody: any;
      if (data.attachments.length > 0) {
        const formData = new FormData();
        formData.append('message', data.message);
        formData.append('serviceId', config.selectedService);
        formData.append('selectedTools', JSON.stringify(Object.keys(config.selectedTools).filter(key => config.selectedTools[key])));
        data.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
        requestBody = formData;
      } else {
        requestBody = {
          message: data.message,
          serviceId: config.selectedService,
          selectedTools: Object.keys(config.selectedTools).filter(key => config.selectedTools[key])
        };
      }
      
      const response = await apiRequest("POST", "/api/chat", requestBody, controller.signal);
      
      setAbortController(null);
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => {
        // Remove the thinking message and add the real response
        const withoutThinking = prev.filter(msg => !msg.isThinking);
        return [...withoutThinking, data.response];
      });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setAbortController(null);
    },
    onError: () => {
      setMessages(prev => prev.filter(msg => !msg.isThinking));
      setAbortController(null);
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await apiRequest("POST", "/api/services/test", { serviceId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    }
  });

  // Update service configuration mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ serviceId, config: serviceConfig }: { serviceId: string; config: any }) => {
      const response = await apiRequest("PATCH", `/api/services/${serviceId}`, serviceConfig);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    }
  });

  const updateConfig = useCallback((updates: Partial<MCPConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const sendMessage = useCallback((content: string, attachments?: File[]) => {
    let messageContent = content;
    
    // Add file information to message content if files are attached
    if (attachments && attachments.length > 0) {
      const fileList = attachments.map(f => `📎 ${f.name} (${(f.size / 1024).toFixed(1)}KB)`).join('\n');
      messageContent = content + (content ? '\n\n' : '') + fileList;
    }
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageContent,
      timestamp: new Date(),
      type: "user"
    };
    
    const thinkingMessage: ChatMessage = {
      id: `thinking-${Date.now()}`,
      content: "AI is thinking...",
      timestamp: new Date(),
      type: "assistant",
      isThinking: true
    };
    
    setMessages(prev => [...prev, userMessage, thinkingMessage]);
    sendMessageMutation.mutate({ message: content, attachments: attachments || [] });
  }, [sendMessageMutation]);

  const toggleToolSelection = useCallback((toolId: string, riskLevel: "low" | "medium" | "high") => {
    const currentlySelected = config.selectedTools[toolId];
    
    if (!currentlySelected && riskLevel === "high") {
      // Show permission modal for high-risk tools
      const service = services.find((s: MCPService) => s.id === config.selectedService);
      const tool = service?.tools.find((t: MCPTool) => t.id === toolId);
      
      if (tool) {
        setPermissionRequest({
          toolId,
          toolName: tool.name,
          description: tool.description,
          riskLevel: "high"
        });
      }
    } else {
      updateConfig({
        selectedTools: {
          ...config.selectedTools,
          [toolId]: !currentlySelected
        }
      });
    }
  }, [config.selectedTools, config.selectedService, services, updateConfig]);

  const approvePermission = useCallback(() => {
    if (permissionRequest) {
      updateConfig({
        selectedTools: {
          ...config.selectedTools,
          [permissionRequest.toolId]: true
        }
      });
      setPermissionRequest(null);
    }
  }, [permissionRequest, config.selectedTools, updateConfig]);

  const denyPermission = useCallback(() => {
    setPermissionRequest(null);
  }, []);

  const deselectAllTools = useCallback((currentServerTools?: any[]) => {
    const hasAnySelected = Object.values(config.selectedTools).some(Boolean);
    
    if (hasAnySelected) {
      // Deselect all
      updateConfig({ selectedTools: {} });
    } else {
      // Select all available tools for current service
      if (currentServerTools) {
        const allToolsSelected = currentServerTools.reduce((acc: Record<string, boolean>, tool: any) => {
          const toolId = `${config.selectedService}:${tool.name}`;
          acc[toolId] = true;
          return acc;
        }, {});
        updateConfig({ selectedTools: { ...config.selectedTools, ...allToolsSelected } });
      }
    }
  }, [config.selectedTools, config.selectedService, updateConfig]);

  const refreshService = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/services"] });
  }, [queryClient]);

  const toggleTheme = useCallback(() => {
    updateConfig({ darkMode: !config.darkMode });
  }, [config.darkMode, updateConfig]);

  const stopChat = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  }, [abortController]);

  return {
    config,
    updateConfig,
    messages,
    services,
    models,
    permissionRequest,
    sidebarWidth,
    setSidebarWidth,
    isLoading: servicesLoading || modelsLoading,
    sendMessage,
    toggleToolSelection,
    approvePermission,
    denyPermission,
    deselectAllTools,
    refreshService,
    toggleTheme,
    stopChat,
    testConnection: testConnectionMutation.mutate,
    updateService: updateServiceMutation.mutate,
    isSending: sendMessageMutation.isPending,
    isTesting: testConnectionMutation.isPending,
  };
}
