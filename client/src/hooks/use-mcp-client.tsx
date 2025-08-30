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
    mutationFn: async (message: string) => {
      const controller = new AbortController();
      setAbortController(controller);
      
      const response = await apiRequest("POST", "/api/chat", {
        message,
        serviceId: config.selectedService,
        selectedTools: Object.keys(config.selectedTools).filter(key => config.selectedTools[key])
      }, controller.signal);
      
      setAbortController(null);
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, data.response]);
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setAbortController(null);
    },
    onError: () => {
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

  const sendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      type: "user"
    };
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(content);
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

  const deselectAllTools = useCallback(() => {
    updateConfig({ selectedTools: {} });
  }, [updateConfig]);

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
