import React, { useState, useCallback, useEffect } from "react";
import { LeftSidebar } from "@/components/left-sidebar";
import { MainContent } from "@/components/main-content";
import { PermissionModal } from "@/components/permission-modal";
import { useMCPClient } from "@/hooks/use-mcp-client";

export function MCPClient() {
  const mcpClient = useMCPClient();
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 500) {
      mcpClient.setSidebarWidth(newWidth);
    }
  }, [isResizing, mcpClient.setSidebarWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <LeftSidebar 
        {...mcpClient}
        width={mcpClient.sidebarWidth}
      />
      
      {/* Resize Handle */}
      <div 
        className="w-1 bg-transparent hover:bg-primary cursor-col-resize select-none transition-colors"
        onMouseDown={handleMouseDown}
        data-testid="resize-handle"
      />
      
      <MainContent {...mcpClient} />
      
      {mcpClient.permissionRequest && (
        <PermissionModal 
          request={mcpClient.permissionRequest}
          onApprove={mcpClient.approvePermission}
          onDeny={mcpClient.denyPermission}
        />
      )}
    </div>
  );
}
