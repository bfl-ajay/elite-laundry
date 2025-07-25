import api from '../api';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    });
  });

  test('creates axios instance with correct base URL', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      withCredentials: true
    });
  });

  test('sets up request interceptor for Basic Auth', () => {
    const mockInstance = mockedAxios.create();
    
    // Verify request interceptor was set up
    expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
    
    const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0];
    
    // Mock localStorage
    const mockCredentials = { username: 'testuser', password: 'testpass' };
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockCredentials));
    
    const config = { headers: {} };
    const modifiedConfig = requestInterceptor(config);
    
    expect(modifiedConfig.headers.Authorization).toBe('Basic dGVzdHVzZXI6dGVzdHBhc3M=');
  });

  test('handles request interceptor without credentials', () => {
    const mockInstance = mockedAxios.create();
    const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0];
    
    // Mock localStorage returning null
    Storage.prototype.getItem = jest.fn(() => null);
    
    const config = { headers: {} };
    const modifiedConfig = requestInterceptor(config);
    
    expect(modifiedConfig.headers.Authorization).toBeUndefined();
  });

  test('sets up response interceptor for error handling', () => {
    const mockInstance = mockedAxios.create();
    
    // Verify response interceptor was set up
    expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
    
    const responseInterceptor = mockInstance.interceptors.response.use.mock.calls[0];
    const successHandler = responseInterceptor[0];
    const errorHandler = responseInterceptor[1];
    
    // Test success handler
    const response = { data: 'test' };
    expect(successHandler(response)).toBe(response);
    
    // Test error handler
    const error = {
      response: {
        status: 401,
        data: { error: { message: 'Unauthorized' } }
      }
    };
    
    expect(() => errorHandler(error)).toThrow();
  });

  test('handles 401 errors by clearing credentials', () => {
    const mockInstance = mockedAxios.create();
    const errorHandler = mockInstance.interceptors.response.use.mock.calls[0][1];
    
    // Mock localStorage
    Storage.prototype.removeItem = jest.fn();
    
    const error = {
      response: {
        status: 401,
        data: { error: { message: 'Unauthorized' } }
      }
    };
    
    try {
      errorHandler(error);
    } catch (e) {
      // Expected to throw
    }
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('authCredentials');
  });

  test('handles network errors', () => {
    const mockInstance = mockedAxios.create();
    const errorHandler = mockInstance.interceptors.response.use.mock.calls[0][1];
    
    const networkError = {
      request: {},
      message: 'Network Error'
    };
    
    expect(() => errorHandler(networkError)).toThrow('Network error. Please check your connection.');
  });

  test('handles errors without response', () => {
    const mockInstance = mockedAxios.create();
    const errorHandler = mockInstance.interceptors.response.use.mock.calls[0][1];
    
    const genericError = {
      message: 'Something went wrong'
    };
    
    expect(() => errorHandler(genericError)).toThrow('Something went wrong');
  });

  test('formats error messages correctly', () => {
    const mockInstance = mockedAxios.create();
    const errorHandler = mockInstance.interceptors.response.use.mock.calls[0][1];
    
    const validationError = {
      response: {
        status: 400,
        data: {
          error: {
            message: 'Validation failed',
            details: [
              { msg: 'Name is required' },
              { msg: 'Email is invalid' }
            ]
          }
        }
      }
    };
    
    try {
      errorHandler(validationError);
    } catch (error) {
      expect(error.message).toBe('Name is required, Email is invalid');
    }
  });

  test('handles server errors with generic message', () => {
    const mockInstance = mockedAxios.create();
    const errorHandler = mockInstance.interceptors.response.use.mock.calls[0][1];
    
    const serverError = {
      response: {
        status: 500,
        data: { error: { message: 'Internal server error' } }
      }
    };
    
    try {
      errorHandler(serverError);
    } catch (error) {
      expect(error.message).toBe('Internal server error');
    }
  });

  test('preserves original error properties', () => {
    const mockInstance = mockedAxios.create();
    const errorHandler = mockInstance.interceptors.response.use.mock.calls[0][1];
    
    const originalError = {
      response: {
        status: 404,
        data: { error: { message: 'Not found', code: 'NOT_FOUND' } }
      }
    };
    
    try {
      errorHandler(originalError);
    } catch (error) {
      expect(error.response).toBe(originalError.response);
      expect(error.status).toBe(404);
    }
  });

  test('handles malformed error responses', () => {
    const mockInstance = mockedAxios.create();
    const errorHandler = mockInstance.interceptors.response.use.mock.calls[0][1];
    
    const malformedError = {
      response: {
        status: 400,
        data: 'Invalid JSON response'
      }
    };
    
    try {
      errorHandler(malformedError);
    } catch (error) {
      expect(error.message).toBe('An error occurred');
    }
  });

  test('encodes Basic Auth credentials correctly', () => {
    const mockInstance = mockedAxios.create();
    const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0];
    
    const credentials = { username: 'user@example.com', password: 'p@ssw0rd!' };
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(credentials));
    
    const config = { headers: {} };
    const modifiedConfig = requestInterceptor(config);
    
    // Verify the Base64 encoding is correct
    const expectedAuth = btoa('user@example.com:p@ssw0rd!');
    expect(modifiedConfig.headers.Authorization).toBe(`Basic ${expectedAuth}`);
  });

  test('handles invalid JSON in localStorage', () => {
    const mockInstance = mockedAxios.create();
    const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0];
    
    // Mock localStorage returning invalid JSON
    Storage.prototype.getItem = jest.fn(() => 'invalid json');
    
    const config = { headers: {} };
    const modifiedConfig = requestInterceptor(config);
    
    expect(modifiedConfig.headers.Authorization).toBeUndefined();
  });

  test('preserves existing headers in request interceptor', () => {
    const mockInstance = mockedAxios.create();
    const requestInterceptor = mockInstance.interceptors.request.use.mock.calls[0][0];
    
    const credentials = { username: 'testuser', password: 'testpass' };
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(credentials));
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value'
      }
    };
    
    const modifiedConfig = requestInterceptor(config);
    
    expect(modifiedConfig.headers['Content-Type']).toBe('application/json');
    expect(modifiedConfig.headers['X-Custom-Header']).toBe('custom-value');
    expect(modifiedConfig.headers.Authorization).toBeDefined();
  });
});