import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { BusinessSettingsProvider } from './contexts/BusinessSettingsContext';
import { ProtectedRoute } from './components';
import ErrorBoundary from './components/common/ErrorBoundary';
import ErrorNotification from './components/common/ErrorNotification';
import PerformanceMonitor, { usePerformanceMonitor } from './components/common/PerformanceMonitor';
import { PageLoader } from './components/common/LoadingState';
import { preloadIcons, COMMON_ICONS, DASHBOARD_ICONS } from './components/common/LazyIcon';
import { initializePerformanceOptimizations } from './utils/preloader';
import './App.css';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const BusinessSettingsPage = lazy(() => import('./pages/BusinessSettingsPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));

function AppContent() {
  const { shouldOptimize, isSlowConnection } = usePerformanceMonitor();

  useEffect(() => {
    // Initialize performance optimizations
    initializePerformanceOptimizations();
    
    // Preload common icons on app start
    preloadIcons([...COMMON_ICONS, ...DASHBOARD_ICONS]);

    // Preload critical resources based on connection speed
    if (!isSlowConnection) {
      // Preload other pages for faster navigation
      import('./pages/DashboardPage');
      import('./pages/OrdersPage');
    }
  }, [isSlowConnection]);

  return (
    <div className="App min-h-screen bg-background transition-colors duration-300">
      <Suspense fallback={<PageLoader message="Loading application..." />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
                <DashboardPage />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/orders" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading orders..." />}>
                <OrdersPage />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/expenses" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading expenses..." />}>
                <ExpensesPage />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading user management..." />}>
                <UserManagementPage />
              </Suspense>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader message="Loading settings..." />}>
                <BusinessSettingsPage />
              </Suspense>
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      
      {/* Global error notifications */}
      <ErrorNotification />
      
      {/* Performance monitoring (development only) */}
      <PerformanceMonitor 
        enabled={process.env.NODE_ENV === 'development'} 
        showMetrics={false} 
      />
      
      {/* Connection status indicator for slow connections */}
      {isSlowConnection && (
        <div className="fixed top-0 left-0 right-0 bg-warning-500 text-white text-center py-2 text-sm z-50 animate-slide-down">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <span>Slow connection detected - Some features may load slower</span>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <BusinessSettingsProvider>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </BusinessSettingsProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;