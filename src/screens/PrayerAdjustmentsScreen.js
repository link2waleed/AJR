import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import StorageService from '../services/StorageService';

import fajrIcon from '../../assets/images/fajr.png';
import duhurIcon from '../../assets/images/duhur.png';
import asrIcon from '../../assets/images/asr.png';
import maghribIcon from '../../assets/images/mughrib.png';
import ishaIcon from '../../assets/images/isha.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const PRAYERS = [
    { key: 'fajr', name: 'Fajr', iconImg: fajrIcon, color: '#5C6BC0', description: 'Dawn Prayer' },
    { key: 'sunrise', name: 'Sunrise', iconImg: fajrIcon, color: '#FFA726', description: 'Shuruq' },
    { key: 'dhuhr', name: 'Dhuhr', iconImg: duhurIcon, color: '#FF7043', description: 'Midday Prayer' },
    { key: 'asr', name: 'Asr', iconImg: asrIcon, color: '#AB47BC', description: 'Afternoon Prayer' },
    { key: 'maghrib', name: 'Maghrib', iconImg: maghribIcon, color: '#EF5350', description: 'Sunset Prayer' },
    { key: 'isha', name: 'Isha', iconImg: ishaIcon, color: '#3949AB', description: 'Night Prayer' },
];

const DEFAULT_OFFSETS = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

const PrayerAdjustmentRow = ({ prayer, offset, onIncrement, onDecrement }) => (
    <View style={styles.prayerRow}>
        <View style={styles.prayerRowLeft}>
            <Image
                source={prayer.iconImg}
                style={{ width: 36, height: 36, marginRight: spacing.md }}
                resizeMode="contain"
            />
            <View style={styles.prayerInfo}>
                <Text style={styles.prayerName}>{prayer.name}</Text>
                <Text style={styles.prayerDescription}>{prayer.description}</Text>
            </View>
        </View>

        <View style={styles.adjustmentControls}>
            <TouchableOpacity
                style={styles.adjustButton}
                onPress={onDecrement}
                activeOpacity={0.6}
            >
                <Ionicons name="remove" size={18} color={colors.primary.darkSage} />
            </TouchableOpacity>

            <View style={styles.offsetDisplay}>
                <Text style={[
                    styles.offsetText,
                    offset !== 0 && styles.offsetTextActive,
                    offset > 0 && styles.offsetTextPositive,
                    offset < 0 && styles.offsetTextNegative,
                ]}>
                    {offset > 0 ? `+${offset}` : offset === 0 ? '0' : `${offset}`}
                </Text>
                <Text style={styles.offsetUnit}>min</Text>
            </View>

            <TouchableOpacity
                style={styles.adjustButton}
                onPress={onIncrement}
                activeOpacity={0.6}
            >
                <Ionicons name="add" size={18} color={colors.primary.darkSage} />
            </TouchableOpacity>
        </View>
    </View>
);

const PrayerAdjustmentsScreen = ({ navigation, route }) => {
    const [offsets, setOffsets] = useState({ ...DEFAULT_OFFSETS });
    const [savedOffsets, setSavedOffsets] = useState({ ...DEFAULT_OFFSETS });
    const [saving, setSaving] = useState(false);

    // Load saved adjustments on mount
    useEffect(() => {
        const loadAdjustments = async () => {
            const saved = await StorageService.getPrayerAdjustments();
            setOffsets(saved);
            setSavedOffsets(saved);
            console.log('🕌 Loaded prayer adjustments:', saved);
        };
        loadAdjustments();
    }, []);

    const handleIncrement = (key) => {
        setOffsets(prev => ({
            ...prev,
            [key]: Math.min(prev[key] + 1, 60),
        }));
    };

    const handleDecrement = (key) => {
        setOffsets(prev => ({
            ...prev,
            [key]: Math.max(prev[key] - 1, -60),
        }));
    };

    const handleReset = async () => {
        setOffsets({ ...DEFAULT_OFFSETS });
        setSavedOffsets({ ...DEFAULT_OFFSETS });
        await StorageService.clearPrayerAdjustments();
        // Invalidate prayer cache so next fetch uses no offsets
        await invalidatePrayerCache();
        Alert.alert('Reset Complete', 'All prayer time adjustments have been reset to default.');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await StorageService.savePrayerAdjustments(offsets);
            setSavedOffsets({ ...offsets });
            // Invalidate prayer cache so next fetch applies new offsets
            await invalidatePrayerCache();
            Alert.alert('Saved', 'Your prayer time adjustments have been saved. Prayer times will update on next refresh.');
        } catch (error) {
            console.error('Error saving prayer adjustments:', error);
            Alert.alert('Error', 'Failed to save adjustments. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Invalidate cached prayer data so the new adjustments take effect
     * on the next app open / prayer times screen visit.
     */
    const invalidatePrayerCache = async () => {
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.removeItem('@ajr_prayer_times');
            await AsyncStorage.removeItem('@ajr_full_timings');
            console.log('🕌 Prayer cache invalidated after adjustment change');
        } catch (e) {
            console.warn('Could not invalidate prayer cache:', e);
        }
    };

    // hasChanges = offsets differ from what's saved
    const hasUnsavedChanges = JSON.stringify(offsets) !== JSON.stringify(savedOffsets);
    const hasAnyOffset = Object.values(offsets).some(v => v !== 0);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (route?.params?.onGoBack) {
                                route.params.onGoBack();
                            }
                            navigation.goBack();
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.text.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Prayer Adjustments</Text>
                    <View style={styles.headerRight} />
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoIconContainer}>
                        <Ionicons name="information-circle-outline" size={22} color={colors.primary.sage} />
                    </View>
                    <Text style={styles.infoText}>
                        Fine-tune your prayer times by adding or subtracting minutes. Adjustments are applied to the calculated prayer times from your local masjid or API source.
                    </Text>
                </View>

                {/* Prayer Adjustments List */}
                <Text style={styles.sectionTitle}>ADJUST PRAYER TIMES</Text>
                <View style={styles.prayerListCard}>
                    {PRAYERS.map((prayer, index) => (
                        <React.Fragment key={prayer.key}>
                            <PrayerAdjustmentRow
                                prayer={prayer}
                                offset={offsets[prayer.key]}
                                onIncrement={() => handleIncrement(prayer.key)}
                                onDecrement={() => handleDecrement(prayer.key)}
                            />
                            {index < PRAYERS.length - 1 && <View style={styles.separator} />}
                        </React.Fragment>
                    ))}
                </View>

                {/* Summary Card */}
                {hasAnyOffset && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary.sage} />
                            <Text style={styles.summaryTitle}>Active Adjustments</Text>
                        </View>
                        <View style={styles.summaryChips}>
                            {PRAYERS.filter(p => offsets[p.key] !== 0).map(prayer => (
                                <View key={prayer.key} style={styles.summaryChip}>
                                    <Text style={styles.summaryChipText}>
                                        {prayer.name}: {offsets[prayer.key] > 0 ? '+' : ''}{offsets[prayer.key]} min
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Reset Button */}
                <TouchableOpacity
                    style={[styles.resetButton, !hasAnyOffset && styles.resetButtonDisabled]}
                    onPress={handleReset}
                    activeOpacity={hasAnyOffset ? 0.7 : 1}
                    disabled={!hasAnyOffset}
                >
                    <Ionicons
                        name="refresh-outline"
                        size={18}
                        color={hasAnyOffset ? '#E57373' : '#BDBDBD'}
                    />
                    <Text style={[styles.resetText, !hasAnyOffset && styles.resetTextDisabled]}>
                        Reset All to Default
                    </Text>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, !hasUnsavedChanges && styles.saveButtonDisabled]}
                    activeOpacity={hasUnsavedChanges ? 0.7 : 1}
                    disabled={!hasUnsavedChanges || saving}
                    onPress={handleSave}
                >
                    <Text style={[styles.saveButtonText, !hasUnsavedChanges && styles.saveButtonTextDisabled]}>
                        {saving ? 'Saving...' : 'Save Adjustments'}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    These adjustments are for personal preference only and do not affect the official prayer calculation method.
                </Text>
            </ScrollView>
        </View>
    );
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
        paddingBottom: spacing.xxl + 20,
    },

    // ─── Header ────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    headerRight: {
        width: 40,
    },

    // ─── Info Card ─────────────────────────────────
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(122, 158, 127, 0.08)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(122, 158, 127, 0.15)',
    },
    infoIconContainer: {
        marginRight: spacing.sm,
        marginTop: 1,
    },
    infoText: {
        flex: 1,
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
        lineHeight: 19,
    },

    // ─── Section Title ─────────────────────────────
    sectionTitle: {
        fontSize: isSmallDevice ? 12 : 13,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.grey,
        marginBottom: spacing.sm,
        letterSpacing: 0.5,
    },

    // ─── Prayer List Card ──────────────────────────
    prayerListCard: {
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginBottom: spacing.lg,
    },

    // ─── Prayer Row ────────────────────────────────
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    prayerRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    prayerIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    prayerInfo: {
        flex: 1,
    },
    prayerName: {
        fontSize: isSmallDevice ? 15 : 16,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    prayerDescription: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
        marginTop: 1,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.04)',
        marginHorizontal: spacing.md,
    },

    // ─── Adjustment Controls ───────────────────────
    adjustmentControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    adjustButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(122, 158, 127, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(122, 158, 127, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    offsetDisplay: {
        minWidth: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    offsetText: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.grey,
    },
    offsetTextActive: {
        color: colors.text.black,
    },
    offsetTextPositive: {
        color: colors.primary.darkSage,
    },
    offsetTextNegative: {
        color: '#E57373',
    },
    offsetUnit: {
        fontSize: 10,
        color: colors.text.grey,
        marginTop: -2,
    },

    // ─── Summary Card ──────────────────────────────
    summaryCard: {
        backgroundColor: 'rgba(122, 158, 127, 0.06)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(122, 158, 127, 0.12)',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    summaryTitle: {
        fontSize: isSmallDevice ? 13 : 14,
        fontWeight: typography.fontWeight.semibold,
        color: colors.primary.darkSage,
        marginLeft: spacing.xs,
    },
    summaryChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    summaryChip: {
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
        paddingVertical: 4,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
    },
    summaryChipText: {
        fontSize: isSmallDevice ? 11 : 12,
        fontWeight: typography.fontWeight.medium,
        color: colors.primary.darkSage,
    },

    // ─── Buttons ───────────────────────────────────
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        marginBottom: spacing.sm,
    },
    resetButtonDisabled: {
        opacity: 0.5,
    },
    resetText: {
        fontSize: isSmallDevice ? 14 : 15,
        fontWeight: typography.fontWeight.medium,
        color: '#E57373',
        marginLeft: spacing.xs,
    },
    resetTextDisabled: {
        color: '#BDBDBD',
    },
    saveButton: {
        backgroundColor: colors.primary.darkSage,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md + 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    saveButtonDisabled: {
        backgroundColor: 'rgba(90, 122, 95, 0.3)',
    },
    saveButtonText: {
        fontSize: isSmallDevice ? 15 : 16,
        fontWeight: typography.fontWeight.semibold,
        color: '#FFFFFF',
    },
    saveButtonTextDisabled: {
        color: 'rgba(255,255,255,0.5)',
    },
    disclaimer: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
        textAlign: 'center',
        lineHeight: 17,
        paddingHorizontal: spacing.md,
    },
});

export default PrayerAdjustmentsScreen;
