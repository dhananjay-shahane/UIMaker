import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { Ollama } from "ollama";
import { testMCPConnection, callMCPToolWithConfig, listMCPToolsWithConfig, listMCPPromptsWithConfig, listMCPResourcesWithConfig } from "./mcp-actions";
import multer from "multer";
import fs from "fs/promises";
import path from "path";

// Global storage for tracking successful MCP connections
const connectedServers = new Map<string, { name: string; url: string; tools: string[]; lastSeen: Date }>();

// Helper function to track successful MCP connections
function trackMCPConnection(url: string, tools: any[]) {
  const name = url.includes('zeppelin') ? 'Cairo Smart Contracts' : 
               url.includes('javadocs') ? 'Javadocs API' :
               url.includes('findadomain') ? 'Find-A-Domain' :
               url;
  
  connectedServers.set(url, {
    name,
    url,
    tools: tools.map(t => t.name),
    lastSeen: new Date()
  });
}

// Helper function to get currently connected MCP servers
function getConnectedMCPServers() {
  // Remove servers not seen in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  for (const [url, server] of Array.from(connectedServers.entries())) {
    if (server.lastSeen < fiveMinutesAgo) {
      connectedServers.delete(url);
    }
  }
  
  return Array.from(connectedServers.values());
}
import { MCPHttpConfig } from "@shared/mcp-types";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

// Helper function to read file content and preserve files
async function readFileContent(file: Express.Multer.File): Promise<{ content: string; metadata: any }> {
  try {
    let content = '';
    
    if (file.mimetype.startsWith('text/') || file.mimetype === 'application/pdf') {
      content = await fs.readFile(file.path, 'utf-8');
    } else if (file.mimetype.startsWith('image/')) {
      content = `[Image: ${file.originalname}]`;
    } else {
      content = `[File: ${file.originalname}]`;
    }
    
    const metadata = {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadDate: new Date().toISOString()
    };
    
    return { content, metadata };
  } catch (error) {
    throw error;
  }
}

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
  app.post("/api/chat", upload.any(), async (req, res) => {
    try {
      let message: string;
      let serviceId: string | undefined;
      let selectedTools: string[] | undefined;
      let fileMetadata: any[] = [];
      
      // Handle both JSON and FormData requests
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // FormData request with file uploads
        message = req.body.message || '';
        serviceId = req.body.serviceId;
        selectedTools = req.body.selectedTools ? JSON.parse(req.body.selectedTools) : undefined;
        
        // Process uploaded files
        const files = req.files as Express.Multer.File[];
        const fileProcessingResults = await Promise.all(files.map(readFileContent));
        fileMetadata = fileProcessingResults.map(result => result.metadata);
        const fileContents = fileProcessingResults.map(result => result.content);
        
        if (fileContents.length > 0) {
          message += (message ? '\n\n' : '') + '--- Attached Files ---\n' + fileContents.join('\n\n');
        }
      } else {
        // Regular JSON request
        const chatSchema = z.object({
          message: z.string(),
          serviceId: z.string().optional(),
          selectedTools: z.array(z.string()).optional(),
        });
        
        const parsed = chatSchema.parse(req.body);
        message = parsed.message;
        serviceId = parsed.serviceId;
        selectedTools = parsed.selectedTools;
      }
      
      // Store user message with file metadata
      await storage.createMessage({
        content: message,
        type: "user",
        attachedFiles: fileMetadata.length > 0 ? fileMetadata : undefined,
      });

      // Initialize Ollama client using environment variables
      const ollamaHost = process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434';
      const ollamaModel = process.env.LOCAL_LLM_MODEL || 'llama3.2:1b';
      const ollama = new Ollama({ host: ollamaHost });
      
      // Get real-time connected MCP servers for dynamic prompt
      const connectedMCPServers = getConnectedMCPServers();
      
      // Filter servers based on selected service (if any)
      let relevantServers = connectedMCPServers;
      if (serviceId && serviceId !== 'configuration') {
        relevantServers = connectedMCPServers.filter(server => 
          server.name.toLowerCase().includes(serviceId.toLowerCase()) ||
          server.url.includes(serviceId)
        );
      }
      
      // Create dynamic system prompt based on selected or all connected MCP services
      const servicesList = relevantServers.length > 0 
        ? relevantServers.map(s => s.name).join(', ') 
        : (serviceId && serviceId !== 'configuration' ? `Selected service "${serviceId}" not currently connected` : 'No MCP services currently connected');
        
      const toolsList = relevantServers.length > 0 
        ? `\n\nAvailable tools${serviceId && serviceId !== 'configuration' ? ` for ${serviceId}` : ''}:\n${relevantServers.map(server => 
            `${server.name}: ${server.tools.join(', ')}`
          ).join('\n')}` 
        : '';
        
      const systemPrompt = `You are an AI assistant that helps users interact with Model Context Protocol (MCP) services. 

${serviceId && serviceId !== 'configuration' ? `Currently selected service: ${serviceId}` : `All connected MCP services: ${servicesList}`}
${selectedTools && selectedTools.length > 0 ? `\nSelected tools: ${selectedTools.join(', ')}` : ''}${toolsList}

I can help you interact with these MCP services and execute their available tools. 

If you have uploaded files, I can analyze and answer questions about their contents. I understand various file formats including text documents, PDFs, and images.

What would you like to do?`;

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
          attachedFiles: undefined,
        });

        res.json({ response: responseMessage });
      } catch (ollamaError) {
        console.error('Ollama error:', ollamaError);
        // Instead of fallback, return proper error response
        res.status(503).json({ 
          message: "AI service temporarily unavailable",
          error: "Connection to AI model failed"
        });
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
      
      // Track successful connections for chat context
      if (result.success && result.tools) {
        trackMCPConnection(config.url, result.tools);
      }
      
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

  // Serve uploaded files
  app.get("/api/files/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      // Check if file exists (synchronously for this endpoint)
      const fsSync = require('fs');
      if (!fsSync.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.sendFile(filePath);
    } catch (error) {
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
