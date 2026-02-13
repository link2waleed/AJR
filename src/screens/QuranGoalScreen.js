import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    Image,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import FirebaseService from '../services/FirebaseService';
import clockIcon from '../../assets/images/clock.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const QuranGoalScreen = ({ navigation, route }) => {
    const activities = route?.params?.activities || {};
    const [minutesPerDay, setMinutesPerDay] = useState('');
    const [loading, setLoading] = useState(false);

    /**
     * Validate input: only numbers, max 500
     */
    const validateInput = (value) => {
        return value.replace(/[^0-9]/g, '');
    };

    const handleInputChange = (value, setter) => {
        const validated = validateInput(value);
        if (validated === '' || parseInt(validated, 10) <= 500) {
            setter(validated);
        } else {
            Alert.alert('Invalid Input', 'Value must not exceed 500');
        }
    };

    const validateAllInputs = () => {
        const num = parseInt(minutesPerDay, 10);
        if (minutesPerDay === '') {
            Alert.alert('Required Field', 'Minutes Per Day is required');
            return false;
        }
        if (isNaN(num) || num < 1 || num > 500) {
            Alert.alert('Invalid Input', 'Minutes Per Day must be a number between 1 and 500');
            return false;
        }
        return true;
    };

    const handleContinue = async () => {
        if (!validateAllInputs()) return;
        const fromSettings = route?.params?.fromSettings || false;

        setLoading(true);
        try {
            // Save Quran goals to Firebase
            await FirebaseService.saveQuranGoals(minutesPerDay);
            // Navigate to next selected activity
            if (activities.dhikr === 'yes') {
                navigation.navigate('DhikrGoal', { activities, fromSettings });
            } else if (activities.journaling === 'yes') {
                await FirebaseService.saveJournalingGoals(true);
                navigation.navigate(fromSettings ? 'FinalSetup' : 'MyCircleSetup', { activities, fromSettings });
            } else {
                navigation.navigate(fromSettings ? 'FinalSetup' : 'MyCircleSetup', { activities });
            }
        } catch (error) {
            console.error('Error saving Quran goals:', error);
            Alert.alert('Error', error.message || 'Failed to save Quran goals. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        const fromSettings = route?.params?.fromSettings || false;
        // Navigate to next selected activity
        if (activities.dhikr === 'yes') {
            navigation.navigate('DhikrGoal', { activities, fromSettings });
        } else if (activities.journaling === 'yes') {
            await FirebaseService.saveJournalingGoals(true);
            navigation.navigate(fromSettings ? 'FinalSetup' : 'MyCircleSetup', { activities, fromSettings });
        } else {
            navigation.navigate(fromSettings ? 'FinalSetup' : 'MyCircleSetup', { activities });
        }
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
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <Text style={styles.title}>Connect with the Quran</Text>
                <Text style={styles.subtitle}>
                    A few verses a day brings light and clarity.{'\n'}Set your daily reading time
                </Text>

                {/* Input Fields */}
                <View style={styles.inputsContainer}>
                    {/* Minutes Per Day */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Minutes Per Day</Text>
                        <View style={styles.inputWrapper}>
                            <Image
                                source={clockIcon}
                                style={styles.inputIconImage}
                                resizeMode="contain"
                            />
                            <TextInput
                                style={styles.input}
                                value={minutesPerDay}
                                onChangeText={(value) => handleInputChange(value, setMinutesPerDay)}
                                placeholder="Enter Minutes Per Day"
                                placeholderTextColor={colors.text.grey}
                                keyboardType="number-pad"
                                editable={!loading}
                                maxLength={3}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.buttonContainer}>
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
    inputsContainer: {
        marginTop: spacing.md,
    },
    inputSection: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#C5C5C5',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    inputIconImage: {
        width: 20,
        height: 20,
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: colors.text.black,
        paddingVertical: spacing.xs,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: horizontalPadding,
        paddingBottom: spacing.xxl,
        paddingTop: spacing.md,
        justifyContent: 'space-between',
        width: '100%',
    },
    skipText: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.black,
        marginRight: spacing.xs,
    },
    continueButton: {
        flex: 1,
        margin: spacing.sm,

    },
});

export default QuranGoalScreen;
