import { MCPServerClient } from "./mcp-client";
import { MCPHttpConfig, MCPTool, MCPToolResponse, MCPPrompt, MCPResource } from "@shared/mcp-types";

// Server Actions for MCP operations
export async function testMCPConnection(config: MCPHttpConfig): Promise<{
  success: boolean;
  tools?: MCPTool[];
  error?: string;
}> {
  let client: MCPServerClient | null = null;

  try {
    console.log('Testing MCP connection with config:', config);

    // Validate HTTP configuration
    if (!config.url || config.url.trim() === '') {
      return {
        success: false,
        error: 'URL is required for HTTP transport'
      };
    }

    try {
      new URL(config.url);
    } catch {
      return {
        success: false,
        error: `Invalid URL format: ${config.url}`
      };
    }

    // Create and connect client
    client = new MCPServerClient(config);
    await client.connect();

    console.log('MCP client connected, testing tools...');

    // Test connection by listing tools
    const tools = await client.listTools();

    console.log('Connection test successful, found tools:', tools);

    return {
      success: true,
      tools: tools
    };

  } catch (error) {
    console.error('Connection test failed:', error);

    let errorMessage = 'Unknown connection error';

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot reach server at ${config.url}. Please check:
        • Server is running and accessible
        • URL is correct (including protocol)
        • No CORS restrictions
        • Network connectivity`;
      } else if (error.message.includes('CORS')) {
        errorMessage = `CORS error: The server needs to allow requests from this domain.`;
      } else if (error.message.includes('NetworkError')) {
        errorMessage = `Network error: Cannot connect to ${config.url}. Check if the server is running.`;
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  } finally {
    // Always disconnect test client
    if (client) {
      try {
        await client.disconnect();
      } catch (disconnectError) {
        console.warn('Error disconnecting test client:', disconnectError);
      }
    }
  }
}

export async function callMCPToolWithConfig(
  config: MCPHttpConfig,
  toolName: string,
  arguments_: Record<string, unknown> = {}
): Promise<MCPToolResponse> {
  let client: MCPServerClient | null = null;

  try {
    // Create and connect client
    client = new MCPServerClient(config);
    await client.connect();

    const result = await client.callTool({
      name: toolName,
      arguments: arguments_
    });

    return result;

  } catch (error) {
    console.error(`Failed to call tool ${toolName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tool call failed'
    };
  } finally {
    // Always disconnect stateless client
    if (client) {
      try {
        await client.disconnect();
      } catch (error) {
        console.error('Error disconnecting client:', error);
      }
    }
  }
}

export async function listMCPToolsWithConfig(config: MCPHttpConfig): Promise<{
  success: boolean;
  tools?: MCPTool[];
  error?: string;
}> {
  let client: MCPServerClient | null = null;

  try {
    console.log(`Creating fresh connection to list tools`);

    // Validate configuration
    if (!config.url || config.url.trim() === '') {
      return {
        success: false,
        error: 'URL is required for HTTP transport'
      };
    }

    try {
      new URL(config.url);
    } catch {
      return {
        success: false,
        error: `Invalid URL format: ${config.url}`
      };
    }

    // Create fresh client and connect
    client = new MCPServerClient(config);
    await client.connect();

    // List tools
    const tools = await client.listTools();

    return {
      success: true,
      tools: tools
    };
  } catch (error) {
    console.error(`Failed to list tools:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List tools failed'
    };
  } finally {
    // Always disconnect the fresh client
    if (client) {
      try {
        await client.disconnect();
      } catch (error) {
        console.error('Error disconnecting client:', error);
      }
    }
  }
}

export async function listMCPPromptsWithConfig(config: MCPHttpConfig): Promise<{
  success: boolean;
  prompts?: MCPPrompt[];
  error?: string;
}> {
  let client: MCPServerClient | null = null;

  try {
    client = new MCPServerClient(config);
    await client.connect();

    const prompts = await client.listPrompts();

    return {
      success: true,
      prompts: prompts
    };
  } catch (error) {
    console.error(`Failed to list prompts:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List prompts failed'
    };
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch (error) {
        console.error('Error disconnecting client:', error);
      }
    }
  }
}

export async function listMCPResourcesWithConfig(config: MCPHttpConfig): Promise<{
  success: boolean;
  resources?: MCPResource[];
  error?: string;
}> {
  let client: MCPServerClient | null = null;

  try {
    client = new MCPServerClient(config);
    await client.connect();

    const resources = await client.listResources();

    return {
      success: true,
      resources: resources
    };
  } catch (error) {
    console.error(`Failed to list resources:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List resources failed'
    };
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch (error) {
        console.error('Error disconnecting client:', error);
      }
    }
  }
}