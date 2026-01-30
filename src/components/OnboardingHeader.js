/**
 * OnboardingHeader.js
 * Reusable header for all onboarding screens
 * Displays user name and current screen position
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

const OnboardingHeader = ({ userName = 'User', stepNumber = 1, totalSteps = 8 }) => {
    return (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                <Text style={styles.greeting}>Hello, {userName}</Text>
                <Text style={styles.stepIndicator}>Step {stepNumber} of {totalSteps}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerContent: {
        justifyContent: 'space-between',
    },
    greeting: {
        fontSize: 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    stepIndicator: {
        fontSize: 12,
        color: colors.text.grey,
        fontWeight: '500',
    },
});

export default OnboardingHeader;
