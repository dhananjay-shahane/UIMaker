import { ServiceTabs } from "@/components/service-tabs";
import { GitHubService } from "@/components/github-service";
import { ServerConfiguration } from "@/components/server-configuration";
import { ConfiguredServerView } from "@/components/configured-server-view";
import type { MCPService } from "@/types/mcp";
import { useState, useEffect } from "react";
import { loadConfiguredServers, type ConfiguredServer } from "@/utils/mcp-storage";

interface MainContentProps {
  config: any;
  services: MCPService[];
  updateConfig: (updates: any) => void;
  toggleToolSelection: (toolId: string, riskLevel: "low" | "medium" | "high") => void;
  deselectAllTools: (tools?: any[]) => void;
  refreshService: () => void;
  testConnection: (serviceId: string) => void;
  updateService: (data: { serviceId: string; config: any }) => void;
  isTesting: boolean;
}

export function MainContent({
  config,
  services,
  updateConfig,
  toggleToolSelection,
  deselectAllTools,
  refreshService,
  testConnection,
  updateService,
  isTesting
}: MainContentProps) {
  const [configuredServers, setConfiguredServers] = useState<ConfiguredServer[]>([]);

  // Load configured servers on mount and listen for changes
  useEffect(() => {
    const loadServers = () => {
      const servers = loadConfiguredServers();
      setConfiguredServers(servers);
    };

    loadServers();

    // Listen for storage changes
    const handleStorageChange = (event: any) => {
      if (event.detail?.key?.includes('configured-servers')) {
        loadServers();
      }
    };

    window.addEventListener('configuredServersChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('configuredServersChange', handleStorageChange);
    };
  }, []);

  const handleServerAdded = (server: any) => {
    setConfiguredServers(prev => [...prev.filter(s => s.id !== server.id), server]);
    // Switch to the newly added server
    updateConfig({ selectedService: server.id });
  };

  const handleRemoveServer = (serverId: string) => {
    setConfiguredServers(prev => prev.filter(s => s.id !== serverId));
    // Switch to configuration tab if the removed server was selected
    if (config.selectedService === serverId) {
      updateConfig({ selectedService: "configuration" });
    }
  };

  const currentService = services.find(s => s.id === config.selectedService);
  const currentConfiguredServer = configuredServers.find(s => s.id === config.selectedService);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-300 text-black dark:text-gray-800">
      {/* Welcome Section */}
      <div className="p-8 border-b-2 border-gray-200 dark:border-gray-400 bg-white dark:bg-gray-100">
        <h1 className="text-2xl font-bold mb-3 text-black dark:text-gray-800" data-testid="text-welcome-title">
          Welcome to MCP Client
        </h1>
        <p className="text-gray-600 dark:text-gray-700 text-base leading-relaxed" data-testid="text-welcome-description">
          Connect and interact with real Model Context Protocol servers. 
          Use the Configuration tab to add new servers, then select them from the tabs to view available tools.
        </p>
      </div>

      {/* Service Tabs */}
      <ServiceTabs
        services={[...services, ...configuredServers.map(server => ({
          id: server.id,
          name: server.name,
          description: `Connected MCP Server (${server.tools.length} tools)`,
          icon: "server",
          connected: true,
          tools: server.tools
        } as any))]}
        selectedService={config.selectedService}
        onSelectService={(serviceId: string) => updateConfig({ selectedService: serviceId })}
      />

      {/* Service Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-300 no-scrollbar">
        {config.selectedService === "configuration" && (
          <div className="p-6 bg-white dark:bg-gray-300">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 text-black dark:text-gray-800">
                  MCP Server Configuration
                </h2>
                <p className="text-gray-600 dark:text-gray-700">
                  Configure connections to real Model Context Protocol servers. Connect to services like GitHub, Notion, Linear, Stripe, and more.
                </p>
              </div>
              
              <ServerConfiguration onServerAdded={handleServerAdded} />
            </div>
          </div>
        )}

        {currentConfiguredServer && (
          <ConfiguredServerView
            server={currentConfiguredServer}
            selectedTools={config.selectedTools}
            onToggleToolSelection={toggleToolSelection}
            onDeselectAll={deselectAllTools}
            onRefresh={refreshService}
            onRemoveServer={handleRemoveServer}
          />
        )}
        
        {!currentConfiguredServer && config.selectedService !== "configuration" && (
          <div className="p-6 bg-white dark:bg-gray-300">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2 text-black dark:text-gray-800" data-testid="text-service-placeholder">
                No Server Configured
              </h3>
              <p className="text-gray-600 dark:text-gray-700" data-testid="text-service-placeholder-description">
                Use the Configuration tab to set up real MCP server connections.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
