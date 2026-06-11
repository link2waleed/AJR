import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
    LOCATION: '@ajr_user_location',
    PRAYER_TIMES: '@ajr_prayer_times',
    FULL_TIMINGS: '@ajr_full_timings',       // all prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha)
    PERMISSION_STATUS: '@ajr_location_permission',
    LOCATION_ENABLED: '@ajr_location_enabled',
    WEATHER_UNIT: '@ajr_weather_unit',
    LAST_COUNTRY: '@ajr_last_country',       // Track country for region change detection
    DHIKR_OFFSETS: '@ajr_dhikr_offsets',
    SCHOOL_PREFERENCE: '@ajr_school_preference',
    PRAYER_ADJUSTMENTS: '@ajr_prayer_adjustments',
};

// Helper to create location hash for cache invalidation
const createLocationHash = (latitude, longitude) => {
    // Round to 2 decimal places (~1km precision) for cache purposes
    const roundedLat = Math.round(latitude * 100) / 100;
    const roundedLng = Math.round(longitude * 100) / 100;
    return `${roundedLat},${roundedLng}`;
};

// Helper to get today's date string in device local timezone (NOT UTC)
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Get today's date string in a specific IANA timezone.
 * Critical for DST: ensures we use the correct "local day" at the prayer location.
 */
const getDateStringForTimezone = (timezone) => {
    const now = new Date();
    if (timezone && timezone !== 'UTC') {
        try {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).formatToParts(now);
            const year = parts.find(p => p.type === 'year').value;
            const month = parts.find(p => p.type === 'month').value;
            const day = parts.find(p => p.type === 'day').value;
            return `${year}-${month}-${day}`;
        } catch (e) {
            console.warn('StorageService: Invalid timezone for date calc:', timezone);
        }
    }
    return getTodayDateString();
};

/**
 * Get the current timezone abbreviation (e.g., 'BST', 'GMT', 'EDT', 'EST').
 * Used to detect DST transitions — if abbreviation changes, cache must be invalidated.
 */
const getTimezoneAbbr = (timezone) => {
    if (!timezone || timezone === 'UTC') return 'UTC';
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'short',
        }).formatToParts(new Date());
        return parts.find(p => p.type === 'timeZoneName')?.value || 'UTC';
    } catch (e) {
        return 'UTC';
    }
};

const StorageService = {

    saveLocation: async (latitude, longitude) => {
        try {
            const locationData = {
                latitude,
                longitude,
                lastUpdated: new Date().toISOString(),
            };
            await AsyncStorage.setItem(
                STORAGE_KEYS.LOCATION,
                JSON.stringify(locationData)
            );
            return true;
        } catch (error) {
            console.error('StorageService: Error saving location:', error);
            return false;
        }
    },

    /**
     * Get stored user location
     * FUTURE: GET from /api/user/location
     */
    getLocation: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('StorageService: Error getting location:', error);
            return null;
        }
    },

    /**
     * Save prayer times to storage (cached for one day per location)
     * Includes all display fields for fallback when location is disabled
     * FUTURE: POST to /api/prayer-times/cache
     */
    savePrayerTimes: async (prayerDataToCache, latitude, longitude) => {
        try {
            const timezone = prayerDataToCache.timezone || 'UTC';
            const prayerData = {
                maghrib: prayerDataToCache.maghribTime,
                hijriDate: prayerDataToCache.hijriDate,
                gregorianDate: prayerDataToCache.gregorianDate,
                nextPrayer: prayerDataToCache.nextPrayer,
                nextPrayerTime: prayerDataToCache.nextPrayerTime,
                city: prayerDataToCache.city,
                date: getDateStringForTimezone(timezone),
                locationHash: createLocationHash(latitude, longitude),
                timezone,
                tzAbbr: getTimezoneAbbr(timezone),
            };
            await AsyncStorage.setItem(
                STORAGE_KEYS.PRAYER_TIMES,
                JSON.stringify(prayerData)
            );
            return true;
        } catch (error) {
            console.error('StorageService: Error saving prayer times:', error);
            return false;
        }
    },

    saveFullTimings: async (timings, date, timezone = 'UTC') => {
        try {
            const tz = timezone || 'UTC';
            const data = {
                timings,
                date: date || getDateStringForTimezone(tz),
                timezone: tz,
                tzAbbr: getTimezoneAbbr(tz),
            };
            console.log(`StorageService: Saving full timings for ${data.date}, tz: ${tz} (${data.tzAbbr})`);
            await AsyncStorage.setItem(STORAGE_KEYS.FULL_TIMINGS, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('StorageService: Error saving full timings:', error);
            return false;
        }
    },

    getFullTimings: async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.FULL_TIMINGS);
            if (!raw) return null;
            const data = JSON.parse(raw);

            const timezone = data.timezone || 'UTC';
            const todayDate = getDateStringForTimezone(timezone);
            const currentTzAbbr = getTimezoneAbbr(timezone);

            // Validate: cached data must be from today
            if (data.date !== todayDate) {
                console.log(`StorageService: Full timings cache stale - cached: ${data.date}, today: ${todayDate}`);
                return null;
            }

            // Validate: DST state must not have changed
            if (data.tzAbbr && data.tzAbbr !== currentTzAbbr) {
                console.log(`StorageService: DST change detected - cached: ${data.tzAbbr}, current: ${currentTzAbbr}. Invalidating.`);
                return null;
            }

            console.log(`StorageService: Retrieved cached timings from ${data.date}, tz: ${timezone} (${currentTzAbbr})`);
            return {
                timings: data.timings,
                timezone,
            };
        } catch (error) {
            console.error('StorageService: Error getting full timings:', error);
            return null;
        }
    },

    getPrayerTimes: async (latitude, longitude) => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.PRAYER_TIMES);
            if (!data) return null;

            const prayerData = JSON.parse(data);
            const timezone = prayerData.timezone || 'UTC';
            const currentDate = getDateStringForTimezone(timezone);
            const currentLocationHash = createLocationHash(latitude, longitude);

            // Validate cache: same day and same location
            if (
                prayerData.date !== currentDate ||
                prayerData.locationHash !== currentLocationHash
            ) {
                console.log(`StorageService: Prayer cache stale - date: ${prayerData.date} vs ${currentDate}`);
                return null;
            }

            // Check for DST transition
            if (prayerData.tzAbbr) {
                const currentTzAbbr = getTimezoneAbbr(timezone);
                if (prayerData.tzAbbr !== currentTzAbbr) {
                    console.log(`StorageService: DST change for ${timezone} - cached: ${prayerData.tzAbbr}, now: ${currentTzAbbr}`);
                    return null;
                }
            }

            return prayerData;
        } catch (error) {
            console.error('StorageService: Error getting prayer times:', error);
            return null;
        }
    },
    getRawPrayerTimes: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.PRAYER_TIMES);
            if (!data) return null;
            return JSON.parse(data);
        } catch (error) {
            console.error('StorageService: Error getting raw prayer times:', error);
            return null;
        }
    },

    savePermissionStatus: async (status) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_STATUS, status);
            return true;
        } catch (error) {
            console.error('StorageService: Error saving permission status:', error);
            return false;
        }
    },


    getPermissionStatus: async () => {
        try {
            const status = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_STATUS);
            return status || 'unknown';
        } catch (error) {
            console.error('StorageService: Error getting permission status:', error);
            return 'unknown';
        }
    },


    saveLocationEnabled: async (enabled) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_ENABLED, JSON.stringify(enabled));
            return true;
        } catch (error) {
            console.error('StorageService: Error saving location enabled:', error);
            return false;
        }
    },

    /**
     * Get user preference for location usage
     * Returns true by default if never set (opt-in by default during onboarding)
     */
    getLocationEnabled: async () => {
        try {
            const value = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_ENABLED);
            if (value === null) {
                return null; // Never set
            }
            return JSON.parse(value);
        } catch (error) {
            console.error('StorageService: Error getting location enabled:', error);
            return null;
        }
    },

    saveWeatherUnit: async (unit) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.WEATHER_UNIT, unit);
            return true;
        } catch (error) {
            console.error('StorageService: Error saving weather unit:', error);
            return false;
        }
    },

    getWeatherUnit: async () => {
        try {
            const unit = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_UNIT);
            if (unit === 'F' || unit === 'C') {
                return unit;
            }
            return null;
        } catch (error) {
            console.error('StorageService: Error getting weather unit:', error);
            return null;
        }
    },

    // ============ DHIKR OFFSETS ============

    /**
     * Save dhikr offsets
     */
    saveDhikrOffsets: async (offsets) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.DHIKR_OFFSETS, JSON.stringify(offsets));
            return true;
        } catch (error) {
            console.error('StorageService: Error saving dhikr offsets:', error);
            return false;
        }
    },

    /**
     * Get dhikr offsets
     */
    getDhikrOffsets: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.DHIKR_OFFSETS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('StorageService: Error getting dhikr offsets:', error);
            return {};
        }
    },

    /**
     * Save school preference (0 = Shafi, 1 = Hanafi)
     */
    saveSchoolPreference: async (school) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SCHOOL_PREFERENCE, JSON.stringify(school));
            return true;
        } catch (error) {
            console.error('StorageService: Error saving school preference:', error);
            return false;
        }
    },

    /**
     * Get school preference (defaults to 0 for Standard)
     */
    getSchoolPreference: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.SCHOOL_PREFERENCE);
            return data ? JSON.parse(data) : 0; // Default to Standard (Shafi)
        } catch (error) {
            console.error('StorageService: Error getting school preference:', error);
            return 0; // Default to Standard (Shafi)
        }
    },

    // ============ PRAYER ADJUSTMENTS ============

    /**
     * Save prayer time adjustments (offsets in minutes per prayer)
     * e.g. { fajr: 2, sunrise: 0, dhuhr: -1, asr: 0, maghrib: 3, isha: 0 }
     */
    savePrayerAdjustments: async (adjustments) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.PRAYER_ADJUSTMENTS, JSON.stringify(adjustments));
            console.log('StorageService: Saved prayer adjustments:', adjustments);
            return true;
        } catch (error) {
            console.error('StorageService: Error saving prayer adjustments:', error);
            return false;
        }
    },

    /**
     * Get prayer time adjustments
     * Returns default zeros if none saved
     */
    getPrayerAdjustments: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.PRAYER_ADJUSTMENTS);
            if (data) {
                return JSON.parse(data);
            }
            return { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
        } catch (error) {
            console.error('StorageService: Error getting prayer adjustments:', error);
            return { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
        }
    },

    /**
     * Clear prayer adjustments (reset to defaults)
     */
    clearPrayerAdjustments: async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.PRAYER_ADJUSTMENTS);
            return true;
        } catch (error) {
            console.error('StorageService: Error clearing prayer adjustments:', error);
            return false;
        }
    },

    // ============ ONBOARDING ============

    /**
     * Save onboarding completion status per user
     */
    setOnboardingCompleted: async (uid, isCompleted) => {
        try {
            if (!uid) return false;
            await AsyncStorage.setItem(`@ajr_onboarding_completed_${uid}`, isCompleted ? 'true' : 'false');
            return true;
        } catch (error) {
            console.error('StorageService: Error saving onboarding status:', error);
            return false;
        }
    },

    /**
     * Get onboarding completion status for a user
     */
    getOnboardingCompleted: async (uid) => {
        try {
            if (!uid) return false;
            const data = await AsyncStorage.getItem(`@ajr_onboarding_completed_${uid}`);
            return data === 'true';
        } catch (error) {
            console.error('StorageService: Error getting onboarding status:', error);
            return false;
        }
    },

    // ============ UTILITIES ============

    /**
     * Clear all stored data (for debugging/reset)
     * FUTURE: DELETE /api/user/data
     */
    clearAll: async () => {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.LOCATION,
                STORAGE_KEYS.PRAYER_TIMES,
                STORAGE_KEYS.PERMISSION_STATUS,
                STORAGE_KEYS.LOCATION_ENABLED,
            ]);
            return true;
        } catch (error) {
            console.error('StorageService: Error clearing storage:', error);
            return false;
        }
    },

    /**
     * Save the last country to detect region changes
     */
    saveLastCountry: async (country) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_COUNTRY, country || '');
            return true;
        } catch (error) {
            console.error('StorageService: Error saving last country:', error);
            return false;
        }
    },

    /**
     * Get the last saved country
     */
    getLastCountry: async () => {
        try {
            const country = await AsyncStorage.getItem(STORAGE_KEYS.LAST_COUNTRY);
            return country || null;
        } catch (error) {
            console.error('StorageService: Error getting last country:', error);
            return null;
        }
    },

    /**
     * Check if country has changed and reset weather unit if it has
     * Returns { countryChanged: boolean, wasManuallySet: boolean }
     */
    checkAndResetWeatherUnitIfCountryChanged: async (currentCountry) => {
        try {
            const lastCountry = await StorageService.getLastCountry();
            
            // Save current country for next check
            await StorageService.saveLastCountry(currentCountry);

            // Check if country actually changed
            const countryChanged = lastCountry && lastCountry !== currentCountry;
            if (!countryChanged) {
                return { countryChanged: false, wasManuallySet: false };
            }

            // If country changed, check if weather unit was manually set
            const weatherUnit = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_UNIT);
            const wasManuallySet = weatherUnit !== null;

            // Clear the weather unit to reset to auto-detection
            if (wasManuallySet) {
                await AsyncStorage.removeItem(STORAGE_KEYS.WEATHER_UNIT);
            }

            console.log(`StorageService: Country changed from '${lastCountry}' to '${currentCountry}', weather unit reset`);
            return { countryChanged: true, wasManuallySet };
        } catch (error) {
            console.error('StorageService: Error in checkAndResetWeatherUnitIfCountryChanged:', error);
            return { countryChanged: false, wasManuallySet: false };
        }
    },

    saveUserName: async (uid, name) => {
        try {
            if (!uid || !name) return false;
            await AsyncStorage.setItem(`@ajr_user_name_${uid}`, name);
            return true;
        } catch (error) {
            console.error('StorageService: Error saving user name:', error);
            return false;
        }
    },

    getUserName: async (uid) => {
        try {
            if (!uid) return null;
            return await AsyncStorage.getItem(`@ajr_user_name_${uid}`);
        } catch (error) {
            console.error('StorageService: Error getting user name:', error);
            return null;
        }
    },
};

export default StorageService;
