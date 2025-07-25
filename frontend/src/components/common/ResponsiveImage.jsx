import React, { useState, useRef, useEffect } from 'react';
import { usePerformanceMonitor } from './PerformanceMonitor';

const ResponsiveImage = ({
  src,
  alt,
  className = '',
  placeholder = null,
  lazy = true,
  quality = 'auto', // 'low', 'medium', 'high', 'auto'
  sizes = '100vw',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);
  const { isSlowConnection } = usePerformanceMonitor();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Adjust quality based on connection speed
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return '';

    // If it's a data URL or external URL, return as-is
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // For local images, we could implement quality optimization here
    // This is a placeholder for image optimization logic
    let optimizedSrc = originalSrc;

    if (isSlowConnection && quality === 'auto') {
      // Could append quality parameters or use different image variants
      // e.g., optimizedSrc = originalSrc.replace('.jpg', '_low.jpg');
    }

    return optimizedSrc;
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setIsError(true);
    if (onError) onError(e);
  };

  const optimizedSrc = getOptimizedSrc(src);

  // Placeholder component
  const PlaceholderComponent = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  };

  // Error component
  const ErrorComponent = () => (
    <div className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-500">
        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
        </svg>
        <p className="text-sm">Failed to load image</p>
      </div>
    </div>
  );

  return (
    <div ref={imgRef} className="relative overflow-hidden">
      {/* Show placeholder while loading or if not in view */}
      {(!isInView || !isLoaded) && !isError && <PlaceholderComponent />}
      
      {/* Show error state */}
      {isError && <ErrorComponent />}
      
      {/* Actual image */}
      {isInView && !isError && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? 'lazy' : 'eager'}
          {...props}
        />
      )}
      
      {/* Loading indicator overlay */}
      {isInView && !isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

// Progressive image component with multiple sources
export const ProgressiveImage = ({
  lowQualitySrc,
  highQualitySrc,
  alt,
  className = '',
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (!highQualitySrc) return;

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(highQualitySrc);
      setIsHighQualityLoaded(true);
    };
    img.src = highQualitySrc;
  }, [highQualitySrc]);

  return (
    <ResponsiveImage
      src={currentSrc}
      alt={alt}
      className={`transition-all duration-500 ${
        isHighQualityLoaded ? 'filter-none' : 'filter blur-sm'
      } ${className}`}
      {...props}
    />
  );
};

// Avatar component with fallback
export const Avatar = ({
  src,
  alt,
  size = 'medium', // 'small', 'medium', 'large', 'xl'
  fallbackText,
  className = '',
  ...props
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8 text-sm';
      case 'medium':
        return 'w-12 h-12 text-base';
      case 'large':
        return 'w-16 h-16 text-lg';
      case 'xl':
        return 'w-24 h-24 text-2xl';
      default:
        return 'w-12 h-12 text-base';
    }
  };

  const fallback = (
    <div className={`
      ${getSizeClasses()} 
      bg-primary-500 text-white rounded-full 
      flex items-center justify-center font-semibold
      ${className}
    `}>
      {fallbackText ? fallbackText.charAt(0).toUpperCase() : '?'}
    </div>
  );

  if (!src) {
    return fallback;
  }

  return (
    <ResponsiveImage
      src={src}
      alt={alt}
      className={`${getSizeClasses()} rounded-full object-cover ${className}`}
      placeholder={fallback}
      {...props}
    />
  );
};

export default ResponsiveImage;