import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
    LOCATION: '@ajr_user_location',
    PRAYER_TIMES: '@ajr_prayer_times',
    FULL_TIMINGS: '@ajr_full_timings',       // all prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha)
    PERMISSION_STATUS: '@ajr_location_permission',
    LOCATION_ENABLED: '@ajr_location_enabled',
    DHIKR_OFFSETS: '@ajr_dhikr_offsets',
    SCHOOL_PREFERENCE: '@ajr_school_preference',
};

// Helper to create location hash for cache invalidation
const createLocationHash = (latitude, longitude) => {
    // Round to 2 decimal places (~1km precision) for cache purposes
    const roundedLat = Math.round(latitude * 100) / 100;
    const roundedLng = Math.round(longitude * 100) / 100;
    return `${roundedLat},${roundedLng}`;
};

// Helper to get today's date string
const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
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
            const prayerData = {
                maghrib: prayerDataToCache.maghribTime,
                hijriDate: prayerDataToCache.hijriDate,
                gregorianDate: prayerDataToCache.gregorianDate,
                nextPrayer: prayerDataToCache.nextPrayer,
                nextPrayerTime: prayerDataToCache.nextPrayerTime,
                city: prayerDataToCache.city,
                date: getTodayDateString(),
                locationHash: createLocationHash(latitude, longitude),
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
            const data = {
                timings,
                date: date || getTodayDateString(),
                timezone: timezone || 'UTC',
            };
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
            // Return cached timings even if not from today - they're still valid for daily prayer scheduling
            // The date is only used for context, not for validation
            console.log(`StorageService: Retrieved cached timings from ${data.date}, timezone: ${data.timezone}`);
            return {
                timings: data.timings,
                timezone: data.timezone || 'UTC'
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
            const currentDate = getTodayDateString();
            const currentLocationHash = createLocationHash(latitude, longitude);

            // Validate cache: same day and same location
            if (
                prayerData.date === currentDate &&
                prayerData.locationHash === currentLocationHash
            ) {
                return prayerData;
            }

            // Cache is stale
            return null;
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
     * Get school preference (defaults to 1 for Hanafi)
     */
    getSchoolPreference: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.SCHOOL_PREFERENCE);
            return data ? JSON.parse(data) : 1; // Default to Hanafi
        } catch (error) {
            console.error('StorageService: Error getting school preference:', error);
            return 1; // Default to Hanafi
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
};

export default StorageService;
