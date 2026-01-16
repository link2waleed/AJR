import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const SubscriptionScreen = ({ navigation }) => {

    const handleSupport = () => {
        console.log('Support AJR - $4.99/month');
        navigation.navigate('FinalSetup');
    };

    const handleContinueFree = () => {
        navigation.navigate('FinalSetup');
    };

    const handleTryFree = () => {
        console.log('Try free for 7 days');
        navigation.navigate('FinalSetup');
    };

    const handleCancel = () => {
        navigation.navigate('FinalSetup');
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Support Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/images/support.png')}
                        style={styles.supportImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Title */}
                <Text style={styles.title}>Support AJR if you're able</Text>

                {/* Description 1 */}
                <Text style={styles.description}>
                    We believe spiritual tools should be accessible. If you're unable to pay right now, tap below.
                </Text>
                <Text style={styles.highlightText}>
                    And may Allah enrich you with ease.
                </Text>

                {/* Description 2 */}
                <Text style={styles.description}>
                    If you're able to support AJR with a subscription, your generosity helps us keep this app ad-free and available for those who cannot afford it.
                </Text>

                {/* Support Button */}
                <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
                    <Text style={styles.supportButtonText}>Support AJR — $4.99/month</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Continue for Free Button */}
                <TouchableOpacity style={styles.freeButton} onPress={handleContinueFree}>
                    <Text style={styles.freeButtonText}>Continue for free</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.text.black} />
                </TouchableOpacity>

                {/* Try Free Link */}
                <TouchableOpacity style={styles.tryFreeLink} onPress={handleTryFree}>
                    <Text style={styles.tryFreeText}>Try free for 7 days</Text>
                </TouchableOpacity>

                {/* Cancel Anytime */}
                <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
                    <Text style={styles.cancelText}>Cancel anytime</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
        marginTop: spacing.md
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.06,
        paddingBottom: spacing.xxl,
        alignItems: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    supportImage: {
        width: screenWidth * 0.5,
        height: screenWidth * 0.4,
    },
    title: {
        fontSize: isSmallDevice ? 22 : 26,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    description: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.grey,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: spacing.sm,
    },
    highlightText: {
        fontSize: isSmallDevice ? 14 : 16,
        color: '#5768C7', // Teal/green highlight color from design
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: spacing.lg,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary.sage,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md + 4,
        paddingHorizontal: spacing.xl,
        width: '100%',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    supportButtonText: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.medium,
        color: '#FFFFFF',
        marginRight: spacing.sm,
    },
    freeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: spacing.md + 4,
        paddingHorizontal: spacing.xl,
        width: '100%',
        marginBottom: spacing.lg,
    },
    freeButtonText: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginRight: spacing.sm,
    },
    tryFreeLink: {
        marginBottom: spacing.md,
    },
    tryFreeText: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.black,
        textDecorationLine: 'underline',
    },
    cancelLink: {
        marginTop: spacing.xs,
    },
    cancelText: {
        fontWeight: typography.fontWeight.regular,
        fontSize: isSmallDevice ? 13 : 15,
        color: colors.text.grey,
    },
});

export default SubscriptionScreen;
