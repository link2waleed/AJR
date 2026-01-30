import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Image,
    Alert,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground, Button } from '../components';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { LocationService } from '../services';
import { useTheme } from '../context';
import locationImage from '../../assets/images/location.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const LocationPermissionScreen = ({ navigation, route }) => {
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isRequestingPermission, setIsRequestingPermission] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const userName = route?.params?.userName || '';

    // Check if opened from Profile settings (vs onboarding flow)
    const isFromSettings = route?.params?.fromSettings === true;

    // Get refreshTheme to update after permission change
    const { refreshTheme } = useTheme();

    /**
     * On mount, check actual permission status AND user preference
     * Toggle reflects user preference (which may differ from system permission)
     */
    useEffect(() => {
        const checkCurrentStatus = async () => {
            try {
                // Check user preference first
                const userEnabled = await LocationService.isLocationEnabledByUser();

                if (isFromSettings) {
                    // When from settings, also check if system permission is actually granted
                    const systemGranted = await LocationService.checkPermission();
                    // Show toggle as ON only if user has enabled AND system has granted
                    setLocationEnabled(userEnabled && systemGranted === LocationService.PERMISSION_STATUS.GRANTED);
                } else {
                    // During onboarding, just use default (false) as set
                    setLocationEnabled(false);
                }

                setIsInitialized(true);
            } catch (error) {
                console.error('Error checking permission status:', error);
                setIsInitialized(true);
            }
        };

        checkCurrentStatus();
    }, [isFromSettings]);

    /**
     * Handle location toggle change
     * When enabled, request actual system permission
     * When disabled, save user preference to disable (even if system permission is granted)
     * If system permission is denied, revert toggle to OFF and keep preference disabled
     * If permission is blocked by system, show alert with device settings link
     */
    const handleLocationToggle = async (value) => {
        if (value) {
            // User wants to enable location - request system permission first
            setIsRequestingPermission(true);
            setLocationEnabled(true); // Optimistically show toggle as ON

            try {
                const result = await LocationService.requestPermission();

                if (result.status === LocationService.PERMISSION_STATUS.GRANTED) {
                    // Permission granted - save user preference to enable
                    await LocationService.setLocationEnabled(true);
                    console.log('LocationPermissionScreen: Location enabled with system permission');
                } else if (!result.canAskAgain) {
                    // Permission is blocked by system (user denied multiple times)
                    // Can't ask again - need to go to device settings
                    setLocationEnabled(false);
                    await LocationService.setLocationEnabled(false);
                    console.log('LocationPermissionScreen: Permission blocked, needs device settings');

                    Alert.alert(
                        'Permission Required',
                        'Location permission has been blocked. To enable location access, please go to your device settings and allow location permission for AJR.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Open Settings',
                                onPress: () => Linking.openSettings()
                            }
                        ]
                    );
                } else {
                    // Permission was denied but can ask again
                    setLocationEnabled(false);
                    await LocationService.setLocationEnabled(false);
                    console.log('LocationPermissionScreen: System permission denied, toggle reverted to OFF');
                }
            } catch (error) {
                console.error('Error requesting location permission:', error);
                // On error, revert toggle
                setLocationEnabled(false);
            } finally {
                setIsRequestingPermission(false);
            }
        } else {
            // User disabled location - save preference
            setLocationEnabled(false);
            await LocationService.setLocationEnabled(false);
            console.log('LocationPermissionScreen: User disabled location usage');
        }
    };

    /**
     * Navigate to next screen in onboarding flow
     */
    const proceedToNextScreen = () => {
        navigation.navigate('SelectActivities', {
            userName,
            locationEnabled,
            notificationsEnabled
        });
    };

    /**
     * Request permission and proceed if granted
     */
    const requestPermissionAndProceed = async () => {
        setIsRequestingPermission(true);
        try {
            const result = await LocationService.requestPermission();

            if (result.status === LocationService.PERMISSION_STATUS.GRANTED) {
                await LocationService.setLocationEnabled(true);
                await LocationService.getCurrentLocation();
                // Update local state to reflect enabled
                setLocationEnabled(true);
            } else if (!result.canAskAgain) {
                // Permission blocked - show device settings alert
                Alert.alert(
                    'Permission Required',
                    'Location permission has been blocked. To enable location access, please go to your device settings and allow location permission for AJR.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                    ]
                );
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
        } finally {
            setIsRequestingPermission(false);
        }
        // Proceed to next screen regardless of permission result
        proceedToNextScreen();
    };

    const handleContinue = async () => {
        // If opened from settings, handle differently
        if (isFromSettings) {
            setIsRequestingPermission(true);
            try {
                // If location is enabled, request permission and get location
                if (locationEnabled) {
                    const result = await LocationService.requestPermission();

                    if (result.status === LocationService.PERMISSION_STATUS.GRANTED) {
                        await LocationService.getCurrentLocation();
                    }
                }

                // Refresh theme to pick up permission changes
                await refreshTheme();
                // Navigate back - button stays disabled as we exit
                navigation.goBack();
            } catch (error) {
                console.error('Error during continue:', error);
                setIsRequestingPermission(false);
            }
            return;
        }

        // Onboarding flow: If location is NOT enabled, show confirmation alert
        if (!locationEnabled) {
            Alert.alert(
                'Location Permission',
                'Location access is required to show accurate prayer times for your city. Without it, prayer times may not be available.',
                [
                    {
                        text: 'Continue Anyway',
                        style: 'cancel',
                        onPress: proceedToNextScreen
                    },
                    {
                        text: 'Enable Location',
                        onPress: requestPermissionAndProceed
                    }
                ]
            );
            return;
        }

        // Location is enabled, proceed normally
        setIsRequestingPermission(true);
        try {
            const result = await LocationService.requestPermission();

            if (result.status === LocationService.PERMISSION_STATUS.GRANTED) {
                await LocationService.getCurrentLocation();
            }

            setIsRequestingPermission(false);
            proceedToNextScreen();
        } catch (error) {
            console.error('Error during continue:', error);
            setIsRequestingPermission(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.primary.light }}>
            {/* Back Button - Always show for onboarding flow */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                    navigation.goBack();
                }}
                disabled={isRequestingPermission}
            >
                <Ionicons name="arrow-back" size={24} color={colors.text.black} />
            </TouchableOpacity>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Location Pin Icon */}
                <View style={styles.iconContainer}>
                    <Image
                        source={locationImage}
                        style={styles.locationImage}
                        resizeMode="contain"
                    />
                </View>


                {/* Title */}
                <Text style={styles.title}>
                    {isFromSettings ? 'Location Settings' : 'Allow AJR to stay precise'}
                </Text>

                {/* Description */}
                <Text style={styles.description}>
                    AJR uses your location to provide precise salah times, local weather updates, and notifications that offer gentle prayer and habit reminders
                </Text>

                {/* Permission Cards */}
                <View style={styles.cardsContainer}>
                    {/* Location Permission Card */}
                    <View style={[styles.card]}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="location-outline" size={24} color={colors.primary.sage} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Allow location while using the app</Text>
                            {/* <TouchableOpacity>
                                <Text style={styles.learnMore}>Learn more</Text>
                            </TouchableOpacity> */}
                        </View>
                        <Switch
                            value={locationEnabled}
                            onValueChange={handleLocationToggle}
                            trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E0E0E0"
                            disabled={isRequestingPermission || !isInitialized}
                        />
                    </View>

                    {/* Notifications Permission Card - only show in onboarding */}
                    {!isFromSettings && (
                        <View style={[styles.card]}>
                            <View style={styles.cardIconContainer}>
                                <Ionicons name="notifications-outline" size={24} color={colors.primary.sage} />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>Allow Notifications & reminders</Text>
                                {/* <TouchableOpacity>
                                    <Text style={styles.learnMore}>Learn more</Text>
                                </TouchableOpacity> */}
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor="#E0E0E0"
                            />
                        </View>
                    )}
                </View>

                {/* Privacy Promise */}
                <View style={styles.privacyContainer}>
                    <Text style={styles.privacyTitle}>Privacy Promise</Text>
                    <Text style={styles.privacyText}>
                        No selling. No sharing. No ads. Your data stays yours.
                    </Text>
                </View>
                {/* Continue Button */}
                <Button
                    title={isRequestingPermission ? "Requesting..." : (isFromSettings ? "Save & Return" : "Continue")}
                    onPress={handleContinue}
                    icon={isFromSettings ? "checkmark" : "arrow-forward"}
                    style={styles.button}
                    disabled={isRequestingPermission || !isInitialized}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: spacing.xxl,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.08,
        paddingBottom: spacing.xxl,
    },
    backButton: {
        position: 'absolute',
        top: spacing.lg,
        left: spacing.md,
        padding: spacing.sm,
        zIndex: 10,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    locationImage: {
        width: 120,
        height: 120,
    },
    title: {
        fontSize: isSmallDevice ? 22 : 26,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    description: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.grey,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.sm,
    },
    cardsContainer: {
        marginBottom: spacing.xl,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary.light,
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    cardIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.accent.icon,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: isSmallDevice ? 14 : 15,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: 2,
    },
    learnMore: {
        fontSize: 12,
        color: colors.text.grey,
        textDecorationLine: 'underline',
    },
    privacyContainer: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    privacyTitle: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
        marginBottom: spacing.xs,
    },
    privacyText: {
        fontSize: isSmallDevice ? 12 : 14,
        fontWeight: typography.fontWeight.regular,
        color: colors.text.grey,
        textAlign: 'center',
        opacity: 0.8,
    },
    button: {
        marginTop: spacing.xxl,
    },
});

export default LocationPermissionScreen;
