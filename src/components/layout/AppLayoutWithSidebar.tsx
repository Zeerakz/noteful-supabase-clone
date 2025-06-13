
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PagesSidebar } from '@/components/sidebar/PagesSidebar';
import { Separator } from '@/components/ui/separator';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';

interface AppLayoutWithSidebarProps {
  children: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

export function AppLayoutWithSidebar({ children, breadcrumbs }: AppLayoutWithSidebarProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen max-h-screen flex w-full overflow-hidden">
        <PagesSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {crumb.href ? (
                      <a href={crumb.href} className="hover:text-foreground">
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-foreground">{crumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && <span>/</span>}
                  </React.Fragment>
                ))}
              </div>
            )}
            <div className="ml-auto">
              <DarkModeToggle />
            </div>
          </header>
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
