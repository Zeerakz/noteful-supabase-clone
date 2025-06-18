
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface WorkspaceGeneralSettingsTabProps {
  workspaceId: string;
}

export function WorkspaceGeneralSettingsTab({ workspaceId }: WorkspaceGeneralSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Settings</CardTitle>
        <CardDescription>
          Manage general settings for your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">Coming Soon</h3>
            <p className="mt-1 text-sm text-muted-foreground">Global workspace settings will be available here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
