/**
 * PrayerTimeService.js
 * AlAdhan Prayer Times API integration
 * 
 * FUTURE: Replace AlAdhan API with backend proxy /api/prayer-times
 * to allow for caching, rate limiting, and analytics on server side.
 */

import StorageService from './StorageService';

// AlAdhan API base URL
const ALADHAN_API_BASE = 'https://api.aladhan.com/v1';

// Calculation method (2 = Islamic Society of North America - ISNA)
// Other common methods: 1 = University of Islamic Sciences, Karachi
//                       3 = Muslim World League
//                       4 = Umm Al-Qura University, Makkah
const DEFAULT_METHOD = 2;

// Prayer names in order
const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Display names for prayers
const PRAYER_DISPLAY_NAMES = {
    Fajr: 'Fajr',
    Sunrise: 'Sunrise',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha',
};

/**
 * Parse time string (HH:MM) to Date object for today
 */
const parseTimeToDate = (timeString) => {
    if (!timeString) return null;

    // Remove timezone info if present (e.g., "18:45 (PKT)")
    const cleanTime = timeString.split(' ')[0];
    const [hours, minutes] = cleanTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

/**
 * Format time from 24h to 12h format
 */
const formatTo12Hour = (timeString) => {
    if (!timeString) return '';

    const cleanTime = timeString.split(' ')[0];
    const [hours, minutes] = cleanTime.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Get current Unix timestamp
 */
const getCurrentTimestamp = () => {
    return Math.floor(Date.now() / 1000);
};

const PrayerTimeService = {
    /**
     * Fetch complete prayer data from AlAdhan API
     * Returns timings, date info, and meta data
     * FUTURE: POST to /api/prayer-times/fetch
     */
    fetchPrayerTimes: async (latitude, longitude) => {
        try {
            const timestamp = getCurrentTimestamp();
            const url = `${ALADHAN_API_BASE}/timings/${timestamp}?latitude=${latitude}&longitude=${longitude}&method=${DEFAULT_METHOD}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.code !== 200 || !data.data) {
                throw new Error('Invalid API response');
            }

            return data.data;
        } catch (error) {
            console.error('PrayerTimeService: Error fetching prayer times:', error);
            return null;
        }
    },

    /**
     * Get complete prayer data including city, dates, and all prayer times
     * Returns full object with all needed data for home screen
     */
    getCompletePrayerData: async (latitude, longitude) => {
        try {
            const apiData = await PrayerTimeService.fetchPrayerTimes(latitude, longitude);

            if (!apiData) {
                return null;
            }

            const { timings, date, meta } = apiData;

            // Extract city from meta (timezone usually contains city info)
            // Format: "Asia/Karachi" or "Europe/London"
            let city = 'Unknown';
            if (meta?.timezone) {
                const timezoneParts = meta.timezone.split('/');
                city = timezoneParts[timezoneParts.length - 1].replace(/_/g, ' ');
            }

            // Extract Hijri date
            const hijriDate = date?.hijri
                ? `${date.hijri.day} ${date.hijri.month.en} ${date.hijri.year}`
                : '';

            // Extract Gregorian date
            const gregorianDate = date?.gregorian
                ? `${date.gregorian.day} ${date.gregorian.month.en} ${date.gregorian.year}`
                : '';

            // Clean timings (remove timezone info)
            const cleanTimings = {};
            for (const [key, value] of Object.entries(timings)) {
                cleanTimings[key] = value.split(' ')[0];
            }

            // Calculate next prayer
            const nextPrayer = PrayerTimeService.calculateNextPrayer(cleanTimings);

            const result = {
                city,
                hijriDate,
                gregorianDate,
                timings: cleanTimings,
                nextPrayer: nextPrayer.name,
                nextPrayerTime: formatTo12Hour(nextPrayer.time),
                maghribTime: cleanTimings.Maghrib,
            };

            // Cache complete prayer data for fallback when location is disabled
            await StorageService.savePrayerTimes(result, latitude, longitude);

            return result;
        } catch (error) {
            console.error('PrayerTimeService: Error getting complete prayer data:', error);
            return null;
        }
    },

    /**
     * Calculate the next upcoming prayer based on current time
     */
    calculateNextPrayer: (timings) => {
        const now = new Date();

        for (const prayerName of PRAYER_ORDER) {
            const prayerTime = timings[prayerName];
            if (!prayerTime) continue;

            const prayerDate = parseTimeToDate(prayerTime);
            if (prayerDate && prayerDate > now) {
                return {
                    name: PRAYER_DISPLAY_NAMES[prayerName],
                    time: prayerTime,
                };
            }
        }

        // If all prayers passed, next is Fajr tomorrow
        return {
            name: 'Fajr',
            time: timings.Fajr || '',
        };
    },

    /**
     * Get Maghrib time for given location
     * Uses cache if available and valid, otherwise fetches fresh
     * Returns time string (HH:MM) or null
     */
    getMaghribTime: async (latitude, longitude) => {
        try {
            // Check cache first
            const cachedData = await StorageService.getPrayerTimes(latitude, longitude);

            if (cachedData?.maghrib) {
                console.log('PrayerTimeService: Using cached Maghrib time:', cachedData.maghrib);
                return cachedData.maghrib;
            }

            // Fetch fresh from API
            console.log('PrayerTimeService: Fetching fresh prayer times from API');
            const prayerData = await PrayerTimeService.getCompletePrayerData(latitude, longitude);

            return prayerData?.maghribTime || null;
        } catch (error) {
            console.error('PrayerTimeService: Error getting Maghrib time:', error);
            return null;
        }
    },

    /**
     * Get Maghrib time as Date object
     */
    getMaghribTimeAsDate: async (latitude, longitude) => {
        const timeString = await PrayerTimeService.getMaghribTime(latitude, longitude);
        return parseTimeToDate(timeString);
    },

    /**
     * Check if current time is after Maghrib
     * Returns: true if evening, false if day, null if unable to determine
     */
    isAfterMaghrib: async (latitude, longitude) => {
        try {
            const maghribDate = await PrayerTimeService.getMaghribTimeAsDate(latitude, longitude);

            if (!maghribDate) {
                return null; // Unable to determine
            }

            const now = new Date();
            return now >= maghribDate;
        } catch (error) {
            console.error('PrayerTimeService: Error checking if after Maghrib:', error);
            return null;
        }
    },

    /**
     * Force refresh prayer times (for manual refresh)
     * Bypasses cache and fetches fresh from API
     * Returns complete prayer data
     */
    refreshPrayerTimes: async (latitude, longitude) => {
        try {
            const prayerData = await PrayerTimeService.getCompletePrayerData(latitude, longitude);
            return prayerData;
        } catch (error) {
            console.error('PrayerTimeService: Error refreshing prayer times:', error);
            return null;
        }
    },

    // Export utility functions
    parseTimeToDate,
    formatTo12Hour,
    PRAYER_ORDER,
    PRAYER_DISPLAY_NAMES,
};

export default PrayerTimeService;
