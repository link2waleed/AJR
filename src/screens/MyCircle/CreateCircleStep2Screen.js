import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import FirebaseService from '../../services/FirebaseService';

// Import assets
import notifications from '../../../assets/images/notification-bing.png';
import circlesImage from '../../../assets/images/main-circle.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

// Step Indicator Component
const StepIndicator = ({ currentStep, totalSteps = 2 }) => (
    <View style={styles.stepContainer}>
        {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
                <React.Fragment key={stepNumber}>
                    <View style={[styles.stepOuterCircle, isActive && styles.stepOuterCircleActive]}>
                        <View
                            style={[
                                styles.stepCircle,
                                isActive && styles.stepCircleActive,
                                isCompleted && styles.stepCircleCompleted,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.stepNumber,
                                    (isActive || isCompleted) && styles.stepNumberActive,
                                ]}
                            >
                                {stepNumber}
                            </Text>
                        </View>
                    </View>
                    {stepNumber < totalSteps && (
                        <View
                            style={[
                                styles.stepLine,
                                isCompleted && styles.stepLineCompleted,
                            ]}
                        />
                    )}
                </React.Fragment>
            );
        })}
    </View>
);

// Summary Row Component
const SummaryRow = ({ label, value, isLast }) => (
    <View style={[styles.summaryRow, !isLast && styles.summaryRowBorder]}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
    </View>
);

const CreateCircleStep2Screen = ({ navigation, route }) => {
    // Get circle type from previous screen
    const circleType = route?.params?.circleType || 'named';
    const circleTypeName = circleType === 'named' ? 'Named' : 'Anonymous';

    const [circleName, setCircleName] = useState('');
    const [loading, setLoading] = useState(false);
    const [remainingSlots, setRemainingSlots] = useState(3);

    // Fetch remaining circle slots on mount
    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const circles = await FirebaseService.getUserCircles();
                setRemainingSlots(Math.max(0, 3 - circles.length));
            } catch (e) {
                console.warn('Could not fetch circle count:', e);
            }
        };
        fetchSlots();
    }, []);

    const handleCreateCircle = async () => {
        if (!circleName.trim()) {
            Alert.alert('Circle Name', 'Please enter a name for your circle.');
            return;
        }
        setLoading(true);
        try {
            await FirebaseService.createCircle(circleName.trim(), circleType);
            Alert.alert('Success', 'Your circle has been created!', [
                { text: 'OK', onPress: () => navigation.navigate('MainApp', { screen: 'MyCircle' }) },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to create circle. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    return (
        <LinearGradient
            colors={[colors.homeGradient.top, colors.homeGradient.top, colors.homeGradient.bottom]}
            locations={[0, 0.7, 1]}
            style={styles.container}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Create Circle</Text>

                    <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
                        <View style={styles.notificationBadge}>
                            <Image source={notifications} style={styles.notificationIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Step Indicator */}
                <StepIndicator currentStep={2} totalSteps={2} />

                {/* Circle Name Input */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Circle name</Text>
                    <View style={styles.nameInputContainer}>
                        <TextInput
                            style={styles.nameInput}
                            placeholder="Enter circle name"
                            placeholderTextColor={colors.text.grey}
                            value={circleName}
                            onChangeText={setCircleName}
                            maxLength={30}
                        />
                    </View>
                </View>

                {/* Circle Summary Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Circle summary</Text>
                    <View style={styles.summaryCard}>
                        <SummaryRow label="Circle Type:" value={circleTypeName} />
                        <SummaryRow label="Member limit:" value="10" />
                        <SummaryRow label="Your remaining Circle slots:" value={String(remainingSlots)} isLast />
                    </View>
                </View>

                {/* Circle Size & Limits Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Circle size & limits</Text>

                    {/* Circles Image */}
                    <View style={styles.circlesImageContainer}>
                        <Image
                            source={circlesImage}
                            style={styles.circlesImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Member Info */}
                    <View style={styles.memberInfoContainer}>
                        <Text style={styles.memberInfoTitle}>Up to 10 members per Circle</Text>
                        <Text style={styles.memberInfoSubtitle}>Focus on consistency without comparison</Text>
                    </View>

                    {/* Info Message */}
                    <View style={styles.infoMessageContainer}>
                        <Ionicons name="information-circle-outline" size={18} color={colors.text.grey} />
                        <Text style={styles.infoMessageText}>You can be part of up to 3 Circles total</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.bottomButtonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.text.dark} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.createButton, loading && { opacity: 0.7 }]} onPress={handleCreateCircle} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.text.primary} />
                    ) : (
                        <>
                            <Text style={styles.createButtonText}>Create Circle</Text>
                            <Ionicons name="arrow-forward" size={18} color={colors.text.primary} />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </LinearGradient>
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
        paddingBottom: spacing.xxl * 3,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    notificationButton: {},
    notificationBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationIcon: {
        width: 20,
        height: 20,
    },
    // Step Indicator
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    stepOuterCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    stepOuterCircleActive: {
        borderColor: colors.primary.sage,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.border.light,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleActive: {
        backgroundColor: colors.primary.sage,
    },
    stepCircleCompleted: {
        backgroundColor: colors.primary.sage,
    },
    stepNumber: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.grey,
    },
    stepNumberActive: {
        color: colors.text.primary,
    },
    stepLine: {
        width: screenWidth * 0.25,
        height: 2,
        backgroundColor: colors.border.light,
        marginHorizontal: spacing.xs,
    },
    stepLineCompleted: {
        backgroundColor: colors.primary.sage,
    },
    // Section
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: isSmallDevice ? 17 : 19,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.sm,
    },
    // Summary Card
    summaryCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    summaryRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    summaryLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
    },
    summaryValue: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    // Circles Image
    circlesImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
    },
    circlesImage: {
        width: screenWidth * 0.5,
        height: screenWidth * 0.5,
    },
    // Member Info
    memberInfoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    memberInfoTitle: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    memberInfoSubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
    },
    // Info Message
    infoMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    infoMessageText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
        marginLeft: spacing.sm,
    },
    // Bottom Buttons
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        paddingHorizontal: horizontalPadding,
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
        flexDirection: 'row',
        gap: spacing.sm,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        borderWidth: 1.5,
        borderColor: colors.cards.mint,
        gap: spacing.xxs,
    },
    cancelButtonText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
    },
    createButton: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.button.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        gap: spacing.xxs,
    },
    createButtonText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    // Circle Name Input
    nameInputContainer: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    nameInput: {
        fontSize: typography.fontSize.md,
        color: colors.text.black,
        paddingVertical: spacing.sm,
    },
});

export default CreateCircleStep2Screen;
