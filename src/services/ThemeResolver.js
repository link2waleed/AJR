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
 * Pure function to determine theme based on next prayer
 * @param {boolean} permissionGranted - Is location permission granted
 * @param {Object|null} location - { latitude, longitude } or null
 * @param {string|null} nextPrayer - Name of next prayer (Fajr, Dhuhr, etc.) or null
 * @returns {string} - 'day' or 'evening'
 */
const resolveTheme = (permissionGranted, location, nextPrayer) => {
    // Rule 1: Permission denied → Day UI
    if (!permissionGranted) {
        return THEME_MODE.DAY;
    }

    // Rule 2: Location missing → Day UI
    if (!location || !location.latitude || !location.longitude) {
        return THEME_MODE.DAY;
    }

    // Rule 3: Next prayer unavailable → Day UI
    if (!nextPrayer) {
        return THEME_MODE.DAY;
    }

    // Rule 4 & 5: Evening theme when next prayer is Fajr or Isha
    // - If next = Fajr → We're in Isha-to-Fajr period (night) → Evening
    // - If next = Isha → We're in Maghrib-to-Isha period (evening) → Evening
    // - Otherwise → Day
    if (nextPrayer === 'Fajr' || nextPrayer === 'Isha') {
        return THEME_MODE.EVENING;
    }

    return THEME_MODE.DAY;
};

const ThemeResolver = {
    /**
     * Get current theme mode
     * This is the main entry point that orchestrates all checks
     * Theme logic: Evening when next prayer is Fajr or Isha, Day otherwise
     * @returns {Promise<{ mode: string, location: Object|null, nextPrayer: string|null }>}
     */
    resolveCurrentTheme: async () => {
        try {
            // Step 1: Check permission
            const permissionGranted = await LocationService.isPermissionGranted();

            if (!permissionGranted) {
                console.log('[THEME] Permission not granted, using Day UI');
                return {
                    mode: THEME_MODE.DAY,
                    location: null,
                    nextPrayer: null,
                    reason: 'permission_denied',
                };
            }

            // Step 2: Get location (with fallback to cached)
            const location = await LocationService.getLocationWithFallback();

            if (!location) {
                console.log('[THEME] No location available, using Day UI');
                return {
                    mode: THEME_MODE.DAY,
                    location: null,
                    nextPrayer: null,
                    reason: 'no_location',
                };
            }

            // Step 3: Get complete prayer data to get next prayer
            const prayerData = await PrayerTimeService.getCompletePrayerData(
                location.latitude,
                location.longitude
            );

            if (!prayerData || !prayerData.nextPrayer) {
                console.log('[THEME] Prayer data unavailable, using Day UI');
                return {
                    mode: THEME_MODE.DAY,
                    location,
                    nextPrayer: null,
                    reason: 'no_prayer_data',
                };
            }

            const nextPrayer = prayerData.nextPrayer;

            // Step 4: Resolve theme based on next prayer
            const mode = resolveTheme(true, location, nextPrayer);

            console.log(`\n[THEME] === THEME RESOLVER FINAL DECISION ===`);
            console.log(`[THEME] Resolved theme: ${mode}`);
            console.log(`[THEME] Next prayer: ${nextPrayer}`);
            console.log(`[THEME] Location: ${location.latitude}, ${location.longitude}`);
            console.log(`[THEME] City: ${prayerData.city || 'Unknown'}`);
            console.log(`[THEME] Timezone: ${prayerData.timezone}`);
            console.log(`[THEME] Current time: ${new Date().toLocaleTimeString()}`);
            console.log(`[THEME] Current time ISO: ${new Date().toISOString()}`);
            console.log(`[THEME] ==========================================\n`);

            return {
                mode,
                location,
                nextPrayer,
                reason: (nextPrayer === 'Fajr' || nextPrayer === 'Isha') ? 'evening_period' : 'day_period',
            };
        } catch (error) {
            console.error('[THEME] Error resolving theme:', error);
            // Graceful fallback
            return {
                mode: THEME_MODE.DAY,
                location: null,
                nextPrayer: null,
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
                    nextPrayer: null,
                    reason: 'refresh_no_location',
                };
            }

            // Step 2: Refresh prayer times (returns full prayer data object)
            const prayerData = await PrayerTimeService.refreshPrayerTimes(
                location.latitude,
                location.longitude
            );

            if (!prayerData || !prayerData.nextPrayer) {
                return {
                    mode: THEME_MODE.DAY,
                    location,
                    nextPrayer: null,
                    reason: 'refresh_no_prayer_data',
                };
            }

            const nextPrayer = prayerData.nextPrayer;

            // Step 3: Resolve theme based on next prayer
            const mode = resolveTheme(true, location, nextPrayer);

            console.log(`\n[THEME] === THEME REFRESH FINAL DECISION ===`);
            console.log(`[THEME] Resolved theme: ${mode}`);
            console.log(`[THEME] Next prayer: ${nextPrayer}`);
            console.log(`[THEME] Location: ${location.latitude}, ${location.longitude}`);
            console.log(`[THEME] City: ${prayerData.city || 'Unknown'}`);
            console.log(`[THEME] Current time: ${new Date().toLocaleTimeString()}`);
            console.log(`[THEME] ==========================================\n`);

            return {
                mode,
                location,
                nextPrayer,
                reason: (nextPrayer === 'Fajr' || nextPrayer === 'Isha') ? 'evening_period' : 'day_period',
            };
        } catch (error) {
            console.error('[THEME] Error in refresh:', error);
            return {
                mode: THEME_MODE.DAY,
                location: null,
                nextPrayer: null,
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
