import { type User, type InsertUser, type MCPService, type InsertMCPService, type MCPTool, type InsertMCPTool, type ChatMessage, type InsertChatMessage, users, chatMessages } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
      attachedFiles: message.attachedFiles || [],
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUserByUsername:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getServices(): Promise<MCPService[]> {
    // Services are managed in-memory/localStorage, not in database
    return [];
  }

  async getService(id: string): Promise<MCPService | undefined> {
    return undefined;
  }

  async createService(service: InsertMCPService): Promise<MCPService> {
    throw new Error("Services are managed client-side");
  }

  async updateService(id: string, updates: Partial<MCPService>): Promise<MCPService> {
    throw new Error("Services are managed client-side");
  }

  async getToolsByService(serviceId: string): Promise<MCPTool[]> {
    return [];
  }

  async createTool(tool: InsertMCPTool): Promise<MCPTool> {
    throw new Error("Tools are managed client-side");
  }

  async updateTool(id: string, updates: Partial<MCPTool>): Promise<MCPTool> {
    throw new Error("Tools are managed client-side");
  }

  async getMessages(): Promise<ChatMessage[]> {
    try {
      const messages = await db.select().from(chatMessages).orderBy(chatMessages.timestamp);
      return messages.map(msg => ({
        ...msg,
        attachedFiles: msg.attachedFiles as any[] || []
      }));
    } catch (error) {
      console.error('Database error in getMessages:', error);
      return [];
    }
  }

  async createMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return {
      ...newMessage,
      attachedFiles: newMessage.attachedFiles as any[] || []
    };
  }
}

// Create storage instance that can switch between memory and database
class HybridStorage implements IStorage {
  private memStorage: MemStorage;
  private dbStorage: DatabaseStorage;
  private useDatabase: boolean = false;

  constructor() {
    this.memStorage = new MemStorage();
    this.dbStorage = new DatabaseStorage();
    
    // Check if database should be used based on environment
    this.useDatabase = Boolean(process.env.DATABASE_URL);
  }

  // For chat messages, use database if configured, otherwise use memory
  async getMessages(): Promise<ChatMessage[]> {
    if (this.useDatabase) {
      try {
        return await this.dbStorage.getMessages();
      } catch (error) {
        console.error('Database fallback to memory storage:', error);
        return await this.memStorage.getMessages();
      }
    }
    return await this.memStorage.getMessages();
  }

  async createMessage(message: InsertChatMessage): Promise<ChatMessage> {
    if (this.useDatabase) {
      try {
        return await this.dbStorage.createMessage(message);
      } catch (error) {
        console.error('Database fallback to memory storage:', error);
        return await this.memStorage.createMessage(message);
      }
    }
    return await this.memStorage.createMessage(message);
  }

  // All other methods use memory storage
  async getUser(id: string): Promise<User | undefined> {
    return this.memStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.memStorage.getUserByUsername(username);
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.memStorage.createUser(user);
  }

  async getServices(): Promise<MCPService[]> {
    return this.memStorage.getServices();
  }

  async getService(id: string): Promise<MCPService | undefined> {
    return this.memStorage.getService(id);
  }

  async createService(service: InsertMCPService): Promise<MCPService> {
    return this.memStorage.createService(service);
  }

  async updateService(id: string, updates: Partial<MCPService>): Promise<MCPService> {
    return this.memStorage.updateService(id, updates);
  }

  async getToolsByService(serviceId: string): Promise<MCPTool[]> {
    return this.memStorage.getToolsByService(serviceId);
  }

  async createTool(tool: InsertMCPTool): Promise<MCPTool> {
    return this.memStorage.createTool(tool);
  }

  async updateTool(id: string, updates: Partial<MCPTool>): Promise<MCPTool> {
    return this.memStorage.updateTool(id, updates);
  }
}

export const storage = new HybridStorage();
