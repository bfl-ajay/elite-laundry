import api from './api';

class AuthService {
  // Login with username and password
  async login(username, password) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] AuthService.login: Starting login attempt`, {
      username: username,
      passwordLength: password?.length || 0,
      hasUsername: !!username,
      hasPassword: !!password
    });

    try {
      // Validate inputs
      if (!username || !password) {
        const error = new Error('Username and password are required');
        console.error(`[${timestamp}] AuthService.login: Validation failed`, {
          username: !!username,
          password: !!password
        });
        throw error;
      }

      // Create Basic Auth credentials
      const credentials = btoa(`${username}:${password}`);
      console.log(`[${timestamp}] AuthService.login: Created Basic Auth credentials`);
      
      console.log(`[${timestamp}] AuthService.login: Sending POST request to /auth/login`);
      const response = await api.post('/auth/login', {
        username,
        password
      });

      console.log(`[${timestamp}] AuthService.login: Received response`, {
        status: response.status,
        success: response.data?.success,
        hasUser: !!response.data?.data?.user,
        errorCode: response.data?.error?.code,
        errorMessage: response.data?.error?.message
      });

      if (response.data.success) {
        // Store credentials for future requests
        localStorage.setItem('authCredentials', credentials);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        console.log(`[${timestamp}] AuthService.login: Login successful, credentials stored`, {
          userId: response.data.data.user?.id,
          username: response.data.data.user?.username
        });
        return response.data;
      }

      console.log(`[${timestamp}] AuthService.login: Login failed with server response`, {
        success: response.data.success,
        error: response.data.error
      });
      return response.data;
    } catch (error) {
      console.error(`[${timestamp}] AuthService.login: Login error occurred`, {
        errorType: error.constructor.name,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        stack: error.stack
      });

      // Enhanced error information
      if (error.response) {
        console.error(`[${timestamp}] AuthService.login: HTTP Error Details`, {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          url: error.response.config?.url,
          method: error.response.config?.method
        });
      } else if (error.request) {
        console.error(`[${timestamp}] AuthService.login: Network Error - No response received`, {
          request: error.request,
          timeout: error.code === 'ECONNABORTED'
        });
      }

      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authCredentials');
      localStorage.removeItem('user');
    }
  }

  // Check authentication status
  async checkAuthStatus() {
    try {
      const response = await api.get('/auth/status');
      return response.data;
    } catch (error) {
      console.error('Auth status check error:', error);
      return {
        success: true,
        data: { authenticated: false }
      };
    }
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authCredentials');
  }

  // Get stored credentials
  getCredentials() {
    return localStorage.getItem('authCredentials');
  }
}

export default new AuthService();