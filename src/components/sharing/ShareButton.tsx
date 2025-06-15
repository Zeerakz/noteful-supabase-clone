
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { ShareDialog } from './ShareDialog';

interface ShareButtonProps {
  blockId: string;
  workspaceId: string;
}

export function ShareButton({ blockId, workspaceId }: ShareButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
      <ShareDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        blockId={blockId}
        workspaceId={workspaceId}
      />
    </>
  );
}
