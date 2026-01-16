import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    Modal,
    FlatList,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import noteIcon2 from '../../assets/images/note-2.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const goalOptions = ['10', '50', '100', 'Custom'];
const dhikrOptions = ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'Astaghfirullah'];

const DhikrGoalScreen = ({ navigation }) => {
    const [selectedGoal, setSelectedGoal] = useState('10');
    const [customGoal, setCustomGoal] = useState('');
    const [selectedDhikr, setSelectedDhikr] = useState('');
    const [customDhikr, setCustomDhikr] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const handleContinue = () => {
        navigation.navigate('JournalGoal');
    };

    const handleSkip = () => {
        navigation.navigate('JournalGoal');
    };

    const handleSelectDhikr = (dhikr) => {
        setSelectedDhikr(dhikr);
        setShowDropdown(false);
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
                <Text style={styles.title}>Set your Dhikir Goal</Text>
                <Text style={styles.subtitle}>
                    Remembrance brings peace.{'\n'}Choose a goal that fits gently into your day
                </Text>

                {/* Goal Selection Buttons */}
                <View style={styles.goalButtonsContainer}>
                    {goalOptions.map((goal) => (
                        <TouchableOpacity
                            key={goal}
                            style={[
                                styles.goalButton,
                                selectedGoal === goal && styles.goalButtonSelected,
                            ]}
                            onPress={() => setSelectedGoal(goal)}
                        >
                            <Text style={[
                                styles.goalButtonText,
                                selectedGoal === goal && styles.goalButtonTextSelected,
                            ]}>
                                {goal}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Custom Goal Input (if Custom selected) */}
                {selectedGoal === 'Custom' && (
                    <View style={styles.customInputSection}>
                        <TextInput
                            style={styles.customInput}
                            value={customGoal}
                            onChangeText={setCustomGoal}
                            placeholder="Enter custom goal"
                            placeholderTextColor={colors.text.grey}
                            keyboardType="numeric"
                        />
                    </View>
                )}

                {/* Dhikr Dropdown */}
                <View style={styles.dropdownSection}>
                    <Text style={styles.label}>Dhikr</Text>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowDropdown(!showDropdown)}
                    >
                        <Image
                            source={noteIcon2}
                            style={styles.inputIconImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.dropdownText, !selectedDhikr && styles.dropdownPlaceholder]}>
                            {selectedDhikr || 'Choose Dhikr'}
                        </Text>
                        <Ionicons
                            name={showDropdown ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={colors.text.grey}
                        />
                    </TouchableOpacity>

                    {/* Dropdown Options */}
                    {showDropdown && (
                        <View style={styles.dropdownOptions}>
                            {dhikrOptions.map((dhikr) => (
                                <TouchableOpacity
                                    key={dhikr}
                                    style={styles.dropdownOption}
                                    onPress={() => handleSelectDhikr(dhikr)}
                                >
                                    <Text style={styles.dropdownOptionText}>{dhikr}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Custom Dhikr Input */}
                <View style={styles.customDhikrSection}>
                    <Text style={styles.label}>Custom Dhikr (Optional)</Text>
                    <View style={styles.textAreaWrapper}>
                        <TextInput
                            style={styles.textArea}
                            value={customDhikr}
                            onChangeText={setCustomDhikr}
                            placeholder="Write Something...."
                            placeholderTextColor={colors.text.grey}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
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
    goalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    goalButton: {
        flex: 1,
        paddingVertical: spacing.md,
        marginHorizontal: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#C5C5C5',
        backgroundColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
    },
    goalButtonSelected: {
        backgroundColor: colors.primary.sage,
        borderColor: colors.primary.sage,
    },
    goalButtonText: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    goalButtonTextSelected: {
        color: '#FFFFFF',
    },
    customInputSection: {
        marginBottom: spacing.lg,
    },
    customInput: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#C5C5C5',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: typography.fontSize.md,
        color: colors.text.black,
    },
    dropdownSection: {
        marginBottom: spacing.lg,
        zIndex: 10,
    },
    label: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.sm,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#C5C5C5',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    inputIconImage: {
        width: 20,
        height: 20,
        marginRight: spacing.sm,
    },
    dropdownText: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: colors.text.black,
    },
    dropdownPlaceholder: {
        color: colors.text.grey,
    },
    dropdownOptions: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.md,
        marginTop: spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 100,
    },
    dropdownOption: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dropdownOptionText: {
        fontSize: typography.fontSize.md,
        color: colors.text.black,
    },
    customDhikrSection: {
        marginTop: spacing.md,
    },
    textAreaWrapper: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#C5C5C5',
        minHeight: 100,
    },
    textArea: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: typography.fontSize.md,
        color: colors.text.black,
        minHeight: 100,
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

export default DhikrGoalScreen;
