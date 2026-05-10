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
import { colors, typography, spacing, borderRadius } from '../theme';
import FirebaseService from '../services/FirebaseService';
import NotificationService from '../services/NotificationService';
import StorageService from '../services/StorageService';
import NotificationPermissionModal from '../components/NotificationPermissionModal';

import fajrIcon from '../../assets/images/fajr.png';
import duhurIcon from '../../assets/images/duhur.png';
import asrIcon from '../../assets/images/asr.png';
import maghribIcon from '../../assets/images/mughrib.png';
import ishaIcon from '../../assets/images/isha.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const prayers = [
    { id: 'fajr', dbKey: 'fajr', name: 'Fajr', icon: fajrIcon },
    { id: 'duhur', dbKey: 'dhuhr', name: 'Duhur', icon: duhurIcon },
    { id: 'asr', dbKey: 'asr', name: 'Asr', icon: asrIcon },
    { id: 'maghrib', dbKey: 'maghrib', name: 'Maghrib', icon: maghribIcon },
    { id: 'isha', dbKey: 'isha', name: 'Isha', icon: ishaIcon },
];

const SOUND_MODES = [
    { id: 'athan', label: 'Athan', icon: 'volume-high-outline', description: 'Athan call' },
    { id: 'beep', label: 'Beep', icon: 'notifications-outline', description: 'Short beep' },
    { id: 'vibration', label: 'Vibration', icon: 'phone-portrait-outline', description: 'Vibrate only' },
    { id: 'silent', label: 'Silent', icon: 'volume-mute-outline', description: 'Visual only' },
];

const NEXT_PRAYER_MAP = {
    fajr: 'Dhuhr',
    duhur: 'Asr',
    asr: 'Maghrib',
    maghrib: 'Isha',
    isha: 'Fajr',
};

const DEFAULT_SETTINGS = {
    fajr: { enabled: false, soundMode: 'athan', reminderEnabled: false },
    duhur: { enabled: false, soundMode: 'athan', reminderEnabled: false },
    asr: { enabled: false, soundMode: 'athan', reminderEnabled: false },
    maghrib: { enabled: false, soundMode: 'athan', reminderEnabled: false },
    isha: { enabled: false, soundMode: 'athan', reminderEnabled: false },
};

// ── Per-Prayer Expandable Card ──────────────────────────────────────────────
const PrayerCard = ({ prayer, settings, onSettingChange }) => {
    const isEnabled = settings.enabled;
    const currentMode = SOUND_MODES.find(m => m.id === settings.soundMode) || SOUND_MODES[0];
    const nextPrayer = NEXT_PRAYER_MAP[prayer.id];

    const cycleSoundMode = () => {
        const currentIndex = SOUND_MODES.findIndex(m => m.id === settings.soundMode);
        const nextIndex = (currentIndex + 1) % SOUND_MODES.length;
        onSettingChange(prayer.id, 'soundMode', SOUND_MODES[nextIndex].id);
    };

    return (
        <View style={styles.prayerCard}>
            {/* Header row: icon, name, enable switch */}
            <View style={styles.prayerHeader}>
                <Image source={prayer.icon} style={styles.prayerIcon} resizeMode="contain" />
                <Text style={styles.prayerName}>{prayer.name}</Text>
                <View style={styles.prayerControls}>
                    <Switch
                        value={isEnabled}
                        onValueChange={(value) => onSettingChange(prayer.id, 'enabled', value)}
                        trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#E0E0E0"
                    />
                </View>
            </View>

            {/* Expanded settings when enabled */}
            {isEnabled && (
                <View style={styles.prayerDetails}>
                    {/* Sound Mode */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>Sound Mode</Text>
                            <Text style={styles.settingSubtext}>{currentMode.description}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.soundModeButton}
                            onPress={cycleSoundMode}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={currentMode.icon} size={17} color="#FFFFFF" />
                            <Text style={styles.soundModeButtonText}>{currentMode.label}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 20-min Reminder */}
                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>20-min Reminder</Text>
                            <Text style={styles.settingSubtext}>Alert when 20 min left for {prayer.name}</Text>
                        </View>
                        <Switch
                            value={settings.reminderEnabled}
                            onValueChange={(value) => onSettingChange(prayer.id, 'reminderEnabled', value)}
                            trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E0E0E0"
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

// ── Main Screen ─────────────────────────────────────────────────────────────
const NotificationsScreen = ({ navigation, route }) => {
    const source = route?.params?.source || 'home';

    const [prayerSettings, setPrayerSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [showPermModal, setShowPermModal] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const info = await FirebaseService.getOnboardingInfo();
                const prayer = info?.prayer || {};
                const globalSoundMode = prayer.soundMode || 'athan';

                const parsePrayer = (val, fallbackSound) => {
                    if (val && typeof val === 'object') {
                        return {
                            enabled: val.enabled ?? false,
                            soundMode: val.soundMode || fallbackSound,
                            reminderEnabled: val.reminderEnabled ?? false,
                        };
                    }
                    return { enabled: val ?? false, soundMode: fallbackSound, reminderEnabled: false };
                };

                setPrayerSettings({
                    fajr: parsePrayer(prayer.fajr, globalSoundMode),
                    duhur: parsePrayer(prayer.dhuhr, globalSoundMode),
                    asr: parsePrayer(prayer.asr, globalSoundMode),
                    maghrib: parsePrayer(prayer.maghrib, globalSoundMode),
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
        try {
            await FirebaseService.savePrayerSettings({
                fajr: { enabled: updatedSettings.fajr.enabled, soundMode: updatedSettings.fajr.soundMode, reminderEnabled: updatedSettings.fajr.reminderEnabled },
                dhuhr: { enabled: updatedSettings.duhur.enabled, soundMode: updatedSettings.duhur.soundMode, reminderEnabled: updatedSettings.duhur.reminderEnabled },
                asr: { enabled: updatedSettings.asr.enabled, soundMode: updatedSettings.asr.soundMode, reminderEnabled: updatedSettings.asr.reminderEnabled },
                maghrib: { enabled: updatedSettings.maghrib.enabled, soundMode: updatedSettings.maghrib.soundMode, reminderEnabled: updatedSettings.maghrib.reminderEnabled },
                isha: { enabled: updatedSettings.isha.enabled, soundMode: updatedSettings.isha.soundMode, reminderEnabled: updatedSettings.isha.reminderEnabled },
                soundMode: updatedSettings.fajr.soundMode, // backward compat global key
            });

            // Try cached timings first
            let fullData = await StorageService.getFullTimings();

            // If cache is stale/empty, fetch fresh from API
            if (!fullData) {
                console.log('[NotificationsScreen] No cached timings — fetching fresh from API...');
                const location = await StorageService.getLocation();
                if (location?.latitude && location?.longitude) {
                    const PrayerTimeService = require('../services/PrayerTimeService').default;
                    const prayerData = await PrayerTimeService.getCompletePrayerData(
                        location.latitude, location.longitude
                    );
                    if (prayerData?.timings && prayerData?.timezone) {
                        fullData = { timings: prayerData.timings, timezone: prayerData.timezone };
                        console.log('[NotificationsScreen] Fresh timings fetched successfully');
                    }
                }
            }

            if (fullData) {
                const { timings, timezone } = fullData;
                await NotificationService.schedulePrayerNotifications(
                    {
                        fajr: updatedSettings.fajr,
                        dhuhr: updatedSettings.duhur,  // NotificationService expects 'dhuhr' key
                        asr: updatedSettings.asr,
                        maghrib: updatedSettings.maghrib,
                        isha: updatedSettings.isha,
                    },
                    timings,
                    timezone
                );
            } else {
                console.warn('[NotificationsScreen] Could not get prayer timings — notifications not scheduled. They will be scheduled on next app open.');
            }
        } catch (err) {
            console.error('NotificationsScreen: failed to save prayer settings', err);
        }
    }, []);

    const handleSettingChange = async (prayerId, setting, value) => {
        if (setting === 'enabled' && value === true) {
            const granted = await NotificationService.requestPermissions();
            if (!granted) {
                setShowPermModal(true);
                return;
            }
        }
        const updated = {
            ...prayerSettings,
            [prayerId]: { ...prayerSettings[prayerId], [setting]: value },
        };
        setPrayerSettings(updated);
        saveToDb(updated);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.primary.light }]}>
            <View style={{ flex: 1 }}>
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
                        Choose which prayers to receive notifications for and customize the sound for each
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
                                    settings={prayerSettings[prayer.id]}
                                    onSettingChange={handleSettingChange}
                                />
                            ))}
                        </View>
                    )}

                    {/* ── Sound Mode Legend ── */}
                    {!loading && (
                        <View style={styles.legendBox}>
                            <Text style={styles.legendTitle}>Sound Modes</Text>
                            {SOUND_MODES.map((mode) => (
                                <View key={mode.id} style={styles.legendRow}>
                                    <View style={styles.legendIconWrap}>
                                        <Ionicons name={mode.icon} size={16} color={colors.primary.sage} />
                                    </View>
                                    <Text style={styles.legendLabel}>{mode.label}</Text>
                                    <Text style={styles.legendDesc}> — {mode.description}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Permission Modal */}
            <NotificationPermissionModal
                visible={showPermModal}
                onClose={() => setShowPermModal(false)}
            />
        </View>
    );
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

    cardsContainer: {
        marginBottom: spacing.md,
    },

    // ── Prayer card ──
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

    // ── Expanded details ──
    prayerDetails: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.04)',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm + 2,
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

    // ── Sound mode button ──
    soundModeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary.sage,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.xs + 2,
        paddingHorizontal: spacing.sm + 2,
        gap: 6,
    },
    soundModeButtonText: {
        fontSize: 13,
        fontWeight: typography.fontWeight.semibold,
        color: '#FFFFFF',
    },

    // ── Legend ──
    legendBox: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    legendTitle: {
        fontSize: isSmallDevice ? 14 : 15,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.sm,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    legendIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(122,158,127,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    legendLabel: {
        fontSize: 13,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    legendDesc: {
        fontSize: 13,
        color: colors.text.grey,
    },
});

export default NotificationsScreen;
