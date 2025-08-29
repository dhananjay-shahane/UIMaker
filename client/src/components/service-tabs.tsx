import { Button } from "@/components/ui/button";
import { 
  List, 
  Book, 
  Github, 
  MessageSquare, 
  Database, 
  Cloud 
} from "lucide-react";
import type { MCPService } from "@/types/mcp";

interface ServiceTabsProps {
  services: MCPService[];
  selectedService: string;
  onSelectService: (serviceId: string) => void;
}

const serviceIcons = {
  jira: List,
  confluence: Book,
  github: Github,
  slack: MessageSquare,
  database: Database,
  cloud: Cloud,
};

const serviceColors = {
  jira: "text-blue-500",
  confluence: "text-blue-600", 
  github: "text-foreground",
  slack: "text-purple-500",
  database: "text-green-500",
  cloud: "text-blue-400",
};

export function ServiceTabs({ services, selectedService, onSelectService }: ServiceTabsProps) {
  return (
    <div className="border-b-2 border-border bg-card">
      <div className="flex overflow-x-auto">
        {services.map((service) => {
          const Icon = serviceIcons[service.id as keyof typeof serviceIcons] || List;
          const colorClass = serviceColors[service.id as keyof typeof serviceColors] || "text-foreground";
          const isSelected = service.id === selectedService;
          
          return (
            <Button
              key={service.id}
              variant="ghost"
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap rounded-none border-b-2 transition-colors ${
                isSelected 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onSelectService(service.id)}
              data-testid={`tab-service-${service.id}`}
            >
              <Icon className={`h-4 w-4 ${colorClass}`} />
              <span>{service.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
