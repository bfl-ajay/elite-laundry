import { useState, useEffect } from 'react';

// Tailwind CSS breakpoints
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState('xs');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      // Determine current breakpoint
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm');
      } else {
        setCurrentBreakpoint('xs');
      }
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper functions
  const isMobile = currentBreakpoint === 'xs';
  const isTablet = currentBreakpoint === 'sm' || currentBreakpoint === 'md';
  const isDesktop = ['lg', 'xl', '2xl'].includes(currentBreakpoint);
  const isSmallScreen = ['xs', 'sm'].includes(currentBreakpoint);
  const isLargeScreen = ['xl', '2xl'].includes(currentBreakpoint);

  // Breakpoint checkers
  const isAbove = (breakpoint) => {
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);
    return currentIndex > targetIndex;
  };

  const isBelow = (breakpoint) => {
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);
    return currentIndex < targetIndex;
  };

  const isAt = (breakpoint) => currentBreakpoint === breakpoint;

  // Responsive value selector
  const getResponsiveValue = (values) => {
    if (typeof values !== 'object') return values;
    
    // Check from largest to smallest breakpoint
    const orderedBreakpoints = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = orderedBreakpoints.indexOf(currentBreakpoint);
    
    for (let i = currentIndex; i < orderedBreakpoints.length; i++) {
      const bp = orderedBreakpoints[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }
    
    // Fallback to default or first available value
    return values.default || values[Object.keys(values)[0]];
  };

  // Grid columns helper
  const getGridCols = (colsConfig) => {
    return getResponsiveValue(colsConfig);
  };

  // Spacing helper
  const getSpacing = (spacingConfig) => {
    return getResponsiveValue(spacingConfig);
  };

  return {
    // Screen dimensions
    screenSize,
    width: screenSize.width,
    height: screenSize.height,
    
    // Current breakpoint
    currentBreakpoint,
    
    // Device type helpers
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
    
    // Breakpoint checkers
    isAbove,
    isBelow,
    isAt,
    
    // Responsive value helpers
    getResponsiveValue,
    getGridCols,
    getSpacing,
    
    // Breakpoint values for reference
    breakpoints
  };
};

// Hook for specific breakpoint matching
export const useBreakpoint = (breakpoint) => {
  const { isAt, isAbove, isBelow } = useResponsive();
  
  return {
    isExact: isAt(breakpoint),
    isAbove: isAbove(breakpoint),
    isBelow: isBelow(breakpoint)
  };
};

// Hook for media query matching
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

export default useResponsive;