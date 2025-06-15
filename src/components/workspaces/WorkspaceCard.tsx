
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Workspace } from '@/hooks/useWorkspaces';
import { useAuth } from '@/contexts/AuthContext';

interface WorkspaceCardProps {
  workspace: Workspace;
  onDelete: (workspaceId: string, workspaceName: string) => void;
}

export function WorkspaceCard({ workspace, onDelete }: WorkspaceCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{workspace.name}</CardTitle>
            {workspace.description && (
              <CardDescription className="mt-2">
                {workspace.description}
              </CardDescription>
            )}
          </div>
          {workspace.owner_user_id === user?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(workspace.id, workspace.name)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>
              {workspace.owner_user_id === user?.id ? 'Owner' : 'Member'}
            </span>
            {workspace.is_public && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Public
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/workspace/${workspace.id}`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
