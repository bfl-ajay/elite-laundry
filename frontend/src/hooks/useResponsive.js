import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design breakpoints
 * Returns boolean values for different screen sizes
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
    height: 0
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height
      });
    };

    // Initial check
    updateScreenSize();

    // Add event listener
    window.addEventListener('resize', updateScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
};

/**
 * Hook for detecting touch devices
 */
export const useTouch = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
  }, []);

  return isTouch;
};

/**
 * Hook for detecting device orientation
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    isPortrait: true,
    isLandscape: false,
    angle: 0
  });

  useEffect(() => {
    const updateOrientation = () => {
      const angle = window.screen?.orientation?.angle || 0;
      const isPortrait = window.innerHeight > window.innerWidth;
      
      setOrientation({
        isPortrait,
        isLandscape: !isPortrait,
        angle
      });
    };

    updateOrientation();

    // Listen for orientation changes
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation);

    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return orientation;
};

/**
 * Hook for detecting reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Combined responsive hook with all utilities
 */
export const useResponsiveUtils = () => {
  const screenSize = useResponsive();
  const isTouch = useTouch();
  const orientation = useOrientation();
  const prefersReducedMotion = useReducedMotion();

  return {
    ...screenSize,
    isTouch,
    ...orientation,
    prefersReducedMotion
  };
};

export default useResponsive;