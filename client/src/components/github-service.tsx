import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, List, Github, CheckSquare, RotateCcw } from "lucide-react";
import type { MCPService } from "@/types/mcp";

interface GitHubServiceProps {
  service?: MCPService;
  selectedTools: Record<string, boolean>;
  onToggleToolSelection: (toolId: string, riskLevel: "low" | "medium" | "high") => void;
  onDeselectAll: () => void;
  onRefresh: () => void;
  onTestConnection: (serviceId: string) => void;
  onUpdateService: (data: { serviceId: string; config: any }) => void;
  isTesting: boolean;
}

export function GitHubService({
  service,
  selectedTools,
  onToggleToolSelection,
  onDeselectAll,
  onRefresh,
  onTestConnection,
  onUpdateService,
  isTesting
}: GitHubServiceProps) {
  const selectedCount = Object.values(selectedTools).filter(Boolean).length;
  const totalTools = service?.tools?.length || 0;

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6">
      {/* GitHub Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
          <Github className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-github-title">GitHub</h2>
          <p className="text-sm text-muted-foreground" data-testid="text-github-description">
            Version control and code collaboration
          </p>
        </div>
      </div>

      {/* Server Configuration */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium flex items-center gap-2">
            <Server className="h-4 w-4" />
            Server Configuration
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-500" data-testid="text-connection-status">
                Last test: OK ({totalTools} tools)
              </span>
            </div>
            <Button
              onClick={() => onTestConnection("github")}
              disabled={isTesting}
              data-testid="button-test-connection"
            >
              {isTesting ? "Testing..." : "Test Again"}
            </Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="server-url" className="text-sm font-medium mb-2">
                  Server URL
                </Label>
                <Input
                  id="server-url"
                  type="url"
                  defaultValue="https://api.github.com/mcp"
                  data-testid="input-server-url"
                />
              </div>
              <div>
                <Label htmlFor="bearer-token" className="text-sm font-medium mb-2">
                  Bearer Token
                </Label>
                <Input
                  id="bearer-token"
                  type="password"
                  defaultValue="ghp_****************************"
                  data-testid="input-bearer-token"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium flex items-center gap-2">
            <List className="h-4 w-4" />
            Available Actions
            <span className="text-xs text-muted-foreground" data-testid="text-selected-count">
              ({selectedCount}/{totalTools} selected)
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onDeselectAll}
              data-testid="button-deselect-all"
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Deselect All
            </Button>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground" data-testid="text-tools-available">
              {totalTools} tools available
            </span>
            <Button
              variant="outline"
              onClick={onRefresh}
              data-testid="button-refresh-tools"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {service?.tools?.map((tool) => (
            <Card key={tool.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={tool.id}
                    checked={selectedTools[tool.id] || false}
                    onCheckedChange={() => onToggleToolSelection(tool.id, tool.riskLevel)}
                    className="mt-1"
                    data-testid={`checkbox-tool-${tool.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm" data-testid={`text-tool-name-${tool.id}`}>
                            {tool.name}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRiskBadgeColor(tool.riskLevel)}`}
                            data-testid={`badge-risk-${tool.id}`}
                          >
                            {tool.riskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-tool-description-${tool.id}`}>
                          {tool.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="ml-4"
                        data-testid={`button-select-tool-${tool.id}`}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
