
import React from 'react';
import { Settings, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface SystemActionsProps {
  onNavigationItemSelect?: () => void;
}

export function SystemActions({ onNavigationItemSelect }: SystemActionsProps) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onNavigationItemSelect?.();
  };

  const handleAction = (action: () => void) => {
    action();
    onNavigationItemSelect?.();
  };

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        onClick={() => handleAction(() => console.log('Settings clicked'))}
        className="w-full justify-start gap-2 px-2 py-1.5 h-auto text-sm sidebar-focus-ring"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Button>
      
      <Button
        variant="ghost"
        onClick={() => handleAction(() => console.log('Help clicked'))}
        className="w-full justify-start gap-2 px-2 py-1.5 h-auto text-sm sidebar-focus-ring"
        aria-label="Help"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Help</span>
      </Button>
      
      <Button
        variant="ghost"
        onClick={handleSignOut}
        className="w-full justify-start gap-2 px-2 py-1.5 h-auto text-sm text-destructive hover:text-destructive sidebar-focus-ring"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </Button>
    </div>
  );
}
