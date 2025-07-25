import authService from '../authService';
import api from '../api';

// Mock the api module
jest.mock('../api');
const mockedApi = api;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
    
    // Mock window.location
    delete window.location;
    window.location = { href: '', reload: jest.fn() };
  });

  describe('login', () => {
    test('successfully logs in user', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: 1, username: 'testuser' }
          }
        }
      };
      
      mockedApi.post.mockResolvedValue(mockResponse);
      
      const result = await authService.login('testuser', 'password');
      
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password'
      });
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'authCredentials',
        JSON.stringify({ username: 'testuser', password: 'password' })
      );
      
      expect(result).toEqual(mockResponse.data);
    });

    test('handles login failure', async () => {
      const mockError = {
        response: {
          data: {
            success: false,
            error: { message: 'Invalid credentials' }
          }
        }
      };
      
      mockedApi.post.mockRejectedValue(mockError);
      
      await expect(authService.login('testuser', 'wrongpassword')).rejects.toThrow();
      
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    test('validates required parameters', async () => {
      await expect(authService.login('', 'password')).rejects.toThrow('Username and password are required');
      await expect(authService.login('username', '')).rejects.toThrow('Username and password are required');
      await expect(authService.login(null, 'password')).rejects.toThrow('Username and password are required');
    });
  });

  describe('logout', () => {
    test('successfully logs out user', async () => {
      const mockResponse = {
        data: { success: true, message: 'Logged out successfully' }
      };
      
      mockedApi.post.mockResolvedValue(mockResponse);
      
      const result = await authService.logout();
      
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.removeItem).toHaveBeenCalledWith('authCredentials');
      expect(result).toEqual(mockResponse.data);
    });

    test('clears credentials even if API call fails', async () => {
      mockedApi.post.mockRejectedValue(new Error('Network error'));
      
      await authService.logout();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('authCredentials');
    });
  });

  describe('checkAuthStatus', () => {
    test('returns authentication status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            authenticated: true,
            user: { id: 1, username: 'testuser' }
          }
        }
      };
      
      mockedApi.get.mockResolvedValue(mockResponse);
      
      const result = await authService.checkAuthStatus();
      
      expect(mockedApi.get).toHaveBeenCalledWith('/auth/status');
      expect(result).toEqual(mockResponse.data);
    });

    test('handles unauthenticated status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            authenticated: false,
            user: null
          }
        }
      };
      
      mockedApi.get.mockResolvedValue(mockResponse);
      
      const result = await authService.checkAuthStatus();
      
      expect(result.data.authenticated).toBe(false);
      expect(result.data.user).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    test('returns current user from auth status', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockResponse = {
        data: {
          success: true,
          data: {
            authenticated: true,
            user: mockUser
          }
        }
      };
      
      mockedApi.get.mockResolvedValue(mockResponse);
      
      const result = await authService.getCurrentUser();
      
      expect(result).toEqual(mockUser);
    });

    test('returns null when not authenticated', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            authenticated: false,
            user: null
          }
        }
      };
      
      mockedApi.get.mockResolvedValue(mockResponse);
      
      const result = await authService.getCurrentUser();
      
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    test('returns true when authenticated', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { authenticated: true }
        }
      };
      
      mockedApi.get.mockResolvedValue(mockResponse);
      
      const result = await authService.isAuthenticated();
      
      expect(result).toBe(true);
    });

    test('returns false when not authenticated', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { authenticated: false }
        }
      };
      
      mockedApi.get.mockResolvedValue(mockResponse);
      
      const result = await authService.isAuthenticated();
      
      expect(result).toBe(false);
    });

    test('returns false on API error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));
      
      const result = await authService.isAuthenticated();
      
      expect(result).toBe(false);
    });
  });

  describe('getCredentials', () => {
    test('returns stored credentials', () => {
      const mockCredentials = { username: 'testuser', password: 'password' };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockCredentials));
      
      const result = authService.getCredentials();
      
      expect(localStorage.getItem).toHaveBeenCalledWith('authCredentials');
      expect(result).toEqual(mockCredentials);
    });

    test('returns null when no credentials stored', () => {
      localStorage.getItem.mockReturnValue(null);
      
      const result = authService.getCredentials();
      
      expect(result).toBeNull();
    });

    test('returns null when credentials are invalid JSON', () => {
      localStorage.getItem.mockReturnValue('invalid json');
      
      const result = authService.getCredentials();
      
      expect(result).toBeNull();
    });
  });

  describe('clearCredentials', () => {
    test('removes credentials from localStorage', () => {
      authService.clearCredentials();
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('authCredentials');
    });
  });

  describe('redirectToLogin', () => {
    test('redirects to login page', () => {
      authService.redirectToLogin();
      
      expect(window.location.href).toBe('/login');
    });

    test('redirects to custom path', () => {
      authService.redirectToLogin('/custom-login');
      
      expect(window.location.href).toBe('/custom-login');
    });
  });

  describe('refreshAuth', () => {
    test('refreshes authentication status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            authenticated: true,
            user: { id: 1, username: 'testuser' }
          }
        }
      };
      
      mockedApi.get.mockResolvedValue(mockResponse);
      
      const result = await authService.refreshAuth();
      
      expect(mockedApi.get).toHaveBeenCalledWith('/auth/status');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('error handling', () => {
    test('handles network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      mockedApi.post.mockRejectedValue(networkError);
      
      await expect(authService.login('user', 'pass')).rejects.toThrow('Network Error');
    });

    test('handles API errors with custom messages', async () => {
      const apiError = {
        response: {
          data: {
            success: false,
            error: { message: 'Custom error message' }
          }
        }
      };
      
      mockedApi.post.mockRejectedValue(apiError);
      
      await expect(authService.login('user', 'pass')).rejects.toThrow();
    });

    test('handles malformed API responses', async () => {
      const malformedResponse = { data: 'invalid response' };
      mockedApi.get.mockResolvedValue(malformedResponse);
      
      const result = await authService.isAuthenticated();
      
      expect(result).toBe(false);
    });
  });

  describe('credential management', () => {
    test('stores credentials securely', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { user: { id: 1, username: 'testuser' } }
        }
      };
      
      mockedApi.post.mockResolvedValue(mockResponse);
      
      await authService.login('testuser', 'securepassword');
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'authCredentials',
        JSON.stringify({ username: 'testuser', password: 'securepassword' })
      );
    });

    test('handles special characters in credentials', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { user: { id: 1, username: 'user@example.com' } }
        }
      };
      
      mockedApi.post.mockResolvedValue(mockResponse);
      
      await authService.login('user@example.com', 'p@ssw0rd!');
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'authCredentials',
        JSON.stringify({ username: 'user@example.com', password: 'p@ssw0rd!' })
      );
    });
  });
});