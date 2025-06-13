
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PagesSidebar } from '@/components/sidebar/PagesSidebar';
import { RailSidebar } from '@/components/sidebar/RailSidebar';
import { Separator } from '@/components/ui/separator';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { SkipToContent } from '@/components/accessibility/SkipToContent';
import { MobileNavigationDrawer, MobileNavigationToggle } from '@/components/ui/mobile-navigation-drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebarRail } from '@/hooks/useSidebarRail';
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
  const { isRailMode, isRailExpanded, expandRail, collapseRail } = useSidebarRail();

  // Close drawer when an item is selected (for mobile)
  const handleNavigationItemSelect = React.useCallback(() => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile]);

  // Handle rail collapse when clicking outside
  React.useEffect(() => {
    if (!isRailMode || !isRailExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      if (sidebar && !sidebar.contains(event.target as Node)) {
        collapseRail();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isRailMode, isRailExpanded, collapseRail]);

  return (
    <SidebarProvider>
      <div className="min-h-screen max-h-screen flex w-full overflow-hidden">
        {/* Skip to content link - first focusable element */}
        <SkipToContent />
        
        {/* Desktop/Tablet Sidebar */}
        {!isMobile && (
          <>
            {isRailMode ? (
              <div className={cn(
                "relative z-30 transition-all duration-300",
                isRailExpanded && "w-64"
              )}>
                {isRailExpanded ? (
                  <div className="absolute inset-0 bg-background border-r shadow-lg">
                    <PagesSidebar onNavigationItemSelect={handleNavigationItemSelect} />
                  </div>
                ) : (
                  <RailSidebar 
                    onNavigationItemSelect={handleNavigationItemSelect}
                    onExpand={expandRail}
                  />
                )}
              </div>
            ) : (
              <PagesSidebar onNavigationItemSelect={handleNavigationItemSelect} />
            )}
          </>
        )}
        
        {/* Mobile Navigation Drawer */}
        <MobileNavigationDrawer
          isOpen={mobileDrawerOpen}
          onOpenChange={setMobileDrawerOpen}
        >
          <PagesSidebar onNavigationItemSelect={handleNavigationItemSelect} />
        </MobileNavigationDrawer>

        <SidebarInset className={cn(
          "flex flex-col h-screen overflow-hidden transition-all duration-300",
          isRailMode && isRailExpanded && "ml-0"
        )}>
          <header className={cn(
            "flex h-16 shrink-0 items-center gap-2 border-b px-4",
            "bg-background border-border"
          )}>
            {/* Mobile hamburger or desktop sidebar trigger */}
            {isMobile ? (
              <MobileNavigationToggle 
                onToggle={() => setMobileDrawerOpen(true)}
              />
            ) : !isRailMode ? (
              <SidebarTrigger className={cn(
                "-ml-1 sidebar-trigger sidebar-focus-ring",
                "hover:bg-sidebar-accent focus-visible:bg-sidebar-accent"
              )} />
            ) : null}
            
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

        {/* Overlay for rail expanded state */}
        {isRailMode && isRailExpanded && (
          <div 
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={collapseRail}
          />
        )}
      </div>
    </SidebarProvider>
  );
}
