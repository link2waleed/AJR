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
 * Estimate timezone from coordinates
 * Uses a simple lat-based guess as fallback when API doesn't provide timezone
 */
const estimateTimezoneFromCoordinates = (latitude, longitude) => {
    // Common locations mapping
    if (isInLondon(latitude, longitude)) {
        return 'Europe/London';
    }
    
    // Pakistan coordinates approximation
    if (latitude >= 23 && latitude <= 37 && longitude >= 61 && longitude <= 77) {
        return 'Asia/Karachi';
    }
    
    // General approximation based on longitude
    // Each 15 degrees of longitude = 1 hour offset
    const baseOffset = Math.round(longitude / 15);
    const offset = baseOffset > 0 ? `+${baseOffset}:00` : `${baseOffset}:00`;
    
    console.warn('PrayerTimeService: Using estimated timezone offset for', { latitude, longitude, offset });
    
    // Return UTC as extremely safe fallback
    return 'UTC';
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
 * WITHOUT timezone conversion - used for local timezone times
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
 * Parse prayer time with timezone awareness
 * Gets current time in the prayer location's timezone, then compares
 * This is more robust than trying to convert between timezones
 * @param {string} timeString - Time in HH:MM format (in prayer location's timezone)
 * @param {string} timezone - IANA timezone (e.g., 'Europe/London', 'Asia/Karachi')
 * @returns {Date} - Absolute time that can be compared with new Date()
 */
const parseTimeToDateWithTimezone = (timeString, timezone = 'UTC') => {
    if (!timeString) return null;

    const cleanTime = timeString.split(' ')[0];
    const [prayerHours, prayerMinutes] = cleanTime.split(':').map(Number);

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

    const parts = formatter.formatToParts(now);
    const tzYear = parseInt(parts.find(p => p.type === 'year').value, 10);
    const tzMonth = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
    const tzDay = parseInt(parts.find(p => p.type === 'day').value, 10);
    const tzHours = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const tzMinutes = parseInt(parts.find(p => p.type === 'minute').value, 10);

    console.log('TimeZone Debug - Current time in prayer location:', {
        timezone,
        currentTimeInPrayerTz: `${tzYear}-${tzMonth + 1}-${tzDay} ${tzHours}:${tzMinutes}`,
        nowUTC: now.toISOString(),
        nowDeviceTz: now.toLocaleString(),
    });

    // Calculate the offset between device timezone and prayer location timezone
    // The offset is: (now in device TZ) - (now in prayer location TZ)
    const deviceDate = new Date(tzYear, tzMonth, tzDay, tzHours, tzMinutes, 0);
    const offset = now.getTime() - deviceDate.getTime();

    console.log('TimeZone Debug - Offset calculation:', {
        deviceDateCreated: deviceDate.toISOString(),
        nowTime: now.getTime(),
        deviceDateTime: deviceDate.getTime(),
        offsetMs: offset,
        offsetHours: offset / 3600000,
    });

    // Create prayer time in prayer location's timezone, then adjust to device timezone
    const prayerDateInLocalTz = new Date(tzYear, tzMonth, tzDay, prayerHours, prayerMinutes, 0);
    const prayerDateInDeviceTz = new Date(prayerDateInLocalTz.getTime() + offset);

    console.log('Timezone-aware parse:', {
        timezone,
        timeString: cleanTime,
        tzCurrentTime: `${tzHours}:${tzMinutes}`,
        prayerTimeInTz: `${prayerHours}:${prayerMinutes}`,
        prayerDateLocalTz: prayerDateInLocalTz.toISOString(),
        offset: `${offset / 3600000} hours`,
        result: prayerDateInDeviceTz.toISOString(),
        resultDeviceTz: prayerDateInDeviceTz.toLocaleString(),
    });

    return prayerDateInDeviceTz;
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

/**
 * Check if current time is between Maghrib and Isha (evening prayer times)
 * Used for London to show dark theme only during Maghrib and Isha, not entire evening
 */
const isBetweenMaghribAndIsha = async (latitude, longitude) => {
    try {
        console.log('isBetweenMaghribAndIsha called with coords:', { latitude, longitude });
        
        const prayerData = await PrayerTimeService.getCompletePrayerData(latitude, longitude);
        if (!prayerData?.maghribTime || !prayerData?.timings?.Isha) {
            console.warn('No Maghrib or Isha time available');
            return null;
        }

        const timezone = prayerData.timezone || 'UTC';
        console.log('isBetweenMaghribAndIsha - Using timezone:', timezone, 'for city:', prayerData.city);
        
        // Parse Maghrib time
        const maghribDate = timezone && timezone !== 'UTC' 
            ? parseTimeToDateWithTimezone(prayerData.maghribTime, timezone)
            : parseTimeToDate(prayerData.maghribTime);

        // Parse Isha time (next day's Fajr is considered as end of Isha)
        let ishaDate = timezone && timezone !== 'UTC' 
            ? parseTimeToDateWithTimezone(prayerData.timings.Isha, timezone)
            : parseTimeToDate(prayerData.timings.Isha);

        if (!maghribDate || !ishaDate) {
            console.warn('Failed to parse Maghrib or Isha date');
            return null;
        }

        const now = new Date();

        if (ishaDate < maghribDate) {
            // Isha is past midnight, so extend it to tomorrow
            ishaDate = new Date(ishaDate.getTime() + 24 * 60 * 60 * 1000);
        }

        const isBetween = now >= maghribDate && now < ishaDate;

        console.log('Evening period check (Maghrib to Isha):', {
            city: prayerData.city,
            timezone,
            maghribTime: prayerData.maghribTime,
            ishaTime: prayerData.timings.Isha,
            currentTimeISO: now.toISOString(),
            currentTimeDevice: now.toLocaleString(),
            maghribDateISO: maghribDate.toISOString(),
            ishaDateISO: ishaDate.toISOString(),
            maghribDateDevice: maghribDate.toLocaleString(),
            ishaDateDevice: ishaDate.toLocaleString(),
            nowMs: now.getTime(),
            maghribMs: maghribDate.getTime(),
            ishaMs: ishaDate.getTime(),
            isBetweenMaghribAndIsha: isBetween,
            comparison: `${maghribDate.getTime()} <= ${now.getTime()} < ${ishaDate.getTime()} = ${isBetween}`
        });

        return isBetween;
    } catch (error) {
        console.error('PrayerTimeService: Error checking if between Maghrib and Isha:', error);
        return null;
    }
};

const PrayerTimeService = {

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
            
            console.log('[LONDON API] Fetching London prayer times for:', formattedDate, 'School:', school === 1 ? 'Hanafi' : 'Shafi');
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`London API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('[LONDON API] Raw Response:', JSON.stringify(data, null, 2));
            
            // London API format (CORRECTED):
            // - asr: Shafi Asr time
            // - asr_2: Hanafi Asr time
            // school: 0 = Shafi, 1 = Hanafi
            const asrTime = school === 1 ? data.asr_2 : data.asr;

            // Helper function to correct 12-hour format issues
            // Some APIs return afternoon/evening times incorrectly formatted
            // If a time is too early for its prayer type, add 12 hours
            const correctTimeIfNeeded = (timeStr, prayerName) => {
                if (!timeStr) return timeStr;
                
                const [hours, minutes] = timeStr.split(':').map(Number);
                
                // Prayers that should naturally be afternoon/evening
                // If they appear as early morning times, add 12 hours
                const shouldBeAfternoon = {
                    'Asr': { minExpected: 13, maxExpected: 18 },
                    'Maghrib': { minExpected: 15, maxExpected: 21 },
                    'Isha': { minExpected: 18, maxExpected: 23 }
                };
                
                const expectedRange = shouldBeAfternoon[prayerName];
                if (expectedRange && hours < expectedRange.minExpected) {
                    const correctedHours = hours + 12;
                    const correctedStr = `${correctedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    console.log(`[LONDON API] Corrected ${prayerName}: ${timeStr} → ${correctedStr} (added 12 hours)`);
                    return correctedStr;
                }
                
                return timeStr;
            };

            // Convert London API response to our standard format
            const standardTimings = {
                Fajr: data.fajr,
                Sunrise: data.sunrise,
                Dhuhr: data.dhuhr,
                Asr: correctTimeIfNeeded(asrTime, 'Asr'),
                Maghrib: correctTimeIfNeeded(data.magrib, 'Maghrib'),
                Isha: correctTimeIfNeeded(data.isha, 'Isha'),
            };

            // Validate prayer times are reasonable (catch API corruption)
            const validateTime = (timeStr, prayerName) => {
                if (!timeStr) return false;
                const [hours] = timeStr.split(':').map(Number);
                // Reasonable bounds for London: Maghrib 15-21, Isha 18-23, Fajr 04-07, Dhuhr 11-14, Asr 13-18
                const bounds = {
                    Maghrib: { min: 15, max: 21 },
                    Isha: { min: 18, max: 23 },
                    Fajr: { min: 4, max: 7 },
                    Dhuhr: { min: 11, max: 14 },
                    Asr: { min: 13, max: 18 },
                    Sunrise: { min: 4, max: 9 }
                };
                const bound = bounds[prayerName];
                if (bound && (hours < bound.min || hours > bound.max)) {
                    console.warn(`[LONDON API] WARNING: ${prayerName} time ${timeStr} is outside expected range [${bound.min}:00-${bound.max}:59]`);
                    return false;
                }
                return true;
            };

            // Check all times
            let allValid = true;
            ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(prayer => {
                if (!validateTime(standardTimings[prayer], prayer)) {
                    allValid = false;
                }
            });

            if (!allValid) {
                console.error('[LONDON API] ERROR: Invalid prayer times received after correction. Returning null to trigger fallback.');
                return null;
            }

            console.log('[LONDON API] SUCCESS: All prayer times validated');

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

   
    fetchAladhanPrayerTimes: async (latitude, longitude, school = DEFAULT_SCHOOL) => {
        try {
            const url =
                `${ALADHAN_API_BASE}/timings?latitude=${latitude}` +
                `&longitude=${longitude}` +
                `&method=${DEFAULT_METHOD}` +
                `&school=${school}`;

            console.log('Fetching Aladhan prayer times for:', { latitude, longitude, school: school === 1 ? 'Hanafi' : 'Shafi' });
            
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
     * London API is tried first for London (with validation)
     * Falls back to Aladhan if London API fails or returns invalid data
     */
    fetchPrayerTimes: async (latitude, longitude, school = DEFAULT_SCHOOL) => {
        if (isInLondon(latitude, longitude)) {
            console.log('[PRAYER TIMES] Using London Prayer Times API');
            const londonData = await PrayerTimeService.fetchLondonPrayerTimes(school);
            if (londonData) {
                console.log('[PRAYER TIMES] London API successful - using it');
                return londonData;
            }
            console.warn('[PRAYER TIMES] London API failed or returned invalid data, falling back to Aladhan');
        }
        console.log('[PRAYER TIMES] Using Aladhan API');
        return await PrayerTimeService.fetchAladhanPrayerTimes(latitude, longitude, school);
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

            // Get timezone FIRST - use API's timezone or estimate from coordinates
            let timezone = meta?.timezone;
            if (!timezone) {
                timezone = estimateTimezoneFromCoordinates(latitude, longitude);
                console.log('PrayerTimeService: Estimated timezone for', `${latitude},${longitude}:`, timezone);
            }

            // Calculate next prayer with timezone awareness
            const nextPrayer = PrayerTimeService.calculateNextPrayer(
                cleanTimings,
                timezone,
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
                timezone: timezone || 'UTC',
                isLondonApi: isInLondon(latitude, longitude),
            };

            console.log('PrayerTimeService: Prayer data complete:', {
                city,
                timezone: result.timezone,
                maghribTime: result.maghribTime,
                isLondonApi: result.isLondonApi,
                school: school === 1 ? 'Hanafi' : 'Shafi'
            });

            await StorageService.savePrayerTimes(result, latitude, longitude);
            // Also cache full timings for NotificationService (with timezone)
            const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            await StorageService.saveFullTimings(cleanTimings, todayDate, timezone);

            return result;
        } catch (error) {
            console.error('PrayerTimeService: Error getting complete prayer data:', error);
            return null;
        }
    },

    /**
     * Calculate next upcoming prayer - timezone aware version
     * Gets current time in prayer location's timezone for accurate comparison
     */
    calculateNextPrayer: (timings, timezone = 'UTC', baseDate = new Date()) => {
        // Get current time in the prayer location's timezone
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

        const parts = formatter.formatToParts(baseDate);
        const tzYear = parseInt(parts.find(p => p.type === 'year').value, 10);
        const tzMonth = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
        const tzDay = parseInt(parts.find(p => p.type === 'day').value, 10);
        const tzHours = parseInt(parts.find(p => p.type === 'hour').value, 10);
        const tzMinutes = parseInt(parts.find(p => p.type === 'minute').value, 10);

        // Current time in prayer location's timezone (for comparison)
        const nowInLocationTz = new Date(tzYear, tzMonth, tzDay, tzHours, tzMinutes, 0);

        console.log('calculateNextPrayer - Current time in location timezone:', {
            timezone,
            currentTime: `${tzHours}:${tzMinutes}`,
            baseDate: baseDate.toISOString(),
        });

        for (const prayerName of PRAYER_ORDER) {
            const prayerTime = timings[prayerName];
            if (!prayerTime) continue;

            // Parse prayer time in same timezone context (just HH:MM)
            const [prayerHours, prayerMinutes] = prayerTime.split(':').map(Number);
            const prayerDateInLocationTz = new Date(tzYear, tzMonth, tzDay, prayerHours, prayerMinutes, 0);

            console.log(`Prayer comparison - ${prayerName}: ${prayerTime} (location tz ${timezone}) vs current ${tzHours}:${tzMinutes}`);

            if (prayerDateInLocationTz > nowInLocationTz) {
                console.log(`Next prayer is ${prayerName} at ${prayerTime}`);
                return {
                    name: PRAYER_DISPLAY_NAMES[prayerName],
                    time: prayerTime,
                };
            }
        }

        // If all prayers passed, next is tomorrow's Fajr
        console.log('All prayers passed, next is tomorrow\'s Fajr');
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

    /**
     * Get Maghrib time as Date with timezone awareness
     * Handles timezone conversion for accurate comparisons
     */
    getMaghribTimeAsDate: async (latitude, longitude) => {
        try {
            const prayerData = await PrayerTimeService.getCompletePrayerData(latitude, longitude);
            if (!prayerData?.maghribTime) return null;

            const timezone = prayerData.timezone || 'UTC';
            
            console.log('Getting Maghrib time for', prayerData.city, 'Timezone:', timezone);
            
            // Use timezone-aware parsing if timezone is available
            if (timezone && timezone !== 'UTC') {
                return parseTimeToDateWithTimezone(prayerData.maghribTime, timezone);
            } else {
                return parseTimeToDate(prayerData.maghribTime);
            }
        } catch (error) {
            console.error('PrayerTimeService: Error getting Maghrib time as date:', error);
            return null;
        }
    },

    isAfterMaghrib: async (latitude, longitude) => {
        try {
            console.log('isAfterMaghrib called with coords:', { latitude, longitude });
            
            const prayerData = await PrayerTimeService.getCompletePrayerData(latitude, longitude);
            if (!prayerData?.maghribTime) {
                console.warn('No Maghrib time available');
                return null;
            }

            const timezone = prayerData.timezone || 'UTC';
            console.log('isAfterMaghrib - Using timezone:', timezone, 'for city:', prayerData.city);
            
            const maghribDate = timezone && timezone !== 'UTC' 
                ? parseTimeToDateWithTimezone(prayerData.maghribTime, timezone)
                : parseTimeToDate(prayerData.maghribTime);

            if (!maghribDate) {
                console.warn('Failed to parse Maghrib date');
                return null;
            }

            const now = new Date();
            const isAfter = now >= maghribDate;
            
            console.log('Maghrib check FINAL:', {
                city: prayerData.city,
                timezone,
                maghribTime: prayerData.maghribTime,
                currentTimeISO: now.toISOString(),
                currentTimeDevice: now.toLocaleString(),
                maghribDateISO: maghribDate.toISOString(),
                maghribDateDevice: maghribDate.toLocaleString(),
                nowMs: now.getTime(),
                maghribMs: maghribDate.getTime(),
                isAfterMaghrib: isAfter,
                comparison: `${now.getTime()} >= ${maghribDate.getTime()} = ${isAfter}`
            });

            return isAfter;
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
    parseTimeToDateWithTimezone,
    estimateTimezoneFromCoordinates,
    isBetweenMaghribAndIsha,
    formatTo12Hour,
    PRAYER_ORDER,
    PRAYER_DISPLAY_NAMES,
};

export default PrayerTimeService;