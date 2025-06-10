
import { useState, useEffect, useCallback } from 'react';

interface UseSlashMenuProps {
  onSelectCommand: (command: string) => void;
}

export function useSlashMenu({ onSelectCommand }: UseSlashMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const openSlashMenu = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setPosition({
      x: rect.left,
      y: rect.bottom,
    });
    setTriggerElement(element);
    setIsOpen(true);
  }, []);

  const closeSlashMenu = useCallback(() => {
    setIsOpen(false);
    setTriggerElement(null);
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
    openSlashMenu,
    closeSlashMenu,
    handleSelectItem,
  };
}
