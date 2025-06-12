
import React, { useEffect, useRef, useState } from 'react';

interface MasonryLayoutProps {
  children: React.ReactElement[];
  columns?: number;
  gap?: number;
}

export function MasonryLayout({ children, columns = 3, gap = 16 }: MasonryLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate responsive columns
  const getResponsiveColumns = () => {
    if (containerWidth < 640) return 1; // sm
    if (containerWidth < 768) return 2; // md
    if (containerWidth < 1024) return 3; // lg
    return Math.min(columns, 4); // xl and above
  };

  const responsiveColumns = getResponsiveColumns();
  const columnWidth = (containerWidth - gap * (responsiveColumns - 1)) / responsiveColumns;

  const getColumnHeights = () => new Array(responsiveColumns).fill(0);

  const arrangeItems = () => {
    const columnHeights = getColumnHeights();
    
    return children.map((child, index) => {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      const left = shortestColumnIndex * (columnWidth + gap);
      const top = columnHeights[shortestColumnIndex];

      // Estimate height (you might want to measure actual height)
      const estimatedHeight = 250; // Base height estimate
      columnHeights[shortestColumnIndex] += estimatedHeight + gap;

      return React.cloneElement(child, {
        key: child.key || index,
        style: {
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          width: `${columnWidth}px`,
          transition: 'all 0.3s ease',
        },
      });
    });
  };

  const totalHeight = containerWidth > 0 
    ? Math.max(...getColumnHeights().map((height, index) => {
        const items = children.filter((_, i) => i % responsiveColumns === index);
        return items.length * 266; // Estimated item height + gap
      }))
    : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${totalHeight}px` }}
    >
      {containerWidth > 0 && arrangeItems()}
    </div>
  );
}
