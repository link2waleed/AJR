import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useSubscription } from '../context/SubscriptionContext';

const RedeemCodeScreen = ({ navigation }) => {
    const { isProUser, refreshStatus } = useSubscription();
    const [redeeming, setRedeeming] = useState(false);
    const [redeemed, setRedeemed] = useState(false);

    // Listen for subscription changes after redemption
    useEffect(() => {
        if (redeemed && isProUser) {
            Alert.alert(
                '🎉 Code Redeemed!',
                'Your AJR+ subscription is now active. JazakAllahu Khairan!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        }
    }, [isProUser, redeemed]);

    const handleRedeemCode = async () => {
        if (Platform.OS !== 'ios') {
            Alert.alert(
                'Not Available',
                'Offer code redemption is only available on iOS devices.'
            );
            return;
        }

        setRedeeming(true);
        try {
            // Present Apple's native offer code redemption sheet
            // This handles all validation, code entry, and subscription activation
            await Purchases.presentCodeRedemptionSheet();

            // Mark that we've opened the sheet — we'll detect success
            // via the SubscriptionContext listener when customerInfo updates
            setRedeemed(true);

            // Give Apple a moment to process, then refresh status
            setTimeout(async () => {
                try {
                    await refreshStatus();
                } catch (e) {
                    // Non-critical — the listener will catch it
                }
                setRedeeming(false);
            }, 3000);
        } catch (error) {
            console.error('[RedeemCode] Error presenting redemption sheet:', error);
            setRedeeming(false);

            Alert.alert(
                'Unable to Redeem',
                'Could not open the redemption sheet. Please make sure you have the latest iOS version and try again.',
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Redeem Code</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons name="gift-outline" size={48} color={colors.primary.sage} />
                </View>

                <Text style={styles.title}>Got a Special Code?</Text>
                <Text style={styles.subtitle}>
                    Redeem your offer code to unlock AJR+ premium features. Tap the button below to open Apple's redemption sheet.
                </Text>

                {/* Steps */}
                <View style={styles.stepsContainer}>
                    <View style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepText}>Tap "Redeem Offer Code" below</Text>
                    </View>
                    <View style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepText}>Enter or paste your code</Text>
                    </View>
                    <View style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepText}>Confirm to activate your AJR+ subscription</Text>
                    </View>
                </View>

                {/* Redeem Button */}
                <TouchableOpacity
                    style={[styles.redeemButton, redeeming && styles.redeemButtonDisabled]}
                    onPress={handleRedeemCode}
                    disabled={redeeming}
                >
                    {redeeming ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="ticket-outline" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
                            <Text style={styles.redeemButtonText}>Redeem Offer Code</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Info note */}
                <Text style={styles.infoText}>
                    Offer codes are provided by the AJR team for special promotions, referrals, and community rewards.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xl + spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(122, 158, 127, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: colors.text.dark,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
        paddingHorizontal: spacing.sm,
    },
    stepsContainer: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(224,224,224,0.5)',
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary.sage,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: typography.fontWeight.bold,
        color: '#FFFFFF',
    },
    stepText: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: colors.text.black,
        lineHeight: 20,
    },
    redeemButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary.sage,
        width: '100%',
        paddingVertical: spacing.md + 2,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    redeemButtonDisabled: {
        opacity: 0.6,
    },
    redeemButtonText: {
        color: '#fff',
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
    },
    infoText: {
        fontSize: 13,
        color: colors.text.grey,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: spacing.md,
    },
});

export default RedeemCodeScreen;
