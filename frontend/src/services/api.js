import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true, // Important for session-based auth
});

// Request interceptor to add authentication headers
api.interceptors.request.use(
  (config) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] API Request Interceptor: Preparing request`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      timeout: config.timeout,
      withCredentials: config.withCredentials
    });

    // Add Basic Auth header if credentials are stored
    const credentials = localStorage.getItem('authCredentials');
    if (credentials) {
      config.headers.Authorization = `Basic ${credentials}`;
      console.log(`[${timestamp}] API Request Interceptor: Added Basic Auth header`);
    } else {
      console.log(`[${timestamp}] API Request Interceptor: No stored credentials found`);
    }

    console.log(`[${timestamp}] API Request Interceptor: Final request config`, {
      headers: { ...config.headers, Authorization: config.headers.Authorization ? '[REDACTED]' : undefined },
      data: config.data
    });

    return config;
  },
  (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] API Request Interceptor: Request setup failed`, {
      error: error.message,
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] API Response Interceptor: Successful response`, {
      status: response.status,
      statusText: response.statusText,
      url: response.config?.url,
      method: response.config?.method?.toUpperCase(),
      responseSize: JSON.stringify(response.data).length,
      success: response.data?.success,
      hasData: !!response.data?.data,
      hasError: !!response.data?.error
    });
    return response;
  },
  (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] API Response Interceptor: Error response`, {
      hasResponse: !!error.response,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      errorMessage: error.message,
      errorCode: error.code,
      responseData: error.response?.data
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log(`[${timestamp}] API Response Interceptor: Handling 401 authentication error`);
      
      // Clear stored credentials
      localStorage.removeItem('authCredentials');
      localStorage.removeItem('user');
      console.log(`[${timestamp}] API Response Interceptor: Cleared stored credentials`);
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        console.log(`[${timestamp}] API Response Interceptor: Redirecting to login page`);
        window.location.href = '/login';
      }
      
      return Promise.reject({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Your session has expired. Please log in again.'
        }
      });
    }

    // Handle network errors
    if (!error.response) {
      console.log(`[${timestamp}] API Response Interceptor: Network error detected`, {
        errorCode: error.code,
        errorMessage: error.message,
        isTimeout: error.code === 'ECONNABORTED',
        isNetworkError: error.message === 'Network Error'
      });

      let message = 'Unable to connect to server. Please check your connection.';
      let code = 'NETWORK_ERROR';
      
      if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Please try again.';
        code = 'TIMEOUT_ERROR';
        console.log(`[${timestamp}] API Response Interceptor: Request timeout detected`);
      } else if (error.message === 'Network Error') {
        message = 'Network connection failed. Please check your internet connection.';
        console.log(`[${timestamp}] API Response Interceptor: Network connection failed`);
      }
      
      console.error(`[${timestamp}] API Response Interceptor: Final network error`, { code, message });
      return Promise.reject({
        success: false,
        error: {
          code,
          message
        }
      });
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      return Promise.reject({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Server error occurred. Please try again later.'
        }
      });
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      return Promise.reject({
        success: false,
        error: {
          code: 'RATE_LIMIT_ERROR',
          message: 'Too many requests. Please wait a moment and try again.'
        }
      });
    }

    // Return the error response for handling by individual services
    return Promise.reject(error.response?.data || {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
);

export default api;