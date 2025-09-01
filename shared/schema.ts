import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const mcpServices = pgTable("mcp_services", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  url: text("url"),
  token: text("token"),
  connected: boolean("connected").default(false),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mcpTools = pgTable("mcp_tools", {
  id: varchar("id").primaryKey(),
  serviceId: varchar("service_id").notNull().references(() => mcpServices.id),
  name: text("name").notNull(),
  description: text("description"),
  riskLevel: text("risk_level").notNull(),
  selected: boolean("selected").default(false),
  config: jsonb("config").default({}),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'user' | 'assistant'
  timestamp: timestamp("timestamp").defaultNow(),
  userId: varchar("user_id"),
  attachedFiles: jsonb("attached_files").default([]),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMCPServiceSchema = createInsertSchema(mcpServices).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertMCPToolSchema = createInsertSchema(mcpTools);

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
}).extend({
  attachedFiles: z.array(z.any()).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MCPService = typeof mcpServices.$inferSelect;
export type InsertMCPService = z.infer<typeof insertMCPServiceSchema>;
export type MCPTool = typeof mcpTools.$inferSelect;
export type InsertMCPTool = z.infer<typeof insertMCPToolSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect & {
  attachedFiles?: any[];
};
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
