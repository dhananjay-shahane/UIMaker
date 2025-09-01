import React from "react";
import { LeftSidebar } from "@/components/left-sidebar";
import { MainContent } from "@/components/main-content";
import { PermissionModal } from "@/components/permission-modal";
import { useMCPClient } from "@/hooks/use-mcp-client";

export function MCPClient() {
  const mcpClient = useMCPClient();

  return (
    <div className="main-container flex h-screen overflow-hidden bg-white dark:bg-gray-300 text-black dark:text-gray-800">
      {mcpClient.sidebarSide === 'left' && (
        <LeftSidebar 
          {...mcpClient}
          width={mcpClient.sidebarWidth}
          onWidthChange={mcpClient.setSidebarWidth}
          sidebarSide={mcpClient.sidebarSide}
          setSidebarSide={mcpClient.setSidebarSide}
        />
      )}
      
      <MainContent {...mcpClient} />
      
      {mcpClient.sidebarSide === 'right' && (
        <LeftSidebar 
          {...mcpClient}
          width={mcpClient.sidebarWidth}
          onWidthChange={mcpClient.setSidebarWidth}
          sidebarSide={mcpClient.sidebarSide}
          setSidebarSide={mcpClient.setSidebarSide}
        />
      )}
      
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
