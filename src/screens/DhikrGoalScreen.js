import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    TextInput,
    Alert,

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import FirebaseService from '../services/FirebaseService';
// UI updated: removed dropdown image usage

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const dhikrOptions = [
    'SubhanAllah',
    'Alhamdulillah',
    'Allahu Akbar',
    'Astaghfirullah',
    'La ilaha illa Allah',
    'SubhanAllahi wa bihamdih',
    'SubhanAllah Al-Adheem',
    'La hawla wa la quwwata illa billah',
    'Laa ilaaha illallaahu wahdahu laa shareeka lahul-mulku wa lahul-hamdu wa Huwa alaa kulli shayin Qadeer',
    'Allahumma salli ala Muhammad'
];

const DhikrGoalScreen = ({ navigation, route }) => {
    const activities = route?.params?.activities || {};
    const [selectedDhikrs, setSelectedDhikrs] = useState({}); // { dhikr: counter }
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    /**
     * Toggle dhikr selection with default counter of 10
     */
    const toggleDhikrSelection = (dhikr) => {
        setSelectedDhikrs((prev) => {
            const updated = { ...prev };
            if (updated[dhikr]) {
                delete updated[dhikr]; // Deselect
            } else {
                updated[dhikr] = 10; // Default counter
            }
            return updated;
        });
    };

    /**
     * Update counter for a selected dhikr
     */
    const updateDhikrCounter = (dhikr, value) => {
        setSelectedDhikrs((prev) => ({
            ...prev,
            [dhikr]: value,
        }));
    };

    const incrementCounter = (dhikr) => {
        setSelectedDhikrs((prev) => ({
            ...prev,
            [dhikr]: (prev[dhikr] || 0) + 1,
        }));
    };

    const decrementCounter = (dhikr) => {
        setSelectedDhikrs((prev) => ({
            ...prev,
            [dhikr]: Math.max(1, (prev[dhikr] || 1) - 1),
        }));
    };

    const handleContinue = async () => {
        // Validate that at least one dhikr is selected
        const selectedCount = Object.keys(selectedDhikrs).length;
        if (selectedCount === 0) {
            Alert.alert('No Selection', 'Please select at least one dhikr and set a counter.');
            return;
        }

        // Validate that all have counters > 0
        for (const [dhikr, counter] of Object.entries(selectedDhikrs)) {
            if (!counter || counter < 1) {
                Alert.alert('Invalid Counter', `${dhikr} must have a counter between 1 and 1000`);
                return;
            }
        }

        const fromSettings = route?.params?.fromSettings || false;
        setLoading(true);
        try {
            // Save to Firebase
            await FirebaseService.saveDhikrGoals(selectedDhikrs);
            // Navigate to next selected activity
            if (activities.journaling === 'yes') {
                await FirebaseService.saveJournalingGoals(true);
                navigation.navigate(fromSettings ? 'FinalSetup' : 'Subscription', { activities, fromSettings });
            } else {
                navigation.navigate(fromSettings ? 'FinalSetup' : 'Subscription', { activities });
            }
        } catch (error) {
            console.error('Error saving Dhikr goals:', error);
            Alert.alert('Error', error.message || 'Failed to save Dhikr goals. Please try again.');
        } finally {
            setLoading(false);
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
                scrollEventThrottle={16}
                onScroll={() => showDropdown && setShowDropdown(false)}
            >
                {/* Header */}
                <Text style={styles.title}>Set your Dhikr Goal</Text>
                <Text style={styles.subtitle}>
                    Remembrance brings peace.{'\n'}Select multiple dhikrs with individual counters
                </Text>
                {/* Full-screen Dhikr list with selection and counters */}
                <View style={styles.dhikrListSection}>
                    <Text style={styles.label}>Select Dhikrs</Text>
                    <View style={styles.dhikrList}>
                        {dhikrOptions.map((dhikr) => {
                            const isSelected = selectedDhikrs.hasOwnProperty(dhikr);
                            const counter = selectedDhikrs[dhikr] || 0;
                            return (
                                <View
                                    key={dhikr}
                                    style={[
                                        styles.dhikrRow,
                                        isSelected && styles.dhikrRowSelected,
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={styles.dhikrRowLeft}
                                        onPress={() => toggleDhikrSelection(dhikr)}
                                        disabled={loading}
                                    >
                                        <View style={[
                                            styles.checkboxContainer,
                                            isSelected && styles.checkboxContainerSelected
                                        ]}>
                                            {isSelected && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={14}
                                                    color="#fff"
                                                />
                                            )}
                                        </View>
                                        <Text
                                            style={[styles.dhikrName, isSelected && styles.dhikrNameSelected]}
                                        >
                                            {dhikr}
                                        </Text>
                                    </TouchableOpacity>

                                    {isSelected && (
                                        <View style={styles.counterControl}>
                                            <TouchableOpacity
                                                style={styles.counterButton}
                                                onPress={() => decrementCounter(dhikr)}
                                                disabled={loading}
                                            >
                                                <Text style={styles.counterButtonText}>−</Text>
                                            </TouchableOpacity>

                                            <TextInput
                                                style={styles.counterInput}
                                                value={counter === '' ? '' : String(counter)}
                                                keyboardType="number-pad"
                                                onChangeText={(text) => {
                                                    const cleanText = text.replace(/[^0-9]/g, '');
                                                    if (cleanText === '') {
                                                        updateDhikrCounter(dhikr, '');
                                                    } else {
                                                        const parsed = parseInt(cleanText, 10);
                                                        updateDhikrCounter(dhikr, parsed);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    // Ensure minimum 1 when user leaves the field
                                                    if (counter === '' || counter < 1) {
                                                        updateDhikrCounter(dhikr, 1);
                                                    }
                                                }}
                                                editable={!loading}
                                                selectTextOnFocus={true}
                                            />

                                            <TouchableOpacity
                                                style={styles.counterButton}
                                                onPress={() => incrementCounter(dhikr)}
                                                disabled={loading}
                                            >
                                                <Text style={styles.counterButtonText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {Object.keys(selectedDhikrs).length > 0 && (
                    <View style={styles.selectedDhikrInfo}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary.sage} />
                        <Text style={styles.selectedDhikrText}>{Object.keys(selectedDhikrs).length} selected</Text>
                    </View>
                )}
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
        fontWeight: typography.fontWeight.regular,
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
        fontSize: typography.fontSize.sm,
        color: colors.text.black,
    },
    dropdownSection: {
        marginBottom: spacing.lg,
        zIndex: 10,
    },
    label: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.regular,
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
    dropdownOptionsWrapper: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.md,
        marginTop: spacing.xs,
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
    },
    dropdownOptions: {
        maxHeight: 300,
    },
    dropdownOption: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dropdownOptionSelected: {
        backgroundColor: 'rgba(124, 142, 123, 0.1)',
    },
    dhikrOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxIcon: {
        marginRight: spacing.sm,
    },
    dropdownOptionText: {
        fontSize: typography.fontSize.md,
        color: colors.text.black,
    },
    dropdownOptionTextSelected: {
        color: colors.primary.sage,
        fontWeight: typography.fontWeight.regular,
    },
    dhikrListSection: {
        marginBottom: spacing.lg,
    },
    dhikrList: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
    },
    dhikrRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F3F3',
        minHeight: 52,
    },
    dhikrRowSelected: {
        backgroundColor: 'rgba(124, 142, 123, 0.04)',
    },
    dhikrRowLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        marginRight: spacing.md,
    },
    checkboxContainer: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.text.grey,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxContainerSelected: {
        backgroundColor: colors.primary.sage,
        borderColor: colors.primary.sage,
    },
    dhikrName: {
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.regular,
        fontWeight: typography.fontWeight.regular,
        color: colors.text.black,
        flex: 1,
    },
    dhikrNameSelected: {
        color: colors.primary.sage,
        fontWeight: typography.fontWeight.regular,
    },
    counterControl: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.xs,
    },
    counterButtonText: {
        fontSize: 20,
        color: colors.text.black,
    },
    counterInput: {
        width: 56,
        height: 36,
        textAlign: 'center',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
        paddingVertical: 4,
        paddingHorizontal: 8,
        fontSize: typography.fontSize.md,
    },
    selectedDhikrsContainer: {
        backgroundColor: 'rgba(124, 142, 123, 0.1)',
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    dhikrCounterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    dhikrNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: spacing.md,
    },
    // dhikrName: {
    //     marginLeft: spacing.sm,
    //     fontSize: typography.fontSize.md,
    //     color: colors.text.black,
    //     fontWeight: typography.fontWeight.medium,
    //     flex: 1,
    // },
    counterValueContainer: {
        width: 50,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#C5C5C5',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        alignItems: 'center',
    },
    counterValue: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        color: colors.primary.sage,
    },
    sliderRow: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(124, 142, 123, 0.2)',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    selectedDhikrInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(124, 142, 123, 0.1)',
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    selectedDhikrText: {
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.md,
        color: colors.primary.sage,
        fontWeight: typography.fontWeight.medium,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFE8E8',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#E57373',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    warningText: {
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.sm,
        color: '#C62828',
        flex: 1,
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
        margin: spacing.sm,

    },
});

export default DhikrGoalScreen;
