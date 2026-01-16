import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import noteIcon from '../../assets/images/note.png';
import noteIcon2 from '../../assets/images/note-2.png';
import clockIcon from '../../assets/images/clock.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const QuranGoalScreen = ({ navigation }) => {
    const [pagesPerDay, setPagesPerDay] = useState('');
    const [versePerDay, setVersePerDay] = useState('');
    const [minutesPerDay, setMinutesPerDay] = useState('');

    const handleContinue = () => {
        navigation.navigate('DhikrGoal');
    };

    const handleSkip = () => {
        navigation.navigate('DhikrGoal');
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <Text style={styles.title}>Connect with the Quran</Text>
                <Text style={styles.subtitle}>
                    A few verses a day brings light and clarity.{'\n'}Choose the pace for you
                </Text>

                {/* Input Fields */}
                <View style={styles.inputsContainer}>
                    {/* Pages Per Day */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Pages Per Day</Text>
                        <View style={styles.inputWrapper}>
                            <Image
                                source={noteIcon}
                                style={styles.inputIconImage}
                                resizeMode="contain"
                            />
                            <TextInput
                                style={styles.input}
                                value={pagesPerDay}
                                onChangeText={setPagesPerDay}
                                placeholder="Enter Pages Per Day"
                                placeholderTextColor={colors.text.grey}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Verse Per Day */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Verse Per Day</Text>
                        <View style={styles.inputWrapper}>
                            <Image
                                source={noteIcon2}
                                style={styles.inputIconImage}
                                resizeMode="contain"
                            />
                            <TextInput
                                style={styles.input}
                                value={versePerDay}
                                onChangeText={setVersePerDay}
                                placeholder="Enter Verse Per Day"
                                placeholderTextColor={colors.text.grey}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

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
                                onChangeText={setMinutesPerDay}
                                placeholder="Enter Minutes Per Day"
                                placeholderTextColor={colors.text.grey}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
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

export default QuranGoalScreen;
