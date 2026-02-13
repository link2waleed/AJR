import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

// Import notification icon
import notifications from '../../../assets/images/notification-bing.png';

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

// Circle Type Card Component
const CircleTypeCard = ({ title, subtitle, features, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.circleTypeCard, selected && styles.circleTypeCardSelected]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.circleTypeHeader}>
            <View style={styles.circleTypeIcon}>
                <Image
                    source={require('../../../assets/images/circles.png')}
                    style={styles.circleImage}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.circleTypeInfo}>
                <Text style={styles.circleTypeTitle}>{title}</Text>
                <Text style={styles.circleTypeSubtitle}>{subtitle}</Text>
            </View>
        </View>
        <View style={styles.circleTypeDivider} />
        <View style={styles.circleTypeFeatures}>
            {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark" size={16} color={colors.primary.sage} />
                    <Text style={styles.featureText}>{feature}</Text>
                </View>
            ))}
        </View>
    </TouchableOpacity>
);

const CreateCircleScreen = ({ navigation }) => {
    // State for current step and selected circle type
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedType, setSelectedType] = useState('named'); // 'named' or 'anonymous'

    // Circle type options
    const circleTypes = {
        named: {
            title: 'Named Circle',
            subtitle: 'Best for close friends or family',
            features: [
                "Members' names are visible",
                'Daily progress is shared by name',
                'Encouragement feels personal',
            ],
        },
        anonymous: {
            title: 'Anonymous Circle',
            subtitle: 'Focus on consistency without comparison',
            features: [
                'No names or profiles shown',
                'Members appear as completion rings only',
                'Progress is shared collectively',
            ],
        },
    };

    const handleNext = () => {
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
            // Navigate to step 2 screen or handle within this component
            navigation.navigate('CreateCircleStep2', { circleType: selectedType });
        }
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

                    <TouchableOpacity style={styles.notificationButton}>
                        <View style={styles.notificationBadge}>
                            <Image source={notifications} style={styles.notificationIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Step Indicator */}
                <StepIndicator currentStep={currentStep} totalSteps={2} />

                {/* Step 1: Choose Circle Type */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choose circle type</Text>

                    {/* Named Circle Card */}
                    <CircleTypeCard
                        title={circleTypes.named.title}
                        subtitle={circleTypes.named.subtitle}
                        features={circleTypes.named.features}
                        selected={selectedType === 'named'}
                        onPress={() => setSelectedType('named')}
                    />

                    {/* Anonymous Circle Card */}
                    <CircleTypeCard
                        title={circleTypes.anonymous.title}
                        subtitle={circleTypes.anonymous.subtitle}
                        features={circleTypes.anonymous.features}
                        selected={selectedType === 'anonymous'}
                        onPress={() => setSelectedType('anonymous')}
                    />

                    {/* Warning Message */}
                    <View style={styles.warningContainer}>
                        <Ionicons name="information-circle-outline" size={18} color={colors.text.grey} />
                        <Text style={styles.warningText}>This setting can't be changed later.</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Next Button - Fixed at bottom */}
            <View style={styles.bottomButtonContainer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.text.primary} />
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
        marginBottom: spacing.md,
    },
    // Circle Type Card
    circleTypeCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    circleTypeCardSelected: {
        borderColor: colors.primary.sage,
        borderWidth: 2,
    },
    circleTypeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    circleTypeIcon: {
        width: 54,
        height: 54,
        borderRadius: 22,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    circleImage: {
        width: 54,
        height: 54,
    },
    circleTypeIconInner: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary.sage,
    },
    circleTypeInfo: {
        flex: 1,
    },
    circleTypeTitle: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    circleTypeSubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
        marginTop: 2,
    },
    circleTypeDivider: {
        height: 1,
        backgroundColor: '#D3D3D3',
        marginVertical: spacing.sm,
    },
    circleTypeFeatures: {
        marginTop: spacing.xs,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    featureText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.dark,
        marginLeft: spacing.sm,
    },
    // Warning
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginTop: spacing.sm,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    warningText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
        marginLeft: spacing.sm,
    },
    // Bottom Button
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        paddingHorizontal: horizontalPadding,
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
        backgroundColor: 'transparent',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.button.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        gap: spacing.xs,
    },
    nextButtonText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
});

export default CreateCircleScreen;
