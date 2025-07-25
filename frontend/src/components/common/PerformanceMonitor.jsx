import React, { useEffect, useState } from 'react';

const PerformanceMonitor = ({ 
  enabled = process.env.NODE_ENV === 'development',
  showMetrics = false 
}) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    connectionType: 'unknown'
  });
  const [warningsLogged, setWarningsLogged] = useState({
    slowLoad: false,
    highMemory: false,
    slowConnection: false
  });

  useEffect(() => {
    if (!enabled) return;

    // Measure page load time
    const measureLoadTime = () => {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    // Measure memory usage (if available)
    const measureMemoryUsage = () => {
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    // Get connection information
    const getConnectionInfo = () => {
      if (navigator.connection) {
        const connectionType = navigator.connection.effectiveType || 'unknown';
        setMetrics(prev => ({ ...prev, connectionType }));
      }
    };

    // Performance observer for render times
    const observeRenderTimes = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'measure') {
              setMetrics(prev => ({ ...prev, renderTime: entry.duration }));
            }
          });
        });

        observer.observe({ entryTypes: ['measure'] });
        return observer;
      }
    };

    // Initialize measurements
    measureLoadTime();
    measureMemoryUsage();
    getConnectionInfo();
    const observer = observeRenderTimes();

    // Set up periodic memory monitoring
    const memoryInterval = setInterval(measureMemoryUsage, 5000);

    // Cleanup
    return () => {
      if (observer) observer.disconnect();
      clearInterval(memoryInterval);
    };
  }, [enabled]);

  // Log performance warnings (only once per session)
  useEffect(() => {
    if (!enabled) return;

    const { loadTime, memoryUsage, connectionType } = metrics;

    // Warn about slow load times (only once)
    if (loadTime > 3000 && !warningsLogged.slowLoad) {
      console.warn(`Slow page load detected: ${loadTime}ms`);
      setWarningsLogged(prev => ({ ...prev, slowLoad: true }));
    }

    // Warn about high memory usage (only once per threshold crossing)
    if (memoryUsage > 50 && !warningsLogged.highMemory) {
      console.warn(`High memory usage detected: ${memoryUsage.toFixed(2)}MB`);
      setWarningsLogged(prev => ({ ...prev, highMemory: true }));
    } else if (memoryUsage <= 50 && warningsLogged.highMemory) {
      // Reset warning if memory usage goes back down
      setWarningsLogged(prev => ({ ...prev, highMemory: false }));
    }

    // Warn about slow connections (only once)
    if ((connectionType === 'slow-2g' || connectionType === '2g') && !warningsLogged.slowConnection) {
      console.warn(`Slow connection detected: ${connectionType}`);
      setWarningsLogged(prev => ({ ...prev, slowConnection: true }));
    }
  }, [metrics, enabled, warningsLogged]);

  if (!enabled || !showMetrics) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg font-mono z-50">
      <div className="space-y-1">
        <div>Load: {metrics.loadTime}ms</div>
        <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
        <div>Memory: {metrics.memoryUsage.toFixed(2)}MB</div>
        <div>Connection: {metrics.connectionType}</div>
      </div>
    </div>
  );
};

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [memoryPressure, setMemoryPressure] = useState(false);

  useEffect(() => {
    // Monitor connection speed
    if (navigator.connection) {
      const connection = navigator.connection;
      const updateConnectionStatus = () => {
        const slowConnections = ['slow-2g', '2g'];
        setIsSlowConnection(slowConnections.includes(connection.effectiveType));
      };

      updateConnectionStatus();
      connection.addEventListener('change', updateConnectionStatus);

      return () => {
        connection.removeEventListener('change', updateConnectionStatus);
      };
    }
  }, []);

  useEffect(() => {
    // Monitor memory usage
    const checkMemoryPressure = () => {
      if (performance.memory) {
        const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        setMemoryPressure(usage > 0.8); // 80% threshold
      }
    };

    checkMemoryPressure();
    const interval = setInterval(checkMemoryPressure, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    isSlowConnection,
    memoryPressure,
    shouldOptimize: isSlowConnection || memoryPressure
  };
};

// Performance measurement utilities
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const startTime = performance.now();
    performance.mark(`${name}-start`);
    
    try {
      const result = await fn(...args);
      
      const endTime = performance.now();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${name} took ${endTime - startTime} milliseconds`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      performance.mark(`${name}-error`);
      performance.measure(`${name}-error`, `${name}-start`, `${name}-error`);
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`${name} failed after ${endTime - startTime} milliseconds`, error);
      }
      
      throw error;
    }
  };
};

// Component performance wrapper
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    useEffect(() => {
      performance.mark(`${componentName}-mount-start`);
      
      return () => {
        performance.mark(`${componentName}-unmount`);
        performance.measure(
          `${componentName}-lifecycle`,
          `${componentName}-mount-start`,
          `${componentName}-unmount`
        );
      };
    }, []);

    return <WrappedComponent {...props} />;
  });
};

export default PerformanceMonitor;