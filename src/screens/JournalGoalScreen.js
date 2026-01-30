import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import FirebaseService from '../services/FirebaseService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const promptOptions = [
    { id: 'enabled', label: 'Enable Prompts', icon: 'notifications', description: 'Receive prompts to reflect throughout the day' },
    { id: 'disabled', label: 'Disable Prompts', icon: 'notifications-off', description: 'Skip prompts and reflect on your own' },
];

const JournalGoalScreen = ({ navigation }) => {
    const [selectedPrompt, setSelectedPrompt] = useState('enabled');
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        setLoading(true);
        try {
            // Save journaling goal to Firebase (true for enabled, false for disabled)
            const enablePrompts = selectedPrompt === 'enabled';
            await FirebaseService.saveJournalingGoals(enablePrompts);
            navigation.navigate('MyCircleSetup');
        } catch (error) {
            console.error('Error saving journaling goal:', error);
            Alert.alert('Error', 'Failed to save journaling goal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        navigation.navigate('MyCircleSetup');
    };

    const handleBack = () => {
        navigation.goBack();
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
                <Text style={styles.title}>Set Your Journaling Goal</Text>
                <Text style={styles.subtitle}>
                    Reflection nurtures gratitude.{'\n'}Receive prompts to pause and grow
                </Text>

                {/* Prompt Options */}
                <View style={styles.optionsContainer}>
                    {promptOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionCard,
                                selectedPrompt === option.id && styles.optionCardSelected,
                            ]}
                            onPress={() => setSelectedPrompt(option.id)}
                            activeOpacity={0.7}
                            disabled={loading}
                        >
                            <View style={styles.optionContent}>
                                <Ionicons 
                                    name={option.icon} 
                                    size={32} 
                                    color={selectedPrompt === option.id ? colors.primary.dark : colors.text.gray} 
                                />
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>{option.label}</Text>
                                    <Text style={styles.optionDescription}>{option.description}</Text>
                                </View>
                            </View>
                            <View style={[styles.radioOuter, selectedPrompt === option.id && styles.radioOuterSelected]}>
                                {selectedPrompt === option.id && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={styles.skipButton} 
                    onPress={handleSkip}
                    disabled={loading}
                >
                    <Text style={styles.skipText}>Skip</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.text.black} />
                </TouchableOpacity>
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
        marginTop: spacing.md,
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
        lineHeight: 22,
    },
    optionsContainer: {
        marginTop: spacing.md,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    optionCardSelected: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: colors.primary.sage,
    },
    optionContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionTextContainer: {
        flex: 1,
        marginLeft: spacing.md,
    },
    optionLabel: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    optionDescription: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        lineHeight: 18,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D0D0D0',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.md,
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
        marginLeft: spacing.xxxl,
    },
});

export default JournalGoalScreen;
