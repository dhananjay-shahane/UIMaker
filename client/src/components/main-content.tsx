import { ServiceTabs } from "@/components/service-tabs";
import { GitHubService } from "@/components/github-service";
import { ServerConfiguration } from "@/components/server-configuration";
import type { MCPService } from "@/types/mcp";

interface MainContentProps {
  config: any;
  services: MCPService[];
  updateConfig: (updates: any) => void;
  toggleToolSelection: (toolId: string, riskLevel: "low" | "medium" | "high") => void;
  deselectAllTools: () => void;
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
  const currentService = services.find(s => s.id === config.selectedService);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-300 text-black dark:text-gray-800">
      {/* Welcome Section */}
      <div className="p-8 border-b-2 border-gray-200 dark:border-gray-400 bg-white dark:bg-gray-100">
        <h1 className="text-2xl font-bold mb-3 text-black dark:text-gray-800" data-testid="text-welcome-title">
          Welcome to MCP Client
        </h1>
        <p className="text-gray-600 dark:text-gray-700 text-base leading-relaxed" data-testid="text-welcome-description">
          Connect and interact with various services through the Model Context Protocol. 
          Use the chat interface on the left to communicate with LLMs or manage services directly through the tabs below.
        </p>
      </div>

      {/* Service Tabs */}
      <ServiceTabs
        services={services}
        selectedService={config.selectedService}
        onSelectService={(serviceId: string) => updateConfig({ selectedService: serviceId })}
      />

      {/* Service Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-300 no-scrollbar">
        {config.selectedService === "github" && (
          <GitHubService
            service={currentService}
            selectedTools={config.selectedTools}
            onToggleToolSelection={toggleToolSelection}
            onDeselectAll={deselectAllTools}
            onRefresh={refreshService}
            onTestConnection={testConnection}
            onUpdateService={updateService}
            isTesting={isTesting}
          />
        )}

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
              
              <div className="grid gap-6">
                <ServerConfiguration serviceId="github" />
                <ServerConfiguration serviceId="notion" />
                <ServerConfiguration serviceId="linear" />
                <ServerConfiguration serviceId="stripe" />
                <ServerConfiguration serviceId="custom" />
              </div>
            </div>
          </div>
        )}
        
        {config.selectedService !== "github" && config.selectedService !== "configuration" && (
          <div className="p-6 bg-white dark:bg-gray-300">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2 text-black dark:text-gray-800" data-testid="text-service-placeholder">
                {currentService?.name || "Service"} Configuration
              </h3>
              <p className="text-gray-600 dark:text-gray-700" data-testid="text-service-placeholder-description">
                This service configuration will be available in a future update. 
                <br />
                Use the Configuration tab to set up real MCP server connections.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
