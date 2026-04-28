import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import PrayerTimeService from './PrayerTimeService';
import StorageService from './StorageService';
import FirebaseService from './FirebaseService';
import messaging from '@react-native-firebase/messaging';

const ANDROID_SOUND = 'azan_android';
const IOS_SOUND = 'azan_ios.wav';

// ─── Android Notification Channels ───────────────────────────────────────────
const CHANNELS = {
    athan: {
        id: 'ajr_athan',
        name: 'Athan Alert',
        description: 'Full Athan call to prayer notification',
        importance: Notifications.AndroidImportance.MAX,
        sound: ANDROID_SOUND,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
    },
    beep: {
        id: 'ajr_beep',
        name: 'Prayer Beep',
        description: 'Short beep notification for prayer',
        importance: Notifications.AndroidImportance.HIGH,
        sound: ANDROID_SOUND,
        vibrationPattern: [0, 150],
        enableVibrate: true,
    },
    vibration: {
        id: 'ajr_vibration',
        name: 'Prayer Vibration',
        description: 'Vibration-only prayer notification',
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        vibrationPattern: [0, 400, 200, 400, 200, 400],
        enableVibrate: true,
    },
    silent: {
        id: 'ajr_silent',
        name: 'Silent Prayer Alert',
        description: 'Silent visual-only prayer notification',
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        vibrationPattern: null,
        enableVibrate: false,
    },
};

const PRAYER_LABELS = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
};

// ─── Foreground handler — show notifications even when app is open ─────────────
Notifications.setNotificationHandler({
    handleNotification: async () => {
        console.log('[NOTIFICATION] Foreground notification received');
        return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        };
    },
});

// ─── NotificationService ──────────────────────────────────────────────────────
const NotificationService = {

    /**
     * Register for push notifications and save the token to Firestore.
     * Should be called on app boot after authentication.
     */
    async registerForPushNotifications() {
        try {
            const granted = await this.requestPermissions();
            if (!granted) {
                console.log('[NOTIFICATION] Push permission not granted, skipping token registration');
                return null;
            }

            // Register for Firebase Cloud Messaging
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!enabled) {
                console.log('[NOTIFICATION] FCM permission not granted');
                return null;
            }

            // Get the native FCM token
            const token = await messaging().getToken();
            
            if (token) {
                console.log('[NOTIFICATION] FCM token:', token);
                await FirebaseService.saveFCMToken(token);
                return token;
            }
        } catch (err) {
            console.error('[NOTIFICATION] registerForPushNotifications error:', err);
        }
        return null;
    },


    /**
     * Request notification permissions.
     * Returns true if granted.
     */
    async requestPermissions() {
        try {
            const { status: existing } = await Notifications.getPermissionsAsync();
            console.log(`[NOTIFICATION] Current permission status: ${existing}`);
            if (existing === 'granted') {
                console.log('[NOTIFICATION] Permission already granted');
                return true;
            }

            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: false,
                    allowSound: true,
                },
            });
            console.log(`[NOTIFICATION] Permission request result: ${status}`);
            if (status !== 'granted') {
                console.warn('[NOTIFICATION] Permission was not granted:', status);
            }
            return status === 'granted';
        } catch (err) {
            console.error('[NOTIFICATION] requestPermissions error:', err);
            return false;
        }
    },

    /**
     * Create Android notification channels.
     */
    async setupChannels() {
        if (Platform.OS !== 'android') {
            console.log('[NOTIFICATION] Platform is not Android, skipping channel setup');
            return;
        }
        try {
            for (const [key, ch] of Object.entries(CHANNELS)) {
                await Notifications.setNotificationChannelAsync(ch.id, {
                    name: ch.name,
                    description: ch.description,
                    importance: ch.importance,
                    sound: ch.sound ?? undefined,
                    vibrationPattern: ch.vibrationPattern ?? undefined,
                    enableVibrate: ch.enableVibrate,
                    showBadge: false,
                });
                console.log(`[NOTIFICATION] Android channel "${key}" (${ch.id}) set up`);
            }
        } catch (err) {
            console.error('[NOTIFICATION] setupChannels error:', err);
        }
    },

    /**
     * Cancel all previously scheduled AJR prayer notifications.
     */
    async cancelAllPrayerNotifications() {
        try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const prayerNotifs = scheduled.filter(n => n.content?.data?.type === 'prayer');
            console.log(`[NOTIFICATION] Found ${scheduled.length} total scheduled notifications, ${prayerNotifs.length} are prayer notifications`);
            for (const notif of prayerNotifs) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                console.log(`[NOTIFICATION] Cancelled notification id=${notif.identifier}`);
            }
            console.log(`[NOTIFICATION] Cancelled ${prayerNotifs.length} old prayer notifications`);
        } catch (err) {
            console.error('[NOTIFICATION] cancelAll error:', err);
        }
    },

    /**
     * Schedule a single notification at a future Date.
     * Uses DATE trigger so notifications track real clock time correctly.
     * Skips any notification that is in the past (e.g. when device comes online after prayer time).
     */
    async scheduleAt({ title, body, date, soundMode, data = {} }) {
        const now = new Date();
        const secondsFromNow = Math.floor((date.getTime() - now.getTime()) / 1000);
        const BUFFER_SECONDS = 5; // Keep small buffer so near-time manual tests are not skipped

        if (secondsFromNow < BUFFER_SECONDS) {
            console.log(`[NOTIFICATION] Skipping past notification "${title}" (${secondsFromNow}s from now, now=${now.toISOString()}, scheduled=${date.toISOString()})`);
            return null;
        }

        const channel = CHANNELS[soundMode] ?? CHANNELS.beep;
        const noSound = soundMode === 'vibration' || soundMode === 'silent';
        const customSound = Platform.OS === 'ios' ? IOS_SOUND : ANDROID_SOUND;

        try {
            const notificationContent = {
                title,
                body,
                sound: noSound ? null : customSound,
                data: { ...data, type: 'prayer' },
                ...(Platform.OS === 'android' && { channelId: channel.id }),
            };

            const id = await Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date,
                },
            });

            console.log(
                `[NOTIFICATION] Scheduled "${title}" at ${date.toISOString()} (${Math.round(secondsFromNow / 60)}min from now, id=${id}, soundMode=${soundMode}, channel=${channel.id})`
            );
            return id;
        } catch (err) {
            console.error(`[NOTIFICATION] scheduleAt error for "${title}":`, err);
            return null;
        }
    },

    /**
     * Parse "HH:MM" time string into Date using PrayerTimeService's reliable timezone logic.
     * Uses provided base date for day/month/year context.
     */
    _parseTime(timeStr, timezone = 'UTC', baseDate = new Date()) {
        const result = PrayerTimeService.parseTimeToDateWithTimezone(timeStr, timezone);
        if (result) {
            // Adjust the result to the correct day if baseDate is not today
            const dayDiff = Math.floor((baseDate.getTime() - new Date().setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000));
            if (dayDiff !== 0) {
                result.setDate(result.getDate() + dayDiff);
            }
            console.log(`[NOTIFICATION] Parsed ${timeStr} for day +${dayDiff} in ${timezone} -> ${result.toISOString()}`);
        }
        return result;
    },

    /**
     * Check if a prayer time has already passed (relative to now).
     */
    _hasPrayerPassed(prayerTimeStr, timezone, baseDate = new Date()) {
        if (!prayerTimeStr) return true;
        const prayerDate = this._parseTime(prayerTimeStr, timezone, baseDate);
        if (!prayerDate) return true;
        return prayerDate < new Date();
    },

    /**
     * Main entry point — schedule all enabled prayer notifications.
     *
     * @param {Object} prayerSettings  DB prayer object + soundMode
     * @param {Object} prayerTimings   { Fajr: "05:19", Dhuhr: "12:16", ... }
     * @param {string} timezone        IANA timezone (e.g., 'Europe/London', 'Asia/Karachi')
     */
    async schedulePrayerNotifications(prayerSettings, prayerTimings, timezone = 'UTC') {
        console.log('[NOTIFICATION] Starting schedulePrayerNotifications (Bulk 10-day)...');

        const granted = await this.requestPermissions();
        if (!granted) {
            console.warn('[NOTIFICATION] ERROR: permission denied — cannot schedule');
            return;
        }

        await this.setupChannels();
        await this.cancelAllPrayerNotifications();

        // Get coordinates to fetch future timings
        const location = await StorageService.getLocation();
        const school = await StorageService.getSchoolPreference();

        let totalScheduled = 0;

        // Schedule for today + next 9 days
        for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
            const date = new Date();
            date.setDate(date.getDate() + dayOffset);

            let dayTimings = prayerTimings;
            let dayTimezone = timezone;

            // Fetch timings for future days or if location is available
            if (dayOffset > 0 && location?.latitude && location?.longitude) {
                try {
                    const data = await PrayerTimeService.getCompletePrayerData(
                        location.latitude,
                        location.longitude,
                        date,
                        school
                    );
                    if (data) {
                        dayTimings = data.timings;
                        dayTimezone = data.timezone;
                    } else {
                        console.warn(`[NOTIFICATION] Failed to fetch timings for day +${dayOffset}, skipping`);
                        continue;
                    }
                } catch (err) {
                    console.error(`[NOTIFICATION] Error fetching timings for day +${dayOffset}:`, err);
                    continue;
                }
            }

            const dailyCount = await this._scheduleSingleDay(prayerSettings, dayTimings, dayTimezone, date);
            totalScheduled += dailyCount;
        }

        const total = await this.getScheduledCount();
        console.log(`[NOTIFICATION] SUCCESS: ${totalScheduled} scheduled across 10 days, ${total} total in queue`);
    },

    /**
     * Internal helper to schedule notifications for a specific date.
     */
    async _scheduleSingleDay(prayerSettings, prayerTimings, timezone, date) {
        const soundMode = prayerSettings.soundMode || 'athan';
        let scheduledCount = 0;

        const prayerMap = [
            { local: 'fajr', timingKey: 'Fajr' },
            { local: 'duhur', timingKey: 'Dhuhr' },
            { local: 'asr', timingKey: 'Asr' },
            { local: 'maghrib', timingKey: 'Maghrib' },
            { local: 'isha', timingKey: 'Isha' },
        ];

        for (let i = 0; i < prayerMap.length; i++) {
            const { local, timingKey } = prayerMap[i];
            const settings = prayerSettings[local];
            const label = PRAYER_LABELS[local] || timingKey;

            if (!settings?.enabled) continue;

            const prayerTimeStr = prayerTimings?.[timingKey];
            const prayerDate = this._parseTime(prayerTimeStr, timezone, date);

            const prayerAlreadyPassed = this._hasPrayerPassed(prayerTimeStr, timezone, date);

            // 1️⃣  Start-of-prayer notification
            if (!prayerAlreadyPassed && settings.athanEnabled !== false && prayerDate) {
                const id = await this.scheduleAt({
                    title: `🕌 ${label} Prayer`,
                    body: `It's time for ${label} prayer`,
                    date: prayerDate,
                    soundMode,
                    data: { prayer: local, notifType: 'start' },
                });
                if (id) scheduledCount++;
            }
        }
        return scheduledCount;
    },

    /**
     * How many prayer notifications are currently queued.
     */
    async getScheduledCount() {
        try {
            const all = await Notifications.getAllScheduledNotificationsAsync();
            return all.filter(n => n.content?.data?.type === 'prayer').length;
        } catch {
            return 0;
        }
    },

    /**
     * TESTING HELPER — fire an immediate test notification (5 seconds from now).
     */
    async sendTestNotification() {
        console.log('[NOTIFICATION] Initiating test notification...');
        try {
            const granted = await this.requestPermissions();
            if (!granted) {
                console.error('[NOTIFICATION] Test notification failed: permissions not granted');
                return null;
            }
            await this.setupChannels();
            const testSound = Platform.OS === 'ios' ? IOS_SOUND : ANDROID_SOUND;
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🕌 AJR Test Notification',
                    body: 'Notification system is working correctly!',
                    sound: testSound,
                    data: { type: 'prayer', test: true },
                    ...(Platform.OS === 'android' && { channelId: CHANNELS.athan.id }),
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 5,
                },
            });
            console.log(`[NOTIFICATION] Test notification scheduled (id=${id}), will fire in 5s`);
            return id;
        } catch (err) {
            console.error('[NOTIFICATION] sendTestNotification error:', err);
            return null;
        }
    },

    /**
     * Get the next upcoming scheduled prayer notification.
     */
    async getNextNotification() {
        try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const prayerNotifs = scheduled
                .filter(n => n.content?.data?.type === 'prayer')
                .map(n => {
                    let triggerDate = null;
                    if (n.trigger.type === 'date') {
                        triggerDate = new Date(n.trigger.value);
                    } else if (n.trigger.type === 'calendar') {
                        // Handle calendar trigger if needed, but we mostly use DATE
                    } else if (n.trigger.type === 'timeInterval') {
                        // For test notifications
                        triggerDate = new Date(Date.now() + n.trigger.seconds * 1000);
                    }
                    return { ...n, triggerDate };
                })
                .filter(n => n.triggerDate && n.triggerDate > new Date())
                .sort((a, b) => a.triggerDate - b.triggerDate);

            return prayerNotifs.length > 0 ? prayerNotifs[0] : null;
        } catch (err) {
            console.error('[NOTIFICATION] getNextNotification error:', err);
            return null;
        }
    },
};

export default NotificationService;
