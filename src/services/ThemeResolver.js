/**
 * ThemeResolver.js
 * Pure logic UI decision engine for Day/Evening theme
 * 
 * This module contains NO side effects - only pure functions
 * that determine the UI mode based on inputs.
 * 
 * FUTURE: This logic can be enhanced to support:
 * - User preference overrides from backend
 * - Special occasions (Ramadan nights, Eid, etc.)
 * - Custom themes from user settings
 */

import LocationService from './LocationService';
import PrayerTimeService from './PrayerTimeService';
import StorageService from './StorageService';

// Theme modes
const THEME_MODE = {
    DAY: 'day',
    EVENING: 'evening',
};

/**
 * Pure function to determine theme based on inputs
 * @param {boolean} permissionGranted - Is location permission granted
 * @param {Object|null} location - { latitude, longitude } or null
 * @param {boolean|null} isAfterMaghrib - true/false or null if unknown
 * @returns {string} - 'day' or 'evening'
 */
const resolveTheme = (permissionGranted, location, isAfterMaghrib) => {
    // Rule 1: Permission denied → Day UI
    if (!permissionGranted) {
        return THEME_MODE.DAY;
    }

    // Rule 2: Location missing → Day UI
    if (!location || !location.latitude || !location.longitude) {
        return THEME_MODE.DAY;
    }

    // Rule 3: Maghrib unavailable → Day UI
    if (isAfterMaghrib === null || isAfterMaghrib === undefined) {
        return THEME_MODE.DAY;
    }

    // Rule 4 & 5: Based on time relative to Maghrib
    return isAfterMaghrib ? THEME_MODE.EVENING : THEME_MODE.DAY;
};

const ThemeResolver = {
    /**
     * Get current theme mode
     * This is the main entry point that orchestrates all checks
     * @returns {Promise<{ mode: string, location: Object|null, maghribTime: string|null }>}
     */
    resolveCurrentTheme: async () => {
        try {
            // Step 1: Check permission
            const permissionGranted = await LocationService.isPermissionGranted();

            if (!permissionGranted) {
                console.log('ThemeResolver: Permission not granted, using Day UI');
                return {
                    mode: THEME_MODE.DAY,
                    location: null,
                    maghribTime: null,
                    reason: 'permission_denied',
                };
            }

            // Step 2: Get location (with fallback to cached)
            const location = await LocationService.getLocationWithFallback();

            if (!location) {
                console.log('ThemeResolver: No location available, using Day UI');
                return {
                    mode: THEME_MODE.DAY,
                    location: null,
                    maghribTime: null,
                    reason: 'no_location',
                };
            }

            // Step 3: Get Maghrib time
            const maghribTime = await PrayerTimeService.getMaghribTime(
                location.latitude,
                location.longitude
            );

            if (!maghribTime) {
                console.log('ThemeResolver: Maghrib time unavailable, using Day UI');
                return {
                    mode: THEME_MODE.DAY,
                    location,
                    maghribTime: null,
                    reason: 'no_maghrib',
                };
            }

            // Step 4: Check if after Maghrib
            const isAfterMaghrib = await PrayerTimeService.isAfterMaghrib(
                location.latitude,
                location.longitude
            );

            // Step 5: Resolve theme
            const mode = resolveTheme(true, location, isAfterMaghrib);

            console.log(`ThemeResolver: Resolved theme - ${mode} (Maghrib: ${maghribTime})`);

            return {
                mode,
                location,
                maghribTime,
                reason: isAfterMaghrib ? 'after_maghrib' : 'before_maghrib',
            };
        } catch (error) {
            console.error('ThemeResolver: Error resolving theme:', error);
            // Graceful fallback
            return {
                mode: THEME_MODE.DAY,
                location: null,
                maghribTime: null,
                reason: 'error',
            };
        }
    },

    /**
     * Force refresh and resolve theme
     * For manual refresh button - re-fetches location and prayer times
     */
    refreshAndResolve: async () => {
        try {
            // Step 1: Refresh location
            const location = await LocationService.refreshLocation();

            if (!location) {
                return {
                    mode: THEME_MODE.DAY,
                    location: null,
                    maghribTime: null,
                    reason: 'refresh_no_location',
                };
            }

            // Step 2: Refresh prayer times (returns full prayer data object)
            const prayerData = await PrayerTimeService.refreshPrayerTimes(
                location.latitude,
                location.longitude
            );

            // Extract maghrib time string from prayer data
            const maghribTime = prayerData?.maghribTime || null;

            if (!maghribTime) {
                return {
                    mode: THEME_MODE.DAY,
                    location,
                    maghribTime: null,
                    reason: 'refresh_no_maghrib',
                };
            }

            // Step 3: Check if after Maghrib
            const maghribDate = PrayerTimeService.parseTimeToDate(maghribTime);
            const now = new Date();
            const isAfterMaghrib = maghribDate ? now >= maghribDate : null;

            // Step 4: Resolve theme
            const mode = resolveTheme(true, location, isAfterMaghrib);

            return {
                mode,
                location,
                maghribTime,
                reason: isAfterMaghrib ? 'after_maghrib' : 'before_maghrib',
            };
        } catch (error) {
            console.error('ThemeResolver: Error in refresh:', error);
            return {
                mode: THEME_MODE.DAY,
                location: null,
                maghribTime: null,
                reason: 'refresh_error',
            };
        }
    },

    // Export constants
    THEME_MODE,

    // Export pure function for testing
    resolveTheme,
};

export default ThemeResolver;
