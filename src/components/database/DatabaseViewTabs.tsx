
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, List, Calendar, Kanban, FileText, Images, Clock } from 'lucide-react';
import { DatabaseViewType } from './DatabaseViewSelector';

export interface DatabaseViewTab {
  type: DatabaseViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DatabaseViewTabsProps {
  currentView: DatabaseViewType;
  onViewChange: (view: DatabaseViewType) => void;
  className?: string;
}

const DEFAULT_TABS: DatabaseViewTab[] = [
  { type: 'table', label: 'All Campaigns', icon: Table },
  { type: 'kanban', label: 'Campaign Board', icon: Kanban },
  { type: 'calendar', label: 'Campaign Calendar', icon: Calendar },
  { type: 'timeline', label: 'Timeline', icon: Clock },
];

export function DatabaseViewTabs({ 
  currentView, 
  onViewChange, 
  className = '' 
}: DatabaseViewTabsProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update active tab index when currentView changes
  useEffect(() => {
    const index = DEFAULT_TABS.findIndex(tab => tab.type === currentView);
    if (index !== -1) {
      setActiveTabIndex(index);
    }
  }, [currentView]);

  // Update indicator position when active tab changes
  useEffect(() => {
    const activeTab = tabsRef.current[activeTabIndex];
    if (activeTab && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTabIndex]);

  const handleTabClick = (tab: DatabaseViewTab, index: number) => {
    setActiveTabIndex(index);
    onViewChange(tab.type);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = index > 0 ? index - 1 : DEFAULT_TABS.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = index < DEFAULT_TABS.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = DEFAULT_TABS.length - 1;
        break;
      default:
        return;
    }

    const newTab = DEFAULT_TABS[newIndex];
    setActiveTabIndex(newIndex);
    onViewChange(newTab.type);
    tabsRef.current[newIndex]?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef}
        className="relative flex items-center bg-muted/30 rounded-lg p-1 border"
        role="tablist"
        aria-label="Database view tabs"
      >
        {/* Animated indicator */}
        <div
          className="absolute top-1 bottom-1 bg-background rounded-md shadow-sm transition-all duration-200 ease-out border"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {/* Tabs */}
        {DEFAULT_TABS.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTabIndex === index;
          
          return (
            <Button
              key={tab.type}
              ref={(el) => (tabsRef.current[index] = el)}
              variant="ghost"
              size="sm"
              role="tab"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.type}`}
              className={`
                relative z-10 h-9 px-4 gap-2 text-sm font-medium transition-colors duration-200
                hover:text-foreground focus-visible:outline-none focus-visible:ring-2 
                focus-visible:ring-ring focus-visible:ring-offset-0 rounded-md
                ${isActive 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
              onClick={() => handleTabClick(tab, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Screen reader helper */}
      <div className="sr-only" aria-live="polite">
        Current view: {DEFAULT_TABS[activeTabIndex]?.label}
      </div>
    </div>
  );
}
