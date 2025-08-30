"use client";

import { useState, useEffect } from "react";
import {
  Server,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveServiceConfig, loadServiceConfig, saveConfiguredServer } from "@/utils/mcp-storage";
import { MCPHttpConfig } from "@shared/mcp-types";

interface ConnectionStatus {
  isTesting: boolean;
  lastTestSuccess?: boolean;
  lastTestError?: string;
  lastTestTools?: unknown[];
}

interface ServerConfigurationProps {
  onServerAdded?: (server: { id: string; name: string; config: MCPHttpConfig; tools: unknown[] }) => void;
}

export function ServerConfiguration({ onServerAdded }: ServerConfigurationProps) {
  const [isClient, setIsClient] = useState(false);

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isTesting: false,
  });

  // Form fields
  const [serverName, setServerName] = useState("");
  const [url, setUrl] = useState("");
  const [bearerToken, setBearerToken] = useState("");

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Render placeholder during server-side rendering and initial client mount
  if (!isClient) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleConnect = async () => {
    setConnectionStatus({ isTesting: true });

    // Build current config
    const config: MCPHttpConfig = {
      url: url || "",
      ...(bearerToken && { bearerToken }),
    };

    try {
      // Test the connection via API
      const response = await fetch('/api/mcp/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (result.success) {
        const newServer = {
          id: serverName.toLowerCase().replace(/\s+/g, '-') || 'server-' + Date.now(),
          name: serverName || 'MCP Server',
          config,
          tools: result.tools || []
        };

        // Save configuration to localStorage
        saveConfiguredServer(newServer);

        setConnectionStatus({
          isTesting: false,
          lastTestSuccess: true,
          lastTestTools: result.tools,
        });

        // Notify parent component
        if (onServerAdded) {
          onServerAdded(newServer);
        }

        // Clear form after successful connection
        setServerName("");
        setUrl("");
        setBearerToken("");
      } else {
        setConnectionStatus({
          isTesting: false,
          lastTestSuccess: false,
          lastTestError: result.error || "Connection failed",
        });
      }
    } catch (error) {
      setConnectionStatus({
        isTesting: false,
        lastTestSuccess: false,
        lastTestError:
          error instanceof Error ? error.message : "Connection failed",
      });
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Server className="text-gray-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">
            Server Configuration
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          {connectionStatus.lastTestSuccess && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-green-600 font-medium">
                Last test: OK ({connectionStatus.lastTestTools?.length || 0} tools)
              </span>
            </div>
          )}

          {/* Test Connection Button */}
          <Button
            onClick={handleConnect}
            disabled={connectionStatus.isTesting || !url || !serverName}
            variant={connectionStatus.lastTestSuccess ? "secondary" : "default"}
            size="sm"
            className="px-4 py-2"
          >
            {connectionStatus.isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : connectionStatus.lastTestSuccess ? (
              "Test Again"
            ) : (
              "Test"
            )}
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4">
        {/* Connection Error Message */}
        {connectionStatus.lastTestError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700 font-medium">
                Connection Test Failed
              </span>
            </div>
            <div className="text-sm text-red-600 mt-1">
              {connectionStatus.lastTestError}
            </div>
          </div>
        )}

        {/* Server Name */}
        <div>
          <Label htmlFor="server-name" className="text-sm font-medium text-gray-700 mb-1 block">
            Server Name
          </Label>
          <Input
            id="server-name"
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            placeholder="Enter server name (e.g., GitHub, Notion)"
            className="w-full"
            data-testid="input-server-name"
          />
        </div>

        {/* URL and Token Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Server URL */}
          <div>
            <Label htmlFor="mcp-url" className="text-sm font-medium text-gray-700 mb-1 block">
              Server URL
            </Label>
            <Input
              id="mcp-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.github.com/mcp"
              className="w-full"
              data-testid="input-mcp-url"
            />
          </div>

          {/* Bearer Token */}
          <div>
            <Label htmlFor="mcp-token" className="text-sm font-medium text-gray-700 mb-1 block">
              Bearer Token
            </Label>
            <Input
              id="mcp-token"
              type="password"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full"
              data-testid="input-mcp-token"
            />
          </div>
        </div>
      </div>
    </div>
  );
}