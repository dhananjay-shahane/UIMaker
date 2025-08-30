"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Server, 
  Zap, 
  CheckCircle2, 
  Circle,
  Trash2,
  RefreshCw
} from "lucide-react";
import type { ConfiguredServer } from "@/utils/mcp-storage";
import { removeConfiguredServer } from "@/utils/mcp-storage";

interface ConfiguredServerViewProps {
  server: ConfiguredServer;
  selectedTools: Record<string, boolean>;
  onToggleToolSelection: (toolId: string, riskLevel: "low" | "medium" | "high") => void;
  onDeselectAll: () => void;
  onRefresh: () => void;
  onRemoveServer?: (serverId: string) => void;
}

export function ConfiguredServerView({
  server,
  selectedTools,
  onToggleToolSelection,
  onDeselectAll,
  onRefresh,
  onRemoveServer
}: ConfiguredServerViewProps) {
  const [tools, setTools] = useState(server.tools || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshTools = async () => {
    setIsLoading(true);
    try {
      // Fetch updated tools from the server
      const response = await fetch('/api/mcp/list-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(server.config),
      });

      const result = await response.json();
      if (result.success) {
        setTools(result.tools || []);
      }
    } catch (error) {
      console.error('Failed to refresh tools:', error);
    }
    setIsLoading(false);
  };

  // Refresh tools when server changes (for tab switching)
  useEffect(() => {
    setTools(server.tools || []);
    // Automatically refresh tools when switching to a new server tab
    handleRefreshTools();
  }, [server.id]);

  const handleRemoveServer = () => {
    removeConfiguredServer(server.id);
    if (onRemoveServer) {
      onRemoveServer(server.id);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-300">
      <div className="max-w-6xl mx-auto">
        {/* Server Info Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Server className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-black dark:text-gray-800">
                {server.name}
              </h2>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Connected • {tools.length} tools
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefreshTools}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Tools
            </Button>
            <Button
              onClick={handleRemoveServer}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Server
            </Button>
          </div>
        </div>

        {/* Server Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Server Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-700">URL:</span>
                <p className="font-mono text-blue-600 break-all">{server.config.url}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-700">Authentication:</span>
                <p className="text-gray-900 dark:text-gray-800">
                  {server.config.bearerToken ? "Bearer Token" : "None"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Tools */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="text-yellow-500" size={20} />
                Available Tools ({tools.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={onDeselectAll} 
                  variant="outline" 
                  size="sm"
                  data-testid="button-deselect-all"
                >
                  {Object.values(selectedTools).filter(Boolean).length === 0 ? 'Select All' : 'Deselect All'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tools.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-700">
                  No tools available for this server.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {tools.map((tool: any) => {
                  const toolId = `${server.id}:${tool.name}`;
                  const isSelected = selectedTools[toolId] ?? false;
                  const riskLevel = tool.riskLevel || "low";

                  return (
                    <div
                      key={tool.name}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => onToggleToolSelection(toolId, riskLevel as any)}
                      data-testid={`tool-${tool.name}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <CheckCircle2 className="text-blue-500" size={20} />
                          ) : (
                            <Circle className="text-gray-400" size={20} />
                          )}
                          <div>
                            <h4 className="font-medium text-black dark:text-gray-800">
                              {tool.name}
                            </h4>
                            {tool.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-700 mt-1">
                                {tool.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getRiskLevelColor(riskLevel)}`}
                            title={`Risk Level: ${riskLevel}`}
                          ></div>
                          <span className="text-xs text-gray-500 capitalize">
                            {riskLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}