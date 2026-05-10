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

            // ── Next Salah calculation & Schedule ──
            let nextSalahData = { name: '—', timeRemaining: '—', timeString: '—', targetDateString: null, schedule: [] };
            if (prayerTimings && timezone) {
                try {
                    const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
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
                    const nowMinutes = nowH * 60 + nowM;

                    let schedule = [];
                    // Create entries for today and tomorrow to ensure we always have the next few prayers
                    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
                        PRAYERS.forEach(prayerName => {
                            const timeStr = prayerTimings[prayerName];
                            if (timeStr) {
                                const [h, m] = timeStr.split(':').map(Number);
                                let prayerMinutes = h * 60 + m;
                                
                                // Calculate exact target Date
                                // If dayOffset is 0 but prayer already passed today, we push it to tomorrow
                                let actualDayOffset = dayOffset;
                                if (dayOffset === 0 && prayerMinutes <= nowMinutes) {
                                    actualDayOffset = 1;
                                } else if (dayOffset === 1 && prayerMinutes <= nowMinutes) {
                                    actualDayOffset = 2;
                                }

                                const diffMinutes = prayerMinutes - nowMinutes + (actualDayOffset * 24 * 60);
                                const targetDate = new Date(Date.now() + diffMinutes * 60 * 1000);
                                
                                schedule.push({
                                    name: prayerName,
                                    timeString: timeStr,
                                    targetDateString: targetDate.toISOString(),
                                    targetDateMs: targetDate.getTime()
                                });
                            }
                        });
                    }
                    
                    // Sort chronologically and deduplicate based on time
                    schedule.sort((a, b) => a.targetDateMs - b.targetDateMs);
                    
                    // Filter strictly future prayers
                    schedule = schedule.filter(p => p.targetDateMs > now.getTime());
                    
                    // Remove duplicates (same prayer time on same day)
                    const uniqueSchedule = [];
                    const seenTimes = new Set();
                    for (const item of schedule) {
                        if (!seenTimes.has(item.targetDateString)) {
                            seenTimes.add(item.targetDateString);
                            uniqueSchedule.push(item);
                        }
                    }

                    if (uniqueSchedule.length > 0) {
                        const next = uniqueSchedule[0];
                        let diffMinutes = Math.floor((next.targetDateMs - now.getTime()) / 60000);
                        let timeRemaining = formatTimeRemaining(diffMinutes * 60);

                        nextSalahData = {
                            name: next.name,
                            timeRemaining,
                            timeString: next.timeString,
                            targetDateString: next.targetDateString,
                            schedule: uniqueSchedule.map(s => ({
                                name: s.name,
                                timeString: s.timeString,
                                targetDateString: s.targetDateString
                            }))
                        };
                    }
                } catch (e) {
                    console.warn('WidgetService: Error calculating widget schedule', e);
                }
            } else if (nextSalah && nextSalah.name) {
                // Fallback if timings/timezone not available
                nextSalahData = {
                    name: nextSalah.name,
                    timeRemaining: '—',
                    timeString: nextSalah.timeString || '—',
                    targetDateString: null,
                    schedule: []
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
