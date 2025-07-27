/**
 * App Configuration
 * Centralized configuration for the Elite Laundry Mobile App
 */

const AppConfig = {
  // Web App Configuration
  webAppUrl: 'elite.inichepro.in', // Development URL - change for production
  apiBaseUrl: 'elite-api.inichepro.in',
  
  // App Information
  appName: 'Elite Laundry',
  appVersion: '1.0.0',
  tagline: 'Elite Care for Every Wear',
  
  // Feature Flags
  enablePushNotifications: true,
  enableOfflineMode: false,
  enableDebugMode: __DEV__,
  
  // WebView Configuration
  webViewConfig: {
    javaScriptEnabled: true,
    domStorageEnabled: true,
    startInLoadingState: true,
    scalesPageToFit: true,
    allowsBackForwardNavigationGestures: true,
    cacheEnabled: true,
    cacheMode: 'LOAD_DEFAULT',
  },
  
  // Network Configuration
  networkTimeout: 30000,
  retryAttempts: 3,
  retryDelay: 2000,
  
  // UI Configuration
  splashScreenDuration: 2000,
  loadingTimeout: 15000,
  
  // Colors (matching web app theme)
  colors: {
    primary: '#9D3744',
    secondary: '#7D0C17',
    accent: '#C51D23',
    background: '#FCEAEA',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    error: '#FF0000',
    success: '#00FF00',
    warning: '#FFA500',
  },
};

export default AppConfig;