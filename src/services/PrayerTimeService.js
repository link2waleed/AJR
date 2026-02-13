import StorageService from './StorageService';

const ALADHAN_API_BASE = 'https://api.aladhan.com/v1';

// 1 = University of Islamic Sciences, Karachi
const DEFAULT_METHOD = 1;

// 0 = Shafi, 1 = Hanafi
const DEFAULT_SCHOOL = 1;

const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const PRAYER_DISPLAY_NAMES = {
    Fajr: 'Fajr',
    Sunrise: 'Sunrise',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha',
};

/**
 * Parse time string (HH:MM) into Date using provided base date
 */
const parseTimeToDate = (timeString, baseDate = new Date()) => {
    if (!timeString) return null;

    const cleanTime = timeString.split(' ')[0];
    const [hours, minutes] = cleanTime.split(':').map(Number);

    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);

    return date;
};

/**
 * Format time from 24h to 12h
 */
const formatTo12Hour = (timeString) => {
    if (!timeString) return '';

    const cleanTime = timeString.split(' ')[0];
    const [hours, minutes] = cleanTime.split(':').map(Number);

    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const PrayerTimeService = {

    /**
     * Fetch prayer times using latitude & longitude
     * Uses method=1 (Karachi) and configurable school (default: 1 = Hanafi)
     */
    fetchPrayerTimes: async (latitude, longitude, school = DEFAULT_SCHOOL) => {
        try {
            const url =
                `${ALADHAN_API_BASE}/timings?latitude=${latitude}` +
                `&longitude=${longitude}` +
                `&method=${DEFAULT_METHOD}` +
                `&school=${school}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('PrayerTimeService: Error fetching prayer times:', error);
            return null;
        }
    },

    getCompletePrayerData: async (latitude, longitude, date = new Date(), school = DEFAULT_SCHOOL) => {
        try {
            const apiData = await PrayerTimeService.fetchPrayerTimes(latitude, longitude, school);

            if (!apiData) return null;

            const { timings, date: apiDateResponse, meta } = apiData;

            let city = 'Unknown';
            let country = '';

            try {
                const Location = require('expo-location');

                const geocode = await Location.reverseGeocodeAsync({
                    latitude,
                    longitude
                });

                if (geocode && geocode.length > 0) {
                    const location = geocode[0];

                    city = location.city || location.subregion || location.region || 'Unknown';
                    country = location.country || '';
                }
            } catch (geoError) {
                console.warn('Reverse geocoding failed, using timezone fallback');

                if (meta?.timezone) {
                    const timezoneParts = meta.timezone.split('/');
                    city = timezoneParts[timezoneParts.length - 1].replace(/_/g, ' ');

                    if (timezoneParts.length > 1) {
                        country = timezoneParts[0];
                    }
                }
            }

            const hijriDate = apiDateResponse?.hijri
                ? `${apiDateResponse.hijri.day} ${apiDateResponse.hijri.month.en} ${apiDateResponse.hijri.year}`
                : '';

            const gregorianDate = apiDateResponse?.gregorian
                ? `${apiDateResponse.gregorian.day} ${apiDateResponse.gregorian.month.en} ${apiDateResponse.gregorian.year}`
                : '';

            const cleanTimings = {};
            for (const [key, value] of Object.entries(timings)) {
                cleanTimings[key] = value.split(' ')[0];
            }

            const nextPrayer = PrayerTimeService.calculateNextPrayer(
                cleanTimings,
                new Date()
            );

            const result = {
                city,
                country,
                hijriDate,
                gregorianDate,
                timings: cleanTimings,
                nextPrayer: nextPrayer.name,
                nextPrayerTime: formatTo12Hour(nextPrayer.time),
                maghribTime: cleanTimings.Maghrib,
                timezone: meta?.timezone || '',
            };

            await StorageService.savePrayerTimes(result, latitude, longitude);

            return result;
        } catch (error) {
            console.error('PrayerTimeService: Error getting complete prayer data:', error);
            return null;
        }
    },

    /**
     * Calculate next upcoming prayer safely
     */
    calculateNextPrayer: (timings, baseDate = new Date()) => {
        const now = new Date(baseDate);

        for (const prayerName of PRAYER_ORDER) {
            const prayerTime = timings[prayerName];
            if (!prayerTime) continue;

            const prayerDate = parseTimeToDate(prayerTime, baseDate);

            if (prayerDate && prayerDate > now) {
                return {
                    name: PRAYER_DISPLAY_NAMES[prayerName],
                    time: prayerTime,
                };
            }
        }

        // If all prayers passed, next is tomorrow's Fajr
        const tomorrow = new Date(baseDate);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return {
            name: 'Fajr',
            time: timings.Fajr || '',
        };
    },

    getMaghribTime: async (latitude, longitude) => {
        try {
            const cachedData = await StorageService.getPrayerTimes(latitude, longitude);

            if (cachedData?.maghribTime) {
                return cachedData.maghribTime;
            }

            const prayerData = await PrayerTimeService.getCompletePrayerData(latitude, longitude);
            return prayerData?.maghribTime || null;
        } catch (error) {
            console.error('PrayerTimeService: Error getting Maghrib time:', error);
            return null;
        }
    },

    getMaghribTimeAsDate: async (latitude, longitude) => {
        const timeString = await PrayerTimeService.getMaghribTime(latitude, longitude);
        return parseTimeToDate(timeString);
    },

    isAfterMaghrib: async (latitude, longitude) => {
        try {
            const maghribDate = await PrayerTimeService.getMaghribTimeAsDate(latitude, longitude);

            if (!maghribDate) return null;

            return new Date() >= maghribDate;
        } catch (error) {
            console.error('PrayerTimeService: Error checking if after Maghrib:', error);
            return null;
        }
    },

    refreshPrayerTimes: async (latitude, longitude) => {
        try {
            return await PrayerTimeService.getCompletePrayerData(latitude, longitude);
        } catch (error) {
            console.error('PrayerTimeService: Error refreshing prayer times:', error);
            return null;
        }
    },

    parseTimeToDate,
    formatTo12Hour,
    PRAYER_ORDER,
    PRAYER_DISPLAY_NAMES,
};

export default PrayerTimeService;