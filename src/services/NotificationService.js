import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import PrayerTimeService from './PrayerTimeService';
import StorageService from './StorageService';
import FirebaseService from './FirebaseService';
import messaging from '@react-native-firebase/messaging';

// ─── Sound file names (must match files bundled via app.json expo-notifications plugin) ──
// Android: file lives in android/app/src/main/res/raw/  — SoundResolver strips extension
// iOS:     file lives in the app bundle root (copied by expo-notifications config plugin)
const ANDROID_SOUND = 'azan_android.mp3';
const IOS_SOUND     = 'azan_ios.wav';

// ─── Android Notification Channels ───────────────────────────────────────────
// IMPORTANT: Android does NOT allow modifying a channel's sound after creation.
// Bumping the version suffix (e.g. v4 → v5) forces a fresh channel with the
// correct sound.  Old channels are deleted in setupChannels().
const CHANNEL_VERSION = 'v5';

const CHANNELS = {
    athan: {
        id: `ajr_athan_${CHANNEL_VERSION}`,
        name: 'Athan Alert',
        description: 'Full Athan call to prayer notification',
        importance: Notifications.AndroidImportance.MAX,
        sound: ANDROID_SOUND,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
    },
    beep: {
        id: `ajr_beep_${CHANNEL_VERSION}`,
        name: 'Prayer Beep',
        description: 'Short beep notification for prayer',
        importance: Notifications.AndroidImportance.HIGH,
        sound: ANDROID_SOUND,
        vibrationPattern: [0, 150],
        enableVibrate: true,
    },
    vibration: {
        id: `ajr_vibration_${CHANNEL_VERSION}`,
        name: 'Prayer Vibration',
        description: 'Vibration-only prayer notification',
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        vibrationPattern: [0, 400, 200, 400, 200, 400],
        enableVibrate: true,
    },
    silent: {
        id: `ajr_silent_${CHANNEL_VERSION}`,
        name: 'Silent Prayer Alert',
        description: 'Silent visual-only prayer notification',
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        vibrationPattern: null,
        enableVibrate: false,
    },
    alerts: {
        id: `ajr_alerts_${CHANNEL_VERSION}`,
        name: 'General Alerts',
        description: 'General application alerts and notifications',
        importance: Notifications.AndroidImportance.HIGH,
        sound: undefined,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
    },
};

// Previous channel IDs that should be cleaned up
const OLD_CHANNEL_IDS = [
    'ajr_athan_v4', 'ajr_beep_v4', 'ajr_vibration_v4', 'ajr_silent_v4', 'ajr_alerts_v4',
    'ajr_athan_v3', 'ajr_beep_v3', 'ajr_vibration_v3', 'ajr_silent_v3', 'ajr_alerts_v3',
];

const PRAYER_LABELS = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
};

// Ordered list used for "next prayer" 20-min reminder lookups
const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

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
            // 1. Clean up any old version channels first
            for (const oldId of OLD_CHANNEL_IDS) {
                try {
                    await Notifications.deleteNotificationChannelAsync(oldId);
                    console.log(`[NOTIFICATION] Cleaned up old channel ${oldId}`);
                } catch (_) { /* channel didn't exist — fine */ }
            }

            // 2. Delete + recreate current-version channels so sound settings are always fresh
            for (const [key, ch] of Object.entries(CHANNELS)) {
                try {
                    await Notifications.deleteNotificationChannelAsync(ch.id);
                    console.log(`[NOTIFICATION] Deleted existing channel ${ch.id}`);
                } catch (_) {
                    console.log(`[NOTIFICATION] No existing channel to delete for ${ch.id}`);
                }

                const channelConfig = {
                    name: ch.name,
                    description: ch.description,
                    importance: ch.importance,
                    enableVibrate: ch.enableVibrate,
                    showBadge: false,
                };
                // Explicitly pass sound: null means "no sound", a string means custom sound.
                // Do NOT use undefined — that makes Android fall back to the default system sound.
                if (ch.sound !== undefined) {
                    channelConfig.sound = ch.sound; // null for no-sound, string for custom
                }
                if (ch.vibrationPattern) {
                    channelConfig.vibrationPattern = ch.vibrationPattern;
                }

                console.log(`[NOTIFICATION] Creating channel "${key}" (${ch.id}) with sound=${JSON.stringify(ch.sound)}, vibrate=${ch.enableVibrate}`);
                await Notifications.setNotificationChannelAsync(ch.id, channelConfig);

                // Verify the channel was created correctly
                const created = await Notifications.getNotificationChannelAsync(ch.id);
                console.log(`[NOTIFICATION] Channel "${key}" verified: sound=${created?.sound}, vibrationPattern=${JSON.stringify(created?.vibrationPattern)}`);
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
     * Skips any notification that is in the past.
     */
    async scheduleAt({ title, body, date, soundMode, data = {} }) {
        const now = new Date();
        const secondsFromNow = Math.floor((date.getTime() - now.getTime()) / 1000);
        const BUFFER_SECONDS = 5;

        if (secondsFromNow < BUFFER_SECONDS) {
            console.log(`[NOTIFICATION] Skipping past notification "${title}" (${secondsFromNow}s from now)`);
            return null;
        }

        const channel = CHANNELS[soundMode] ?? CHANNELS.beep;
        const noSound = soundMode === 'vibration' || soundMode === 'silent';

        // ── Resolve sound per platform ──────────────────────────────────────
        // iOS:     string filename → UNNotificationSound(named:) in native
        //          false           → no sound
        // Android: string filename → SoundResolver finds it in res/raw/
        //          On API 26+ the channel ultimately controls the sound,
        //          but we still set content.sound so pre-26 devices and
        //          the builder's shouldPlaySound() gate work correctly.
        let soundValue;
        if (noSound) {
            soundValue = false;                                     // explicitly no sound
        } else {
            soundValue = Platform.OS === 'ios' ? IOS_SOUND : ANDROID_SOUND;
        }

        try {
            const notificationContent = {
                title,
                body,
                sound: soundValue,
                data: { ...data, type: 'prayer' },
            };

            // iOS-specific: time-sensitive interruption level
            if (Platform.OS === 'ios') {
                notificationContent.interruptionLevel = 'timeSensitive';
            }

            // On Android, channelId MUST be in the trigger (not content) —
            // the native NotificationScheduler reads it from trigger params.
            const trigger = {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date,
            };
            if (Platform.OS === 'android') {
                trigger.channelId = channel.id;
            }

            console.log(
                `[NOTIFICATION] Scheduling "${title}"`,
                JSON.stringify({
                    type: 'DATE',
                    date: date.toISOString(),
                    channelId: channel.id,
                    soundMode,
                    soundValue: typeof soundValue === 'string' ? soundValue : String(soundValue),
                    platform: Platform.OS,
                })
            );

            const id = await Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger,
            });

            console.log(
                `[NOTIFICATION] ✅ Scheduled "${title}" at ${date.toISOString()}`,
                `(${Math.round(secondsFromNow / 60)}min, id=${id}, soundMode=${soundMode}, sound=${typeof soundValue === 'string' ? soundValue : String(soundValue)}, ch=${channel.id})`
            );
            return id;
        } catch (err) {
            console.error(`[NOTIFICATION] ❌ scheduleAt error for "${title}":`, err);
            return null;
        }
    },

    /**
     * Parse "HH:MM" time string into Date using PrayerTimeService's reliable timezone logic.
     * Uses provided base date for day/month/year context.
     */
    _parseTime(timeStr, timezone = 'UTC', baseDate = new Date()) {
        if (!timeStr) {
            console.warn('[NOTIFICATION] _parseTime called with empty timeStr');
            return null;
        }
        // Pass baseDate directly so parseTimeToDateWithTimezone uses the
        // correct year/month/day in the prayer location's timezone.
        const result = PrayerTimeService.parseTimeToDateWithTimezone(timeStr, timezone, baseDate);
        if (result) {
            console.log(`[NOTIFICATION] Parsed ${timeStr} in ${timezone} for ${baseDate.toDateString()} -> ${result.toISOString()}`);
        } else {
            console.warn(`[NOTIFICATION] Failed to parse time: ${timeStr} in ${timezone}`);
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
     * Fetch prayer data with retry logic (up to maxRetries attempts).
     * Returns null only if all attempts fail.
     */
    async _fetchWithRetry(lat, lng, date, school, maxRetries = 2) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const data = await PrayerTimeService.getCompletePrayerData(lat, lng, date, school);
                if (data) return data;
            } catch (err) {
                console.warn(`[NOTIFICATION] Fetch attempt ${attempt + 1} failed:`, err.message);
                if (attempt < maxRetries) {
                    // Wait 1 second before retrying
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
        return null;
    },

    /**
     * Main entry point — schedule all enabled prayer notifications.
     *
     * @param {Object} prayerSettings  Per-prayer settings object
     * @param {Object} prayerTimings   { Fajr: "05:19", Dhuhr: "12:16", ... }
     * @param {string} timezone        IANA timezone (e.g., 'Europe/London', 'Asia/Karachi')
     */
    async schedulePrayerNotifications(prayerSettings, prayerTimings, timezone = 'UTC') {
        console.log('[NOTIFICATION] Starting schedulePrayerNotifications (Bulk 6-day)...');

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

        // Schedule for today + next 5 days (6 days total)
        for (let dayOffset = 0; dayOffset < 6; dayOffset++) {
            const date = new Date();
            date.setDate(date.getDate() + dayOffset);

            let dayTimings = prayerTimings;
            let dayTimezone = timezone;

            // Fetch timings for future days
            if (dayOffset > 0 && location?.latitude && location?.longitude) {
                const data = await this._fetchWithRetry(location.latitude, location.longitude, date, school);
                if (data) {
                    dayTimings = data.timings;
                    dayTimezone = data.timezone;
                } else {
                    // Fallback: use today's timings (times shift by ~1 min/day, so still very close)
                    console.warn(`[NOTIFICATION] Using today's timings as fallback for day +${dayOffset}`);
                }
            }

            // Also fetch next day timings for the Isha 20-min reminder
            let nextDayTimings = null;
            let nextDayTimezone = dayTimezone;
            if (location?.latitude && location?.longitude) {
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                const nextData = await this._fetchWithRetry(location.latitude, location.longitude, nextDate, school, 1);
                if (nextData) {
                    nextDayTimings = nextData.timings;
                    nextDayTimezone = nextData.timezone;
                }
            }

            const dailyCount = await this._scheduleSingleDay(prayerSettings, dayTimings, dayTimezone, date, nextDayTimings, nextDayTimezone);
            totalScheduled += dailyCount;
        }

        const total = await this.getScheduledCount();
        console.log(`[NOTIFICATION] SUCCESS: ${totalScheduled} scheduled across 6 days, ${total} total in queue`);
    },

    /**
     * Internal helper to schedule notifications for a specific date.
     * Now reads per-prayer soundMode and handles 20-min reminders.
     */
    async _scheduleSingleDay(prayerSettings, prayerTimings, timezone, date, nextDayTimings, nextDayTimezone) {
        let scheduledCount = 0;

        const prayerMap = [
            { local: 'fajr', timingKey: 'Fajr' },
            { local: 'dhuhr', timingKey: 'Dhuhr' },
            { local: 'asr', timingKey: 'Asr' },
            { local: 'maghrib', timingKey: 'Maghrib' },
            { local: 'isha', timingKey: 'Isha' },
        ];

        // Map local keys to timing keys for next-prayer lookups
        const localToTimingKey = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

        for (let i = 0; i < prayerMap.length; i++) {
            const { local, timingKey } = prayerMap[i];
            // Support both 'duhur' (old UI key) and 'dhuhr' (DB key) for backward compat
            const settings = prayerSettings[local] || prayerSettings[local === 'dhuhr' ? 'duhur' : local];
            const label = PRAYER_LABELS[local] || timingKey;

            if (!settings?.enabled) continue;

            // Use per-prayer soundMode, falling back to global soundMode for backward compat
            const soundMode = settings.soundMode || prayerSettings.soundMode || 'athan';

            const prayerTimeStr = prayerTimings?.[timingKey];
            const prayerDate = this._parseTime(prayerTimeStr, timezone, date);
            const prayerAlreadyPassed = this._hasPrayerPassed(prayerTimeStr, timezone, date);

            // 1️⃣  At-prayer-time notification
            if (!prayerAlreadyPassed && prayerDate) {
                const id = await this.scheduleAt({
                    title: `🕌 ${label} Prayer`,
                    body: `It's time for ${label} prayer`,
                    date: prayerDate,
                    soundMode,
                    data: { prayer: local, notifType: 'start' },
                });
                if (id) scheduledCount++;
            }

            // 2️⃣  20-minute reminder before the NEXT prayer
            if (settings.reminderEnabled) {
                const nextPrayerIndex = i + 1;
                let nextPrayerLabel = null;
                let nextPrayerDate = null;

                if (local === 'fajr') {
                    // Fajr ends at Sunrise
                    nextPrayerLabel = 'Sunrise';
                    const sunriseTimeStr = prayerTimings?.['Sunrise'];
                    nextPrayerDate = this._parseTime(sunriseTimeStr, timezone, date);
                } else if (nextPrayerIndex < prayerMap.length) {
                    // Next prayer is within the same day
                    const nextEntry = prayerMap[nextPrayerIndex];
                    nextPrayerLabel = PRAYER_LABELS[nextEntry.local] || nextEntry.timingKey;
                    const nextTimeStr = prayerTimings?.[nextEntry.timingKey];
                    nextPrayerDate = this._parseTime(nextTimeStr, timezone, date);
                } else if (nextDayTimings) {
                    // This is Isha — next prayer is tomorrow's Fajr
                    nextPrayerLabel = 'Fajr';
                    const fajrTimeStr = nextDayTimings?.Fajr;
                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    nextPrayerDate = this._parseTime(fajrTimeStr, nextDayTimezone || timezone, nextDay);
                }

                if (nextPrayerDate && nextPrayerLabel) {
                    const reminderDate = new Date(nextPrayerDate.getTime() - 20 * 60 * 1000);
                    if (reminderDate > new Date()) {
                        const remId = await this.scheduleAt({
                            title: `⏰ ${label} Reminder`,
                            body: `20 minutes left in ${label} prayer time`,
                            date: reminderDate,
                            soundMode,
                            data: { prayer: local, notifType: 'reminder' },
                        });
                        if (remId) scheduledCount++;
                    }
                }
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
                    } else if (n.trigger.type === 'timeInterval') {
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
