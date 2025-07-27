import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar} from 'react-native';
import SplashScreen from './components/SplashScreen';
import WebViewScreen from './components/WebViewScreen';
import AppConfig from './config/AppConfig';

const Stack = createStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <NavigationContainer>
      <StatusBar
        backgroundColor={AppConfig.colors.primary}
        barStyle="light-content"
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen
          name="WebView"
          component={WebViewScreen}
          options={{
            title: AppConfig.appName,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;