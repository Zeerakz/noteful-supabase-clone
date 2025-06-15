
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { usePageData } from '@/hooks/usePageData';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PageBlocks } from '@/components/blocks/PageBlocks';
import { useSidePeek } from '@/hooks/useSidePeek';

interface SidePeekPageProps {
  pageId?: string;
  onOpenChange?: (open: boolean) => void;
}

export function SidePeekPage({ pageId: pageIdFromProp, onOpenChange: onOpenChangeFromProp }: SidePeekPageProps) {
  const { peekId: pageIdFromUrl, closePeek } = useSidePeek();

  const pageId = pageIdFromProp || pageIdFromUrl;

  const { pageData, loading, error, retry } = usePageData(pageId || undefined);

  const isOpen = !!pageId;

  const handleOpenChange = (open: boolean) => {
    onOpenChangeFromProp?.(open);

    if (!open) {
      if (pageIdFromUrl && !pageIdFromProp) {
        closePeek();
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <SheetHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </SheetHeader>
          <div className="mt-8 flex-grow overflow-y-auto">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </>
      );
    }

    if (error) {
      return (
        <>
          <SheetHeader>
            <SheetTitle>Error</SheetTitle>
            <SheetDescription>Could not load the page.</SheetDescription>
          </SheetHeader>
          <div className="mt-8 flex-grow overflow-y-auto">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={retry}>Try Again</Button>
          </div>
        </>
      );
    }

    if (pageData) {
      return (
        <>
          <SheetHeader>
            <SheetTitle>{(pageData.properties as any)?.title || 'Untitled'}</SheetTitle>
            <SheetDescription>
              In workspace: {pageData.workspace.name}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-8 flex-grow overflow-y-auto pr-6 -mr-6">
            <PageBlocks pageId={pageData.id} workspaceId={pageData.workspace.id} isEditable={false} />
          </div>
        </>
      );
    }
    
    return (
       <>
        <SheetHeader>
          <SheetTitle>Page Not Found</SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex-grow overflow-y-auto">
          <p>The requested page could not be found.</p>
        </div>
      </>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[clamp(50vw,_800px,_90vw)] sm:w-[clamp(50vw,_800px,_90vw)] sm:max-w-none flex flex-col">
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}
