import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { PermissionRequest } from "@/types/mcp";

interface PermissionModalProps {
  request: PermissionRequest;
  onApprove: () => void;
  onDeny: () => void;
}

export function PermissionModal({ request, onApprove, onDeny }: PermissionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" data-testid="modal-permission">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold" data-testid="text-permission-title">High Risk Action</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-permission-subtitle">
              This action requires your approval
            </p>
          </div>
        </div>
        
        <div className="bg-muted rounded-lg p-3 mb-4">
          <p className="text-sm" data-testid="text-permission-description">
            The AI wants to use {request.toolName}. {request.description}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onDeny}
            data-testid="button-deny-permission"
          >
            Deny
          </Button>
          <Button 
            className="flex-1"
            onClick={onApprove}
            data-testid="button-approve-permission"
          >
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
