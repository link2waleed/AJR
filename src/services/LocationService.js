/**
 * LocationService.js
 * Expo Location wrapper for GPS access and permission handling
 * 
 * FUTURE: This service remains client-side only. Location is sent to
 * backend via StorageService when database is connected.
 */

import * as Location from 'expo-location';
import StorageService from './StorageService';

// Permission status constants
const PERMISSION_STATUS = {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
};

const LocationService = {
    /**
     * Check current location permission status without requesting
     */
    checkPermission: async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            return status;
        } catch (error) {
            console.error('LocationService: Error checking permission:', error);
            return PERMISSION_STATUS.DENIED;
        }
    },

    /**
     * Request location permission from the user
     * Returns object with status and canAskAgain flag
     * canAskAgain is false when user has denied permission multiple times
     * and the OS won't show the permission dialog anymore
     */
    requestPermission: async () => {
        try {
            // First check current permission status to know if we can ask
            const currentPermission = await Location.getForegroundPermissionsAsync();

            // If permission is already granted, return immediately
            if (currentPermission.status === PERMISSION_STATUS.GRANTED) {
                return {
                    status: PERMISSION_STATUS.GRANTED,
                    canAskAgain: true,
                };
            }

            // If we can't ask again (user denied multiple times), return that info
            if (currentPermission.canAskAgain === false) {
                console.log('LocationService: Permission blocked by system, user must enable in settings');
                return {
                    status: PERMISSION_STATUS.DENIED,
                    canAskAgain: false,
                };
            }

            // Request permission (will show dialog)
            const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

            // Save permission result to storage
            await StorageService.savePermissionStatus(status);

            return {
                status,
                canAskAgain: canAskAgain !== false, // Default to true if undefined
            };
        } catch (error) {
            console.error('LocationService: Error requesting permission:', error);
            await StorageService.savePermissionStatus(PERMISSION_STATUS.DENIED);
            return {
                status: PERMISSION_STATUS.DENIED,
                canAskAgain: true,
            };
        }
    },

    /**
     * Check if location permission is granted AND user has enabled location usage
     * Both must be true for location to be considered usable
     */
    isPermissionGranted: async () => {
        // First check user preference
        const userEnabled = await StorageService.getLocationEnabled();
        if (userEnabled === false) {
            // User explicitly disabled location usage
            console.log('LocationService: User has disabled location usage');
            return false;
        }

        // Then check system permission
        const status = await LocationService.checkPermission();
        return status === PERMISSION_STATUS.GRANTED;
    },

    /**
     * Check if location is enabled by user (separate from system permission)
     */
    isLocationEnabledByUser: async () => {
        const enabled = await StorageService.getLocationEnabled();
        return enabled !== false; // null or true means enabled
    },

    /**
     * Save user preference for location usage
     */
    setLocationEnabled: async (enabled) => {
        await StorageService.saveLocationEnabled(enabled);
    },

    /**
     * Get current device location
     * Returns { latitude, longitude } or null if unavailable
     */
    getCurrentLocation: async () => {
        try {
            // First check if permission is granted
            const isGranted = await LocationService.isPermissionGranted();
            if (!isGranted) {
                console.log('LocationService: Permission not granted');
                return null;
            }

            // Get current position with medium accuracy (faster, sufficient for prayer times)
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = location.coords;

            // Save to storage
            await StorageService.saveLocation(latitude, longitude);

            return { latitude, longitude };
        } catch (error) {
            console.error('LocationService: Error getting location:', error);
            return null;
        }
    },

    /**
     * Get location - either fresh or from cache
     * Tries to get current location, falls back to stored location
     */
    getLocationWithFallback: async () => {
        try {
            // Check permission first
            const isGranted = await LocationService.isPermissionGranted();

            if (!isGranted) {
                // Try to return cached location if permission was previously granted
                // This allows app to work with stale data if permission is revoked
                const storedLocation = await StorageService.getLocation();
                return storedLocation;
            }

            // Try to get fresh location
            const freshLocation = await LocationService.getCurrentLocation();
            if (freshLocation) {
                return freshLocation;
            }

            // Fall back to stored location
            const storedLocation = await StorageService.getLocation();
            return storedLocation;
        } catch (error) {
            console.error('LocationService: Error in getLocationWithFallback:', error);
            // Last resort: try stored location
            return await StorageService.getLocation();
        }
    },

    /**
     * Force refresh location (for manual refresh button)
     * Re-checks permission, re-fetches location, updates storage
     */
    refreshLocation: async () => {
        try {
            // Re-check permission (may have been changed in settings)
            const status = await LocationService.checkPermission();
            await StorageService.savePermissionStatus(status);

            if (status !== PERMISSION_STATUS.GRANTED) {
                console.log('LocationService: Permission not granted after refresh check');
                return null;
            }

            // Force fetch new location
            const location = await LocationService.getCurrentLocation();
            return location;
        } catch (error) {
            console.error('LocationService: Error refreshing location:', error);
            return null;
        }
    },

    // Export constants
    PERMISSION_STATUS,
};

export default LocationService;
