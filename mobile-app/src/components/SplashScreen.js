import React, {useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import SplashScreenNative from 'react-native-splash-screen';
import AppConfig from '../config/AppConfig';

const SplashScreen = ({onFinish}) => {
  useEffect(() => {
    // Hide the native splash screen
    SplashScreenNative.hide();
    
    // Show custom splash screen for configured duration
    const timer = setTimeout(() => {
      onFinish();
    }, AppConfig.splashScreenDuration);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={AppConfig.colors.primary}
        barStyle="light-content"
      />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBackground}>
          <View style={styles.logoInner}>
            {/* Hanger Icon - Simple representation */}
            <View style={styles.hangerIcon}>
              <View style={styles.hangerHook} />
              <View style={styles.hangerArms} />
              <View style={styles.hangerBar} />
            </View>
          </View>
        </View>
      </View>

      {/* App Name */}
      <Text style={styles.appName}>{AppConfig.appName}</Text>
      
      {/* Tagline */}
      <Text style={styles.tagline}>{AppConfig.tagline}</Text>
      
      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={AppConfig.colors.primary}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
      
      {/* Version */}
      <Text style={styles.version}>v{AppConfig.appVersion}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppConfig.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBackground: {
    width: 100,
    height: 100,
    backgroundColor: AppConfig.colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 76,
    height: 76,
    backgroundColor: AppConfig.colors.background,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangerIcon: {
    width: 40,
    height: 30,
    position: 'relative',
  },
  hangerHook: {
    position: 'absolute',
    top: 0,
    left: 18,
    width: 4,
    height: 8,
    backgroundColor: AppConfig.colors.primary,
    borderRadius: 2,
  },
  hangerArms: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: 40,
    height: 2,
    backgroundColor: AppConfig.colors.primary,
    transform: [{rotate: '0deg'}],
  },
  hangerBar: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    width: 40,
    height: 2,
    backgroundColor: AppConfig.colors.primary,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: AppConfig.colors.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: AppConfig.colors.accent,
    marginBottom: 50,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: AppConfig.colors.textSecondary,
  },
  version: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: AppConfig.colors.textSecondary,
  },
});

export default SplashScreen;