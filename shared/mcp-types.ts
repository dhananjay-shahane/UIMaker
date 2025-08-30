// MCP Server Configuration Types
export interface MCPHttpConfig {
  url: string;
  bearerToken?: string;
}

export type MCPServerConfig = MCPHttpConfig;

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: {
    name: string;
    description?: string;
    required?: boolean;
  }[];
}

export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface MCPConnectionStatus {
  connected: boolean;
  lastTestSuccess?: boolean;
  lastTestError?: string;
  lastTestTools?: MCPTool[];
  isTesting?: boolean;
}

export interface MCPToolCall {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPToolResponse {
  success: boolean;
  content?: unknown[];
  isError?: boolean;
  error?: string;
}