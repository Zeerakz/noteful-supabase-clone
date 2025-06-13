
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, User, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PeoplePropertyConfig } from '@/types/property';
import { usePeopleSearch } from '@/hooks/usePeopleSearch';
import { usePeopleResolver } from '@/hooks/usePeopleResolver';
import { cn } from '@/lib/utils';

interface PeopleFieldEditorProps {
  value: any;
  config: PeoplePropertyConfig;
  onChange: (value: any) => void;
  field?: any;
  workspaceId?: string;
  pageId?: string;
}

export function PeopleFieldEditor({ 
  value, 
  config, 
  onChange, 
  workspaceId 
}: PeopleFieldEditorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  
  const { searchUsers, isLoading, results } = usePeopleSearch(workspaceId);
  const { resolveUsers } = usePeopleResolver();

  // Load selected users on mount
  useEffect(() => {
    if (!value || value.trim() === '') {
      setSelectedUsers([]);
      return;
    }

    const userIds = config.allowMultiple 
      ? value.split(',').filter((id: string) => id.trim())
      : [value.trim()];

    resolveUsers(userIds).then(setSelectedUsers);
  }, [value, config.allowMultiple, resolveUsers]);

  // Trigger search when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery, config.roles);
    }
  }, [searchQuery, searchUsers, config.roles]);

  const handleSelectUser = (user: any) => {
    if (config.allowMultiple) {
      const isSelected = selectedUsers.some(u => u.id === user.id);
      let newSelection;
      
      if (isSelected) {
        newSelection = selectedUsers.filter(u => u.id !== user.id);
      } else {
        newSelection = [...selectedUsers, user];
      }
      
      setSelectedUsers(newSelection);
      onChange(newSelection.map(u => u.id).join(','));
    } else {
      setSelectedUsers([user]);
      onChange(user.id);
      setOpen(false);
    }
    setSearchQuery('');
  };

  const handleRemoveUser = (userId: string) => {
    if (config.allowMultiple) {
      const newSelection = selectedUsers.filter(u => u.id !== userId);
      setSelectedUsers(newSelection);
      onChange(newSelection.map(u => u.id).join(','));
    } else {
      setSelectedUsers([]);
      onChange('');
    }
  };

  const handleAddGuest = () => {
    if (!guestEmail.trim()) return;
    
    const guestUser = {
      id: `guest_${Date.now()}`,
      email: guestEmail.trim(),
      name: guestEmail.trim(),
      isGuest: true,
      avatar_url: null
    };

    if (config.allowMultiple) {
      const newSelection = [...selectedUsers, guestUser];
      setSelectedUsers(newSelection);
      onChange(newSelection.map(u => u.id).join(','));
    } else {
      setSelectedUsers([guestUser]);
      onChange(guestUser.id);
    }

    setGuestEmail('');
    setShowGuestInput(false);
    setOpen(false);
  };

  const displayText = () => {
    if (selectedUsers.length === 0) {
      return config.allowMultiple ? 'Select people...' : 'Select person...';
    }
    
    if (config.allowMultiple) {
      return `${selectedUsers.length} person${selectedUsers.length !== 1 ? 's' : ''} selected`;
    }
    
    return selectedUsers[0].name || selectedUsers[0].email;
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent border-none shadow-none hover:bg-muted/50 focus-visible:ring-1"
          >
            <div className="flex items-center gap-2 flex-1 text-left">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "truncate",
                selectedUsers.length === 0 && "text-muted-foreground"
              )}>
                {displayText()}
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={`Search ${config.restrictToWorkspace ? 'workspace members' : 'people'}...`}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="py-6 text-center text-sm">Searching...</div>
                ) : (
                  <div className="py-6 text-center text-sm">
                    No people found.
                    {config.allowExternal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8"
                        onClick={() => setShowGuestInput(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add guest by email
                      </Button>
                    )}
                  </div>
                )}
              </CommandEmpty>
              
              {showGuestInput && (
                <div className="p-3 border-b">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGuest();
                        }
                      }}
                    />
                    <Button size="sm" onClick={handleAddGuest}>
                      Add
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setShowGuestInput(false);
                        setGuestEmail('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <CommandGroup>
                {results.map((user) => {
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  
                  return (
                    <CommandItem
                      key={user.id}
                      value={user.email}
                      onSelect={() => handleSelectUser(user)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback className="text-xs">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm">{user.name || user.email}</span>
                        {user.name && user.email && (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                      {user.role && (
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {config.allowExternal && !showGuestInput && results.length > 0 && (
                <CommandGroup>
                  <CommandItem onSelect={() => setShowGuestInput(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add guest by email
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected users display for multiple selection */}
      {config.allowMultiple && selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedUsers.map((user) => (
            <Badge 
              key={user.id} 
              variant="secondary" 
              className="flex items-center gap-1 px-2 py-1"
            >
              <Avatar className="h-4 w-4">
                <AvatarImage src={user.avatar_url} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{user.name || user.email}</span>
              {user.isGuest && (
                <span className="text-xs text-muted-foreground">(Guest)</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => handleRemoveUser(user.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
