import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { Ollama } from "ollama";
import { testMCPConnection, callMCPToolWithConfig, listMCPToolsWithConfig, listMCPPromptsWithConfig, listMCPResourcesWithConfig } from "./mcp-actions";
import { MCPHttpConfig } from "@shared/mcp-types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all MCP services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get available LLM models
  app.get("/api/models", async (req, res) => {
    try {
      const models = [
        { id: "ollama-llama3.2", name: "Local LLM (Ollama)", provider: "ollama" },
        { id: "openai-gpt4", name: "OpenAI GPT-4", provider: "openai" },
        { id: "anthropic-claude", name: "Anthropic Claude", provider: "anthropic" },
      ];
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  // Test service connection
  app.post("/api/services/test", async (req, res) => {
    try {
      const { serviceId } = req.body;
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      await storage.updateService(serviceId, { connected: true });
      
      res.json({ 
        success: true, 
        message: "Connection successful",
        toolsCount: (await storage.getToolsByService(serviceId)).length 
      });
    } catch (error) {
      res.status(500).json({ message: "Connection test failed" });
    }
  });

  // Update service configuration
  app.patch("/api/services/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const service = await storage.updateService(id, updates);
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Send chat message and get AI response
  app.post("/api/chat", async (req, res) => {
    try {
      const chatSchema = z.object({
        message: z.string(),
        serviceId: z.string().optional(),
        selectedTools: z.array(z.string()).optional(),
      });
      
      const { message, serviceId, selectedTools } = chatSchema.parse(req.body);
      
      // Store user message
      await storage.createMessage({
        content: message,
        type: "user",
      });

      // Initialize Ollama client using environment variables
      const ollamaHost = process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434';
      const ollamaModel = process.env.LOCAL_LLM_MODEL || 'llama3.2:1b';
      const ollama = new Ollama({ host: ollamaHost });
      
      // Prepare system prompt for MCP context
      const systemPrompt = `You are an AI assistant that helps users interact with various services through the Model Context Protocol (MCP). You can help users with tasks related to GitHub, Jira, Confluence, Slack, Database operations, and Cloud services.

Available services: ${serviceId ? `Currently selected: ${serviceId}` : 'GitHub, Jira, Confluence, Slack, Database, Cloud Services'}
${selectedTools && selectedTools.length > 0 ? `Available tools: ${selectedTools.join(', ')}` : ''}

Be helpful, concise, and ask clarifying questions when needed to better assist the user.`;

      try {
        // Call Ollama with configured model and optimized settings for ngrok connection
        const response = await Promise.race([
          ollama.chat({
            model: ollamaModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              num_predict: 150, // Reduced for faster responses over ngrok
              stop: ['\n\n\n'], // Stop at triple newlines
              num_ctx: 512, // Further reduced context for ngrok speed
            }
          }),
          // Increase timeout for ngrok tunnel delays
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Response timeout')), 20000)
          )
        ]) as any;

        const aiResponse = response.message.content;

        // Store AI response
        const responseMessage = await storage.createMessage({
          content: aiResponse,
          type: "assistant",
        });

        res.json({ response: responseMessage });
      } catch (ollamaError) {
        console.error('Ollama error:', ollamaError);
        
        // Fallback response if Ollama is not available
        const fallbackResponse = `I'm having trouble connecting to the AI model at ${ollamaHost}. 

To fix this:

**If using local Ollama:**
1. Make sure Ollama is running: \`ollama serve\`
2. Pull the model: \`ollama pull ${ollamaModel}\`

**If using Replit (recommended):**
1. Use ngrok to tunnel your local Ollama:
   - Install ngrok: \`brew install ngrok\`
   - Run: \`ngrok http 11434\`
   - Update your .env LOCAL_LLM_BASE_URL with the ngrok URL

Your message: "${message}"

I can help you with MCP services once the connection is restored.`;

        const responseMessage = await storage.createMessage({
          content: fallbackResponse,
          type: "assistant",
        });

        res.json({ response: responseMessage });
      }
    } catch (error) {
      console.error('Chat API error:', error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Get chat messages
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // MCP API endpoints
  app.post("/api/mcp/test-connection", async (req, res) => {
    try {
      const configSchema = z.object({
        url: z.string().url(),
        bearerToken: z.string().optional(),
      });
      
      const config = configSchema.parse(req.body);
      const result = await testMCPConnection(config);
      
      res.json(result);
    } catch (error) {
      console.error('MCP test connection error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Invalid request" 
      });
    }
  });

  app.post("/api/mcp/list-tools", async (req, res) => {
    try {
      const configSchema = z.object({
        url: z.string().url(),
        bearerToken: z.string().optional(),
      });
      
      const config = configSchema.parse(req.body);
      const result = await listMCPToolsWithConfig(config);
      
      res.json(result);
    } catch (error) {
      console.error('MCP list tools error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Invalid request" 
      });
    }
  });

  app.post("/api/mcp/call-tool", async (req, res) => {
    try {
      const requestSchema = z.object({
        config: z.object({
          url: z.string().url(),
          bearerToken: z.string().optional(),
        }),
        toolName: z.string(),
        arguments: z.record(z.unknown()).optional(),
      });
      
      const { config, toolName, arguments: args } = requestSchema.parse(req.body);
      const result = await callMCPToolWithConfig(config, toolName, args || {});
      
      res.json(result);
    } catch (error) {
      console.error('MCP call tool error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Invalid request" 
      });
    }
  });

  app.post("/api/mcp/list-prompts", async (req, res) => {
    try {
      const configSchema = z.object({
        url: z.string().url(),
        bearerToken: z.string().optional(),
      });
      
      const config = configSchema.parse(req.body);
      const result = await listMCPPromptsWithConfig(config);
      
      res.json(result);
    } catch (error) {
      console.error('MCP list prompts error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Invalid request" 
      });
    }
  });

  app.post("/api/mcp/list-resources", async (req, res) => {
    try {
      const configSchema = z.object({
        url: z.string().url(),
        bearerToken: z.string().optional(),
      });
      
      const config = configSchema.parse(req.body);
      const result = await listMCPResourcesWithConfig(config);
      
      res.json(result);
    } catch (error) {
      console.error('MCP list resources error:', error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Invalid request" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
