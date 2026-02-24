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
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
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
            if (existing === 'granted') {
                console.log('NotificationService: permission already granted');
                return true;
            }

            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: false,
                    allowSound: true,
                },
            });
            console.log(`NotificationService: permission status = ${status}`);
            return status === 'granted';
        } catch (err) {
            console.error('NotificationService: requestPermissions error', err);
            return false;
        }
    },

    /**
     * Create Android notification channels.
     */
    async setupChannels() {
        if (Platform.OS !== 'android') return;
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
                console.log(`NotificationService: channel "${key}" set up`);
            }
        } catch (err) {
            console.error('NotificationService: setupChannels error', err);
        }
    },

    /**
     * Cancel all previously scheduled AJR prayer notifications.
     */
    async cancelAllPrayerNotifications() {
        try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const prayerNotifs = scheduled.filter(n => n.content?.data?.type === 'prayer');
            for (const notif of prayerNotifs) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
            console.log(`NotificationService: cancelled ${prayerNotifs.length} old prayer notifications`);
        } catch (err) {
            console.error('NotificationService: cancelAll error', err);
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
            console.log(`NotificationService: skipping past notification "${title}" (${secondsFromNow}s ago)`);
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
                `NotificationService: scheduled "${title}" in ${Math.round(secondsFromNow / 60)}min (id=${id})`
            );
            return id;
        } catch (err) {
            console.error(`NotificationService: scheduleAt error for "${title}"`, err);
            return null;
        }
    },

    /**
     * Parse "HH:MM" time string into today's Date object.
     */
    _parseTime(timeStr) {
        if (!timeStr) return null;
        const clean = timeStr.split(' ')[0];
        const parts = clean.split(':').map(Number);
        if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
        const d = new Date();
        d.setHours(parts[0], parts[1], 0, 0);
        return d;
    },

    /**
     * Main entry point — schedule all enabled prayer notifications.
     *
     * @param {Object} prayerSettings  DB prayer object + soundMode
     * @param {Object} prayerTimings   { Fajr: "05:19", Dhuhr: "12:16", ... }
     */
    async schedulePrayerNotifications(prayerSettings, prayerTimings) {
        console.log('NotificationService: starting schedulePrayerNotifications...');
        console.log('  timings:', JSON.stringify(prayerTimings));
        console.log('  settings:', JSON.stringify(prayerSettings));

        const granted = await this.requestPermissions();
        if (!granted) {
            console.warn('NotificationService: ❌ permission denied — cannot schedule');
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
                console.log(`  ⏭ ${label}: disabled`);
                continue;
            }

            const prayerTimeStr = prayerTimings?.[timingKey];
            const prayerDate = this._parseTime(prayerTimeStr);

            console.log(`  ✅ ${label}: enabled | time=${prayerTimeStr} | athanEnabled=${settings.athanEnabled} | reminderEnabled=${settings.reminderEnabled}`);

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
                    const nextDate = this._parseTime(prayerTimings?.[nextTimingKey]);
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
        console.log(`NotificationService: ✅ done — ${scheduledCount} scheduled this run, ${total} total in queue`);
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
        await this.requestPermissions();
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
        console.log(`NotificationService: test notification scheduled (id=${id}), fires in 5s`);
        return id;
    },
};

export default NotificationService;
