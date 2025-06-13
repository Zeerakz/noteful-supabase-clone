
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PagesSidebar } from '@/components/sidebar/PagesSidebar';
import { Separator } from '@/components/ui/separator';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { SkipToContent } from '@/components/accessibility/SkipToContent';
import { MobileNavigationDrawer, MobileNavigationToggle } from '@/components/ui/mobile-navigation-drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutWithSidebarProps {
  children: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

export function AppLayoutWithSidebar({ children, breadcrumbs }: AppLayoutWithSidebarProps) {
  const isMobile = useIsMobile();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  // Close drawer when an item is selected (for mobile)
  const handleNavigationItemSelect = React.useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile]);

  return (
    <SidebarProvider>
      <div className="min-h-screen max-h-screen flex w-full overflow-hidden">
        {/* Skip to content link - first focusable element */}
        <SkipToContent />
        
        {/* Desktop Sidebar */}
        {!isMobile && <PagesSidebar />}
        
        {/* Mobile Navigation Drawer */}
        <MobileNavigationDrawer
          isOpen={mobileDrawerOpen}
          onOpenChange={setMobileDrawerOpen}
        >
          <PagesSidebar onNavigationItemSelect={handleNavigationItemSelect} />
        </MobileNavigationDrawer>

        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className={cn(
            "flex h-16 shrink-0 items-center gap-2 border-b px-4",
            "bg-background border-border"
          )}>
            {/* Mobile hamburger or desktop sidebar trigger */}
            {isMobile ? (
              <MobileNavigationToggle 
                onToggle={() => setMobileDrawerOpen(true)}
              />
            ) : (
              <SidebarTrigger className={cn(
                "-ml-1 sidebar-trigger sidebar-focus-ring",
                "hover:bg-sidebar-accent focus-visible:bg-sidebar-accent"
              )} />
            )}
            
            <Separator orientation="vertical" className="mr-2 h-4 bg-sidebar-border" />
            <div className="ml-auto">
              <div className="sidebar-focus-ring">
                <DarkModeToggle />
              </div>
            </div>
          </header>
          <main 
            id="main-content" 
            className="flex-1 min-h-0 overflow-hidden"
            role="main"
            aria-label="Main content"
          >
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
