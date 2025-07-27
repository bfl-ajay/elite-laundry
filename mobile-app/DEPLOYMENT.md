# Elite Laundry Mobile App - Deployment Guide

This guide covers the deployment process for the Elite Laundry Mobile App to the Google Play Store and internal distribution.

## Prerequisites

- Android Studio installed and configured
- Google Play Console account (for Play Store deployment)
- Signing key generated for release builds
- App tested thoroughly on multiple devices

## Configuration for Production

### 1. Update App Configuration

Update `src/config/AppConfig.js` with production values:

```javascript
const AppConfig = {
  webAppUrl: 'https://your-production-domain.com',
  apiBaseUrl: 'https://your-production-domain.com/api',
  enableDebugMode: false, // Important: Set to false for production
  // ... other production configurations
};
```

### 2. Generate Signing Key

Generate a signing key for release builds:

```bash
cd android/app
keytool -genkeypair -v -storename elite-laundry-key.keystore -alias elite-laundry -keyalg RSA -keysize 2048 -validity 10000
```

### 3. Configure Gradle for Signing

Create `android/gradle.properties` (or update existing):

```properties
MYAPP_UPLOAD_STORE_FILE=elite-laundry-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=elite-laundry
MYAPP_UPLOAD_STORE_PASSWORD=your_store_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password

# React Native
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=true

# Android
android.useAndroidX=true
android.enableJetifier=true
```

Update `android/app/build.gradle` signing configuration:

```gradle
android {
    ...
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

## Building for Production

### 1. Clean Build

```bash
npm run clean
cd android && ./gradlew clean && cd ..
```

### 2. Build Release APK

```bash
cd android
./gradlew assembleRelease
```

The APK will be generated at: `android/app/build/outputs/apk/release/app-release.apk`

### 3. Build App Bundle (Recommended for Play Store)

```bash
cd android
./gradlew bundleRelease
```

The AAB will be generated at: `android/app/build/outputs/bundle/release/app-release.aab`

## Google Play Store Deployment

### 1. Prepare App Store Assets

Create the following assets:

- **App Icon**: 512x512 PNG
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: Various device sizes
- **App Description**: Short and full descriptions
- **Privacy Policy**: Required for Play Store

### 2. Create Play Console Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new application
3. Fill in app details:
   - **App Name**: Elite Laundry
   - **Description**: Professional laundry management system for mobile devices
   - **Category**: Business
   - **Content Rating**: Everyone

### 3. Upload App Bundle

1. Go to "Release" → "Production"
2. Click "Create new release"
3. Upload the AAB file (`app-release.aab`)
4. Fill in release notes
5. Review and publish

### 4. Store Listing Content

**Short Description** (80 characters):
```
Professional laundry management system for mobile access and operations.
```

**Full Description**:
```
Elite Laundry Mobile App provides complete access to your laundry management system on mobile devices. Manage orders, track expenses, view analytics, and handle all business operations from anywhere.

Features:
• Complete order management system
• Real-time order tracking and updates
• Customer information management
• Business analytics and reporting
• Expense tracking and management
• User role management
• Secure authentication
• Offline notifications
• Native Android experience

Perfect for laundry business owners, managers, and staff who need mobile access to their management system. The app provides a seamless mobile experience while maintaining all the functionality of the web application.

Requirements:
• Android 5.0 (API level 21) or higher
• Internet connection for full functionality
• Access to Elite Laundry web application
```

## Internal Distribution

### 1. Build Debug APK

For internal testing and distribution:

```bash
npm run build:android-debug
```

### 2. Distribute APK

1. Share the APK file directly with users
2. Users need to enable "Install from unknown sources"
3. Provide installation instructions

### 3. Internal Testing via Play Console

1. Upload to "Internal testing" track
2. Add testers by email
3. Share testing link with team

## Version Management

### 1. Update Version Numbers

Update in `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2  // Increment for each release
    versionName "1.1.0"  // Semantic versioning
}
```

Update in `package.json`:

```json
{
  "version": "1.1.0"
}
```

Update in `src/config/AppConfig.js`:

```javascript
appVersion: '1.1.0'
```

### 2. Release Notes Template

```
Version 1.1.0
• New features and improvements
• Bug fixes and performance optimizations
• Enhanced user experience
• Security updates
```

## Post-Deployment

### 1. Monitor App Performance

- Check Google Play Console for crash reports
- Monitor user reviews and ratings
- Track app performance metrics
- Monitor network connectivity issues

### 2. Update Process

1. Make changes to the codebase
2. Test thoroughly on multiple devices
3. Update version numbers
4. Build new release
5. Upload to Play Console
6. Update release notes
7. Publish update

### 3. Rollback Plan

If issues are found after deployment:

1. **Immediate**: Use Play Console to halt rollout
2. **Quick Fix**: Deploy hotfix version
3. **Major Issues**: Rollback to previous version

## Security Considerations

### 1. Code Obfuscation

Enable ProGuard in release builds:

```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

### 2. Network Security

Ensure HTTPS is used for all API calls and configure network security:

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">your-domain.com</domain>
    </domain-config>
</network-security-config>
```

### 3. App Signing

- Keep signing keys secure and backed up
- Use different keys for debug and release
- Consider using Google Play App Signing

## Troubleshooting

### Common Build Issues

1. **Gradle build fails**:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

2. **Signing issues**:
   - Verify keystore path and passwords
   - Check gradle.properties configuration

3. **Bundle size too large**:
   - Enable ProGuard
   - Remove unused dependencies
   - Optimize images and assets

### Play Store Rejection Issues

1. **Privacy Policy**: Ensure privacy policy is accessible
2. **Permissions**: Only request necessary permissions
3. **Content Rating**: Ensure appropriate content rating
4. **Target API**: Meet minimum target API requirements

## Support and Maintenance

### 1. User Support

- Monitor Play Store reviews
- Provide support contact information
- Create FAQ documentation
- Handle user feedback promptly

### 2. Regular Updates

- Security updates
- Bug fixes
- Feature enhancements
- Compatibility updates for new Android versions

### 3. Analytics and Monitoring

- Implement crash reporting (Firebase Crashlytics)
- Monitor app performance
- Track user engagement
- Analyze usage patterns

---

For additional support or questions about deployment, refer to the main README.md or contact the development team.