import { type User, type InsertUser, type MCPService, type InsertMCPService, type MCPTool, type InsertMCPTool, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getServices(): Promise<MCPService[]>;
  getService(id: string): Promise<MCPService | undefined>;
  createService(service: InsertMCPService): Promise<MCPService>;
  updateService(id: string, updates: Partial<MCPService>): Promise<MCPService>;
  
  getToolsByService(serviceId: string): Promise<MCPTool[]>;
  createTool(tool: InsertMCPTool): Promise<MCPTool>;
  updateTool(id: string, updates: Partial<MCPTool>): Promise<MCPTool>;
  
  getMessages(): Promise<ChatMessage[]>;
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private services: Map<string, MCPService>;
  private tools: Map<string, MCPTool>;
  private messages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.tools = new Map();
    this.messages = new Map();
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // No hardcoded services - all services will be dynamically configured through MCP
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getServices(): Promise<MCPService[]> {
    const services = Array.from(this.services.values());
    return services.map(service => ({
      ...service,
      tools: Array.from(this.tools.values()).filter(tool => tool.serviceId === service.id)
    })) as any;
  }

  async getService(id: string): Promise<MCPService | undefined> {
    return this.services.get(id);
  }

  async createService(service: InsertMCPService): Promise<MCPService> {
    const newService: MCPService = {
      ...service,
      description: service.description || null,
      icon: service.icon || null,
      url: service.url || null,
      token: service.token || null,
      connected: service.connected || false,
      config: service.config || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.services.set(service.id!, newService);
    return newService;
  }

  async updateService(id: string, updates: Partial<MCPService>): Promise<MCPService> {
    const service = this.services.get(id);
    if (!service) {
      throw new Error(`Service ${id} not found`);
    }
    const updatedService = { ...service, ...updates, updatedAt: new Date() };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async getToolsByService(serviceId: string): Promise<MCPTool[]> {
    return Array.from(this.tools.values()).filter(tool => tool.serviceId === serviceId);
  }

  async createTool(tool: InsertMCPTool): Promise<MCPTool> {
    const newTool: MCPTool = { 
      ...tool,
      description: tool.description || null,
      selected: tool.selected || false,
      config: tool.config || {},
    };
    this.tools.set(tool.id!, newTool);
    return newTool;
  }

  async updateTool(id: string, updates: Partial<MCPTool>): Promise<MCPTool> {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool ${id} not found`);
    }
    const updatedTool = { ...tool, ...updates };
    this.tools.set(id, updatedTool);
    return updatedTool;
  }

  async getMessages(): Promise<ChatMessage[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
    );
  }

  async createMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const newMessage: ChatMessage = {
      ...message,
      id,
      userId: message.userId || null,
      timestamp: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
}

export const storage = new MemStorage();
