
import React from 'react';
import { useDatabasePermissions, DatabasePermissionLevel } from '@/hooks/useDatabasePermissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  workspaceId: string;
  requiredPermission: 'canEditContent' | 'canModifySchema' | 'canManageViews' | 'canDeleteRows' | 'canAddRows';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
}

export function PermissionGate({
  workspaceId,
  requiredPermission,
  children,
  fallback = null,
  showTooltip = true,
  tooltipMessage
}: PermissionGateProps) {
  const { permissions, loading } = useDatabasePermissions(workspaceId);

  if (loading) {
    return <div className="opacity-50">{children}</div>;
  }

  const hasPermission = permissions[requiredPermission];

  if (!hasPermission) {
    if (showTooltip) {
      const defaultMessage = getDefaultTooltipMessage(requiredPermission, permissions.permissionLevel);
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <div className="opacity-30 cursor-not-allowed">
                  {children}
                </div>
                <Lock className="h-3 w-3 absolute top-1 right-1 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipMessage || defaultMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return fallback;
  }

  return <>{children}</>;
}

function getDefaultTooltipMessage(
  permission: string, 
  currentLevel: DatabasePermissionLevel
): string {
  const permissionMessages = {
    canEditContent: "You need 'Can edit content' permission or higher to modify values",
    canModifySchema: "You need 'Full access' permission to modify database schema",
    canManageViews: "You need 'Full access' permission to manage views",
    canDeleteRows: "You need 'Can edit content' permission or higher to delete rows",
    canAddRows: "You need 'Can edit content' permission or higher to add rows"
  };

  return permissionMessages[permission as keyof typeof permissionMessages] || 
    "You don't have permission to perform this action";
}
