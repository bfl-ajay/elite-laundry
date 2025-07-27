# Elite Laundry Mobile App

A React Native mobile application for Android that provides access to the Elite Laundry Management System through a WebView interface.

## Features

- **Full Web App Access**: Complete access to the laundry management system through a native WebView
- **Native Android Experience**: Splash screen, back button handling, and native navigation
- **Network Monitoring**: Automatic detection of network connectivity with offline notifications
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Performance Optimized**: Optimized for mobile devices with caching and performance enhancements
- **Secure**: SSL certificate validation and secure authentication handling

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **React Native CLI**: `npm install -g react-native-cli`
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** version 11 or higher
- **Android device or emulator** for testing

## Installation

1. **Clone the repository** (if part of a larger project):
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (if planning to support iOS later):
   ```bash
   cd ios && pod install && cd ..
   ```

## Configuration

### Web App URL Configuration

Update the web app URL in `src/config/AppConfig.js`:

```javascript
const AppConfig = {
  webAppUrl: 'https://your-domain.com', // Change this to your web app URL
  apiBaseUrl: 'https://your-domain.com/api',
  // ... other configurations
};
```

### Android Configuration

1. **App Name and Package**: Update in `android/app/src/main/AndroidManifest.xml`
2. **App Icon**: Replace icons in `android/app/src/main/res/mipmap-*` folders
3. **Splash Screen**: Customize in `src/components/SplashScreen.js`

## Development

### Running the App

1. **Start the Metro bundler**:
   ```bash
   npm start
   ```

2. **Run on Android device/emulator**:
   ```bash
   npm run android
   ```

### Development Commands

- **Start Metro**: `npm start`
- **Run Android**: `npm run android`
- **Run iOS**: `npm run ios` (if configured)
- **Run Tests**: `npm test`
- **Lint Code**: `npm run lint`
- **Clean Build**: `npm run clean`

### Debugging

1. **Enable Debug Mode**: Set `enableDebugMode: true` in `AppConfig.js`
2. **Chrome DevTools**: Shake device → "Debug" → "Debug with Chrome"
3. **React Native Debugger**: Use React Native Debugger for advanced debugging
4. **Flipper**: Use Flipper for network debugging and performance monitoring

## Building for Production

### Debug Build

```bash
npm run build:android-debug
```

### Release Build

1. **Generate a signing key**:
   ```bash
   cd android/app
   keytool -genkeypair -v -storename my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Update gradle.properties**:
   ```
   MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
   MYAPP_UPLOAD_STORE_PASSWORD=*****
   MYAPP_UPLOAD_KEY_PASSWORD=*****
   ```

3. **Build release APK**:
   ```bash
   npm run build:android
   ```

## Project Structure

```
mobile-app/
├── src/
│   ├── components/          # React Native components
│   │   ├── SplashScreen.js  # Custom splash screen
│   │   ├── WebViewScreen.js # Main WebView component
│   │   ├── NetworkStatus.js # Network connectivity monitor
│   │   ├── LoadingOverlay.js # Loading indicator
│   │   └── ErrorScreen.js   # Error handling screen
│   ├── config/
│   │   └── AppConfig.js     # App configuration
│   └── App.js               # Main app component
├── android/                 # Android-specific files
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Customization

### Branding

1. **App Icon**: Replace icons in `android/app/src/main/res/mipmap-*`
2. **Splash Screen**: Modify `src/components/SplashScreen.js`
3. **Colors**: Update colors in `src/config/AppConfig.js`
4. **App Name**: Update in `android/app/src/main/res/values/strings.xml`

### Features

1. **WebView Configuration**: Modify `webViewConfig` in `AppConfig.js`
2. **Network Handling**: Customize `NetworkStatus.js`
3. **Error Messages**: Update `ErrorScreen.js`
4. **Loading States**: Modify `LoadingOverlay.js`

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build issues**:
   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native clean
   ```

3. **Network connectivity issues**:
   - Check `android/app/src/main/AndroidManifest.xml` for network permissions
   - Ensure `usesCleartextTraffic="true"` for HTTP connections

4. **WebView not loading**:
   - Check the URL in `AppConfig.js`
   - Verify network connectivity
   - Check Android network security config

### Performance Optimization

1. **Enable Hermes**: Already enabled in `android/app/build.gradle`
2. **Optimize Images**: Use appropriate image sizes and formats
3. **Bundle Size**: Use `npx react-native bundle` to analyze bundle size
4. **Memory Usage**: Monitor with Android Studio profiler

## Deployment

### Google Play Store

1. **Prepare assets**: Icons, screenshots, descriptions
2. **Build signed APK**: Follow production build steps
3. **Upload to Play Console**: Create app listing and upload APK
4. **Testing**: Use internal testing before public release

### Internal Distribution

1. **Build debug APK**: `npm run build:android-debug`
2. **Share APK file**: Distribute directly to users
3. **Enable unknown sources**: Users need to enable installation from unknown sources

## Support

For issues and questions:

1. **Check logs**: Use `adb logcat` for Android logs
2. **Debug mode**: Enable debug mode in `AppConfig.js`
3. **Network issues**: Check connectivity and URL configuration
4. **Build issues**: Clean and rebuild the project

## License

This project is part of the Elite Laundry Management System.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This mobile app is a WebView wrapper around the existing web application. Ensure the web application is mobile-responsive and accessible via the configured URL.