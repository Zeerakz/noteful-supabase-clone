
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface SidePeekPageProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SidePeekPage({ isOpen, onOpenChange }: SidePeekPageProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[clamp(50vw,_800px,_90vw)] sm:w-[clamp(50vw,_800px,_90vw)] sm:max-w-none">
        <SheetHeader>
          <SheetTitle>Side Peek Page Title</SheetTitle>
          <SheetDescription>
            This is where a description or page metadata could go.
          </SheetDescription>
        </SheetHeader>
        <div className="py-8">
          <p>Placeholder for the main content of the peeked page.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
