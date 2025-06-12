
import { useState, useEffect, useCallback } from 'react';

interface UseSlashMenuProps {
  onSelectCommand: (command: string) => void;
}

export function useSlashMenu({ onSelectCommand }: UseSlashMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openSlashMenu = useCallback((element: HTMLElement, term = '') => {
    const rect = element.getBoundingClientRect();
    setPosition({
      left: rect.left,
      top: rect.bottom + window.scrollY,
    });
    setTriggerElement(element);
    setSearchTerm(term);
    setIsOpen(true);
  }, []);

  const closeSlashMenu = useCallback(() => {
    setIsOpen(false);
    setTriggerElement(null);
    setSearchTerm('');
  }, []);

  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleSelectItem = useCallback((command: string) => {
    onSelectCommand(command);
    closeSlashMenu();
  }, [onSelectCommand, closeSlashMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && triggerElement && !triggerElement.contains(event.target as Node)) {
        closeSlashMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, triggerElement, closeSlashMenu]);

  return {
    isOpen,
    position,
    searchTerm,
    openSlashMenu,
    closeSlashMenu,
    updateSearchTerm,
    handleSelectItem,
  };
}
