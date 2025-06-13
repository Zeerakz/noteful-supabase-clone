
import { useState, useEffect, useMemo, useCallback } from 'react';

interface UseVirtualScrollingProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScrolling({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: UseVirtualScrollingProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + 2 * overscan);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);
  }, []);

  // Smooth scrolling utilities
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const element = document.querySelector('[data-virtual-scroll-container]') as HTMLDivElement;
    if (element) {
      const targetScrollTop = Math.max(0, Math.min(index * itemHeight, totalHeight - containerHeight));
      element.scrollTo({
        top: targetScrollTop,
        behavior
      });
    }
  }, [itemHeight, totalHeight, containerHeight]);

  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollToIndex(0, behavior);
  }, [scrollToIndex]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollToIndex(items.length - 1, behavior);
  }, [scrollToIndex, items.length]);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    isScrolledToTop: scrollTop === 0,
    isScrolledToBottom: scrollTop >= totalHeight - containerHeight
  };
}
