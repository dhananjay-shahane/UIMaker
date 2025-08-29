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
    // Create sample services
    const githubService: MCPService = {
      id: "github",
      name: "GitHub",
      description: "Version control and code collaboration",
      icon: "github",
      url: "https://api.github.com/mcp",
      token: "ghp_****************************",
      connected: true,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const jiraService: MCPService = {
      id: "jira",
      name: "Jira",
      description: "Project and issue tracking",
      icon: "list",
      url: null,
      token: null,
      connected: false,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const confluenceService: MCPService = {
      id: "confluence",
      name: "Confluence",
      description: "Team collaboration and documentation",
      icon: "book",
      url: null,
      token: null,
      connected: false,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const slackService: MCPService = {
      id: "slack",
      name: "Slack",
      description: "Team communication",
      icon: "message-square",
      url: null,
      token: null,
      connected: false,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const databaseService: MCPService = {
      id: "database",
      name: "Database",
      description: "Database operations",
      icon: "database",
      url: null,
      token: null,
      connected: false,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const cloudService: MCPService = {
      id: "cloud",
      name: "Cloud Services",
      description: "Cloud infrastructure management",
      icon: "cloud",
      url: null,
      token: null,
      connected: false,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.services.set("github", githubService);
    this.services.set("jira", jiraService);
    this.services.set("confluence", confluenceService);
    this.services.set("slack", slackService);
    this.services.set("database", databaseService);
    this.services.set("cloud", cloudService);

    // Create GitHub tools
    const githubTools: MCPTool[] = [
      {
        id: "github_create_issue",
        serviceId: "github",
        name: "GITHUB_CREATE_AN_ISSUE",
        description: "Creates a new issue in a github repository, requiring the repository to exist and have issues enabled; fields like assignees, milestone, or labels may require post-access.",
        riskLevel: "high",
        selected: true,
        config: {},
      },
      {
        id: "github_create_pr",
        serviceId: "github",
        name: "GITHUB_CREATE_A_PULL_REQUEST",
        description: "Creates a pull request in a github repository, requiring existing base and head branches. VSA or head must be provided.",
        riskLevel: "medium",
        selected: true,
        config: {},
      },
      {
        id: "github_get_pr",
        serviceId: "github",
        name: "GITHUB_GET_A_PULL_REQUEST",
        description: "Retrieves a specific pull request from a github repository using its owner, repository name, and pull request number.",
        riskLevel: "low",
        selected: true,
        config: {},
      },
      {
        id: "github_list_branches",
        serviceId: "github",
        name: "GITHUB_LIST_BRANCHES",
        description: "List branches for an existing github repository, with an option to filter by protection status.",
        riskLevel: "low",
        selected: true,
        config: {},
      },
      {
        id: "github_list_commits",
        serviceId: "github",
        name: "GITHUB_LIST_COMMITS",
        description: "Lists commits for a repository with optional filtering by author, since date, until date, and path.",
        riskLevel: "low",
        selected: true,
        config: {},
      },
    ];

    githubTools.forEach(tool => this.tools.set(tool.id, tool));
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
