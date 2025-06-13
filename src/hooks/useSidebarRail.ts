
import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

export function useSidebarRail() {
  const [isRailMode, setIsRailMode] = useState(false);
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkRailMode = () => {
      // Enable rail mode on tablet (md) but not on mobile or desktop
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsRailMode(!isMobile && isTablet);
      
      // Reset expansion when switching modes
      if (!isTablet) {
        setIsRailExpanded(false);
      }
    };

    checkRailMode();
    window.addEventListener('resize', checkRailMode);
    
    return () => window.removeEventListener('resize', checkRailMode);
  }, [isMobile]);

  const expandRail = () => {
    if (isRailMode) {
      setIsRailExpanded(true);
    }
  };

  const collapseRail = () => {
    if (isRailMode) {
      setIsRailExpanded(false);
    }
  };

  const toggleRail = () => {
    if (isRailMode) {
      setIsRailExpanded(prev => !prev);
    }
  };

  return {
    isRailMode,
    isRailExpanded,
    expandRail,
    collapseRail,
    toggleRail,
  };
}
