export interface MCPService {
  id: string;
  name: string;
  icon: string;
  iconClass?: string;
  description: string;
  connected: boolean;
  url?: string;
  token?: string;
  tools: MCPTool[];
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  selected: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: "user" | "assistant";
  isThinking?: boolean;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
}

export interface MCPConfiguration {
  selectedModel: string;
  selectedService: string;
  selectedTools: Record<string, boolean>;
  darkMode: boolean;
}

export interface PermissionRequest {
  toolId: string;
  toolName: string;
  description: string;
  riskLevel: "high";
}
