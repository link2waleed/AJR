import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Dimensions,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../theme';
import FirebaseService from '../services/FirebaseService';
import NotificationService from '../services/NotificationService';
import StorageService from '../services/StorageService';
import NotificationPermissionModal from '../components/NotificationPermissionModal';


import fajrIcon from '../../assets/images/fajr.png';
import duhurIcon from '../../assets/images/duhur.png';
import asrIcon from '../../assets/images/asr.png';
import mughribIcon from '../../assets/images/mughrib.png';
import ishaIcon from '../../assets/images/isha.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const prayers = [
    { id: 'fajr', dbKey: 'fajr', name: 'Fajr', icon: fajrIcon },
    { id: 'duhur', dbKey: 'dhuhr', name: 'Duhur', icon: duhurIcon },
    { id: 'asr', dbKey: 'asr', name: 'Asr', icon: asrIcon },
    { id: 'mughrib', dbKey: 'maghrib', name: 'Mughrib', icon: mughribIcon },
    { id: 'isha', dbKey: 'isha', name: 'Isha', icon: ishaIcon },
];

const SOUND_MODES = [
    { id: 'athan', label: 'Athan', icon: 'volume-high-outline', description: 'Full Athan call to prayer' },
    { id: 'beep', label: 'Beep', icon: 'notifications-outline', description: 'Short notification sound' },
    { id: 'vibration', label: 'Vibration', icon: 'phone-portrait-outline', description: 'Vibration only, no sound' },
    { id: 'silent', label: 'Silent', icon: 'volume-mute-outline', description: 'Visual notification only' },
];

const DEFAULT_SETTINGS = {
    fajr: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
    duhur: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
    asr: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
    mughrib: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
    isha: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
};


const PrayerCard = ({ prayer, isExpanded, onToggleExpand, settings, onSettingChange, onSoundModeChange }) => {
    const currentSoundMode = SOUND_MODES.find(m => m.id === settings.soundMode) || SOUND_MODES[0];

    const handleSoundModePress = () => {
        const currentIndex = SOUND_MODES.findIndex(m => m.id === settings.soundMode);
        const nextIndex = (currentIndex + 1) % SOUND_MODES.length;
        onSoundModeChange(prayer.id, SOUND_MODES[nextIndex].id);
    };

    return (
        <View style={styles.prayerCard}>
            <TouchableOpacity
                style={styles.prayerHeader}
                onPress={() => onToggleExpand(prayer.id)}
                activeOpacity={0.7}
            >
                <Image source={prayer.icon} style={styles.prayerIcon} resizeMode="contain" />
                <Text style={styles.prayerName}>{prayer.name}</Text>

                <View style={styles.prayerControls}>
                    {isExpanded && settings.enabled && (
                        <TouchableOpacity
                            style={styles.soundButton}
                            onPress={handleSoundModePress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.soundIconBackground}>
                                <Ionicons
                                    name={currentSoundMode.icon}
                                    size={19}
                                    color="#FFFFFF"
                                />
                            </View>
                        </TouchableOpacity>
                    )}
                    <Switch
                        value={settings.enabled}
                        onValueChange={(value) => onSettingChange(prayer.id, 'enabled', value)}
                        trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#E0E0E0"
                    />
                </View>
            </TouchableOpacity>

            {isExpanded && settings.enabled && (
                <View style={styles.prayerDetails}>
                    {/* Notification at start */}
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>
                            Notification at the start of {prayer.name}
                        </Text>
                        <Switch
                            value={settings.athanEnabled}
                            onValueChange={(value) => onSettingChange(prayer.id, 'athanEnabled', value)}
                            trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E0E0E0"
                        />
                    </View>

                    {/* End-time reminder */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>End-Time Reminder</Text>
                            <Text style={styles.settingSubtext}>
                                Get a reminder 20 minutes before the prayer window closes
                            </Text>
                        </View>
                        <Switch
                            value={settings.reminderEnabled}
                            onValueChange={(value) => onSettingChange(prayer.id, 'reminderEnabled', value)}
                            trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E0E0E0"
                        />
                    </View>

                    {/* Sound mode info */}
                    <View style={styles.soundModeContainer}>
                        <Text style={styles.soundModeTitle}>
                            Current sound mode: {currentSoundMode.label}
                        </Text>
                        <Text style={styles.soundModeSubtext}>
                            Tap the sound icon to cycle through options
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};



const NotificationsScreen = ({ navigation, route }) => {
    const source = route?.params?.source || 'home'; // 'hub' | 'home'

    const [expandedPrayer, setExpandedPrayer] = useState(null);
    const [prayerSettings, setPrayerSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPermModal, setShowPermModal] = useState(false);


    useEffect(() => {
        const loadSettings = async () => {
            try {
                const info = await FirebaseService.getOnboardingInfo();
                const prayer = info?.prayer || {};
                const globalSoundMode = prayer.soundMode || 'athan';

                // Support both old structure (boolean) and new structure (object) for backward compat
                const parsePrayer = (val, fallbackSound) => {
                    if (val && typeof val === 'object') {
                        return {
                            enabled: val.enabled ?? false,
                            athanEnabled: val.athanEnabled ?? true,
                            reminderEnabled: val.reminderEnabled ?? true,
                            soundMode: fallbackSound,
                        };
                    }
                    // old boolean format
                    return { enabled: val ?? false, athanEnabled: true, reminderEnabled: true, soundMode: fallbackSound };
                };

                setPrayerSettings({
                    fajr: parsePrayer(prayer.fajr, globalSoundMode),
                    duhur: parsePrayer(prayer.dhuhr, globalSoundMode),
                    asr: parsePrayer(prayer.asr, globalSoundMode),
                    mughrib: parsePrayer(prayer.maghrib, globalSoundMode),
                    isha: parsePrayer(prayer.isha, globalSoundMode),
                });
            } catch (err) {
                console.error('NotificationsScreen: failed to load prayer settings', err);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const saveToDb = useCallback(async (updatedSettings) => {
        setSaving(true);
        try {
            // 1. Save to DB
            await FirebaseService.savePrayerSettings({
                fajr: { enabled: updatedSettings.fajr.enabled, athanEnabled: updatedSettings.fajr.athanEnabled, reminderEnabled: updatedSettings.fajr.reminderEnabled },
                dhuhr: { enabled: updatedSettings.duhur.enabled, athanEnabled: updatedSettings.duhur.athanEnabled, reminderEnabled: updatedSettings.duhur.reminderEnabled },
                asr: { enabled: updatedSettings.asr.enabled, athanEnabled: updatedSettings.asr.athanEnabled, reminderEnabled: updatedSettings.asr.reminderEnabled },
                maghrib: { enabled: updatedSettings.mughrib.enabled, athanEnabled: updatedSettings.mughrib.athanEnabled, reminderEnabled: updatedSettings.mughrib.reminderEnabled },
                isha: { enabled: updatedSettings.isha.enabled, athanEnabled: updatedSettings.isha.athanEnabled, reminderEnabled: updatedSettings.isha.reminderEnabled },
                soundMode: updatedSettings.fajr.soundMode,
            });

            // 2. Reschedule local notifications
            const timings = await StorageService.getFullTimings();
            if (timings) {
                await NotificationService.schedulePrayerNotifications(
                    {
                        fajr: updatedSettings.fajr,
                        duhur: updatedSettings.duhur,
                        asr: updatedSettings.asr,
                        mughrib: updatedSettings.mughrib,
                        isha: updatedSettings.isha,
                        soundMode: updatedSettings.fajr.soundMode,
                    },
                    timings
                );
            }
        } catch (err) {
            console.error('NotificationsScreen: failed to save prayer settings', err);
        } finally {
            setSaving(false);
        }
    }, []);

    const handleToggleExpand = (prayerId) => {
        setExpandedPrayer(expandedPrayer === prayerId ? null : prayerId);
    };

    const handleSettingChange = async (prayerId, setting, value) => {
        if (setting === 'enabled' && value === true) {
            const granted = await NotificationService.requestPermissions();
            if (!granted) {
                setShowPermModal(true);
                return;
            }
        }
        setPrayerSettings(prev => {
            const updated = {
                ...prev,
                [prayerId]: { ...prev[prayerId], [setting]: value },
            };
            saveToDb(updated);
            return updated;
        });
        if (setting === 'enabled' && value === true) {
            setExpandedPrayer(prayerId);
        }
    };

    const handleSoundModeChange = (prayerId, newMode) => {
        setPrayerSettings(prev => {
            const updated = {
                ...prev,
                [prayerId]: { ...prev[prayerId], soundMode: newMode },
            };
            saveToDb(updated);
            return updated;
        });
    };


    const isHubSource = source === 'hub';
    const gradientColors = isHubSource
        ? [colors.gradient.start, colors.gradient.middle, colors.gradient.end]
        : [colors.homeGradient.top, colors.homeGradient.top, colors.homeGradient.bottom];
    const gradientEnd = isHubSource ? { x: 1, y: 1 } : { x: 0, y: 1 };
    const gradientLocations = isHubSource ? undefined : [0, 0.7, 1];


    return (
        <>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={gradientEnd}
                locations={gradientLocations}
                style={styles.container}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Notifications</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* ── Subtitle ── */}
                    <Text style={styles.subtitle}>
                        Choose when you'd like to receive Athan notifications and reminders
                    </Text>

                    {/* ── Prayer Cards ── */}
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={colors.primary.darkSage} />
                        </View>
                    ) : (
                        <View style={styles.cardsContainer}>
                            {prayers.map((prayer) => (
                                <PrayerCard
                                    key={prayer.id}
                                    prayer={prayer}
                                    isExpanded={expandedPrayer === prayer.id}
                                    onToggleExpand={handleToggleExpand}
                                    settings={prayerSettings[prayer.id]}
                                    onSettingChange={handleSettingChange}
                                    onSoundModeChange={handleSoundModeChange}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </LinearGradient>

            {/* Permission Modal */}
            <NotificationPermissionModal
                visible={showPermModal}
                onClose={() => setShowPermModal(false)}
            />
        </>);
};



const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.06,
        paddingBottom: spacing.xxl * 2,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    headerTitle: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    savingIndicator: {
        marginLeft: 4,
    },

    subtitle: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        textAlign: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },

    loaderContainer: {
        paddingTop: spacing.xxl,
        alignItems: 'center',
    },

    // Cards container
    cardsContainer: {
        marginBottom: spacing.lg,
    },


    // Prayer card
    prayerCard: {
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        overflow: 'hidden',
    },
    prayerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    prayerIcon: {
        width: 36,
        height: 36,
        marginRight: spacing.md,
    },
    prayerName: {
        flex: 1,
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    prayerControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    soundButton: {
        marginRight: spacing.sm,
    },
    soundIconBackground: {
        backgroundColor: colors.primary.sage,
        borderRadius: borderRadius.sm,
        padding: spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Expanded details
    prayerDetails: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    settingTextContainer: {
        flex: 1,
        marginRight: spacing.sm,
    },
    settingLabel: {
        fontSize: isSmallDevice ? 13 : 14,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    settingSubtext: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
        marginTop: 2,
    },

    // Sound mode info box
    soundModeContainer: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.sm,
    },
    soundModeTitle: {
        fontSize: isSmallDevice ? 13 : 14,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    soundModeSubtext: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
    },
});

export default NotificationsScreen;
