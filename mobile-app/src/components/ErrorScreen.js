import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AppConfig from '../config/AppConfig';

const ErrorScreen = ({error, onRetry, onGoHome}) => {
  const getErrorMessage = () => {
    if (error?.description) {
      return error.description;
    }
    
    switch (error?.code) {
      case -1009:
        return 'No internet connection. Please check your network settings.';
      case -1001:
        return 'Request timed out. Please try again.';
      case -1004:
        return 'Could not connect to server. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const getErrorTitle = () => {
    switch (error?.code) {
      case -1009:
        return 'No Internet Connection';
      case -1001:
        return 'Connection Timeout';
      case -1004:
        return 'Server Unavailable';
      default:
        return 'Connection Error';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>

        {/* Error Title */}
        <Text style={styles.title}>{getErrorTitle()}</Text>

        {/* Error Message */}
        <Text style={styles.message}>{getErrorMessage()}</Text>

        {/* Error Details (for debugging) */}
        {AppConfig.enableDebugMode && error && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Information:</Text>
            <Text style={styles.debugText}>Code: {error.code}</Text>
            <Text style={styles.debugText}>URL: {error.url}</Text>
            {error.description && (
              <Text style={styles.debugText}>Description: {error.description}</Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onGoHome}>
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          If the problem persists, please check your internet connection or contact support.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppConfig.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppConfig.colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: AppConfig.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  debugContainer: {
    backgroundColor: AppConfig.colors.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppConfig.colors.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: AppConfig.colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: AppConfig.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppConfig.colors.primary,
  },
  secondaryButtonText: {
    color: AppConfig.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: AppConfig.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ErrorScreen;