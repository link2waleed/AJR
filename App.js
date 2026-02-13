import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import './src/services/FirebaseInit'; // Firebase init first
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context';

export default function App() {
  const [fontsLoaded] = useFonts({
    Uthmanic: require('./assets/fonts/Uthmanic.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
