"use client";

import { useState, useEffect } from "react";
import {
  Server,
  Globe,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Loader2,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { saveServiceConfig, loadServiceConfig } from "@/utils/mcp-storage";
import { MCPHttpConfig } from "@shared/mcp-types";

interface ConnectionStatus {
  isTesting: boolean;
  lastTestSuccess?: boolean;
  lastTestError?: string;
  lastTestTools?: unknown[];
}

interface ServerConfigurationProps {
  serviceId: string;
}

export function ServerConfiguration({ serviceId }: ServerConfigurationProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isTesting: false,
  });

  // HTTP fields
  const [url, setUrl] = useState("");
  const [bearerToken, setBearerToken] = useState("");

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load saved configuration on mount (only on client)
  useEffect(() => {
    if (!isClient) return;

    const savedConfig = loadServiceConfig(serviceId);
    if (savedConfig) {
      setUrl(savedConfig.url);
      setBearerToken(savedConfig.bearerToken || "");
    }
  }, [serviceId, isClient]);

  // Render placeholder during server-side rendering and initial client mount
  if (!isClient) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
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
        // Save configuration to localStorage
        saveServiceConfig(serviceId, config);

        setConnectionStatus({
          isTesting: false,
          lastTestSuccess: true,
          lastTestTools: result.tools,
        });
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

  const getPrefilledUrls = () => {
    return [
      { name: "GitHub", url: "https://api.githubcopilot.com/mcp" },
      { name: "Notion", url: "https://mcp.notion.com/sse" },
      { name: "Linear", url: "https://mcp.linear.app/sse" },
      { name: "Asana", url: "https://mcp.asana.com/sse" },
      { name: "Stripe", url: "https://mcp.stripe.com/" },
      { name: "Cloudflare Workers", url: "https://bindings.mcp.cloudflare.com/sse" },
      { name: "Vercel", url: "https://mcp.vercel.com/" },
      { name: "Find-A-Domain (Open)", url: "https://api.findadomain.dev/mcp" },
      { name: "Hugging Face (Open)", url: "https://hf.co/mcp" },
      { name: "Remote MCP (Open)", url: "https://mcp.remote-mcp.com" },
    ];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="text-primary" size={20} />
            <CardTitle className="text-lg">
              Server Configuration
            </CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {connectionStatus.isTesting ? (
                  <Loader2 className="w-3 h-3 text-primary animate-spin" />
                ) : connectionStatus.lastTestSuccess ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500" />
                )}
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus.lastTestSuccess
                      ? "bg-green-500"
                      : connectionStatus.isTesting
                      ? "bg-blue-500"
                      : "bg-red-500"
                  }`}
                ></div>
              </div>
              <span className="text-xs text-muted-foreground">
                {connectionStatus.isTesting
                  ? "Testing..."
                  : connectionStatus.lastTestSuccess
                  ? `Connected (${
                      connectionStatus.lastTestTools?.length || 0
                    } tools)`
                  : connectionStatus.lastTestError
                  ? "Failed"
                  : "Not tested"}
              </span>
            </div>

            {/* Test Connection Button */}
            <Button
              onClick={handleConnect}
              disabled={connectionStatus.isTesting || !url}
              variant={connectionStatus.lastTestSuccess ? "secondary" : "default"}
              size="sm"
            >
              {connectionStatus.isTesting
                ? "Testing..."
                : connectionStatus.lastTestSuccess
                ? "Test Again"
                : "Test Connection"}
            </Button>

            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              variant="ghost"
              size="sm"
            >
              {isCollapsed ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronUp size={16} />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Connection Error Message */}
          {connectionStatus.lastTestError && (
            <Alert variant="destructive">
              <WifiOff className="w-4 h-4" />
              <AlertDescription>
                <strong>Connection Test Failed</strong>
                <br />
                {connectionStatus.lastTestError}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick URLs */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Quick Select (Popular Servers)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {getPrefilledUrls().map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => setUrl(preset.url)}
                  className="justify-start text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* URL Configuration */}
          <div>
            <Label htmlFor="mcp-url" className="flex items-center gap-1 text-sm font-medium mb-2">
              <Globe className="w-4 h-4" />
              Server URL
            </Label>
            <Input
              id="mcp-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mcp.example.com/sse"
              data-testid="input-mcp-url"
            />
          </div>

          {/* Bearer Token Configuration */}
          <div>
            <Label htmlFor="mcp-token" className="flex items-center gap-1 text-sm font-medium mb-2">
              <Key className="w-4 h-4" />
              Bearer Token (Optional)
            </Label>
            <Input
              id="mcp-token"
              type="password"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              placeholder="Enter authentication token"
              data-testid="input-mcp-token"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Used for authentication with servers that require API keys
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}