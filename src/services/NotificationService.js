import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Android Notification Channels ───────────────────────────────────────────
const CHANNELS = {
    athan: {
        id: 'ajr_athan',
        name: 'Athan Alert',
        description: 'Full Athan call to prayer notification',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
    },
    beep: {
        id: 'ajr_beep',
        name: 'Prayer Beep',
        description: 'Short beep notification for prayer',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
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

const REMINDER_OFFSET_MINUTES = 20;

const PRAYER_LABELS = {
    fajr: 'Fajr',
    duhur: 'Dhuhr',
    asr: 'Asr',
    mughrib: 'Maghrib',
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
     * Uses seconds-based trigger for maximum compatibility.
     */
    async scheduleAt({ title, body, date, soundMode, data = {} }) {
        const now = new Date();
        const secondsFromNow = Math.floor((date.getTime() - now.getTime()) / 1000);

        if (secondsFromNow <= 5) {
            console.log(`[NOTIFICATION] Skipping past notification "${title}" (scheduled ${secondsFromNow}s ago, now=${now.toISOString()}, scheduled=${date.toISOString()})`);
            return null;
        }

        const channel = CHANNELS[soundMode] ?? CHANNELS.beep;
        const noSound = soundMode === 'vibration' || soundMode === 'silent';

        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: noSound ? null : 'default',
                    data: { ...data, type: 'prayer' },
                    ...(Platform.OS === 'android' && { channelId: channel.id }),
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: secondsFromNow,
                },
            });

            console.log(
                `[NOTIFICATION] Scheduled "${title}" in ${Math.round(secondsFromNow / 60)}min (id=${id}, soundMode=${soundMode}, channel=${channel.id})`
            );
            return id;
        } catch (err) {
            console.error(`[NOTIFICATION] scheduleAt error for "${title}":`, err);
            return null;
        }
    },

    /**
     * Parse "HH:MM" time string into Date object with timezone awareness.
     * Gets current time in the prayer location's timezone for accurate notification scheduling.
     * @param {string} timeStr - Time in HH:MM format (in prayer location's timezone)
     * @param {string} timezone - IANA timezone (e.g., 'Europe/London', 'Asia/Karachi')
     */
    _parseTime(timeStr, timezone = 'UTC') {
        if (!timeStr) return null;
        const clean = timeStr.split(' ')[0];
        const parts = clean.split(':').map(Number);
        if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;

        if (timezone === 'UTC') {
            // Simple UTC case - just use local time
            const d = new Date();
            d.setHours(parts[0], parts[1], 0, 0);
            return d;
        }

        // Get current time in the prayer location's timezone
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        const tzParts = formatter.formatToParts(now);
        const tzYear = parseInt(tzParts.find(p => p.type === 'year').value, 10);
        const tzMonth = parseInt(tzParts.find(p => p.type === 'month').value, 10) - 1;
        const tzDay = parseInt(tzParts.find(p => p.type === 'day').value, 10);

        // Create a prayer time in the prayer location's timezone
        const prayerTimeInTz = new Date(tzYear, tzMonth, tzDay, parts[0], parts[1], 0);

        // Calculate offset between device timezone and prayer location timezone
        const offset = now.getTime() - new Date(tzYear, tzMonth, tzDay).getTime();

        // Adjust prayer time to device timezone
        const prayerTimeInDeviceTz = new Date(prayerTimeInTz.getTime() + offset);

        console.log(`[NOTIFICATION] Parsed ${timeStr} in ${timezone} timezone -> ${prayerTimeInDeviceTz.toISOString()}`);
        return prayerTimeInDeviceTz;
    },

    /**
     * Main entry point — schedule all enabled prayer notifications.
     *
     * @param {Object} prayerSettings  DB prayer object + soundMode
     * @param {Object} prayerTimings   { Fajr: "05:19", Dhuhr: "12:16", ... }
     * @param {string} timezone        IANA timezone (e.g., 'Europe/London', 'Asia/Karachi')
     */
    async schedulePrayerNotifications(prayerSettings, prayerTimings, timezone = 'UTC') {
        console.log('[NOTIFICATION] Starting schedulePrayerNotifications...');
        console.log('[NOTIFICATION] Timezone:', timezone);
        console.log('[NOTIFICATION] Timings:', JSON.stringify(prayerTimings));
        console.log('[NOTIFICATION] Settings:', JSON.stringify(prayerSettings));

        const granted = await this.requestPermissions();
        if (!granted) {
            console.warn('[NOTIFICATION] ERROR: permission denied — cannot schedule');
            return;
        }

        await this.setupChannels();
        await this.cancelAllPrayerNotifications();

        const soundMode = prayerSettings.soundMode || 'athan';
        let scheduledCount = 0;

        const prayerMap = [
            { local: 'fajr', timingKey: 'Fajr' },
            { local: 'duhur', timingKey: 'Dhuhr' },
            { local: 'asr', timingKey: 'Asr' },
            { local: 'mughrib', timingKey: 'Maghrib' },
            { local: 'isha', timingKey: 'Isha' },
        ];

        for (let i = 0; i < prayerMap.length; i++) {
            const { local, timingKey } = prayerMap[i];
            const settings = prayerSettings[local];
            const label = PRAYER_LABELS[local] || timingKey;

            if (!settings?.enabled) {
                console.log(`  [NOTIFICATION] ⏭ ${label}: disabled`);
                continue;
            }

            const prayerTimeStr = prayerTimings?.[timingKey];
            const prayerDate = this._parseTime(prayerTimeStr, timezone);

            console.log(`  [NOTIFICATION] ✅ ${label}: enabled | time=${prayerTimeStr} | athanEnabled=${settings.athanEnabled} | reminderEnabled=${settings.reminderEnabled}`);

            // 1️⃣  Start-of-prayer notification
            if (settings.athanEnabled !== false && prayerDate) {
                const id = await this.scheduleAt({
                    title: `🕌 ${label} Prayer`,
                    body: soundMode === 'silent'
                        ? `It's time for ${label} prayer`
                        : `It's time for ${label} prayer — Allahu Akbar`,
                    date: prayerDate,
                    soundMode,
                    data: { prayer: local, notifType: 'start' },
                });
                if (id) scheduledCount++;
            }

            // 2️⃣  End-time reminder — 20 min before NEXT prayer
            if (settings.reminderEnabled !== false) {
                const nextTimingKey = i + 1 < prayerMap.length
                    ? prayerMap[i + 1].timingKey
                    : null;

                if (nextTimingKey) {
                    const nextDate = this._parseTime(prayerTimings?.[nextTimingKey], timezone);
                    if (nextDate) {
                        const reminderDate = new Date(nextDate.getTime() - REMINDER_OFFSET_MINUTES * 60 * 1000);
                        const id = await this.scheduleAt({
                            title: `⏰ ${label} Ending Soon`,
                            body: `${REMINDER_OFFSET_MINUTES} minutes left in ${label} prayer time`,
                            date: reminderDate,
                            soundMode: 'beep',
                            data: { prayer: local, notifType: 'reminder' },
                        });
                        if (id) scheduledCount++;
                    }
                }
            }
        }

        const total = await this.getScheduledCount();
        console.log(`[NOTIFICATION] SUCCESS: ${scheduledCount} scheduled this run, ${total} total in queue`);
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
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🕌 AJR Test Notification',
                    body: 'Notification system is working correctly!',
                    sound: 'default',
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
};

export default NotificationService;
