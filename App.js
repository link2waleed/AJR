import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import './src/services/FirebaseInit'; // Firebase init first
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, SubscriptionProvider, UpdateProvider } from './src/context';
import NotificationService from './src/services/NotificationService';
import FirebaseService from './src/services/FirebaseService';
import StorageService from './src/services/StorageService';

// ── Bootstrap notifications on every app start ────────────────────────────────
async function bootstrapNotifications() {
  try {
    console.log('[APP] Starting notification bootstrap...');
    await NotificationService.setupChannels();
    // Clear any stale queued prayer notifications from older app logic/text.
    await NotificationService.cancelAllPrayerNotifications();

    // Load prayer settings from DB (only if authenticated)
    const currentUser = require('@react-native-firebase/auth').default().currentUser;
    if (!currentUser) {
      console.log('[APP] No authenticated user, skipping notification bootstrap');
      return;
    }
    
    const info = await FirebaseService.getOnboardingInfo();
    const prayer = info?.prayer;
    if (!prayer) {
      console.log('[APP] No prayer settings found in database, skipping bootstrap');
      return;
    }
    console.log('[APP] Prayer settings loaded:', JSON.stringify(prayer, null, 2));

    // Load cached timings with timezone
    let fullData = await StorageService.getFullTimings();

    // If cache is stale/empty, fetch fresh from API
    if (!fullData) {
      console.log('[APP] No cached timings — fetching fresh from API...');
      const location = await StorageService.getLocation();
      if (location?.latitude && location?.longitude) {
        const PrayerTimeService = require('./src/services/PrayerTimeService').default;
        const prayerData = await PrayerTimeService.getCompletePrayerData(
          location.latitude, location.longitude
        );
        if (prayerData?.timings && prayerData?.timezone) {
          fullData = { timings: prayerData.timings, timezone: prayerData.timezone };
          console.log('[APP] Fresh timings fetched successfully');
        }
      }
    }

    if (!fullData) {
      console.warn('[APP] Could not get prayer timings — notifications will be scheduled later');
      return;
    }
    console.log('[APP] Timings loaded:', { timings: fullData.timings, timezone: fullData.timezone });

    const { timings, timezone } = fullData;
    const parsePrayer = (val) => {
      if (val && typeof val === 'object') return val;
      return { enabled: val ?? false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' };
    };

    await NotificationService.schedulePrayerNotifications(
      {
        fajr: parsePrayer(prayer.fajr),
        dhuhr: parsePrayer(prayer.dhuhr),
        asr: parsePrayer(prayer.asr),
        maghrib: parsePrayer(prayer.maghrib),
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
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    bootstrapNotifications();
    // Register for push notifications and save FCM token
    NotificationService.registerForPushNotifications();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasInBackground = appStateRef.current === 'background' || appStateRef.current === 'inactive';
      if (wasInBackground && nextState === 'active') {
        // Re-bootstrap on foreground so time/location changes re-schedule notifications.
        bootstrapNotifications();
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
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
      <UpdateProvider>
        <ThemeProvider>
          <SubscriptionProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </SubscriptionProvider>
        </ThemeProvider>
      </UpdateProvider>
    </SafeAreaProvider>
  );
}
