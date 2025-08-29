import { ServiceTabs } from "@/components/service-tabs";
import { GitHubService } from "@/components/github-service";
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
    <div className="flex-1 flex flex-col bg-background text-foreground">
      {/* Welcome Section */}
      <div className="p-8 border-b-2 border-border bg-card">
        <h1 className="text-2xl font-bold mb-3 text-foreground" data-testid="text-welcome-title">
          Welcome to MCP Client
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed" data-testid="text-welcome-description">
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
      <div className="flex-1 overflow-y-auto bg-background">
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
        
        {config.selectedService !== "github" && (
          <div className="p-6 bg-background">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2 text-foreground" data-testid="text-service-placeholder">
                {currentService?.name || "Service"} Configuration
              </h3>
              <p className="text-muted-foreground" data-testid="text-service-placeholder-description">
                This service configuration will be available in a future update.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
