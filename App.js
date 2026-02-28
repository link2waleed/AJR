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
    console.log('[APP] Starting notification bootstrap...');
    await NotificationService.setupChannels();

    // Load prayer settings from DB
    const info = await FirebaseService.getOnboardingInfo();
    const prayer = info?.prayer;
    if (!prayer) {
      console.log('[APP] No prayer settings found in database, skipping bootstrap');
      return;
    }
    console.log('[APP] Prayer settings loaded:', JSON.stringify(prayer, null, 2));

    // Load cached timings with timezone
    const fullData = await StorageService.getFullTimings();
    if (!fullData) {
      console.warn('[APP] No cached timings found, notifications cannot be scheduled');
      return;
    }
    console.log('[APP] Cached timings loaded:', { timings: fullData.timings, timezone: fullData.timezone });

    const { timings, timezone } = fullData;
    const parsePrayer = (val) => {
      if (val && typeof val === 'object') return val;
      return { enabled: val ?? false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' };
    };

    await NotificationService.schedulePrayerNotifications(
      {
        fajr: parsePrayer(prayer.fajr),
        duhur: parsePrayer(prayer.dhuhr),
        asr: parsePrayer(prayer.asr),
        mughrib: parsePrayer(prayer.maghrib),
        isha: parsePrayer(prayer.isha),
        soundMode: prayer.soundMode || 'athan',
      },
      timings,
      timezone
    );
    console.log('[APP] Notification bootstrap completed successfully');
  } catch (err) {
    // Non-blocking — notifications are best-effort
    console.warn('[APP] bootstrapNotifications failed:', err.message, err);
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
