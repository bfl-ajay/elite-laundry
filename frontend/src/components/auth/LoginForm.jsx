import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinnerIcon } from '../../assets/icons/laundry-icons';
import Logo from '../common/Logo';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Capture console logs for debug panel
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    const addToDebugLogs = (level, args) => {
      const timestamp = new Date().toISOString();
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setDebugLogs(prev => [...prev.slice(-49), { // Keep last 50 logs
        timestamp,
        level,
        message
      }]);
    };

    console.log = (...args) => {
      originalLog(...args);
      if (args[0]?.includes?.('LoginForm') || args[0]?.includes?.('AuthContext') || args[0]?.includes?.('AuthService') || args[0]?.includes?.('API')) {
        addToDebugLogs('log', args);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      if (args[0]?.includes?.('LoginForm') || args[0]?.includes?.('AuthContext') || args[0]?.includes?.('AuthService') || args[0]?.includes?.('API')) {
        addToDebugLogs('error', args);
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  // Clear error when component mounts or form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError]);

  // Navigate to dashboard after successful authentication
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] LoginForm.useEffect: Authentication state changed`, {
      isAuthenticated,
      loading,
      hasError: !!error
    });

    if (isAuthenticated && !loading) {
      console.log(`[${timestamp}] LoginForm.useEffect: User is authenticated, navigating to dashboard`);
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate, error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] LoginForm.handleSubmit: Form submission started`, {
      username: formData.username,
      passwordLength: formData.password?.length || 0,
      hasUsername: !!formData.username.trim(),
      hasPassword: !!formData.password.trim(),
      isSubmitting,
      loading,
      currentError: error
    });
    
    if (!formData.username.trim() || !formData.password.trim()) {
      console.log(`[${timestamp}] LoginForm.handleSubmit: Form validation failed - empty fields`, {
        usernameEmpty: !formData.username.trim(),
        passwordEmpty: !formData.password.trim()
      });
      return;
    }

    setIsSubmitting(true);
    console.log(`[${timestamp}] LoginForm.handleSubmit: Set isSubmitting=true`);
    
    try {
      console.log(`[${timestamp}] LoginForm.handleSubmit: Calling login function`);
      const result = await login(formData.username.trim(), formData.password);
      
      console.log(`[${timestamp}] LoginForm.handleSubmit: Login function returned`, {
        success: result.success,
        hasError: !!result.error,
        errorMessage: result.error?.message,
        errorCode: result.error?.code
      });
      
      if (!result.success) {
        // Error is handled by AuthContext
        console.log(`[${timestamp}] LoginForm.handleSubmit: Login failed`, {
          error: result.error,
          willShowErrorToUser: true
        });
      } else {
        console.log(`[${timestamp}] LoginForm.handleSubmit: Login successful, waiting for navigation`);
        // Navigation will be handled by useEffect when isAuthenticated becomes true
      }
    } catch (error) {
      console.error(`[${timestamp}] LoginForm.handleSubmit: Exception in handleSubmit`, {
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setIsSubmitting(false);
      console.log(`[${timestamp}] LoginForm.handleSubmit: Set isSubmitting=false`);
    }
  };

  const isFormValid = formData.username.trim() && formData.password.trim();
  const isLoading = loading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-50 to-accent-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header with logo */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo variant="full" size="lg" />
          </div>
          <p className="text-sm text-primary-600">
            Please sign in to access your dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8 border border-primary-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Enter your username"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary-600 transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <LoadingSpinnerIcon className="w-5 h-5 mr-2" color="white" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign in</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Demo credentials hint */}
          {/* <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Demo:</strong> Username: <code className="bg-blue-100 px-1 rounded">admin</code>, Password: <code className="bg-blue-100 px-1 rounded">admin123</code>
                  </p>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Debug Panel Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {showDebugPanel ? 'Hide' : 'Show'} Debug Logs
          </button>
        </div>

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-semibold">Login Debug Logs</h3>
              <button
                onClick={() => setDebugLogs([])}
                className="text-gray-400 hover:text-white text-xs"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {debugLogs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Try logging in to see debug information.</div>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className={`${log.level === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    <span className="text-gray-500">[{log.timestamp.split('T')[1].split('.')[0]}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">Laundry Management powered by iNichePro IT Solutions
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;