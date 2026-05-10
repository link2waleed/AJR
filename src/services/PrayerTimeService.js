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
    // London
    if (isInLondon(latitude, longitude)) {
        return 'Europe/London';
    }

    // Pakistan
    if (latitude >= 23 && latitude <= 37 && longitude >= 61 && longitude <= 77) {
        return 'Asia/Karachi';
    }

    // Turkey
    if (latitude >= 36 && latitude <= 42 && longitude >= 26 && longitude <= 45) {
        return 'Europe/Istanbul';
    }

    // Middle East / Gulf
    if (latitude >= 12 && latitude <= 42 && longitude >= 35 && longitude <= 60) {
        if (longitude >= 54) return 'Asia/Dubai';       // UAE, Oman
        if (longitude >= 43 && latitude <= 30) return 'Asia/Riyadh'; // Saudi, Yemen
        if (longitude >= 43) return 'Asia/Baghdad';     // Iraq
        return 'Asia/Riyadh';
    }

    // North Africa
    if (latitude >= 15 && latitude <= 37 && longitude >= -17 && longitude <= 35) {
        if (longitude <= 0) return 'Africa/Casablanca';
        if (longitude <= 12) return 'Africa/Algiers';
        return 'Africa/Cairo';
    }

    // Sub-Saharan Africa
    if (latitude >= -35 && latitude <= 15 && longitude >= -17 && longitude <= 52) {
        if (longitude <= 15) return 'Africa/Lagos';
        if (longitude <= 35) return 'Africa/Nairobi';
        return 'Africa/Nairobi';
    }

    // Western Europe (excluding London)
    if (latitude >= 36 && latitude <= 71 && longitude >= -10 && longitude <= 25) {
        if (longitude <= 0) return 'Europe/Lisbon';
        if (longitude <= 8) return 'Europe/Paris';
        if (longitude <= 15) return 'Europe/Berlin';
        return 'Europe/Athens';
    }

    // Eastern Europe / Russia west
    if (latitude >= 36 && latitude <= 71 && longitude >= 25 && longitude <= 60) {
        if (longitude <= 35) return 'Europe/Moscow';
        return 'Europe/Moscow';
    }

    // South Asia (India, Bangladesh, Sri Lanka)
    if (latitude >= 5 && latitude <= 35 && longitude >= 68 && longitude <= 92) {
        if (longitude <= 82) return 'Asia/Kolkata';
        return 'Asia/Dhaka';
    }

    // Southeast Asia
    if (latitude >= -10 && latitude <= 28 && longitude >= 92 && longitude <= 141) {
        if (longitude <= 105) return 'Asia/Bangkok';
        if (longitude <= 120) return 'Asia/Kuala_Lumpur';
        return 'Asia/Tokyo';
    }

    // East Asia
    if (latitude >= 18 && latitude <= 54 && longitude >= 100 && longitude <= 150) {
        if (longitude <= 125) return 'Asia/Shanghai';
        return 'Asia/Tokyo';
    }

    // North America
    if (latitude >= 15 && latitude <= 72 && longitude >= -170 && longitude <= -50) {
        if (longitude >= -80) return 'America/New_York';
        if (longitude >= -100) return 'America/Chicago';
        if (longitude >= -115) return 'America/Denver';
        return 'America/Los_Angeles';
    }

    // South America
    if (latitude >= -56 && latitude <= 15 && longitude >= -82 && longitude <= -34) {
        if (longitude >= -50) return 'America/Sao_Paulo';
        return 'America/Bogota';
    }

    // Australia / Oceania
    if (latitude >= -50 && latitude <= -10 && longitude >= 110 && longitude <= 180) {
        return 'Australia/Sydney';
    }

    // Last resort: try device timezone (better than raw UTC)
    try {
        const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (deviceTz) {
            console.log('PrayerTimeService: Using device timezone as fallback:', deviceTz);
            return deviceTz;
        }
    } catch (e) { /* ignore */ }

    console.warn('PrayerTimeService: Could not determine timezone, using UTC');
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
 * Converts a local time string (HH:MM) in the given IANA timezone to an absolute UTC Date.
 *
 * APPROACH: Calculate the timezone's UTC offset mathematically by comparing
 * wall-clock components (from Intl.DateTimeFormat) against the actual UTC time
 * of baseDate. This is 100% platform-independent — no string parsing of
 * timezone abbreviations (BST, EDT, etc.) which vary across platforms/locales.
 *
 * @param {string} timeString - Time in HH:MM format (in prayer location's timezone)
 * @param {string} timezone - IANA timezone (e.g., 'Europe/London', 'Asia/Karachi')
 * @param {Date}   baseDate  - Reference date for determining day/month/year context
 * @returns {Date} - Absolute UTC Date that can be compared with new Date()
 */
const parseTimeToDateWithTimezone = (timeString, timezone = 'UTC', baseDate = new Date()) => {
    if (!timeString) return null;

    const cleanTime = timeString.split(' ')[0];
    const [prayerHours, prayerMinutes] = cleanTime.split(':').map(Number);

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
    const tzSeconds = parseInt(parts.find(p => p.type === 'second').value, 10);

    // Calculate UTC offset mathematically:
    // "asIfUtcMs" treats the wall-clock values as if they were UTC
    // The difference between that and the actual UTC time (baseDate.getTime())
    // gives us the timezone's offset in milliseconds.
    const asIfUtcMs = Date.UTC(tzYear, tzMonth, tzDay, tzHours, tzMinutes, tzSeconds);
    const offsetMs = asIfUtcMs - baseDate.getTime();

    // Now build the prayer time: same date, but with the prayer's hours/minutes,
    // then subtract the offset to get the true UTC instant.
    const localPrayerUtcMs = Date.UTC(tzYear, tzMonth, tzDay, prayerHours, prayerMinutes, 0) - offsetMs;

    const result = new Date(localPrayerUtcMs);
    console.log(`[TZ-PARSE] ${timeString} in ${timezone} => ${result.toISOString()} (offset=${Math.round(offsetMs/3600000)}h)`);
    return result;
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

    fetchLondonPrayerTimes: async (school = DEFAULT_SCHOOL, date = new Date()) => {
        try {
            // Get the requested date in London timezone
            const londonDate = date.toLocaleDateString('en-GB', {
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
                    'Dhuhr': { minExpected: 11, maxExpected: 15 },
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
                Dhuhr: correctTimeIfNeeded(data.dhuhr, 'Dhuhr'),
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
                    Maghrib: { min: 15, max: 22 },
                    Isha: { min: 18, max: 24 },
                    Fajr: { min: 1, max: 7 },
                    Dhuhr: { min: 11, max: 14 },
                    Asr: { min: 13, max: 19 },
                    Sunrise: { min: 3, max: 9 }
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


    fetchAladhanPrayerTimes: async (latitude, longitude, date = new Date(), school = DEFAULT_SCHOOL) => {
        try {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const dateStr = `${day}-${month}-${year}`;

            const url =
                `${ALADHAN_API_BASE}/timings/${dateStr}?latitude=${latitude}` +
                `&longitude=${longitude}` +
                `&method=${DEFAULT_METHOD}` +
                `&school=${school}`;

            console.log('Fetching Aladhan prayer times for:', { dateStr, latitude, longitude, school: school === 1 ? 'Hanafi' : 'Shafi' });

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
    fetchPrayerTimes: async (latitude, longitude, date = new Date(), school = DEFAULT_SCHOOL) => {
        if (isInLondon(latitude, longitude)) {
            console.log('[PRAYER TIMES] Using London Prayer Times API');
            const londonData = await PrayerTimeService.fetchLondonPrayerTimes(school, date);
            if (londonData) {
                console.log('[PRAYER TIMES] London API successful - using it');
                return londonData;
            }
            console.warn('[PRAYER TIMES] London API failed or returned invalid data, falling back to Aladhan');
        }
        console.log('[PRAYER TIMES] Using Aladhan API');
        return await PrayerTimeService.fetchAladhanPrayerTimes(latitude, longitude, date, school);
    },

    getCompletePrayerData: async (latitude, longitude, date = new Date(), school = DEFAULT_SCHOOL) => {
        try {
            const apiData = await PrayerTimeService.fetchPrayerTimes(latitude, longitude, date, school);

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
                    const aladhanData = await PrayerTimeService.fetchAladhanPrayerTimes(latitude, longitude, date, school);
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

            // ─── Apply user's custom prayer adjustments ───
            const adjustments = await StorageService.getPrayerAdjustments();
            const adjustmentMap = {
                Fajr: adjustments.fajr || 0,
                Sunrise: adjustments.sunrise || 0,
                Dhuhr: adjustments.dhuhr || 0,
                Asr: adjustments.asr || 0,
                Maghrib: adjustments.maghrib || 0,
                Isha: adjustments.isha || 0,
            };

            const hasAdjustments = Object.values(adjustmentMap).some(v => v !== 0);
            if (hasAdjustments) {
                console.log('PrayerTimeService: Applying custom prayer adjustments:', adjustmentMap);
                for (const [prayer, offset] of Object.entries(adjustmentMap)) {
                    if (offset !== 0 && cleanTimings[prayer]) {
                        const [h, m] = cleanTimings[prayer].split(':').map(Number);
                        const totalMinutes = h * 60 + m + offset;
                        const newH = Math.floor(totalMinutes / 60) % 24;
                        const newM = totalMinutes % 60;
                        cleanTimings[prayer] = `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
                        console.log(`  ${prayer}: adjusted by ${offset > 0 ? '+' : ''}${offset}min → ${cleanTimings[prayer]}`);
                    }
                }
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

            const isToday = new Date(date).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
            if (isToday) {
                await StorageService.savePrayerTimes(result, latitude, longitude);
                // Use timezone-aware date for full timings cache
                let todayDate;
                try {
                    const parts = new Intl.DateTimeFormat('en-US', {
                        timeZone: timezone || undefined,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    }).formatToParts(new Date());
                    const y = parts.find(p => p.type === 'year').value;
                    const m = parts.find(p => p.type === 'month').value;
                    const d = parts.find(p => p.type === 'day').value;
                    todayDate = `${y}-${m}-${d}`;
                } catch (e) {
                    const now = new Date();
                    todayDate = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
                }
                await StorageService.saveFullTimings(cleanTimings, todayDate, timezone);
            }

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
        const tzHours = parseInt(parts.find(p => p.type === 'hour').value, 10);
        const tzMinutes = parseInt(parts.find(p => p.type === 'minute').value, 10);

        const nowInLocationTz = parseTimeToDateWithTimezone(
            `${tzHours.toString().padStart(2, '0')}:${tzMinutes.toString().padStart(2, '0')}`,
            timezone,
            baseDate
        );

        console.log('calculateNextPrayer - Current time in location timezone:', {
            timezone,
            currentTime: `${tzHours}:${tzMinutes}`,
            baseDate: baseDate.toISOString(),
        });

        for (const prayerName of PRAYER_ORDER) {
            const prayerTime = timings[prayerName];
            if (!prayerTime) continue;

            const prayerDateInLocationTz = parseTimeToDateWithTimezone(prayerTime, timezone, baseDate);

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