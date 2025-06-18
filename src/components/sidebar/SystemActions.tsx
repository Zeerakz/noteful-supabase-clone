
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsAndMembersLink } from './SettingsAndMembersLink';

export function SystemActions() {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="mt-auto p-2 border-t space-y-2">
            <SettingsAndMembersLink />
            
            {/* User info and logout section */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{user?.email}</span>
                </div>
                
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
