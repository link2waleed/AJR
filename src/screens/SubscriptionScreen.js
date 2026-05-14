import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Linking,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useSubscription } from '../context/SubscriptionContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

// ── AJR+ Features ──────────────────────────────────────────────────────────
const FEATURES = [
    { icon: 'people-outline', text: 'Create unlimited circles' },
    { icon: 'person-add-outline', text: 'Up to 25 members in each circle' },
    { icon: 'analytics-outline', text: 'Priority access to insights' },
];

const SubscriptionScreen = ({ navigation, route }) => {
    const {
        offerings,
        purchasing,
        isProUser,
        purchaseWeekly,
        purchaseYearly,
        restorePurchases,
        loading,
    } = useSubscription();

    const [selectedPlan, setSelectedPlan] = useState('yearly'); // Default to yearly (best value)
    const fromSettings = route?.params?.fromSettings;
    const variant = route?.params?.variant;
    const isCircleVariant = variant === 'circle';

    const displayFeatures = FEATURES;

    // Get prices from RevenueCat offerings (fallback to static prices)
    const weeklyPrice = offerings?.availablePackages?.find(
        p => p.packageType === 'WEEKLY' || p.identifier === '$rc_weekly'
    )?.product?.priceString || '$2.99';

    const yearlyPrice = offerings?.availablePackages?.find(
        p => p.packageType === 'ANNUAL' || p.identifier === '$rc_annual'
    )?.product?.priceString || '$31.99';

    // Calculate weekly equivalent for yearly
    const yearlyWeeklyEquivalent = '$0.61';

    const handleSubscribe = async () => {
        let success;
        if (selectedPlan === 'weekly') {
            success = await purchaseWeekly();
        } else {
            success = await purchaseYearly();
        }

        if (success) {
            if (fromSettings) {
                navigation.goBack();
            } else {
                navigation.navigate('FinalSetup');
            }
        }
    };

    const handleSkip = () => {
        if (fromSettings) {
            navigation.goBack();
        } else {
            navigation.navigate('FinalSetup');
        }
    };

    const handleRestore = async () => {
        const restored = await restorePurchases();
        if (restored) {
            if (fromSettings) {
                navigation.goBack();
            } else {
                navigation.navigate('FinalSetup');
            }
        }
    };

    // Already a pro user — show active status
    if (isProUser && fromSettings) {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                </TouchableOpacity>
                <View style={styles.activeContainer}>
                    <View style={styles.activeIconWrapper}>
                        <Ionicons name="checkmark-circle" size={64} color={colors.primary.sage} />
                    </View>
                    <Text style={styles.activeTitle}>AJR+ Active</Text>
                    <Text style={styles.activeSubtitle}>
                        You have full access to all premium features. JazakAllahu Khairan for your support!
                    </Text>
                    <TouchableOpacity
                        style={styles.manageButton}
                        onPress={() => {
                            Linking.openURL(
                                Platform.OS === 'ios'
                                    ? 'https://apps.apple.com/account/subscriptions'
                                    : 'https://play.google.com/store/account/subscriptions'
                            );
                        }}
                    >
                        <Text style={styles.manageButtonText}>Manage Subscription</Text>
                        <Ionicons name="open-outline" size={16} color={colors.primary.sage} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Back / Close Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={fromSettings ? () => navigation.goBack() : handleSkip}
            >
                <Ionicons
                    name={fromSettings ? 'arrow-back' : 'close'}
                    size={24}
                    color={colors.text.black}
                />
            </TouchableOpacity>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* AJR+ Badge */}
                <View style={styles.badgeContainer}>
                    <LinearGradient
                        colors={['#C4A265', '#E8D5A8', '#C4A265']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.badge}
                    >
                        <Text style={styles.badgeText}>AJR+</Text>
                    </LinearGradient>
                </View>

                {/* Title */}
                <Text style={styles.title}>{isCircleVariant ? 'Grow Your Circles' : 'Elevate Your Journey'}</Text>
                <Text style={styles.subtitle}>
                    {isCircleVariant
                        ? 'You’ve reached your free limits. Upgrade to keep building, organizing, and growing your communities with ease.'
                        : 'Unlock the full AJR experience with premium features designed to deepen your spiritual growth.'}
                </Text>

                {/* Features List */}
                <View style={styles.featuresContainer}>
                    {displayFeatures.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                            <View style={styles.featureIconContainer}>
                                <Ionicons name={feature.icon} size={20} color={colors.primary.sage} />
                            </View>
                            <Text style={styles.featureText}>{feature.text}</Text>
                        </View>
                    ))}
                </View>

                {/* Plan Cards */}
                <View style={styles.plansContainer}>
                    {/* Yearly Plan */}
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            selectedPlan === 'yearly' && styles.planCardSelected,
                        ]}
                        onPress={() => setSelectedPlan('yearly')}
                        activeOpacity={0.8}
                    >
                        {/* Best Value Badge */}
                        <View style={styles.bestValueBadge}>
                            <Text style={styles.bestValueText}>SAVE 80%</Text>
                        </View>

                        <View style={styles.planRadio}>
                            <View style={[
                                styles.radioOuter,
                                selectedPlan === 'yearly' && styles.radioOuterSelected,
                            ]}>
                                {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
                            </View>
                        </View>

                        <View style={styles.planInfo}>
                            <Text style={[
                                styles.planName,
                                selectedPlan === 'yearly' && styles.planNameSelected,
                            ]}>
                                Yearly
                            </Text>
                            <Text style={styles.planEquivalent}>
                                {yearlyWeeklyEquivalent}/week
                            </Text>
                        </View>

                        <View style={styles.planPriceContainer}>
                            <Text style={[
                                styles.planPrice,
                                selectedPlan === 'yearly' && styles.planPriceSelected,
                            ]}>
                                {yearlyPrice}
                            </Text>
                            <Text style={styles.planPeriod}>/year</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Weekly Plan */}
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            selectedPlan === 'weekly' && styles.planCardSelected,
                        ]}
                        onPress={() => setSelectedPlan('weekly')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.planRadio}>
                            <View style={[
                                styles.radioOuter,
                                selectedPlan === 'weekly' && styles.radioOuterSelected,
                            ]}>
                                {selectedPlan === 'weekly' && <View style={styles.radioInner} />}
                            </View>
                        </View>

                        <View style={styles.planInfo}>
                            <Text style={[
                                styles.planName,
                                selectedPlan === 'weekly' && styles.planNameSelected,
                            ]}>
                                Weekly
                            </Text>
                            <Text style={styles.planEquivalent}>
                                Billed every week
                            </Text>
                        </View>

                        <View style={styles.planPriceContainer}>
                            <Text style={[
                                styles.planPrice,
                                selectedPlan === 'weekly' && styles.planPriceSelected,
                            ]}>
                                {weeklyPrice}
                            </Text>
                            <Text style={styles.planPeriod}>/week</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Subscribe Button */}
                <TouchableOpacity
                    style={[styles.subscribeButton, purchasing && styles.subscribeButtonDisabled]}
                    onPress={handleSubscribe}
                    disabled={purchasing || loading}
                    activeOpacity={0.8}
                >
                    {purchasing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.subscribeButtonText}>
                                Subscribe to AJR+
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>

                {/* Restore Purchases */}
                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestore}
                    disabled={purchasing}
                >
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>

                {/* Skip (only in onboarding and limits) */}
                {!fromSettings && (
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                    >
                        <Text style={styles.skipText}>{isCircleVariant ? 'Continue with 1 Circle' : 'Continue with free plan'}</Text>
                    </TouchableOpacity>
                )}

                {/* Referral Link */}
                {/* <TouchableOpacity
                    style={styles.referralButton}
                    onPress={() => navigation.navigate('RedeemCode')}
                >
                    <Text style={styles.referralText}>Got a referral code?</Text>
                </TouchableOpacity> */}

                {/* Legal Links */}
                <View style={styles.legalContainer}>
                    <Text style={styles.legalText}>
                        {isCircleVariant
                            ? 'Small consistent actions are beloved.'
                            : Platform.OS === 'ios'
                                ? 'Payment will be charged to your Apple ID account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'
                                : 'Payment will be charged to your Google Play account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'}
                    </Text>
                    <View style={styles.legalLinks}>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('https://ajrapp.com/terms-of-services')}
                        >
                            <Text style={styles.legalLink}>Terms of Use</Text>
                        </TouchableOpacity>
                        <Text style={styles.legalSeparator}>•</Text>
                        <TouchableOpacity
                            onPress={() => Linking.openURL('https://ajrapp.com/policies/privacy-and-policy')}
                        >
                            <Text style={styles.legalLink}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
    },
    backButton: {
        position: 'absolute',
        top: spacing.xl + spacing.md,
        left: spacing.md,
        padding: spacing.sm,
        zIndex: 10,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.1,
        paddingBottom: spacing.xxl,
    },

    // ── Active State ──
    activeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    activeIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(122, 158, 127, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    activeTitle: {
        fontSize: 28,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.sm,
    },
    activeSubtitle: {
        fontSize: 16,
        color: colors.text.grey,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xl,
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(122, 158, 127, 0.12)',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
    },
    manageButtonText: {
        fontSize: 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.primary.sage,
        marginRight: spacing.sm,
    },

    // ── Badge ──
    badgeContainer: {
        marginBottom: spacing.lg,
    },
    badge: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xl + spacing.sm,
        borderRadius: borderRadius.xl,
    },
    badgeText: {
        fontSize: isSmallDevice ? 22 : 26,
        fontWeight: typography.fontWeight.bold,
        color: '#FFFFFF',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // ── Title ──
    title: {
        fontSize: isSmallDevice ? 24 : 28,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: isSmallDevice ? 14 : 15,
        color: colors.text.grey,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.lg,
    },

    // ── Features ──
    featuresContainer: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    featureIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(122, 158, 127, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    featureText: {
        fontSize: isSmallDevice ? 14 : 15,
        color: colors.text.black,
        flex: 1,
    },

    // ── Plans ──
    plansContainer: {
        width: '100%',
        marginBottom: spacing.md,
    },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: 'rgba(224,224,224,0.6)',
        padding: spacing.md,
        marginBottom: spacing.sm,
        position: 'relative',
        overflow: 'hidden',
    },
    planCardSelected: {
        borderColor: colors.primary.sage,
        backgroundColor: 'rgba(122, 158, 127, 0.06)',
    },
    bestValueBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#C4A265',
        paddingVertical: 3,
        paddingHorizontal: spacing.sm,
        borderBottomLeftRadius: borderRadius.md,
    },
    bestValueText: {
        fontSize: 10,
        fontWeight: typography.fontWeight.bold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    planRadio: {
        marginRight: spacing.md,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D0D0D0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: colors.primary.sage,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary.sage,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: isSmallDevice ? 16 : 17,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    planNameSelected: {
        color: colors.primary.darkSage,
    },
    planEquivalent: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
        marginTop: 2,
    },
    planPriceContainer: {
        alignItems: 'flex-end',
    },
    planPrice: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    planPriceSelected: {
        color: colors.primary.darkSage,
    },
    planPeriod: {
        fontSize: 12,
        color: colors.text.grey,
    },

    // ── Subscribe Button ──
    subscribeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary.sage,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md + 4,
        paddingHorizontal: spacing.xl,
        width: '100%',
        marginBottom: spacing.sm,
    },
    subscribeButtonDisabled: {
        opacity: 0.7,
    },
    subscribeButtonText: {
        fontSize: isSmallDevice ? 16 : 17,
        fontWeight: typography.fontWeight.medium,
        color: '#FFFFFF',
        marginRight: spacing.sm,
    },

    // ── Restore & Skip ──
    restoreButton: {
        paddingVertical: spacing.sm,
        marginBottom: spacing.xs,
    },
    restoreText: {
        fontSize: isSmallDevice ? 14 : 15,
        color: colors.primary.sage,
        fontWeight: typography.fontWeight.medium,
    },
    skipButton: {
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
    },
    skipText: {
        fontSize: isSmallDevice ? 14 : 15,
        color: colors.text.grey,
        textDecorationLine: 'underline',
    },
    referralButton: {
        paddingVertical: spacing.sm,
        marginBottom: spacing.xs,
    },
    referralText: {
        fontSize: isSmallDevice ? 14 : 15,
        color: colors.text.dark,
        fontWeight: typography.fontWeight.medium,
        textDecorationLine: 'underline',
    },

    // ── Legal ──
    legalContainer: {
        width: '100%',
        paddingTop: spacing.sm,
    },
    legalText: {
        fontSize: 11,
        color: colors.text.grey,
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: spacing.sm,
    },
    legalLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    legalLink: {
        fontSize: 12,
        color: colors.primary.sage,
        fontWeight: typography.fontWeight.medium,
    },
    legalSeparator: {
        fontSize: 12,
        color: colors.text.grey,
        marginHorizontal: spacing.sm,
    },
});

export default SubscriptionScreen;
