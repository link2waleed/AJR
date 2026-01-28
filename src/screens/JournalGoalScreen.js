import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import morningIcon from '../../assets/images/fajr.png';
import eveningIcon from '../../assets/images/isha.png';
import bothIcon from '../../assets/images/both.png';
import noPromptIcon from '../../assets/images/no-prompts.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const promptOptions = [
    { id: 'yes', label: 'prompts', icon: morningIcon },
    { id: 'no', label: 'No prompts', icon: noPromptIcon },
];

const JournalGoalScreen = ({ navigation }) => {
    const [selectedPrompt, setSelectedPrompt] = useState('morning');

    const handleContinue = () => {
        navigation.navigate('MyCircleSetup');
    };

    const handleSkip = () => {
        navigation.navigate('MyCircleSetup');
    };

    return (
        <View style={styles.container}>
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
                            style={styles.optionCard}
                            onPress={() => setSelectedPrompt(option.id)}
                            activeOpacity={0.7}
                        >
                            <Image
                                source={option.icon}
                                style={styles.optionIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.optionLabel}>{option.label}</Text>
                            <View style={[styles.radioOuter, selectedPrompt === option.id && styles.radioOuterSelected]}>
                                {selectedPrompt === option.id && <View style={styles.radioInner} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.text.black} />
                </TouchableOpacity>
                <Button
                    title="Continue"
                    onPress={handleContinue}
                    icon="arrow-forward"
                    style={styles.continueButton}
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
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    optionIcon: {
        width: 36,
        height: 36,
        marginRight: spacing.md,
    },
    optionLabel: {
        flex: 1,
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D0D0D0',
        alignItems: 'center',
        justifyContent: 'center',
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
