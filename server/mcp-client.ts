import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCPHttpConfig, MCPTool, MCPToolResponse, MCPPrompt, MCPResource } from "@shared/mcp-types";

// Server-side MCP client manager
export class MCPServerClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport | null = null;
  private isConnected = false;

  constructor(private config: MCPHttpConfig) {
    this.client = new Client({
      name: "mcp-client",
      version: "1.0.0"
    });
  }

  private createTransport(): StreamableHTTPClientTransport {
    const requestInit: RequestInit = {};

    if (this.config.bearerToken) {
      requestInit.headers = {
        'Authorization': `Bearer ${this.config.bearerToken}`,
      };
    }

    return new StreamableHTTPClientTransport(
      new URL(this.config.url),
      { requestInit }
    );
  }

  async connect(): Promise<void> {
    try {
      this.transport = this.createTransport();
      await this.client.connect(this.transport);
      this.isConnected = true;
    } catch (error) {
      console.error("Failed to connect to MCP server:", error);
      throw new Error(`MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.close();
        this.isConnected = false;
      }
    } catch (error) {
      console.error("Error during MCP disconnect:", error);
    }
  }

  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error("MCP Client is not connected. Call connect() first.");
    }
  }

  async listTools(): Promise<MCPTool[]> {
    this.ensureConnected();
    try {
      const response = await this.client.listTools();
      return (response.tools || []).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as any
      }));
    } catch (error) {
      console.error("Failed to list tools:", error);
      throw new Error(`Failed to list tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async callTool(request: { name: string; arguments?: Record<string, unknown> }): Promise<MCPToolResponse> {
    this.ensureConnected();
    try {
      const response = await this.client.callTool({
        name: request.name,
        arguments: request.arguments as { [key: string]: string } || {}
      });

      return {
        success: true,
        content: Array.isArray(response.content) ? response.content : [],
        isError: typeof response.isError === 'boolean' ? response.isError : false
      };
    } catch (error) {
      console.error(`Failed to call tool "${request.name}":`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async listPrompts(): Promise<MCPPrompt[]> {
    this.ensureConnected();
    try {
      const response = await this.client.listPrompts();
      return (response.prompts || []).map(prompt => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments
      }));
    } catch (error) {
      console.error("Failed to list prompts:", error);
      throw new Error(`Failed to list prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPrompt(request: { name: string; arguments?: Record<string, unknown> }): Promise<{
    description?: string;
    messages?: unknown[];
  }> {
    this.ensureConnected();
    try {
      const response = await this.client.getPrompt({
        name: request.name,
        arguments: request.arguments as { [key: string]: string } || {}
      });
      return response;
    } catch (error) {
      console.error(`Failed to get prompt "${request.name}":`, error);
      throw new Error(`Failed to get prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listResources(): Promise<MCPResource[]> {
    this.ensureConnected();
    try {
      const response = await this.client.listResources();
      return (response.resources || []).map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType
      }));
    } catch (error) {
      console.error("Failed to list resources:", error);
      throw new Error(`Failed to list resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async readResource(request: { uri: string }): Promise<{
    contents: unknown[];
  }> {
    this.ensureConnected();
    try {
      const response = await this.client.readResource({
        uri: request.uri
      });
      return response;
    } catch (error) {
      console.error(`Failed to read resource "${request.uri}":`, error);
      throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}