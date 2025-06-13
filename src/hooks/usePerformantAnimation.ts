
import { useCallback, useEffect, useRef, useState } from 'react';

interface AnimationOptions {
  duration?: number;
  easing?: string;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
  onStart?: () => void;
  onComplete?: () => void;
}

interface AnimationState {
  isAnimating: boolean;
  isVisible: boolean;
}

/**
 * Hook for performant animations using hardware-accelerated CSS properties
 * Only uses transform and opacity, JavaScript only toggles CSS classes
 */
export function usePerformantAnimation<T extends HTMLElement = HTMLElement>() {
  const elementRef = useRef<T>(null);
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    isVisible: false,
  });

  // Toggle visibility with hardware-accelerated animation
  const toggleVisibility = useCallback((visible: boolean, options?: AnimationOptions) => {
    const element = elementRef.current;
    if (!element) return;

    setAnimationState(prev => ({ ...prev, isAnimating: true }));
    
    // Call onStart callback
    options?.onStart?.();

    // Apply CSS classes for hardware-accelerated animation
    element.classList.add('animate-hw');
    
    if (visible) {
      element.classList.remove('fade-out', 'scale-out');
      element.classList.add('fade-in', 'scale-in');
    } else {
      element.classList.remove('fade-in', 'scale-in');
      element.classList.add('fade-out', 'scale-out');
    }

    // Set up animation completion listener
    const handleAnimationEnd = () => {
      setAnimationState({
        isAnimating: false,
        isVisible: visible,
      });
      
      // Clean up animation classes
      element.classList.remove('animate-hw');
      options?.onComplete?.();
      
      element.removeEventListener('transitionend', handleAnimationEnd);
    };

    element.addEventListener('transitionend', handleAnimationEnd);

    // Fallback timeout in case transitionend doesn't fire
    setTimeout(handleAnimationEnd, options?.duration || 300);
  }, []);

  // Slide animation (horizontal)
  const slideHorizontal = useCallback((direction: 'left' | 'right', visible: boolean, options?: AnimationOptions) => {
    const element = elementRef.current;
    if (!element) return;

    setAnimationState(prev => ({ ...prev, isAnimating: true }));
    options?.onStart?.();

    element.classList.add('slide-animate');
    
    if (visible) {
      element.classList.remove(`slide-out-${direction}`);
      element.classList.add(`slide-in-${direction === 'left' ? 'right' : 'left'}`);
    } else {
      element.classList.remove(`slide-in-${direction === 'left' ? 'right' : 'left'}`);
      element.classList.add(`slide-out-${direction}`);
    }

    const handleAnimationEnd = () => {
      setAnimationState({
        isAnimating: false,
        isVisible: visible,
      });
      
      element.classList.remove('slide-animate');
      options?.onComplete?.();
      element.removeEventListener('transitionend', handleAnimationEnd);
    };

    element.addEventListener('transitionend', handleAnimationEnd);
    setTimeout(handleAnimationEnd, options?.duration || 300);
  }, []);

  // Scale animation
  const scale = useCallback((visible: boolean, options?: AnimationOptions) => {
    const element = elementRef.current;
    if (!element) return;

    setAnimationState(prev => ({ ...prev, isAnimating: true }));
    options?.onStart?.();

    element.classList.add('scale-animate');
    
    if (visible) {
      element.classList.remove('scale-out');
      element.classList.add('scale-in');
    } else {
      element.classList.remove('scale-in');
      element.classList.add('scale-out');
    }

    const handleAnimationEnd = () => {
      setAnimationState({
        isAnimating: false,
        isVisible: visible,
      });
      
      element.classList.remove('scale-animate');
      options?.onComplete?.();
      element.removeEventListener('transitionend', handleAnimationEnd);
    };

    element.addEventListener('transitionend', handleAnimationEnd);
    setTimeout(handleAnimationEnd, options?.duration || 200);
  }, []);

  // Accordion expand/collapse
  const accordion = useCallback((expanded: boolean, options?: AnimationOptions) => {
    const element = elementRef.current;
    if (!element) return;

    setAnimationState(prev => ({ ...prev, isAnimating: true }));
    options?.onStart?.();

    element.classList.add('accordion-animate');
    
    if (expanded) {
      element.classList.remove('accordion-collapsed');
      element.classList.add('accordion-expanded');
    } else {
      element.classList.remove('accordion-expanded');
      element.classList.add('accordion-collapsed');
    }

    const handleAnimationEnd = () => {
      setAnimationState({
        isAnimating: false,
        isVisible: expanded,
      });
      
      element.classList.remove('accordion-animate');
      options?.onComplete?.();
      element.removeEventListener('transitionend', handleAnimationEnd);
    };

    element.addEventListener('transitionend', handleAnimationEnd);
    setTimeout(handleAnimationEnd, options?.duration || 300);
  }, []);

  // Apply hover animations
  const applyHoverAnimation = useCallback((type: 'menu-item' | 'button' | 'tooltip') => {
    const element = elementRef.current;
    if (!element) return;

    element.classList.add(`${type}-animate`);

    const handleMouseEnter = () => {
      element.classList.add(`${type}-hover`);
    };

    const handleMouseLeave = () => {
      element.classList.remove(`${type}-hover`);
    };

    const handleMouseDown = () => {
      if (type === 'button') {
        element.classList.add('button-press');
      }
    };

    const handleMouseUp = () => {
      if (type === 'button') {
        element.classList.remove('button-press');
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);

    // Return cleanup function
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Focus ring animation
  const focusRing = useCallback((visible: boolean) => {
    const element = elementRef.current;
    if (!element) return;

    element.classList.add('focus-ring-animate');
    
    if (visible) {
      element.classList.remove('focus-ring-hidden');
      element.classList.add('focus-ring-visible');
    } else {
      element.classList.remove('focus-ring-visible');
      element.classList.add('focus-ring-hidden');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const element = elementRef.current;
      if (element) {
        // Remove all animation classes
        const animationClasses = [
          'animate-hw', 'fade-in', 'fade-out', 'scale-in', 'scale-out',
          'slide-animate', 'slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right',
          'accordion-animate', 'accordion-expanded', 'accordion-collapsed',
          'menu-item-animate', 'menu-item-hover', 'button-animate', 'button-hover', 'button-press',
          'tooltip-animate', 'tooltip-enter', 'tooltip-exit',
          'focus-ring-animate', 'focus-ring-visible', 'focus-ring-hidden'
        ];
        
        element.classList.remove(...animationClasses);
      }
    };
  }, []);

  return {
    elementRef,
    animationState,
    toggleVisibility,
    slideHorizontal,
    scale,
    accordion,
    applyHoverAnimation,
    focusRing,
  };
}
