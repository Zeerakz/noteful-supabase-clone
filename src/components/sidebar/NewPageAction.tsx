
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/hooks/useWorkspaces';

interface NewPageActionProps {
  onSelect?: () => void;
}

export function NewPageAction({ onSelect }: NewPageActionProps) {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaces();

  const handleNewPage = () => {
    if (currentWorkspace) {
      navigate(`/workspace/${currentWorkspace.id}/new-page`);
      onSelect?.();
    }
  };

  return (
    <Button
      onClick={handleNewPage}
      variant="ghost"
      className="w-full justify-start gap-2 px-2 py-1.5 h-auto text-sm sidebar-focus-ring"
      disabled={!currentWorkspace}
      aria-label="Create new page"
    >
      <Plus className="h-4 w-4" />
      <span>New Page</span>
    </Button>
  );
}
