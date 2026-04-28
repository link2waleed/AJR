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
    { id: 'athan', label: 'Athan', icon: 'volume-high-outline', description: 'Full Athan call to prayer' },
    { id: 'beep', label: 'Beep', icon: 'notifications-outline', description: 'Short notification sound' },
    { id: 'vibration', label: 'Vibration', icon: 'phone-portrait-outline', description: 'Vibration only, no sound' },
    { id: 'silent', label: 'Silent', icon: 'volume-mute-outline', description: 'Visual notification only' },
];

const DEFAULT_SETTINGS = {
    fajr: { enabled: false, athanEnabled: true, soundMode: 'athan' },
    duhur: { enabled: false, athanEnabled: true, soundMode: 'athan' },
    asr: { enabled: false, athanEnabled: true, soundMode: 'athan' },
    maghrib: { enabled: false, athanEnabled: true, soundMode: 'athan' },
    isha: { enabled: false, athanEnabled: true, soundMode: 'athan' },
};


const PrayerCard = ({ prayer, settings, onSettingChange }) => {
    return (
        <View style={styles.prayerCard}>
            <View style={styles.prayerHeader}>
                <Image source={prayer.icon} style={styles.prayerIcon} resizeMode="contain" />
                <Text style={styles.prayerName}>{prayer.name}</Text>

                <View style={styles.prayerControls}>
                    <Switch
                        value={settings.enabled}
                        onValueChange={(value) => onSettingChange(prayer.id, 'enabled', value)}
                        trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#E0E0E0"
                    />
                </View>
            </View>
        </View>
    );
};



const NotificationsScreen = ({ navigation, route }) => {
    const source = route?.params?.source || 'home'; // 'hub' | 'home'

    const [prayerSettings, setPrayerSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [showPermModal, setShowPermModal] = useState(false);
    const [nextNotification, setNextNotification] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');

    const fetchNextNotif = useCallback(async () => {
        const next = await NotificationService.getNextNotification();
        setNextNotification(next);
    }, []);

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
                            athanEnabled: val.athanEnabled ?? true,
                            soundMode: fallbackSound,
                        };
                    }
                    return { enabled: val ?? false, athanEnabled: true, soundMode: fallbackSound };
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
        fetchNextNotif();
    }, [fetchNextNotif]);

    useEffect(() => {
        if (!nextNotification) return;

        const computeTimeLeft = () => {
            const now = new Date();
            const trigger = new Date(nextNotification.triggerDate);
            const diff = trigger - now;

            if (diff <= 0) {
                setNextNotification(null);
                setTimeLeft('');
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
        };

        // Compute immediately so timer shows instantly
        computeTimeLeft();

        const interval = setInterval(computeTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [nextNotification]);

    const saveToDb = useCallback(async (updatedSettings) => {
        try {
            await FirebaseService.savePrayerSettings({
                fajr: { enabled: updatedSettings.fajr.enabled, athanEnabled: updatedSettings.fajr.athanEnabled, soundMode: updatedSettings.fajr.soundMode },
                dhuhr: { enabled: updatedSettings.duhur.enabled, athanEnabled: updatedSettings.duhur.athanEnabled, soundMode: updatedSettings.duhur.soundMode },
                asr: { enabled: updatedSettings.asr.enabled, athanEnabled: updatedSettings.asr.athanEnabled, soundMode: updatedSettings.asr.soundMode },
                maghrib: { enabled: updatedSettings.maghrib.enabled, athanEnabled: updatedSettings.maghrib.athanEnabled, soundMode: updatedSettings.maghrib.soundMode },
                isha: { enabled: updatedSettings.isha.enabled, athanEnabled: updatedSettings.isha.athanEnabled, soundMode: updatedSettings.isha.soundMode },
                soundMode: updatedSettings.fajr.soundMode,
            });

            const fullData = await StorageService.getFullTimings();
            if (fullData) {
                const { timings, timezone } = fullData;
                await NotificationService.schedulePrayerNotifications(
                    {
                        fajr: updatedSettings.fajr,
                        duhur: updatedSettings.duhur,
                        asr: updatedSettings.asr,
                        maghrib: updatedSettings.maghrib,
                        isha: updatedSettings.isha,
                        soundMode: updatedSettings.fajr.soundMode,
                    },
                    timings,
                    timezone
                );
            }
            await fetchNextNotif();
        } catch (err) {
            console.error('NotificationsScreen: failed to save prayer settings', err);
        }
    }, [fetchNextNotif]);

    const handleGlobalSettingChange = (setting, value) => {
        const updated = { ...prayerSettings };
        prayers.forEach(p => {
            updated[p.id] = { ...updated[p.id], [setting]: value };
        });
        setPrayerSettings(updated);
        saveToDb(updated);
    };

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


    const isHubSource = source === 'hub';
    const gradientColors = ['#cdb469', '#a0aea0', '#2e543d'];
    const gradientStart = { x: 1, y: 0 };
    const gradientEnd = { x: 0, y: 1 };
    const gradientLocations = [0, 0.35, 0.95];

    const anyPrayerEnabled = prayers.some(p => prayerSettings[p.id]?.enabled);
    const globalSoundModeDetails = SOUND_MODES.find(m => m.id === prayerSettings.fajr.soundMode) || SOUND_MODES[0];


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

                    {/* ── Next Notification Timer ── */}
                    {/* {nextNotification && timeLeft ? (
                        <View style={styles.timerCard}>
                            <Text style={styles.timerLabel}>Next Notification In</Text>
                            <Text style={styles.timerValue}>{timeLeft}</Text>
                            <Text style={styles.timerPrayer}>
                                {nextNotification.content?.title}
                            </Text>
                        </View>
                    ) : null} */}

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
                                    settings={prayerSettings[prayer.id]}
                                    onSettingChange={handleSettingChange}
                                />
                            ))}
                        </View>
                    )}

                    {/* ── Global Settings Box ── */}
                    {anyPrayerEnabled && !loading && (
                        <View style={styles.globalSettingsBox}>
                            <Text style={styles.globalSettingsTitle}>Notification Settings</Text>

                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Notification at the start of prayer</Text>
                                <Switch
                                    value={prayerSettings.fajr.athanEnabled}
                                    onValueChange={(value) => handleGlobalSettingChange('athanEnabled', value)}
                                    trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                                    thumbColor="#FFFFFF"
                                    ios_backgroundColor="#E0E0E0"
                                />
                            </View>

                            <View style={styles.soundModeContainer}>
                                <View style={styles.soundModeHeader}>
                                    <Text style={styles.soundModeTitle}>Current sound mode: {globalSoundModeDetails.label}</Text>
                                    <TouchableOpacity
                                        style={styles.soundIconBackground}
                                        onPress={() => {
                                            const currentIndex = SOUND_MODES.findIndex(m => m.id === prayerSettings.fajr.soundMode);
                                            const nextIndex = (currentIndex + 1) % SOUND_MODES.length;
                                            handleGlobalSettingChange('soundMode', SOUND_MODES[nextIndex].id);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={globalSoundModeDetails.icon}
                                            size={19}
                                            color="#FFFFFF"
                                        />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.soundModeSubtext}>Tap the sound icon to cycle through options</Text>
                            </View>
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
        marginBottom: spacing.md,
    },

    globalSettingsBox: {
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    globalSettingsTitle: {
        fontSize: isSmallDevice ? 15 : 16,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.sm,
    },
    soundModeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
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

    // Timer Card
    timerCard: {
        backgroundColor: 'rgba(255,255,255,0.72)',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffffff',
    },
    timerLabel: {
        fontSize: 13,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    timerValue: {
        fontSize: 32,
        fontWeight: typography.fontWeight.bold,
        color: colors.primary.darkSage,
    },
    timerPrayer: {
        fontSize: 12,
        color: colors.text.grey,
        marginTop: 6,
    },
});

export default NotificationsScreen;
