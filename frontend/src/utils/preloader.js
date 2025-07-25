// Preloader utilities for performance optimization

// Preload critical CSS
export const preloadCSS = (href) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = () => {
    link.rel = 'stylesheet';
  };
  document.head.appendChild(link);
};

// Preload JavaScript modules
export const preloadJS = (href) => {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = href;
  document.head.appendChild(link);
};

// Preload images
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Preload multiple images
export const preloadImages = (srcArray) => {
  return Promise.all(srcArray.map(preloadImage));
};

// Preload fonts
export const preloadFont = (href, type = 'font/woff2') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = type;
  link.href = href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

// Critical resource preloader
export const preloadCriticalResources = () => {
  // Preload Inter font
  preloadFont('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2');
  
  // Preload critical images (if any)
  // preloadImages(['/path/to/critical/image.jpg']);
  
  // DNS prefetch for external resources
  const dnsPrefetch = (href) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = href;
    document.head.appendChild(link);
  };
  
  dnsPrefetch('//fonts.googleapis.com');
  dnsPrefetch('//fonts.gstatic.com');
};

// Lazy load non-critical resources
export const lazyLoadResource = (src, type = 'script') => {
  return new Promise((resolve, reject) => {
    const element = document.createElement(type);
    
    if (type === 'script') {
      element.src = src;
      element.async = true;
    } else if (type === 'link') {
      element.rel = 'stylesheet';
      element.href = src;
    }
    
    element.onload = resolve;
    element.onerror = reject;
    
    document.head.appendChild(element);
  });
};

// Service Worker registration for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
      return registration;
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
    }
  }
};

// Resource hints for better performance
export const addResourceHints = () => {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
  ];
  
  hints.forEach(hint => {
    const link = document.createElement('link');
    Object.assign(link, hint);
    document.head.appendChild(link);
  });
};

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  // Add resource hints
  addResourceHints();
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Register service worker
  registerServiceWorker();
  
  // Enable passive event listeners for better scroll performance
  if (typeof window !== 'undefined') {
    const passiveEvents = ['touchstart', 'touchmove', 'wheel'];
    passiveEvents.forEach(event => {
      document.addEventListener(event, () => {}, { passive: true });
    });
  }
};

// Performance monitoring
export const measureResourceTiming = () => {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource');
    const slowResources = resources.filter(resource => resource.duration > 1000);
    
    if (slowResources.length > 0) {
      console.warn('Slow loading resources detected:', slowResources);
    }
    
    return {
      totalResources: resources.length,
      slowResources: slowResources.length,
      averageLoadTime: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length
    };
  }
  
  return null;
};

// Connection-aware loading
export const getConnectionInfo = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  
  return null;
};

// Adaptive loading based on connection
export const shouldLoadHighQuality = () => {
  const connection = getConnectionInfo();
  
  if (!connection) return true; // Default to high quality if no info
  
  // Don't load high quality on slow connections or when save-data is enabled
  if (connection.saveData || ['slow-2g', '2g'].includes(connection.effectiveType)) {
    return false;
  }
  
  return true;
};

export default {
  preloadCSS,
  preloadJS,
  preloadImage,
  preloadImages,
  preloadFont,
  preloadCriticalResources,
  lazyLoadResource,
  registerServiceWorker,
  addResourceHints,
  initializePerformanceOptimizations,
  measureResourceTiming,
  getConnectionInfo,
  shouldLoadHighQuality
};