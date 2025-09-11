import { useState, useEffect } from 'react';

// Breakpoints padrão
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280
} as const;

type BreakpointKey = keyof typeof BREAKPOINTS;

interface UseResponsiveReturn {
  // Estados de breakpoint
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  
  // Dimensões da tela
  width: number;
  height: number;
  
  // Orientação
  isPortrait: boolean;
  isLandscape: boolean;
  
  // Utilitários
  isAbove: (breakpoint: BreakpointKey) => boolean;
  isBelow: (breakpoint: BreakpointKey) => boolean;
  isBetween: (min: BreakpointKey, max: BreakpointKey) => boolean;
}

/**
 * Hook personalizado para gerenciar responsividade
 * Fornece informações sobre o tamanho da tela e breakpoints
 */
export const useResponsive = (): UseResponsiveReturn => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    // Função para atualizar as dimensões
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Debounce para otimizar performance
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 100);
    };

    // Adicionar listener
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, []);

  const { width, height } = dimensions;

  // Estados de breakpoint
  const isMobile = width <= BREAKPOINTS.mobile;
  const isTablet = width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet;
  const isDesktop = width > BREAKPOINTS.tablet && width <= BREAKPOINTS.desktop;
  const isWide = width > BREAKPOINTS.desktop;

  // Orientação
  const isPortrait = height > width;
  const isLandscape = width > height;

  // Utilitários
  const isAbove = (breakpoint: BreakpointKey): boolean => {
    return width > BREAKPOINTS[breakpoint];
  };

  const isBelow = (breakpoint: BreakpointKey): boolean => {
    return width <= BREAKPOINTS[breakpoint];
  };

  const isBetween = (min: BreakpointKey, max: BreakpointKey): boolean => {
    return width > BREAKPOINTS[min] && width <= BREAKPOINTS[max];
  };

  return {
    // Estados de breakpoint
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    
    // Dimensões
    width,
    height,
    
    // Orientação
    isPortrait,
    isLandscape,
    
    // Utilitários
    isAbove,
    isBelow,
    isBetween
  };
};

/**
 * Hook para detectar se é um dispositivo touch
 */
export const useTouch = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
};

/**
 * Hook para detectar preferências de acessibilidade
 */
export const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersReducedTransparency: false
  });

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersReducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches
      });
    };

    updatePreferences();

    // Listeners para mudanças
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-reduced-transparency: reduce)')
    ];

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  return preferences;
};

export default useResponsive;