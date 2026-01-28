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

    const handleSupportMonthly = () => {
        console.log('Support AJR - $4.99/month');
        navigation.navigate('FinalSetup');
    };

    const handleSupportYearly = () => {
        console.log('Support AJR - $29.99/year');
        navigation.navigate('FinalSetup');
    };

    const handleTryFree = () => {
        console.log('Try free for 3 days');
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
                <Text style={styles.title}>Support AJR</Text>

                {/* Description */}
                <Text style={styles.description}>
                    Thank you for supporting AJR.{'\n'}
                    Your support helps us keep this space intentional,{'\n'}
                    ad-free, and growing.
                </Text>

                {/* Blessing Text */}
                <Text style={styles.highlightText}>
                    May Allah place barakah in your time, intentions,{'\n'}and actions.
                </Text>

                {/* Monthly Support Button */}
                <TouchableOpacity style={styles.supportButton} onPress={handleSupportMonthly}>
                    <Text style={styles.supportButtonText}>Support AJR — $4.99/month</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Yearly Support Button */}
                <TouchableOpacity style={styles.yearlyButton} onPress={handleSupportYearly}>
                    <Text style={styles.yearlyButtonText}>
                        Support AJR -  $29.99 / year (just $2.49/month)
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.text.black} />
                </TouchableOpacity>

                {/* Try Free Link */}
                <TouchableOpacity style={styles.tryFreeLink} onPress={handleTryFree}>
                    <Text style={styles.tryFreeText}>Try free for 3 days</Text>
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
        marginBottom: spacing.xl
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
    yearlyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: spacing.md + 4,
        paddingHorizontal: spacing.lg,
        width: '100%',
        marginBottom: spacing.lg,
    },
    yearlyButtonText: {
        fontSize: isSmallDevice ? 13 : 15,
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
