import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

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

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate AI response based on the message
      let aiResponse = "I understand your request. ";
      
      if (message.toLowerCase().includes("github")) {
        aiResponse += "I can help you with GitHub operations. What specific task would you like me to perform?";
      } else if (message.toLowerCase().includes("tool") || message.toLowerCase().includes("action")) {
        aiResponse += "I can see the available tools for the selected services. Which tools would you like me to use?";
      } else {
        aiResponse += "How can I assist you with the MCP services today?";
      }

      // Store AI response
      const responseMessage = await storage.createMessage({
        content: aiResponse,
        type: "assistant",
      });

      res.json({ response: responseMessage });
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
