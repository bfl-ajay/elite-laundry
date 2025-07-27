import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import AppConfig from '../config/AppConfig';

const LoadingOverlay = ({message = 'Loading...'}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color={AppConfig.colors.primary}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    backgroundColor: AppConfig.colors.surface,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    color: AppConfig.colors.text,
    textAlign: 'center',
  },
});

export default LoadingOverlay;