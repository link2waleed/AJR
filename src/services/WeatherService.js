/**
 * WeatherService.js
 * Open-Meteo API integration for current temperature
 * 
 * Uses Open-Meteo free API (no API key required)
 * Only fetches current temperature in Celsius
 * Gracefully degrades if API fails
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ajr_weather_cache';
const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';

// Cache duration: 30 minutes
const CACHE_DURATION_MS = 30 * 60 * 1000;

// Weather code to icon mapping (WMO Weather interpretation codes)
// https://open-meteo.com/en/docs
const WEATHER_ICONS = {
    // Clear
    0: { icon: 'sunny-outline', description: 'Clear sky' },
    1: { icon: 'sunny-outline', description: 'Mainly clear' },

    // Partly cloudy
    2: { icon: 'partly-sunny-outline', description: 'Partly cloudy' },
    3: { icon: 'cloudy-outline', description: 'Overcast' },

    // Fog
    45: { icon: 'cloudy-outline', description: 'Foggy' },
    48: { icon: 'cloudy-outline', description: 'Depositing rime fog' },

    // Drizzle
    51: { icon: 'rainy-outline', description: 'Light drizzle' },
    53: { icon: 'rainy-outline', description: 'Moderate drizzle' },
    55: { icon: 'rainy-outline', description: 'Dense drizzle' },

    // Freezing Drizzle
    56: { icon: 'rainy-outline', description: 'Light freezing drizzle' },
    57: { icon: 'rainy-outline', description: 'Dense freezing drizzle' },

    // Rain
    61: { icon: 'rainy-outline', description: 'Slight rain' },
    63: { icon: 'rainy-outline', description: 'Moderate rain' },
    65: { icon: 'rainy-outline', description: 'Heavy rain' },

    // Freezing Rain
    66: { icon: 'rainy-outline', description: 'Light freezing rain' },
    67: { icon: 'rainy-outline', description: 'Heavy freezing rain' },

    // Snow
    71: { icon: 'snow-outline', description: 'Slight snow' },
    73: { icon: 'snow-outline', description: 'Moderate snow' },
    75: { icon: 'snow-outline', description: 'Heavy snow' },
    77: { icon: 'snow-outline', description: 'Snow grains' },

    // Showers
    80: { icon: 'rainy-outline', description: 'Slight rain showers' },
    81: { icon: 'rainy-outline', description: 'Moderate rain showers' },
    82: { icon: 'thunderstorm-outline', description: 'Violent rain showers' },

    // Snow showers
    85: { icon: 'snow-outline', description: 'Slight snow showers' },
    86: { icon: 'snow-outline', description: 'Heavy snow showers' },

    // Thunderstorm
    95: { icon: 'thunderstorm-outline', description: 'Thunderstorm' },
    96: { icon: 'thunderstorm-outline', description: 'Thunderstorm with slight hail' },
    99: { icon: 'thunderstorm-outline', description: 'Thunderstorm with heavy hail' },
};

// Default icon for unknown weather codes
const DEFAULT_WEATHER = { icon: 'cloud-outline', description: 'Unknown' };

const WeatherService = {
    /**
     * Get current weather data (temperature and weather code)
     * Returns { temperature, weatherCode, icon, description } or null
     */
    getCurrentWeather: async (latitude, longitude) => {
        try {
            // Check cache first
            const cached = await WeatherService.getCachedWeather(latitude, longitude);
            if (cached) {
                console.log('WeatherService: Using cached weather:', cached.temperature);
                return cached;
            }

            // Fetch from Open-Meteo
            const url = `${OPEN_METEO_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.current) {
                throw new Error('No current weather data');
            }

            const temperature = Math.round(data.current.temperature_2m);
            const weatherCode = data.current.weather_code;
            const weatherInfo = WEATHER_ICONS[weatherCode] || DEFAULT_WEATHER;

            const weatherData = {
                temperature,
                weatherCode,
                icon: weatherInfo.icon,
                description: weatherInfo.description,
            };

            // Cache the result
            await WeatherService.cacheWeather(latitude, longitude, weatherData);

            console.log('WeatherService: Fetched weather:', weatherData);
            return weatherData;
        } catch (error) {
            console.error('WeatherService: Error getting weather:', error);
            return null;
        }
    },

    /**
     * Get cached weather if valid
     */
    getCachedWeather: async (latitude, longitude) => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (!data) return null;

            const cached = JSON.parse(data);
            const now = Date.now();

            // Check if cache is still valid (same location, not expired)
            const latMatch = Math.abs(cached.latitude - latitude) < 0.1;
            const lngMatch = Math.abs(cached.longitude - longitude) < 0.1;
            const notExpired = (now - cached.timestamp) < CACHE_DURATION_MS;

            if (latMatch && lngMatch && notExpired) {
                return cached.weather;
            }

            return null;
        } catch (error) {
            console.error('WeatherService: Error reading cache:', error);
            return null;
        }
    },

    /**
     * Cache weather data
     */
    cacheWeather: async (latitude, longitude, weather) => {
        try {
            const data = {
                latitude,
                longitude,
                weather,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('WeatherService: Error caching weather:', error);
        }
    },

    /**
     * Force refresh weather (bypasses cache)
     */
    refreshWeather: async (latitude, longitude) => {
        try {
            // Clear cache
            await AsyncStorage.removeItem(STORAGE_KEY);

            // Fetch fresh
            return await WeatherService.getCurrentWeather(latitude, longitude);
        } catch (error) {
            console.error('WeatherService: Error refreshing weather:', error);
            return null;
        }
    },

    /**
     * Get raw cached weather WITHOUT validation (for fallback when location is disabled)
     * Returns whatever is cached, even if stale
     */
    getRawCachedWeather: async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (!data) return null;
            const cached = JSON.parse(data);
            return cached.weather || null;
        } catch (error) {
            console.error('WeatherService: Error getting raw cached weather:', error);
            return null;
        }
    },

    // Export weather icons for reference
    WEATHER_ICONS,
};

export default WeatherService;
