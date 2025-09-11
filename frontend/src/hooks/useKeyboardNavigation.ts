import { useEffect, useCallback, useRef } from 'react';

// Hook para navegação por teclado em listas
export const useKeyboardNavigation = ({
  items,
  onSelect,
  isOpen = true,
  loop = true,
  orientation = 'vertical'
}: {
  items: any[];
  onSelect: (item: any, index: number) => void;
  isOpen?: boolean;
  loop?: boolean;
  orientation?: 'vertical' | 'horizontal';
}) => {
  const activeIndexRef = useRef<number>(-1);
  const containerRef = useRef<HTMLElement>(null);

  const getNextIndex = useCallback((currentIndex: number, direction: 'next' | 'prev') => {
    if (items.length === 0) return -1;

    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= items.length) {
        nextIndex = loop ? 0 : items.length - 1;
      }
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = loop ? items.length - 1 : 0;
      }
    }
    return nextIndex;
  }, [items.length, loop]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || items.length === 0) return;

    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        activeIndexRef.current = getNextIndex(activeIndexRef.current, 'next');
        break;
      case prevKey:
        event.preventDefault();
        activeIndexRef.current = getNextIndex(activeIndexRef.current, 'prev');
        break;
      case 'Home':
        event.preventDefault();
        activeIndexRef.current = 0;
        break;
      case 'End':
        event.preventDefault();
        activeIndexRef.current = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (activeIndexRef.current >= 0 && activeIndexRef.current < items.length) {
          onSelect(items[activeIndexRef.current], activeIndexRef.current);
        }
        break;
      case 'Escape':
        activeIndexRef.current = -1;
        break;
    }

    // Focar no elemento ativo
    if (activeIndexRef.current >= 0 && containerRef.current) {
      const activeElement = containerRef.current.querySelector(
        `[data-keyboard-index="${activeIndexRef.current}"]`
      ) as HTMLElement;
      if (activeElement) {
        activeElement.focus();
      }
    }
  }, [isOpen, items, onSelect, getNextIndex, orientation]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Reset active index when items change
  useEffect(() => {
    activeIndexRef.current = -1;
  }, [items]);

  return {
    containerRef,
    activeIndex: activeIndexRef.current,
    setActiveIndex: (index: number) => {
      activeIndexRef.current = index;
    }
  };
};

// Hook para gerenciar foco em modais e overlays
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Salvar o elemento focado anteriormente
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Focar no primeiro elemento focável
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Restaurar foco anterior
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restaurar foco quando o trap for desativado
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

// Hook para anúncios de screen reader
export const useScreenReader = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remover após um tempo
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return { announce };
};

// Hook para detectar preferências de acessibilidade
export const useAccessibilityPreferences = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersDarkMode
  };
};