
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

interface SidePeekPageProps {
  pageId?: string;
  onOpenChange?: (open: boolean) => void;
}

export function SidePeekPage({ pageId: pageIdFromProp, onOpenChange: onOpenChangeFromProp }: SidePeekPageProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const pageIdFromUrl = queryParams.get('peek');

  const pageId = pageIdFromProp || pageIdFromUrl;

  const { pageData, loading, error, retry } = usePageData(pageId || undefined);

  const isOpen = !!pageId;

  const handleOpenChange = (open: boolean) => {
    onOpenChangeFromProp?.(open);

    if (!open) {
      if (pageIdFromUrl && !pageIdFromProp) {
        const newParams = new URLSearchParams(location.search);
        newParams.delete('peek');
        navigate({ search: newParams.toString() }, { replace: true });
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
          <div className="py-8">
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
          <div className="py-8">
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
            <SheetTitle>{pageData.title}</SheetTitle>
            <SheetDescription>
              In workspace: {pageData.workspace.name}
            </SheetDescription>
          </SheetHeader>
          <div className="py-8">
            <p>Placeholder for the main content of the peeked page.</p>
          </div>
        </>
      );
    }
    
    return (
       <>
        <SheetHeader>
          <SheetTitle>Page Not Found</SheetTitle>
        </SheetHeader>
        <div className="py-8">
          <p>The requested page could not be found.</p>
        </div>
      </>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[clamp(50vw,_800px,_90vw)] sm:w-[clamp(50vw,_800px,_90vw)] sm:max-w-none">
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}
