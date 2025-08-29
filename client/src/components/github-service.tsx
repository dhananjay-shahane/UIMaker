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
    <div className="p-8 bg-background text-foreground">
      {/* GitHub Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center border">
          <Github className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground" data-testid="text-github-title">GitHub</h2>
          <p className="text-base text-muted-foreground" data-testid="text-github-description">
            Version control and code collaboration
          </p>
        </div>
      </div>

      {/* Server Configuration */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-3">
            <Server className="h-5 w-5" />
            Server Configuration
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-green-500 font-medium" data-testid="text-connection-status">
                Last test: OK ({totalTools} tools)
              </span>
            </div>
            <Button
              onClick={() => onTestConnection("github")}
              disabled={isTesting}
              variant="outline"
              data-testid="button-test-connection"
            >
              {isTesting ? "Testing..." : "Test Again"}
            </Button>
          </div>
        </div>
        
        <Card className="border-2 bg-card text-card-foreground">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="server-url" className="text-sm font-semibold text-foreground">
                  Server URL
                </Label>
                <Input
                  id="server-url"
                  type="url"
                  defaultValue="https://api.github.com/mcp"
                  className="h-11 bg-background border-input text-foreground"
                  data-testid="input-server-url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bearer-token" className="text-sm font-semibold text-foreground">
                  Bearer Token
                </Label>
                <Input
                  id="bearer-token"
                  type="password"
                  defaultValue="ghp_****************************"
                  className="h-11 bg-background border-input text-foreground"
                  data-testid="input-bearer-token"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-3">
            <List className="h-5 w-5" />
            Available Actions
            <Badge variant="secondary" className="text-sm font-medium" data-testid="text-selected-count">
              {selectedCount} selected
            </Badge>
          </h3>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onDeselectAll}
              data-testid="button-deselect-all"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Deselect All
            </Button>
            <span className="text-sm text-muted-foreground font-medium" data-testid="text-tools-available">
              {totalTools} tools available
            </span>
            <Button
              variant="outline"
              onClick={onRefresh}
              data-testid="button-refresh-tools"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {service?.tools?.map((tool) => (
            <Card key={tool.id} className="transition-all hover:shadow-md border-2 bg-card text-card-foreground">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={tool.id}
                    checked={selectedTools[tool.id] || false}
                    onCheckedChange={() => onToggleToolSelection(tool.id, tool.riskLevel)}
                    className="mt-1 h-5 w-5"
                    data-testid={`checkbox-tool-${tool.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-base text-foreground" data-testid={`text-tool-name-${tool.id}`}>
                            {tool.name}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-sm font-medium ${getRiskBadgeColor(tool.riskLevel)}`}
                            data-testid={`badge-risk-${tool.id}`}
                          >
                            {tool.riskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-tool-description-${tool.id}`}>
                          {tool.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-4 border-input bg-background text-foreground hover:bg-accent"
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