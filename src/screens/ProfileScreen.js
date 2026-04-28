import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    Modal,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import auth from '@react-native-firebase/auth';
import FirebaseService from '../services/FirebaseService';
import StorageService from '../services/StorageService';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent }) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={showArrow && !rightComponent ? onPress : undefined}
        activeOpacity={0.7}
        disabled={!showArrow || rightComponent}
    >
        <View style={styles.settingIconContainer}>
            <Ionicons name={icon} size={22} color={colors.primary.sage} />
        </View>
        <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {rightComponent ? rightComponent : (
            showArrow && <Ionicons name="chevron-forward" size={20} color={colors.text.grey} />
        )}
    </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
);

const ProfileScreen = ({ navigation }) => {
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(1); // 0 = Shafi, 1 = Hanafi
    const [weatherUnit, setWeatherUnit] = useState('C');
    const [isWeatherUnitManual, setIsWeatherUnitManual] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get country name from theme context
    const { countryName } = useTheme();

    // Subscription state
    const { isProUser } = useSubscription();

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(5);
    const [deleting, setDeleting] = useState(false);
    const countdownRef = useRef(null);
    const deletingRef = useRef(false);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    // Fetch user data from Firestore
                    const firestoreData = await FirebaseService.getUserRootData();

                    // Extract name from Firestore or Firebase Auth
                    const displayName = firestoreData.name || user.displayName || user.email.split('@')[0];
                    const nameParts = displayName.split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts[1] || '';

                    // Create initials
                    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

                    // Calculate days since member
                    const createdAt = firestoreData.createdAt?.toDate ? firestoreData.createdAt.toDate() : new Date();
                    const now = new Date();
                    const daysSince = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
                    const monthYear = createdAt.toLocaleString('default', { month: 'long', year: 'numeric' });

                    // Calculate streak (for now, basic calculation - can be enhanced)
                    const streak = Math.min(daysSince, 30); // Max 30 day streak display

                    setUserData({
                        name: displayName,
                        email: user.email,
                        avatarInitials: initials.length > 0 ? initials : 'U',
                        memberSince: monthYear,
                        streak: streak,
                        totalDays: daysSince,
                    });
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    // Fallback to basic info if Firestore fails
                    const displayName = user.displayName || user.email.split('@')[0];
                    const nameParts = displayName.split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts[1] || '';
                    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

                    setUserData({
                        name: displayName,
                        email: user.email,
                        avatarInitials: initials.length > 0 ? initials : 'U',
                        memberSince: 'January 2026',
                        streak: 15,
                        totalDays: 45,
                    });
                }
            } else {
                // Don't navigate during account deletion — the deletion handler controls navigation
                if (!deletingRef.current) {
                    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
                }
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [navigation]);

    // Load Prayer School preference on mount
    useEffect(() => {
        const loadSchoolPreference = async () => {
            try {
                const school = await StorageService.getSchoolPreference();
                setSelectedSchool(school);
                console.log('🕌 Loaded school preference:', school === 0 ? 'Standard' : 'Hanafi');
            } catch (error) {
                console.error('Error loading school preference:', error);
            }
        };

        loadSchoolPreference();
    }, []);

    // Helper to get automatic weather unit based on country
    const getAutomaticWeatherUnit = (country) => {
        const fahrenheitCountries = new Set([
            'united states',
            'united states of america',
            'usa',
            'bahamas',
            'cayman islands',
            'liberia',
        ]);

        if (!country) {
            return 'C';
        }

        const normalizedCountry = country.trim().toLowerCase();
        return fahrenheitCountries.has(normalizedCountry) ? 'F' : 'C';
    };

    // Load weather unit and detect country changes
    useEffect(() => {
        const loadWeatherUnit = async () => {
            try {
                // Check if country has changed and reset weather unit if needed
                const { countryChanged, wasManuallySet } = await StorageService.checkAndResetWeatherUnitIfCountryChanged(countryName);

                // Load the saved weather unit (or null if auto-detect)
                const unit = await StorageService.getWeatherUnit();
                if (unit) {
                    setWeatherUnit(unit);
                    setIsWeatherUnitManual(true);
                } else {
                    // Auto-detect based on country
                    const autoUnit = getAutomaticWeatherUnit(countryName);
                    setWeatherUnit(autoUnit);
                    setIsWeatherUnitManual(false);
                }

                // Log if country changed and manual override was reset
                if (countryChanged && wasManuallySet) {
                    console.log('🌍 Weather unit reset due to country change');
                }
            } catch (error) {
                console.error('ProfileScreen: Error loading weather unit:', error);
                setWeatherUnit(getAutomaticWeatherUnit(countryName));
                setIsWeatherUnitManual(false);
            }
        };

        if (countryName) {
            loadWeatherUnit();
        }
    }, [countryName]);

    const toggleWeatherUnit = async () => {
        const nextUnit = weatherUnit === 'C' ? 'F' : 'C';
        setWeatherUnit(nextUnit);
        hasSavedWeatherUnit.current = true;
        try {
            await StorageService.saveWeatherUnit(nextUnit);
            console.log('Weather unit changed to:', nextUnit);
        } catch (error) {
            console.error('ProfileScreen: Error saving weather unit:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Log Out',
                    onPress: async () => {
                        try {
                            await auth().signOut();
                            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to log out');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const handleSchoolChange = async (school) => {
        setSelectedSchool(school);
        await StorageService.saveSchoolPreference(school);
        console.log('🕌 School preference changed to:', school === 0 ? 'Standard' : 'Hanafi');
    };

    const openDeleteModal = () => {
        setDeleteCountdown(5);
        setShowDeleteModal(true);

        // Start countdown
        let count = 5;
        countdownRef.current = setInterval(() => {
            count -= 1;
            setDeleteCountdown(count);
            if (count <= 0) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
        }, 1000);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        deletingRef.current = true;
        try {
            await FirebaseService.deleteAccountAndCleanup();
            // Auth account deleted — close modal and navigate to Welcome screen
            setShowDeleteModal(false);
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        } catch (error) {
            console.error('Account deletion error:', error);
            deletingRef.current = false;
            setDeleting(false);
            setShowDeleteModal(false);

            // If auth/requires-recent-login, prompt user to re-authenticate
            if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                    'Re-authentication Required',
                    'For security, please log out and log back in, then try deleting your account again.',
                );
            } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
        }
    };

    return (<>
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                {/* Profile Card */}
                {userData ? (
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{userData.avatarInitials}</Text>
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{userData.name}</Text>
                            <Text style={styles.profileEmail}>{userData.email}</Text>
                            <Text style={styles.memberSince}>Member since {userData.memberSince}</Text>
                        </View>
                        {/* Logout Pill */}
                        <TouchableOpacity style={styles.logoutPill} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={16} color="#E57373" />
                            <Text style={styles.logoutPillText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Stats Section */}
                {/* <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="flame-outline" size={24} color="#FF6B6B" />
                        </View>
                        <Text style={styles.statValue}>{userData.streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="calendar-outline" size={24} color={colors.primary.sage} />
                        </View>
                        <Text style={styles.statValue}>{userData.totalDays}</Text>
                        <Text style={styles.statLabel}>Total Days</Text>
                    </View>
                </View> */}



                {/* AJR+ Subscription Card */}
                <TouchableOpacity
                    style={styles.ajrPlusCard}
                    onPress={() => navigation.navigate('Subscription', { fromSettings: true })}
                    activeOpacity={0.8}
                >
                    <View style={styles.ajrPlusIconContainer}>
                        <Ionicons name="diamond-outline" size={22} color="#C4A265" />
                    </View>
                    <View style={styles.ajrPlusContent}>
                        <Text style={styles.ajrPlusTitle}>AJR+</Text>
                        <Text style={styles.ajrPlusSubtitle}>
                            {isProUser ? 'Active — Full premium access' : 'Upgrade for premium features'}
                        </Text>
                    </View>
                    <View style={[
                        styles.ajrPlusStatusBadge,
                        isProUser ? styles.ajrPlusStatusActive : styles.ajrPlusStatusInactive,
                    ]}>
                        <Text style={[
                            styles.ajrPlusStatusText,
                            isProUser ? styles.ajrPlusStatusTextActive : styles.ajrPlusStatusTextInactive,
                        ]}>
                            {isProUser ? 'Active' : 'Upgrade'}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Preferences Section */}
                <SectionHeader title="Settings" />
                <View style={styles.settingsSection}>
                    <SettingItem
                        icon="book-outline"
                        title="My AJR Activities"
                        subtitle="Manage your daily activities"
                        onPress={() => navigation.navigate('SelectActivities', { fromSettings: true })}
                    />
                    <SettingItem
                        icon="notifications-outline"
                        title="Notifications"
                        subtitle="Prayer reminders, daily prompts"
                        onPress={() => navigation.navigate('Notifications')}
                    />
                    <SettingItem
                        icon="location-outline"
                        title="Location Settings"
                        subtitle="For accurate prayer times"
                        onPress={() => navigation.navigate('LocationPermission', { fromSettings: true })}
                    />
                    <SettingItem
                        icon="time-outline"
                        title="Custom Prayer Adjustments"
                        subtitle="Fine-tune individual prayer times"
                        onPress={() => navigation.navigate('PrayerAdjustments')}
                    />
                    <SettingItem
                        icon="book-outline"
                        title="Prayer School"
                        subtitle={selectedSchool === 0 ? 'Standard' : 'Hanafi'}
                        showArrow={false}
                        rightComponent={
                            <View style={styles.schoolToggleContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.schoolToggleButton,
                                        selectedSchool === 0 && styles.schoolToggleButtonActive
                                    ]}
                                    onPress={() => handleSchoolChange(0)}
                                >
                                    <Text style={[
                                        styles.schoolToggleText,
                                        selectedSchool === 0 && styles.schoolToggleTextActive
                                    ]}>
                                        Standard
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.schoolToggleButton,
                                        selectedSchool === 1 && styles.schoolToggleButtonActive
                                    ]}
                                    onPress={() => handleSchoolChange(1)}
                                >
                                    <Text style={[
                                        styles.schoolToggleText,
                                        selectedSchool === 1 && styles.schoolToggleTextActive
                                    ]}>
                                        Hanafi
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                    <SettingItem
                        icon="thermometer-outline"
                        title="Temperature Unit"
                        subtitle={isWeatherUnitManual ? `Manual: ${weatherUnit === 'C' ? 'Celsius' : 'Fahrenheit'}` : `Auto: ${weatherUnit}°`}
                        showArrow={false}
                        rightComponent={
                            <View style={styles.weatherToggleContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.weatherToggleButton,
                                        weatherUnit === 'C' && styles.weatherToggleButtonActive
                                    ]}
                                    onPress={async () => {
                                        if (weatherUnit !== 'C') {
                                            setWeatherUnit('C');
                                            setIsWeatherUnitManual(true);
                                            await StorageService.saveWeatherUnit('C');
                                            console.log('🌡️ ProfileScreen: Weather unit changed to Celsius');
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.weatherToggleText,
                                        weatherUnit === 'C' && styles.weatherToggleTextActive
                                    ]}>
                                        °C
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.weatherToggleButton,
                                        weatherUnit === 'F' && styles.weatherToggleButtonActive
                                    ]}
                                    onPress={async () => {
                                        if (weatherUnit !== 'F') {
                                            setWeatherUnit('F');
                                            setIsWeatherUnitManual(true);
                                            await StorageService.saveWeatherUnit('F');
                                            console.log('🌡️ ProfileScreen: Weather unit changed to Fahrenheit');
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.weatherToggleText,
                                        weatherUnit === 'F' && styles.weatherToggleTextActive
                                    ]}>
                                        °F
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                    {/* <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        showArrow={false}
                        rightComponent={
                            <Switch
                                value={darkModeEnabled}
                                onValueChange={setDarkModeEnabled}
                                trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor="#E0E0E0"
                            />
                        }
                    /> */}
                    {/* <SettingItem
                        icon="language-outline"
                        title="Language"
                        subtitle="English"
                        onPress={() => console.log('Language')}
                    /> */}
                </View>

                <SectionHeader title="Privacy & Terms" />
                <View style={styles.legalSection}>
                    <TouchableOpacity
                        style={styles.legalButton}
                        activeOpacity={0.7}
                        onPress={() => Linking.openURL('https://ajrapp.com/policies/privacy-and-policy')}
                    >
                        <Text style={styles.legalButtonText}>Privacy and Policy</Text>
                        <Ionicons name="open-outline" size={18} color={colors.primary.sage} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.legalButton, styles.legalButtonLast]}
                        activeOpacity={0.7}
                        onPress={() => Linking.openURL('https://ajrapp.com/terms-of-services')}
                    >
                        <Text style={styles.legalButtonText}>Terms of Services</Text>
                        <Ionicons name="open-outline" size={18} color={colors.primary.sage} />
                    </TouchableOpacity>
                </View>





                {/* Logout Button Moved to Profile Card */}

                {/* User Account Deletion */}
                <SectionHeader title="Account Management" />
                <View style={styles.dangerSection}>
                    <TouchableOpacity
                        style={styles.dangerItem}
                        onPress={openDeleteModal}
                        activeOpacity={0.7}
                    >
                        <View style={styles.dangerIconContainer}>
                            <Ionicons name="trash-outline" size={22} color="#D32F2F" />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={styles.dangerTitle}>Delete Account</Text>
                            <Text style={styles.dangerSubtitle}>Permanently delete your account</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D32F2F" />
                    </TouchableOpacity>
                </View>

                {/* App Version */}
                <Text style={styles.versionText}>AJR v2.0.0</Text>
            </ScrollView>
        </View>

        {/* Delete Confirmation Modal */}
        <Modal
            visible={showDeleteModal}
            transparent={true}
            animationType="fade"
            onRequestClose={deleting ? undefined : closeDeleteModal}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.deleteModalContainer}>
                    <View style={styles.deleteModalIconContainer}>
                        <Ionicons name={deleting ? "hourglass-outline" : "warning"} size={36} color="#D32F2F" />
                    </View>

                    <Text style={styles.deleteModalTitle}>{deleting ? 'Deleting Account...' : 'Delete Account'}</Text>

                    <Text style={styles.deleteModalMessage}>
                        {deleting
                            ? 'Please wait while we remove your data and clean up your circles. Do not close the app.'
                            : 'Your account and all data will be permanently deleted, including removal from all circles. This action cannot be undone.'
                        }
                    </Text>

                    {deleting ? (
                        <View style={styles.deleteModalLoading}>
                            <ActivityIndicator size="small" color="#D32F2F" />
                            <Text style={styles.deleteModalLoadingText}>Deleting account...</Text>
                        </View>
                    ) : (
                        <View style={styles.deleteModalActions}>
                            <TouchableOpacity
                                style={styles.deleteModalCancelButton}
                                onPress={closeDeleteModal}
                            >
                                <Text style={styles.deleteModalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.deleteModalConfirmButton,
                                    deleteCountdown > 0 && styles.deleteModalConfirmDisabled,
                                ]}
                                onPress={handleDeleteAccount}
                                disabled={deleteCountdown > 0}
                            >
                                <Text style={[
                                    styles.deleteModalConfirmText,
                                    deleteCountdown > 0 && styles.deleteModalConfirmTextDisabled,
                                ]}>
                                    {deleteCountdown > 0 ? `Delete (${deleteCountdown}s)` : 'Delete'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    </>);
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.06,
        paddingBottom: spacing.xxl,
    },
    header: {
        marginBottom: spacing.lg,
    },
    headerTitle: {
        fontSize: isSmallDevice ? 28 : 32,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.xl,
        padding: spacing.sm,
        marginBottom: spacing.lg,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 35,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: typography.fontWeight.semibold,
        color: '#FFFFFF',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.primary.light,
    },
    profileInfo: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    profileName: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        marginBottom: 4,
        marginRight:10
    },
    memberSince: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
        fontStyle: 'italic',
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    editProfileText: {
        fontSize: 11,
        color: colors.primary.sage,
        marginLeft: 4,
        fontWeight: typography.fontWeight.medium,
    },
    statsContainer: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginRight: spacing.sm,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: isSmallDevice ? 22 : 26,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    statLabel: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
        marginTop: 2,
    },
    sectionHeader: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.grey,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    settingsSection: {
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    settingSubtitle: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
        marginTop: 2,
    },
    logoutPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(229, 115, 115, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginLeft: 'auto',
    },
    logoutPillText: {
        fontSize: 13,
        fontWeight: typography.fontWeight.medium,
        color: '#E57373',
        marginLeft: 4,
    },
    versionText: {
        fontSize: 12,
        color: colors.text.grey,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    deleteButton: {
        // kept for reference, unused
    },
    deleteButtonText: {
        // kept for reference, unused
    },
    dangerSection: {
        borderWidth: 1,
        borderColor: 'rgba(211, 47, 47, 0.15)',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    dangerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    dangerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    dangerTitle: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    dangerSubtitle: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    deleteModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    deleteModalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    deleteModalTitle: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.sm,
    },
    deleteModalMessage: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.xl,
    },
    deleteModalActions: {
        flexDirection: 'row',
        width: '100%',
        gap: spacing.sm,
    },
    deleteModalCancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.primary.light,
        alignItems: 'center',
    },
    deleteModalCancelText: {
        fontSize: isSmallDevice ? 14 : 15,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    deleteModalConfirmButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: '#D32F2F',
        alignItems: 'center',
    },
    deleteModalConfirmDisabled: {
        backgroundColor: 'rgba(211, 47, 47, 0.3)',
    },
    deleteModalConfirmText: {
        fontSize: isSmallDevice ? 14 : 15,
        fontWeight: typography.fontWeight.medium,
        color: '#FFFFFF',
    },
    deleteModalConfirmTextDisabled: {
        color: 'rgba(255,255,255,0.6)',
    },
    deleteModalLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
    },
    deleteModalLoadingText: {
        fontSize: isSmallDevice ? 13 : 14,
        color: '#D32F2F',
        fontWeight: typography.fontWeight.medium,
    },
    schoolToggleContainer: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    schoolToggleButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(122, 158, 127, 0.1)',
        borderWidth: 1,
        borderColor: colors.primary.darkSage,
        minWidth: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    schoolToggleButtonActive: {
        backgroundColor: colors.primary.darkSage,
        borderColor: colors.primary.darkSage,
    },
    schoolToggleText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.primary.darkSage,
    },
    schoolToggleTextActive: {
        color: '#FFFFFF',
    },
    weatherToggleContainer: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    weatherToggleButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(122, 158, 127, 0.1)',
        borderWidth: 1,
        borderColor: colors.primary.sage,
        minWidth: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weatherToggleButtonActive: {
        backgroundColor: colors.primary.sage,
        borderColor: colors.primary.sage,
    },
    weatherToggleText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.primary.sage,
    },
    weatherToggleTextActive: {
        color: '#FFFFFF',
    },
    legalSection: {
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    legalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    legalButtonLast: {
        borderBottomWidth: 0,
    },
    legalButtonText: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },

    // ── AJR+ Card ──
    ajrPlusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(196, 162, 101, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(196, 162, 101, 0.25)',
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    ajrPlusIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(196, 162, 101, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    ajrPlusContent: {
        flex: 1,
    },
    ajrPlusTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.bold,
        color: '#9E7E3F',
        letterSpacing: 0.5,
    },
    ajrPlusSubtitle: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
        marginTop: 2,
    },
    ajrPlusStatusBadge: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 14,
    },
    ajrPlusStatusActive: {
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
    },
    ajrPlusStatusInactive: {
        backgroundColor: 'rgba(196, 162, 101, 0.15)',
    },
    ajrPlusStatusText: {
        fontSize: 12,
        fontWeight: typography.fontWeight.semibold,
    },
    ajrPlusStatusTextActive: {
        color: colors.primary.sage,
    },
    ajrPlusStatusTextInactive: {
        color: '#9E7E3F',
    },
});

export default ProfileScreen;
