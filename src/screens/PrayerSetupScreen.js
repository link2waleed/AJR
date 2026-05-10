import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Dimensions,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import FirebaseService from '../services/FirebaseService';
import NotificationService from '../services/NotificationService';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import volumeImage from '../../assets/images/volume.png';
import fajrIcon from '../../assets/images/fajr.png';
import duhurIcon from '../../assets/images/duhur.png';
import asrIcon from '../../assets/images/asr.png';
import maghribIcon from '../../assets/images/mughrib.png';
import ishaIcon from '../../assets/images/isha.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const prayers = [
    { id: 'fajr', name: 'Fajr', icon: fajrIcon },
    { id: 'duhur', name: 'Duhur', icon: duhurIcon },
    { id: 'asr', name: 'Asr', icon: asrIcon },
    { id: 'maghrib', name: 'Maghrib', icon: maghribIcon },
    { id: 'isha', name: 'Isha', icon: ishaIcon },
];

const SOUND_MODES = [
    { id: 'athan', label: 'Athan', icon: 'volume-high-outline', description: 'Full Athan call to prayer' },
    { id: 'beep', label: 'Beep', icon: 'notifications-outline', description: 'Short notification sound' },
    { id: 'vibration', label: 'Vibration', icon: 'phone-portrait-outline', description: 'Vibration only, no sound' },
    { id: 'silent', label: 'Silent', icon: 'volume-mute-outline', description: 'Visual notification only' },
];

const PrayerCard = ({ prayer, settings, onSettingChange }) => {
    return (
        <View style={styles.prayerCard}>
            <View style={styles.prayerHeader}>
                <Image
                    source={prayer.icon}
                    style={styles.prayerIcon}
                    resizeMode="contain"
                />

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

const PrayerSetupScreen = ({ navigation, route }) => {
    const activities = route?.params?.activities || {};
    const [prayerSettings, setPrayerSettings] = useState({
        fajr: { enabled: false, reminderEnabled: false, soundMode: 'athan' },
        duhur: { enabled: false, reminderEnabled: false, soundMode: 'athan' },
        asr: { enabled: false, reminderEnabled: false, soundMode: 'athan' },
        maghrib: { enabled: false, reminderEnabled: false, soundMode: 'athan' },
        isha: { enabled: false, reminderEnabled: false, soundMode: 'athan' },
    });
    const [trackPrayers, setTrackPrayers] = useState(true);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [showPermModal, setShowPermModal] = useState(false);

    // Load saved prayer settings on mount
    useEffect(() => {
        const loadSavedSettings = async () => {
            try {
                const info = await FirebaseService.getOnboardingInfo();
                const prayer = info?.prayer;
                if (prayer) {
                    const globalSound = prayer.soundMode || 'athan';
                    const parse = (val, fallback) => {
                        if (val && typeof val === 'object') {
                            return {
                                enabled: val.enabled ?? false,
                                reminderEnabled: val.reminderEnabled ?? false,
                                soundMode: val.soundMode || globalSound,
                            };
                        }
                        return { enabled: !!val, reminderEnabled: false, soundMode: globalSound };
                    };
                    setPrayerSettings({
                        fajr: parse(prayer.fajr),
                        duhur: parse(prayer.dhuhr),
                        asr: parse(prayer.asr),
                        maghrib: parse(prayer.maghrib),
                        isha: parse(prayer.isha),
                    });
                }
            } catch (e) {
                console.warn('PrayerSetupScreen: could not load saved prayer settings', e);
            } finally {
                setInitialLoading(false);
            }
        };
        loadSavedSettings();
    }, []);

    const handleGlobalSettingChange = (setting, value) => {
        setPrayerSettings(prev => {
            const updated = { ...prev };
            prayers.forEach(p => {
                updated[p.id] = { ...updated[p.id], [setting]: value };
            });
            return updated;
        });
    };

    const handleSettingChange = async (prayerId, setting, value) => {
        if (setting === 'enabled' && value === true) {
            const granted = await NotificationService.requestPermissions();
            if (!granted) {
                setShowPermModal(true);
                return;
            }
        }
        setPrayerSettings(prev => ({
            ...prev,
            [prayerId]: { ...prev[prayerId], [setting]: value }
        }));
    };

    const handleContinue = async () => {
        const fromSettings = route?.params?.fromSettings || false;
        setLoading(true);
        try {
            // Save prayer settings to Firebase
            await FirebaseService.savePrayerSettings({
                fajr: { enabled: prayerSettings.fajr.enabled, reminderEnabled: prayerSettings.fajr.reminderEnabled, soundMode: prayerSettings.fajr.soundMode },
                dhuhr: { enabled: prayerSettings.duhur.enabled, reminderEnabled: prayerSettings.duhur.reminderEnabled, soundMode: prayerSettings.duhur.soundMode },
                asr: { enabled: prayerSettings.asr.enabled, reminderEnabled: prayerSettings.asr.reminderEnabled, soundMode: prayerSettings.asr.soundMode },
                maghrib: { enabled: prayerSettings.maghrib.enabled, reminderEnabled: prayerSettings.maghrib.reminderEnabled, soundMode: prayerSettings.maghrib.soundMode },
                isha: { enabled: prayerSettings.isha.enabled, reminderEnabled: prayerSettings.isha.reminderEnabled, soundMode: prayerSettings.isha.soundMode },
                soundMode: prayerSettings.fajr.soundMode,
            });
            // Navigate to next selected activity
            if (activities.quran === 'yes') {
                navigation.navigate('QuranGoal', { activities, fromSettings });
            } else if (activities.dhikr === 'yes') {
                navigation.navigate('DhikrGoal', { activities, fromSettings });
            } else if (activities.journaling === 'yes') {
                await FirebaseService.saveJournalingGoals(true);
                navigation.navigate(fromSettings ? 'FinalSetup' : 'Subscription', { activities, fromSettings });
            } else {
                navigation.navigate(fromSettings ? 'FinalSetup' : 'Subscription', { activities, fromSettings });
            }
        } catch (error) {
            console.error('Error saving prayer settings:', error);
            Alert.alert('Error', 'Failed to save prayer settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        const fromSettings = route?.params?.fromSettings || false;
        // Navigate to next selected activity
        if (activities.quran === 'yes') {
            navigation.navigate('QuranGoal', { activities, fromSettings });
        } else if (activities.dhikr === 'yes') {
            navigation.navigate('DhikrGoal', { activities, fromSettings });
        } else if (activities.journaling === 'yes') {
            await FirebaseService.saveJournalingGoals(true);
            navigation.navigate(fromSettings ? 'FinalSetup' : 'Subscription', { activities, fromSettings });
        } else {
            navigation.navigate(fromSettings ? 'FinalSetup' : 'Subscription', { activities, fromSettings });
        }
    };

    const handleBack = () => {
        Alert.alert(
            'Go Back',
            'Are you sure? You will lose your prayer settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Go Back',
                    onPress: () => navigation.goBack(),
                    style: 'destructive',
                },
            ]
        );
    };

    if (initialLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary.darkSage} />
                <Text style={{ marginTop: spacing.md, fontSize: 14, color: colors.text.grey }}>
                    Loading your prayer settings...
                </Text>
            </View>
        );
    }

    const anyPrayerEnabled = prayers.some(p => prayerSettings[p.id]?.enabled);
    const globalSoundModeDetails = SOUND_MODES.find(m => m.id === prayerSettings.fajr.soundMode) || SOUND_MODES[0];

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={loading}
            >
                <Ionicons name="arrow-back" size={24} color={colors.text.black} />
            </TouchableOpacity>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={styles.title}>Prayer Setup</Text>
                <Text style={styles.subtitle}>
                    Choose when you'd like to receive Athan notifications and reminders
                </Text>

                {/* Prayer Cards */}
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

                {/* Global Settings Box */}
                {anyPrayerEnabled && (
                    <View style={styles.globalSettingsBox}>
                        <Text style={styles.globalSettingsTitle}>Quick Settings (applies to all)</Text>

                        <View style={styles.settingRow}>
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingLabel}>20-min Reminder</Text>
                                <Text style={styles.settingSubtext}>
                                    Alert 20 min before the next prayer starts
                                </Text>
                            </View>
                            <Switch
                                value={prayerSettings.fajr.reminderEnabled}
                                onValueChange={(value) => handleGlobalSettingChange('reminderEnabled', value)}
                                trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor="#E0E0E0"
                            />
                        </View>

                        <View style={styles.soundModeContainer}>
                            <View style={styles.soundModeHeader}>
                                <Text style={styles.soundModeTitle}>Sound mode: {globalSoundModeDetails.label}</Text>
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
                            <Text style={styles.soundModeSubtext}>Tap the icon to cycle: Athan → Beep → Vibration → Silent</Text>
                        </View>
                    </View>
                )}

                {/* Prayer Times Info Message */}
                <View style={styles.infoMessageContainer}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.text.grey} style={styles.infoIcon} />
                    <Text style={styles.infoMessage}>
                        Prayer times are calculated based on your location and standard methods. Times may differ from your local mosque. Please verify your times and adjust them in Settings if needed.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.buttonContainer}>
                <Button
                    title={loading ? "Saving..." : "Continue"}
                    onPress={handleContinue}
                    icon="arrow-forward"
                    style={styles.continueButton}
                    disabled={loading}
                />
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
        backgroundColor: colors.primary.light,
    },
    backButton: {
        position: 'absolute',
        top: spacing.xxl,
        left: spacing.md,
        padding: spacing.sm,
        zIndex: 10,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.06,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: isSmallDevice ? 22 : 26,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.grey,
        textAlign: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },
    cardsContainer: {
        marginBottom: spacing.md,
    },
    globalSettingsBox: {
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
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
    volumeIcon: {
        width: 30,
        height: 30,
    },
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
    activitySection: {
        marginTop: spacing.md,
    },
    activityTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    activitySubtext: {
        fontSize: isSmallDevice ? 12 : 14,
        color: colors.text.grey,
        marginBottom: spacing.md,
    },
    yesNoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    radioLabel: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.black,
        marginRight: spacing.xs,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D0D0D0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: colors.primary.sage,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary.sage,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: horizontalPadding,
        paddingBottom: spacing.xxl,
        paddingTop: spacing.md,
        justifyContent: 'space-between',
    },
    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xxl,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    skipText: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.black,
        marginRight: spacing.xs,
    },
    continueButton: {
        flex: 1,
        margin: spacing.sm,

    },
    infoMessageContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(122, 158, 127, 0.3)',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        alignItems: 'flex-start',
    },
    infoIcon: {
        marginRight: spacing.sm,
        marginTop: 2,
        flexShrink: 0,
    },
    infoMessage: {
        flex: 1,
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
        lineHeight: 18,
        fontWeight: '400',
    },
});

export default PrayerSetupScreen;
