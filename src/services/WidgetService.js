/**
 * WidgetService.js
 * Bridge between React Native app and iOS WidgetKit widgets.
 *
 * Collects widget-relevant data from existing services, serialises it
 * into a JSON payload, writes it to shared UserDefaults via App Group,
 * and requests a widget timeline reload.
 *
 * Flow: RN App → WidgetService → UserDefaults (App Group) → SwiftUI Widget
 */

import { Platform } from 'react-native';
import FirebaseService from './FirebaseService';

const APP_GROUP = 'group.com.my.AJR';
const WIDGET_DATA_KEY = 'ajr_widget_data';

// ── Circle Widget Caching (Quota Protection) ──
let cachedCircleData = { hasCircles: false, name: '', percentage: 0, otherCirclesCount: 0 };
let lastCircleFetchTimestamp = 0;

/**
 * Lazy-load ExtensionStorage to avoid crashes on Android or when
 * the native module is not yet available.
 */
let _storage = null;
function getStorage() {
    if (_storage) return _storage;
    try {
        const { ExtensionStorage } = require('@bacons/apple-targets');
        _storage = new ExtensionStorage(APP_GROUP);
        return _storage;
    } catch (e) {
        console.warn('WidgetService: ExtensionStorage not available', e.message);
        return null;
    }
}

function reloadWidgets() {
    try {
        const { ExtensionStorage } = require('@bacons/apple-targets');
        ExtensionStorage.reloadWidget();
    } catch (e) {
        console.warn('WidgetService: Could not reload widgets', e.message);
    }
}

/**
 * Format seconds remaining into a human-readable string.
 * Examples: "2h 15m", "45m", "3m"
 */
function formatTimeRemaining(totalSeconds) {
    if (totalSeconds <= 0) return '—';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

const WidgetService = {
    /**
     * Force invalidates the circle data cache so the next widget update
     * fetches fresh statistics (e.g. after creating a circle or toggling progress).
     */
    invalidateCircleCache() {
        lastCircleFetchTimestamp = 0;
    },

    /**
     * Fetches circle data safely protecting Firestore Quotas.
     */
    async getCircleWidgetData() {
        const now = Date.now();
        // Return cache if it's less than 5 minutes old
        if (now - lastCircleFetchTimestamp < 5 * 60 * 1000) {
            return cachedCircleData;
        }

        try {
            const circles = await FirebaseService.getUserCircles();
            if (circles && circles.length > 0) {
                const primaryCircle = circles[0];
                const averages = await FirebaseService.getCircleMemberRingAverages(primaryCircle.id);
                cachedCircleData = {
                    hasCircles: true,
                    name: primaryCircle.name,
                    percentage: averages.overall || 0,
                    otherCirclesCount: circles.length - 1
                };
            } else {
                cachedCircleData = { hasCircles: false, name: '', percentage: 0, otherCirclesCount: 0 };
            }
            lastCircleFetchTimestamp = now;
        } catch (e) {
            console.warn('WidgetService: Failed to fetch circle data', e);
        }
        return cachedCircleData;
    },

    /**
     * Main entry point. Collects all relevant data and pushes it to the
     * widget extension via the shared App Group UserDefaults.
     *
     * @param {Object} params
     * @param {Object} params.prayerStats      - { completed, total }
     * @param {Object} params.quranStats       - { seconds, goalMinutes }
     * @param {Object} params.dhikrStats       - { totalCompleted, totalGoal }
     * @param {Object} params.activityCompletion - { prayers, quran, dhikr, journaling }
     * @param {Object} params.selectedActivities - { prayers, quran, dhikr, journaling }
     * @param {Object} params.nextSalah        - { name, timeString } (from PrayerTimeService)
     * @param {Object} params.prayerTimings    - full timings object with Fajr, Dhuhr, etc.
     * @param {string} params.timezone         - IANA timezone
     * @param {string} params.timezone         - IANA timezone
     */
    async updateWidgetData({
        prayerStats = { completed: 0, total: 5 },
        quranStats = { seconds: 0, goalMinutes: 15 },
        dhikrStats = { totalCompleted: 0, totalGoal: 0 },
        activityCompletion = {},
        selectedActivities = {},
        nextSalah = null,
        prayerTimings = null,
        timezone = null,
    } = {}) {
        if (Platform.OS !== 'ios') return;

        try {
            // ── Salah ring percentage ──
            const salahPct = activityCompletion.prayers
                ? 100
                : Math.min(Math.round((prayerStats.completed / (prayerStats.total || 5)) * 100), 100);

            // ── Quran ring percentage ──
            const quranGoalSec = (quranStats.goalMinutes || 15) * 60;
            const quranPct = activityCompletion.quran
                ? 100
                : (quranGoalSec > 0
                    ? Math.min(Math.round((quranStats.seconds / quranGoalSec) * 100), 100)
                    : 0);

            // ── Dhikr ring percentage ──
            const dhikrPct = activityCompletion.dhikr
                ? 100
                : (dhikrStats.totalGoal > 0
                    ? Math.min(Math.round((dhikrStats.totalCompleted / dhikrStats.totalGoal) * 100), 100)
                    : 0);

            // ── Overall progress (only selected activities) ──
            let totalPct = 0;
            let count = 0;
            if (selectedActivities.prayers) { totalPct += salahPct; count++; }
            if (selectedActivities.quran) { totalPct += quranPct; count++; }
            if (selectedActivities.dhikr) { totalPct += dhikrPct; count++; }
            const overallProgress = count > 0 ? Math.round(totalPct / count) : 0;

            // ── Next Salah calculation ──
            let nextSalahData = { name: '—', timeRemaining: '—', timeString: '—' };
            if (nextSalah && nextSalah.name) {
                // Calculate time remaining from now
                let timeRemaining = '—';
                if (prayerTimings && timezone) {
                    try {
                        const prayerKey = nextSalah.name;
                        const prayerTimeStr = prayerTimings[prayerKey];
                        if (prayerTimeStr) {
                            const [h, m] = prayerTimeStr.split(':').map(Number);
                            // Get current time in prayer timezone
                            const now = new Date();
                            const formatter = new Intl.DateTimeFormat('en-US', {
                                timeZone: timezone,
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            });
                            const parts = formatter.formatToParts(now);
                            const nowH = parseInt(parts.find(p => p.type === 'hour').value, 10);
                            const nowM = parseInt(parts.find(p => p.type === 'minute').value, 10);

                            let diffMinutes = (h * 60 + m) - (nowH * 60 + nowM);
                            if (diffMinutes < 0) diffMinutes += 24 * 60; // next day
                            timeRemaining = formatTimeRemaining(diffMinutes * 60);
                        }
                    } catch (e) {
                        console.warn('WidgetService: Error calculating time remaining', e);
                    }
                }

                nextSalahData = {
                    name: nextSalah.name,
                    timeRemaining,
                    timeString: nextSalah.timeString || '—',
                };
            }

            const circleData = await this.getCircleWidgetData();

            const payload = {
                salah: { percentage: salahPct, completed: prayerStats.completed, total: prayerStats.total || 5, isActive: !!selectedActivities.prayers },
                quran: { percentage: quranPct, isActive: !!selectedActivities.quran },
                dhikr: { percentage: dhikrPct, isActive: !!selectedActivities.dhikr },
                hasJournalActive: !!selectedActivities.journaling,
                overallProgress,
                nextSalah: nextSalahData,
                circleData: {
                    hasCircles: circleData.hasCircles || false,
                    name: circleData.name || '',
                    percentage: circleData.percentage || 0,
                    otherCirclesCount: circleData.otherCirclesCount || 0
                },
                lastUpdated: new Date().toISOString(),
            };

            const storage = getStorage();
            if (storage) {
                storage.set(WIDGET_DATA_KEY, JSON.stringify(payload));
                reloadWidgets();
                console.log('WidgetService: Widget data updated', JSON.stringify(payload));
            }
        } catch (error) {
            console.error('WidgetService: Error updating widget data', error);
        }
    },

    /**
     * Force a widget reload without writing new data.
     * Useful when you know the underlying data has changed
     * but don't have all the parameters handy.
     */
    reload() {
        if (Platform.OS !== 'ios') return;
        reloadWidgets();
    },
};

export default WidgetService;
