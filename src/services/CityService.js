/**
 * CityService.js
 * Expo Location reverse geocoding for city name
 * 
 * Uses Expo Location's built-in reverse geocoding (no external API)
 * Gracefully degrades if geocoding fails
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ajr_city_cache';

// Cache duration: 24 hours (city doesn't change often)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const CityService = {
    /**
     * Get city name from coordinates using Expo Location reverse geocoding
     * Returns city name, or null if unavailable
     */
    getCityName: async (latitude, longitude) => {
        try {
            // Check cache first
            const cached = await CityService.getCachedCity(latitude, longitude);
            if (cached) {
                console.log('CityService: Using cached city:', cached);
                return cached;
            }

            // Reverse geocode using Expo Location
            const results = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (!results || results.length === 0) {
                console.log('CityService: No geocoding results');
                return null;
            }

            const location = results[0];

            // Priority: city > subregion > region > district
            const cityName = location.city
                || location.subregion
                || location.region
                || location.district
                || null;

            if (cityName) {
                // Cache the result
                await CityService.cacheCity(latitude, longitude, cityName);
                console.log('CityService: Resolved city:', cityName);
            }

            return cityName;
        } catch (error) {
            console.error('CityService: Error getting city name:', error);
            return null;
        }
    },

    /**
     * Get cached city if valid
     */
    getCachedCity: async (latitude, longitude) => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (!data) return null;

            const cached = JSON.parse(data);
            const now = Date.now();

            // Check if cache is still valid (same location, not expired)
            const latMatch = Math.abs(cached.latitude - latitude) < 0.01;
            const lngMatch = Math.abs(cached.longitude - longitude) < 0.01;
            const notExpired = (now - cached.timestamp) < CACHE_DURATION_MS;

            if (latMatch && lngMatch && notExpired) {
                return cached.cityName;
            }

            return null;
        } catch (error) {
            console.error('CityService: Error reading cache:', error);
            return null;
        }
    },

    /**
     * Cache city name
     */
    cacheCity: async (latitude, longitude, cityName) => {
        try {
            const data = {
                latitude,
                longitude,
                cityName,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('CityService: Error caching city:', error);
        }
    },

    /**
     * Force refresh city (bypasses cache)
     */
    refreshCity: async (latitude, longitude) => {
        try {
            // Clear cache
            await AsyncStorage.removeItem(STORAGE_KEY);

            // Fetch fresh
            return await CityService.getCityName(latitude, longitude);
        } catch (error) {
            console.error('CityService: Error refreshing city:', error);
            return null;
        }
    },

    /**
     * Get raw cached city WITHOUT validation (for fallback when location is disabled)
     * Returns whatever is cached, even if stale
     */
    getRawCachedCity: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (!data) return null;
            const cached = JSON.parse(data);
            return cached.cityName || null;
        } catch (error) {
            console.error('CityService: Error getting raw cached city:', error);
            return null;
        }
    },
};

export default CityService;
