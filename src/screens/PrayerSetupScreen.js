import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import FirebaseService from '../services/FirebaseService';
import volumeImage from '../../assets/images/volume.png';
import fajrIcon from '../../assets/images/fajr.png';
import duhurIcon from '../../assets/images/duhur.png';
import asrIcon from '../../assets/images/asr.png';
import mughribIcon from '../../assets/images/mughrib.png';
import ishaIcon from '../../assets/images/isha.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const prayers = [
    { id: 'fajr', name: 'Fajr', icon: fajrIcon },
    { id: 'duhur', name: 'Duhur', icon: duhurIcon },
    { id: 'asr', name: 'Asr', icon: asrIcon },
    { id: 'mughrib', name: 'Mughrib', icon: mughribIcon },
    { id: 'isha', name: 'Isha', icon: ishaIcon },
];

/**
 * Sound mode options for prayer notifications
 * Each mode determines how the app notifies the user at prayer time
 * 
 * TODO: Future integration for each mode:
 * - 'athan': Play the selected Athan audio file
 * - 'beep': Play a short notification beep sound
 * - 'vibration': Trigger device vibration pattern
 * - 'silent': No sound or vibration, only visual notification
 */
const SOUND_MODES = [
    { id: 'athan', label: 'Athan', icon: 'volume-high-outline', description: 'Full Athan call to prayer' },
    { id: 'beep', label: 'Beep', icon: 'notifications-outline', description: 'Short notification sound' },
    { id: 'vibration', label: 'Vibration', icon: 'phone-portrait-outline', description: 'Vibration only, no sound' },
    { id: 'silent', label: 'Silent', icon: 'volume-mute-outline', description: 'Visual notification only' },
];

const PrayerCard = ({ prayer, isExpanded, onToggleExpand, settings, onSettingChange, onSoundModeChange }) => {
    // Get current sound mode details
    const currentSoundMode = SOUND_MODES.find(mode => mode.id === settings.soundMode) || SOUND_MODES[0];

    /**
     * Cycle to next sound mode
     * TODO: Add haptic feedback when cycling modes
     * TODO: Play preview sound for audio modes (athan, beep)
     */
    const handleSoundModePress = () => {
        const currentIndex = SOUND_MODES.findIndex(mode => mode.id === settings.soundMode);
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
                <Image
                    source={prayer.icon}
                    style={styles.prayerIcon}
                    resizeMode="contain"
                />

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
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Notification at the start of {prayer.name}</Text>
                        <Switch
                            value={settings.athanEnabled}
                            onValueChange={(value) => onSettingChange(prayer.id, 'athanEnabled', value)}
                            trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E0E0E0"
                        />
                    </View>

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

                    {/* Sound Mode Display - Tap the icon above to cycle */}
                    <View style={styles.soundModeContainer}>
                        <Text style={styles.soundModeTitle}>Current sound mode: {currentSoundMode.label}</Text>
                        <Text style={styles.soundModeSubtext}>Tap the sound icon to cycle through options</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const PrayerSetupScreen = ({ navigation, route }) => {
    const activities = route?.params?.activities || {};
    const [expandedPrayer, setExpandedPrayer] = useState(null);
    const [prayerSettings, setPrayerSettings] = useState({
        fajr: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
        duhur: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
        asr: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
        mughrib: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
        isha: { enabled: false, athanEnabled: true, reminderEnabled: true, soundMode: 'athan' },
    });
    const [trackPrayers, setTrackPrayers] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleToggleExpand = (prayerId) => {
        setExpandedPrayer(expandedPrayer === prayerId ? null : prayerId);
    };

    const handleSettingChange = (prayerId, setting, value) => {
        setPrayerSettings(prev => ({
            ...prev,
            [prayerId]: { ...prev[prayerId], [setting]: value }
        }));

        // Auto-expand when prayer is enabled
        if (setting === 'enabled' && value === true) {
            setExpandedPrayer(prayerId);
        }
    };

    /**
     * Handle sound mode change for a specific prayer
     * Cycles through: Athan -> Beep -> Vibration -> Silent -> Athan...
     * 
     * TODO: Future integration:
     * - Store selected sound mode in persistent storage
     * - Configure notification sound based on mode
     * - Add haptic feedback on mode change
     */
    const handleSoundModeChange = (prayerId, newMode) => {
        setPrayerSettings(prev => ({
            ...prev,
            [prayerId]: { ...prev[prayerId], soundMode: newMode }
        }));
    };

    const handleContinue = async () => {
        const fromSettings = route?.params?.fromSettings || false;
        setLoading(true);
        try {
            // Save prayer settings to Firebase
            await FirebaseService.savePrayerSettings({
                fajr: prayerSettings.fajr.enabled,
                dhuhr: prayerSettings.duhur.enabled,
                asr: prayerSettings.asr.enabled,
                maghrib: prayerSettings.mughrib.enabled,
                isha: prayerSettings.isha.enabled,
                soundMode: prayerSettings.fajr.soundMode,
            });
            // Navigate to next selected activity
            if (activities.quran === 'yes') {
                navigation.navigate('QuranGoal', { activities, fromSettings });
            } else if (activities.dhikr === 'yes') {
                navigation.navigate('DhikrGoal', { activities, fromSettings });
            } else if (activities.journaling === 'yes') {
                await FirebaseService.saveJournalingGoals(true);
                navigation.navigate(fromSettings ? 'FinalSetup' : 'MyCircleSetup', { activities, fromSettings });
            } else {
                navigation.navigate(fromSettings ? 'FinalSetup' : 'MyCircleSetup', { activities, fromSettings });
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
            navigation.navigate(fromSettings ? 'FinalSetup' : 'MyCircleSetup', { activities, fromSettings });
        } else {
            navigation.navigate(fromSettings ? 'FinalSetup' : 'MyCircleSetup', { activities, fromSettings });
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
                            isExpanded={expandedPrayer === prayer.id}
                            onToggleExpand={handleToggleExpand}
                            settings={prayerSettings[prayer.id]}
                            onSettingChange={handleSettingChange}
                            onSoundModeChange={handleSoundModeChange}
                        />
                    ))}
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
        top: spacing.lg,
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
        marginBottom: spacing.lg,
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
});

export default PrayerSetupScreen;
