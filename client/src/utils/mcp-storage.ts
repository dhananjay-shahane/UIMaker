/**
 * Utility functions for localStorage management of MCP configurations
 */

import { MCPHttpConfig } from "@shared/mcp-types";

const STORAGE_PREFIX = 'mcp-client';

// Since we only support HTTP now, stored config is the same as the base config
export type StoredMCPConfig = MCPHttpConfig;

/**
 * Get storage key for a specific service
 */
function getStorageKey(serviceId: string): string {
  return `${STORAGE_PREFIX}-${serviceId}`;
}

/**
 * Save MCP configuration for a specific service
 */
export function saveServiceConfig(serviceId: string, config: StoredMCPConfig): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getStorageKey(serviceId);
    localStorage.setItem(key, JSON.stringify(config));
    console.log('💾 Saved MCP config for service:', serviceId);
  } catch (error) {
    console.error('Failed to save service config:', error);
  }
}

/**
 * Load MCP configuration for a specific service
 */
export function loadServiceConfig(serviceId: string): StoredMCPConfig | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const key = getStorageKey(serviceId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as StoredMCPConfig;
    }
  } catch (error) {
    console.error('Failed to load service config:', error);
  }
  return null;
}

/**
 * Remove MCP configuration for a specific service
 */
export function removeServiceConfig(serviceId: string): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const key = getStorageKey(serviceId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove service config:', error);
  }
}

/**
 * Get all saved service configurations
 */
export function getAllServiceConfigs(): Record<string, StoredMCPConfig> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {};
  }

  const configs: Record<string, StoredMCPConfig> = {};

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX + '-') && !key.includes('-tool-selection')) {
        const serviceId = key.replace(STORAGE_PREFIX + '-', '');
        const config = loadServiceConfig(serviceId);
        if (config) {
          configs[serviceId] = config;
        }
      }
    }
  } catch (error) {
    console.error('Failed to get all service configs:', error);
  }

  return configs;
}

/**
 * Tool selection state management
 */
const TOOL_SELECTION_KEY = `${STORAGE_PREFIX}-tool-selection`;

export interface ToolSelectionState {
  [toolId: string]: boolean; // toolId format: "serviceId:toolName"
}

/**
 * Save tool selection state
 */
export function saveToolSelection(toolSelections: ToolSelectionState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serialized = JSON.stringify(toolSelections);
    localStorage.setItem(TOOL_SELECTION_KEY, serialized);

    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: TOOL_SELECTION_KEY, newValue: serialized }
    }));
  } catch (error) {
    console.error('Failed to save tool selection:', error);
  }
}

/**
 * Load tool selection state
 */
export function loadToolSelection(): ToolSelectionState {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(TOOL_SELECTION_KEY);
    if (stored) {
      return JSON.parse(stored) as ToolSelectionState;
    }
  } catch (error) {
    console.error('Failed to load tool selection:', error);
  }

  return {};
}

/**
 * Toggle tool selection for a specific tool
 */
export function toggleToolSelection(serviceId: string, toolName: string): void {
  const toolId = `${serviceId}:${toolName}`;
  const currentSelection = loadToolSelection();
  const currentValue = currentSelection[toolId] ?? true; // Default to true if not set
  const newSelection = {
    ...currentSelection,
    [toolId]: !currentValue, // Toggle the current value
  };
  saveToolSelection(newSelection);
}

/**
 * Check if a tool is selected
 */
export function isToolSelected(serviceId: string, toolName: string): boolean {
  const toolId = `${serviceId}:${toolName}`;
  const selection = loadToolSelection();
  return selection[toolId] ?? true; // Default to true (selected) if not set
}

/**
 * Set tool selection for a specific tool
 */
export function setToolSelection(serviceId: string, toolName: string, selected: boolean): void {
  const toolId = `${serviceId}:${toolName}`;
  const currentSelection = loadToolSelection();
  const newSelection = {
    ...currentSelection,
    [toolId]: selected,
  };
  saveToolSelection(newSelection);
}

/**
 * Configured servers management
 */
const CONFIGURED_SERVERS_KEY = `${STORAGE_PREFIX}-configured-servers`;

export interface ConfiguredServer {
  id: string;
  name: string;
  config: StoredMCPConfig;
  tools: unknown[];
  createdAt: string;
}

/**
 * Save a configured server
 */
export function saveConfiguredServer(server: Omit<ConfiguredServer, 'createdAt'>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const configuredServers = loadConfiguredServers();
    const newServer: ConfiguredServer = {
      ...server,
      createdAt: new Date().toISOString()
    };
    
    // Remove existing server with same ID if it exists
    const updatedServers = configuredServers.filter(s => s.id !== server.id);
    updatedServers.push(newServer);
    
    localStorage.setItem(CONFIGURED_SERVERS_KEY, JSON.stringify(updatedServers));
    
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent('configuredServersChange', {
      detail: { servers: updatedServers }
    }));
  } catch (error) {
    console.error('Failed to save configured server:', error);
  }
}

/**
 * Load all configured servers
 */
export function loadConfiguredServers(): ConfiguredServer[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(CONFIGURED_SERVERS_KEY);
    if (stored) {
      return JSON.parse(stored) as ConfiguredServer[];
    }
  } catch (error) {
    console.error('Failed to load configured servers:', error);
  }

  return [];
}

/**
 * Remove a configured server
 */
export function removeConfiguredServer(serverId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const configuredServers = loadConfiguredServers();
    const updatedServers = configuredServers.filter(s => s.id !== serverId);
    
    localStorage.setItem(CONFIGURED_SERVERS_KEY, JSON.stringify(updatedServers));
    
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent('configuredServersChange', {
      detail: { servers: updatedServers }
    }));
  } catch (error) {
    console.error('Failed to remove configured server:', error);
  }
}