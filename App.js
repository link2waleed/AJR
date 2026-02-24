import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import './src/services/FirebaseInit'; // Firebase init first
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context';
import NotificationService from './src/services/NotificationService';
import FirebaseService from './src/services/FirebaseService';
import StorageService from './src/services/StorageService';

// ── Bootstrap notifications on every app start ────────────────────────────────
async function bootstrapNotifications() {
  try {
    await NotificationService.setupChannels();

    // Load prayer settings from DB
    const info = await FirebaseService.getOnboardingInfo();
    const prayer = info?.prayer;
    if (!prayer) return;

    // Load cached timings (only available if prayer times were fetched today)
    const timings = await StorageService.getFullTimings();
    if (!timings) return;

    const globalSound = prayer.soundMode || 'athan';
    const parsePrayer = (val) => {
      if (val && typeof val === 'object') return val;
      return { enabled: val ?? false, athanEnabled: true, reminderEnabled: true };
    };

    await NotificationService.schedulePrayerNotifications(
      {
        fajr: parsePrayer(prayer.fajr),
        duhur: parsePrayer(prayer.dhuhr),
        asr: parsePrayer(prayer.asr),
        mughrib: parsePrayer(prayer.maghrib),
        isha: parsePrayer(prayer.isha),
        soundMode: globalSound,
      },
      timings
    );
  } catch (err) {
    // Non-blocking — notifications are best-effort
    console.warn('bootstrapNotifications failed:', err.message);
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Uthmanic: require('./assets/fonts/Uthmanic.otf'),
  });

  useEffect(() => {
    bootstrapNotifications();
  }, []);

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
