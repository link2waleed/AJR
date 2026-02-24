import StorageService from './StorageService';

const ALADHAN_API_BASE = 'https://api.aladhan.com/v1';
const LONDON_API = 'https://www.londonprayertimes.com/api/times/?format=json&key=bb82e0db-c7fc-4250-9c07-788cb6a56cb2';

// London coordinates (approximate center)
const LONDON_BOUNDS = {
    minLat: 51.28,
    maxLat: 51.70,
    minLng: -0.51,
    maxLng: 0.33,
};

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
 * Check if coordinates are within London bounds
 */
const isInLondon = (latitude, longitude) => {
    return (
        latitude >= LONDON_BOUNDS.minLat &&
        latitude <= LONDON_BOUNDS.maxLat &&
        longitude >= LONDON_BOUNDS.minLng &&
        longitude <= LONDON_BOUNDS.maxLng
    );
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
     * Fetch prayer times from London API
     * London API uses 'asr' for Hanafi and 'asr_2' for Shafi
     */
    fetchLondonPrayerTimes: async (school = DEFAULT_SCHOOL) => {
        try {
            // Get today's date in London timezone
            const londonDate = new Date().toLocaleDateString('en-GB', { 
                timeZone: 'Europe/London',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            // Convert DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = londonDate.split('/');
            const formattedDate = `${year}-${month}-${day}`;
            
            const apiUrl = `${LONDON_API}&date=${formattedDate}`;
            
            console.log('Fetching London prayer times for:', formattedDate);
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`London API error: ${response.status}`);
            }

            const data = await response.json();
            
            // London API format:
            // - asr: Hanafi Asr time
            // - asr_2: Shafi Asr time
            // school: 0 = Shafi, 1 = Hanafi
            const asrTime = school === 1 ? data.asr : data.asr_2;

            // Convert London API response to our standard format
            const standardTimings = {
                Fajr: data.fajr,
                Sunrise: data.sunrise,
                Dhuhr: data.dhuhr,
                Asr: asrTime,
                Maghrib: data.magrib, // Note: API uses 'magrib' not 'maghrib'
                Isha: data.isha,
            };

            // Parse the date string to create hijri/gregorian format
            const dateObj = new Date(data.date);
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];

            return {
                timings: standardTimings,
                date: {
                    gregorian: {
                        day: dateObj.getDate().toString(),
                        month: {
                            en: months[dateObj.getMonth()]
                        },
                        year: dateObj.getFullYear().toString()
                    },
                    // London API doesn't provide Hijri date, will need fallback
                    hijri: null
                },
                meta: {
                    timezone: 'Europe/London',
                    method: {
                        name: 'London Unified Prayer Timetable'
                    }
                }
            };
        } catch (error) {
            console.error('PrayerTimeService: Error fetching London prayer times:', error);
            return null;
        }
    },

    /**
     * Fetch prayer times using latitude & longitude from Aladhan API
     * Uses method=1 (Karachi) and configurable school (default: 1 = Hanafi)
     */
    fetchAladhanPrayerTimes: async (latitude, longitude, school = DEFAULT_SCHOOL) => {
        try {
            const url =
                `${ALADHAN_API_BASE}/timings?latitude=${latitude}` +
                `&longitude=${longitude}` +
                `&method=${DEFAULT_METHOD}` +
                `&school=${school}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Aladhan API error: ${response.status}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('PrayerTimeService: Error fetching Aladhan prayer times:', error);
            return null;
        }
    },

    /**
     * Fetch prayer times - automatically selects London or Aladhan API
     */
    fetchPrayerTimes: async (latitude, longitude, school = DEFAULT_SCHOOL) => {
        if (isInLondon(latitude, longitude)) {
            console.log('Using London Prayer Times API');
            return await PrayerTimeService.fetchLondonPrayerTimes(school);
        } else {
            console.log('Using Aladhan API');
            return await PrayerTimeService.fetchAladhanPrayerTimes(latitude, longitude, school);
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

            // If London API (no Hijri date), fetch it from Aladhan
            let hijriDate = '';
            let gregorianDate = '';

            if (apiDateResponse?.hijri) {
                hijriDate = `${apiDateResponse.hijri.day} ${apiDateResponse.hijri.month.en} ${apiDateResponse.hijri.year}`;
            } else if (isInLondon(latitude, longitude)) {
                // Fallback: Get Hijri date from Aladhan for London users
                try {
                    const aladhanData = await PrayerTimeService.fetchAladhanPrayerTimes(latitude, longitude, school);
                    if (aladhanData?.date?.hijri) {
                        hijriDate = `${aladhanData.date.hijri.day} ${aladhanData.date.hijri.month.en} ${aladhanData.date.hijri.year}`;
                    }
                } catch (hijriError) {
                    console.warn('Could not fetch Hijri date:', hijriError);
                }
            }

            if (apiDateResponse?.gregorian) {
                gregorianDate = `${apiDateResponse.gregorian.day} ${apiDateResponse.gregorian.month.en} ${apiDateResponse.gregorian.year}`;
            }

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
                isLondonApi: isInLondon(latitude, longitude),
            };

            await StorageService.savePrayerTimes(result, latitude, longitude);
            // Also cache full timings for NotificationService
            await StorageService.saveFullTimings(cleanTimings);

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

    isInLondon,
    parseTimeToDate,
    formatTo12Hour,
    PRAYER_ORDER,
    PRAYER_DISPLAY_NAMES,
};

export default PrayerTimeService;