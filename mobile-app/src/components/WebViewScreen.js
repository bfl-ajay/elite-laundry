import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Alert,
  StatusBar,
  ActivityIndicator,
  Text,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useFocusEffect} from '@react-navigation/native';
import AppConfig from '../config/AppConfig';
import NetworkStatus from './NetworkStatus';
import LoadingOverlay from './LoadingOverlay';
import ErrorScreen from './ErrorScreen';

const WebViewScreen = () => {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(AppConfig.webAppUrl);

  // Handle Android back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        } else {
          // Show exit confirmation
          Alert.alert(
            'Exit App',
            'Are you sure you want to exit?',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Exit', onPress: () => BackHandler.exitApp()},
            ],
            {cancelable: false}
          );
          return true;
        }
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [canGoBack])
  );

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
    setError(null);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent) => {
    const {nativeEvent} = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    setError({
      code: nativeEvent.code,
      description: nativeEvent.description,
      url: nativeEvent.url,
    });
    setIsLoading(false);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleGoHome = () => {
    setError(null);
    setIsLoading(true);
    setCurrentUrl(AppConfig.webAppUrl);
    if (webViewRef.current) {
      webViewRef.current.stopLoading();
      // Force navigation to home URL
      webViewRef.current.injectJavaScript(`
        window.location.href = '${AppConfig.webAppUrl}';
        true;
      `);
    }
  };

  // JavaScript to inject into WebView for better mobile experience
  const injectedJavaScript = `
    // Disable zoom
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);
    
    // Add mobile-specific styles
    const style = document.createElement('style');
    style.innerHTML = \`
      body {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
    \`;
    document.head.appendChild(style);
    
    // Notify native app about page changes
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'PAGE_LOADED',
      url: window.location.href,
      title: document.title
    }));
    
    true;
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView Message:', data);
      
      switch (data.type) {
        case 'PAGE_LOADED':
          console.log('Page loaded:', data.url, data.title);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={handleRetry}
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={AppConfig.colors.primary}
        barStyle="light-content"
      />
      
      <NetworkStatus />
      
      <WebView
        ref={webViewRef}
        source={{uri: currentUrl}}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={AppConfig.webViewConfig.javaScriptEnabled}
        domStorageEnabled={AppConfig.webViewConfig.domStorageEnabled}
        startInLoadingState={AppConfig.webViewConfig.startInLoadingState}
        scalesPageToFit={AppConfig.webViewConfig.scalesPageToFit}
        allowsBackForwardNavigationGestures={AppConfig.webViewConfig.allowsBackForwardNavigationGestures}
        cacheEnabled={AppConfig.webViewConfig.cacheEnabled}
        cacheMode={AppConfig.webViewConfig.cacheMode}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        userAgent="EliteLaundryMobile/1.0.0 (Android)"
      />
      
      {isLoading && <LoadingOverlay />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppConfig.colors.surface,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;