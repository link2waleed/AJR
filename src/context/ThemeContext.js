/**
 * ThemeContext.js
 * React context for theme state, prayer data, city, and weather management
 * 
 * THEME CONTROL MODEL:
 * - Automatic Maghrib-based logic is the SOURCE OF TRUTH
 * - Manual theme switch is a TEMPORARY PREVIEW only
 * - Manual selection is NOT persisted to storage
 * - Automatic switching ALWAYS clears manual preview
 * 
 * ONE-LINE RULE: Manual theme switching is a temporary preview; automatic Maghrib-based logic always wins.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { ThemeResolver, PrayerTimeService, CityService, WeatherService, LocationService, StorageService } from '../services';

// Create context with default values
const ThemeContext = createContext({
    isEvening: false,
    isLoading: true,
    isLocationEnabled: true,
    location: null,
    maghribTime: null,
    prayerData: null,
    cityName: null,
    weather: null,
    isManualPreview: false,
    refreshTheme: async () => { },
    toggleThemePreview: () => { },
});

// Custom hook for consuming theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Helper to get today's date string
const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

export const ThemeProvider = ({ children }) => {
    // Automatic theme state (source of truth from Maghrib logic)
    const [automaticIsEvening, setAutomaticIsEvening] = useState(false);

    // Manual preview override (in-memory only, NOT persisted)
    // null = no manual override, true = evening preview, false = day preview
    const [manualPreviewOverride, setManualPreviewOverride] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isLocationEnabled, setIsLocationEnabled] = useState(true);
    const [location, setLocation] = useState(null);
    const [maghribTime, setMaghribTime] = useState(null);
    const [prayerData, setPrayerData] = useState(null);
    const [cityName, setCityName] = useState(null);
    const [weather, setWeather] = useState(null);

    // Track current date to detect midnight crossing
    const currentDateRef = useRef(getTodayDateString());

    // Track app state for foreground detection
    const appState = useRef(AppState.currentState);

    // COMPUTED: Effective theme = manual override ?? automatic
    // Manual preview takes precedence, but only until next automatic update
    const isEvening = manualPreviewOverride !== null ? manualPreviewOverride : automaticIsEvening;

    // Track if currently in manual preview mode
    const isManualPreview = manualPreviewOverride !== null;

    /**
     * Clear manual preview (called when automatic logic triggers)
     */
    const clearManualPreview = useCallback(() => {
        if (manualPreviewOverride !== null) {
            console.log('ThemeContext: Clearing manual preview, syncing with automatic theme');
            setManualPreviewOverride(null);
        }
    }, [manualPreviewOverride]);

    /**
     * Toggle theme preview (manual switch)
     * This is a TEMPORARY preview - does NOT persist
     * Will be cleared on next automatic theme update
     */
    const toggleThemePreview = useCallback(() => {
        const currentEffective = manualPreviewOverride !== null ? manualPreviewOverride : automaticIsEvening;
        const newPreview = !currentEffective;

        console.log(`ThemeContext: Manual preview toggled to ${newPreview ? 'Evening' : 'Day'}`);
        setManualPreviewOverride(newPreview);
    }, [manualPreviewOverride, automaticIsEvening]);

    /**
     * Load cached data from storage (used when location is disabled)
     * Uses raw cache methods that don't validate - we want ANY cached data
     */
    const loadCachedData = useCallback(async () => {
        try {
            // Load cached location (for display only)
            const cachedLocation = await StorageService.getLocation();
            if (cachedLocation) {
                setLocation(cachedLocation);
            }

            // Load raw cached city (no validation - get whatever is saved)
            const cachedCity = await CityService.getRawCachedCity();
            if (cachedCity) {
                setCityName(cachedCity);
            }

            // Load raw cached weather (no validation - get whatever is saved)
            const cachedWeather = await WeatherService.getRawCachedWeather();
            if (cachedWeather) {
                setWeather(cachedWeather);
            }

            // Load raw cached prayer times (no date/location validation)
            const cachedPrayer = await StorageService.getRawPrayerTimes();
            if (cachedPrayer) {
                setMaghribTime(cachedPrayer.maghrib);

                // Create prayer data object from cached data for display
                // Note: next prayer calculation may be stale but still informative
                setPrayerData({
                    city: cachedCity || 'Unknown',
                    hijriDate: cachedPrayer.hijriDate || '--',
                    gregorianDate: cachedPrayer.gregorianDate || '--',
                    nextPrayer: cachedPrayer.nextPrayer || '--',
                    nextPrayerTime: cachedPrayer.nextPrayerTime || '--',
                    maghribTime: cachedPrayer.maghrib,
                    isCached: true, // Flag to indicate this is cached data
                });
            }

            console.log('ThemeContext: Loaded cached data for disabled location', {
                city: cachedCity,
                weather: cachedWeather?.temperature,
                maghrib: cachedPrayer?.maghrib,
            });
        } catch (error) {
            console.error('ThemeContext: Error loading cached data:', error);
        }
    }, []);

    /**
     * Fetch city name using Expo Location reverse geocoding
     */
    const fetchCityName = useCallback(async (lat, lng) => {
        try {
            const city = await CityService.getCityName(lat, lng);
            setCityName(city);
            return city;
        } catch (error) {
            console.error('ThemeContext: Error fetching city name:', error);
            return null;
        }
    }, []);

    /**
     * Fetch weather using Open-Meteo API
     */
    const fetchWeather = useCallback(async (lat, lng) => {
        try {
            const weatherData = await WeatherService.getCurrentWeather(lat, lng);
            setWeather(weatherData);
            return weatherData;
        } catch (error) {
            console.error('ThemeContext: Error fetching weather:', error);
            return null;
        }
    }, []);

    /**
     * Fetch complete prayer data from API
     */
    const fetchPrayerData = useCallback(async (lat, lng) => {
        try {
            const data = await PrayerTimeService.getCompletePrayerData(lat, lng);
            if (data) {
                setPrayerData(data);
                setMaghribTime(data.maghribTime);
            }
            return data;
        } catch (error) {
            console.error('ThemeContext: Error fetching prayer data:', error);
            return null;
        }
    }, []);

    /**
     * Fetch all location-based data (prayer, city, weather)
     */
    const fetchAllLocationData = useCallback(async (lat, lng) => {
        // Fetch all in parallel for performance
        await Promise.all([
            fetchPrayerData(lat, lng),
            fetchCityName(lat, lng),
            fetchWeather(lat, lng),
        ]);
    }, [fetchPrayerData, fetchCityName, fetchWeather]);

    /**
     * Evaluate theme based on current conditions
     * CLEARS manual preview - automatic logic always wins
     * Loads cached data if location is disabled
     */
    const evaluateTheme = useCallback(async () => {
        try {
            setIsLoading(true);

            // Check if location is enabled by user
            const locationEnabled = await LocationService.isLocationEnabledByUser();
            setIsLocationEnabled(locationEnabled);

            if (!locationEnabled) {
                // Location is disabled - load cached data only, skip API calls
                console.log('ThemeContext: Location disabled, loading cached data');
                await loadCachedData();
                setAutomaticIsEvening(false); // Default to day theme
                setManualPreviewOverride(null);
                setIsLoading(false);
                return;
            }

            const result = await ThemeResolver.resolveCurrentTheme();
            const newIsEvening = result.mode === ThemeResolver.THEME_MODE.EVENING;

            // Update automatic theme state
            setAutomaticIsEvening(newIsEvening);

            // CRITICAL: Clear manual preview on automatic update
            setManualPreviewOverride(null);

            setLocation(result.location);
            setMaghribTime(result.maghribTime);

            // Fetch all location-based data if we have location
            if (result.location) {
                await fetchAllLocationData(result.location.latitude, result.location.longitude);
            }

            console.log('ThemeContext: Theme evaluated:', result.mode, '(manual preview cleared)');
        } catch (error) {
            console.error('ThemeContext: Error evaluating theme:', error);
            // Fallback to day
            setAutomaticIsEvening(false);
            setManualPreviewOverride(null);
        } finally {
            setIsLoading(false);
        }
    }, [fetchAllLocationData, loadCachedData]);

    /**
     * Manual refresh - force refetch location, prayer times, city, and weather
     * CLEARS manual preview - refresh syncs with automatic logic
     * Returns { success: true } or { success: false, locationDisabled: true }
     */
    const refreshTheme = useCallback(async () => {
        try {
            setIsLoading(true);

            // Check if location is enabled by user
            const locationEnabled = await LocationService.isLocationEnabledByUser();
            setIsLocationEnabled(locationEnabled);

            if (!locationEnabled) {
                // Location is disabled - return status for UI to show alert
                console.log('ThemeContext: Cannot refresh - location disabled by user');
                setIsLoading(false);
                return { success: false, locationDisabled: true };
            }

            const result = await ThemeResolver.refreshAndResolve();
            const newIsEvening = result.mode === ThemeResolver.THEME_MODE.EVENING;

            // Update automatic theme state
            setAutomaticIsEvening(newIsEvening);

            // CRITICAL: Clear manual preview on refresh
            setManualPreviewOverride(null);

            setLocation(result.location);
            setMaghribTime(result.maghribTime);

            // Refresh all location-based data if we have location
            if (result.location) {
                const lat = result.location.latitude;
                const lng = result.location.longitude;

                // Refresh all in parallel
                const [prayerResult, cityResult, weatherResult] = await Promise.all([
                    PrayerTimeService.refreshPrayerTimes(lat, lng),
                    CityService.refreshCity(lat, lng),
                    WeatherService.refreshWeather(lat, lng),
                ]);

                if (prayerResult) {
                    setPrayerData(prayerResult);
                }
                setCityName(cityResult);
                setWeather(weatherResult);
            }

            // Update date reference
            currentDateRef.current = getTodayDateString();

            console.log('ThemeContext: Theme refreshed:', result.mode, '(manual preview cleared)');
            return { success: true };
        } catch (error) {
            console.error('ThemeContext: Error refreshing theme:', error);
            setAutomaticIsEvening(false);
            setManualPreviewOverride(null);
            return { success: false, error: true };
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Handle app state changes (foreground/background)
     * CLEARS manual preview on foreground - re-syncs with automatic logic
     */
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            // App came to foreground
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('ThemeContext: App came to foreground, re-evaluating');

                // Check if date changed (midnight crossed)
                const newDate = getTodayDateString();
                if (newDate !== currentDateRef.current) {
                    console.log('ThemeContext: Date changed, forcing refresh');
                    currentDateRef.current = newDate;
                    refreshTheme();
                } else {
                    evaluateTheme();
                }
            }

            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription?.remove();
        };
    }, [evaluateTheme, refreshTheme]);

    /**
     * Initial theme evaluation on mount
     */
    useEffect(() => {
        evaluateTheme();
    }, [evaluateTheme]);

    /**
     * Periodic check for theme changes (every 5 minutes)
     * This catches the transition at Maghrib time without requiring app restart
     * CLEARS manual preview - periodic check syncs with automatic logic
     */
    useEffect(() => {
        const interval = setInterval(() => {
            // Only re-evaluate, don't force refresh
            evaluateTheme();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [evaluateTheme]);

    // Computed: hasNoData = location disabled AND no cached prayer data
    // Used to show "location permission required" message on HomeScreen
    const hasNoData = !isLocationEnabled && !prayerData && !isLoading;

    const value = {
        isEvening,           // Effective theme (manual override ?? automatic)
        isLoading,
        isLocationEnabled,   // Is location enabled by user preference
        hasNoData,           // True when location disabled and no cached data
        location,
        maghribTime,
        prayerData,
        cityName,
        weather,
        isManualPreview,     // True if currently in manual preview mode
        refreshTheme,
        toggleThemePreview,  // Toggle manual preview
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
