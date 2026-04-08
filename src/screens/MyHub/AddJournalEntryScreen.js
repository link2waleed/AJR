import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import HomeGradient from '../../components/HomeGradient';
import { colors, spacing, borderRadius, typography } from '../../theme';
import dailyThemes from '../../data/dailyThemes.json';
import FirebaseService from '../../services/FirebaseService';


const RECENT_ENTRIES = [
    {
        id: 1,
        category: 'Presence',
        content: "I felt so connected during my Maghrib prayer today...",
    },
    {
        id: 2,
        category: 'Tawakkul',
        content: 'I let go of my anxiety about the meeting and trusted Allah...',
    },
];

const AddJournalEntryScreen = ({ navigation }) => {
    const [mode, setMode] = useState('Guided'); // 'Guided' or 'Free write'
    const [currentTheme, setCurrentTheme] = useState(null);
    const [entryText, setEntryText] = useState('');
    const [recentEntries, setRecentEntries] = useState([]);
    const [promptsEnabled, setPromptsEnabled] = useState(true);

    const fetchRecentEntries = useCallback(async () => {
        try {
            const entries = await FirebaseService.getJournalEntries();
            // Filter out archived and take top 3 most recent
            setRecentEntries(entries.filter(e => !e.isArchived).slice(0, 3));
        } catch (error) {
            console.error('Error fetching recent entries:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchPreferences();
            fetchDailyTheme();
            fetchRecentEntries();
        }, [fetchRecentEntries])
    );

    const fetchPreferences = async () => {
        try {
            const info = await FirebaseService.getOnboardingInfo();
            let isEnabled = true;
            if (info?.journaling) {
                if (typeof info.journaling.prompts !== 'undefined') {
                    isEnabled = info.journaling.prompts;
                } else if (typeof info.journaling.enablePrompts !== 'undefined') {
                    isEnabled = info.journaling.enablePrompts;
                }
            }
            setPromptsEnabled(isEnabled);
            if (!isEnabled) {
                setMode('Free write');
            }
        } catch (error) {
            console.error('Error fetching journal preferences:', error);
        }
    };

    const fetchDailyTheme = async () => {
        try {
            const firestoreData = await FirebaseService.getUserRootData();
            // Use fallback to today if createdAt is missing
            const createdAtData = firestoreData.createdAt?.toDate ? firestoreData.createdAt.toDate() : new Date();

            // Normalize dates to midnight to calculate "Calendar Days" difference
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const joinDate = new Date(createdAtData);
            joinDate.setHours(0, 0, 0, 0);

            // Calculate absolute difference in days
            const diffTime = Math.abs(today - joinDate);
            const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            const themesArray = Array.isArray(dailyThemes)
                ? dailyThemes
                : (dailyThemes?.daily_themes || dailyThemes?.themes || []);

            if (!themesArray || themesArray.length === 0) {
                setCurrentTheme(null);
                return;
            }

            const index = daysSince % themesArray.length;
            setCurrentTheme(themesArray[index]);
            console.log('Daily Theme Updated:', { daysSince, index, title: themesArray[index].title });
        } catch (error) {
            console.error('Error fetching daily theme:', error);
            const fallback = Array.isArray(dailyThemes) ? dailyThemes[0] : (dailyThemes?.daily_themes?.[0] || null);
            setCurrentTheme(fallback);
        }
    };

    const handleBack = () => navigation.goBack();

    const handleSave = async () => {
        console.log('💾 handleSave called - Starting journal save process');
        try {
            if (!entryText.trim()) {
                Alert.alert('Empty Entry', 'Please write something before saving.');
                return;
            }

            console.log('Saving journal entry...');
            await FirebaseService.saveJournalEntry({
                mode: mode,
                themeTitle: mode === 'Guided' ? currentTheme?.title : null,
                themeDescription: mode === 'Guided' ? currentTheme?.description : null,
                content: entryText.trim(),
                isArchived: false
            });

            console.log('Journal entry saved, now marking as complete...');
            // Mark journal as complete for today
            await FirebaseService.markJournalComplete();

            Alert.alert('Success', 'Journal entry saved successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving journal entry:', error);
            Alert.alert('Error', 'Failed to save journal entry. Please try again.');
        }
    };

    return (
        <HomeGradient>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Journal Entry</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Entry Card */}
                        <View style={styles.entryCard}>
                            {/* Mode Toggle - Only show if prompts are enabled */}
                            {promptsEnabled && (
                                <View style={styles.modeToggle}>
                                    <TouchableOpacity
                                        style={[styles.modeButton, mode === 'Guided' && styles.modeButtonActive]}
                                        onPress={() => setMode('Guided')}
                                    >
                                        <Text style={[styles.modeButtonText, mode === 'Guided' && styles.modeButtonTextActive]}>
                                            Guided
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modeButton, mode === 'Free write' && styles.modeButtonActive]}
                                        onPress={() => setMode('Free write')}
                                    >
                                        <Text style={[styles.modeButtonText, mode === 'Free write' && styles.modeButtonTextActive]}>
                                            Free write
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {mode === 'Guided' ? (
                                <>
                                    {/* Guided Prompt Box containing Category and Text */}
                                    <View style={styles.promptBox}>
                                        <View style={styles.categoryTag}>
                                            <Text style={styles.categoryTagText}>{currentTheme?.title || 'Loading...'}</Text>
                                        </View>
                                        <Text style={styles.promptText}>
                                            {currentTheme?.description}
                                        </Text>
                                    </View>

                                    {/* Entry Title */}
                                    {/* <Text style={styles.entryTitle}>{currentTheme?.title ? `${currentTheme.title} Reflection` : 'Reflection'}</Text> */}
                                </>
                            ) : (
                                <>
                                    {/* Free Writing Title */}
                                    <Text style={styles.entryTitle}>Free Writing</Text>
                                </>
                            )}

                            {/* Text Input */}
                            <TextInput
                                style={styles.textInput}
                                placeholder="Write Something..."
                                placeholderTextColor={colors.text.grey}
                                multiline
                                value={entryText}
                                onChangeText={setEntryText}
                                textAlignVertical="top"
                            />

                            {/* Action Buttons */}
                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Recent Entries Section */}
                        {recentEntries.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Recent Entries</Text>
                                {recentEntries.map((entry) => (
                                    <TouchableOpacity
                                        key={entry.id}
                                        style={styles.recentEntryCard}
                                        onPress={() => navigation.navigate('JournalDetail', { entry })}
                                    >
                                        <Text style={styles.recentEntryCategory}>
                                            {entry.themeTitle || entry.mode || 'Journal Entry'}
                                        </Text>
                                        <Text style={styles.recentEntryContent} numberOfLines={2}>
                                            {entry.content}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </HomeGradient>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    headerIcon: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },

    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 80,
    },
    entryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)', // Translucent glass effect
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(122, 145, 129, 0.15)', // Light sage tint
        borderRadius: 14,
        padding: 4,
        marginBottom: 20,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 11,
    },
    modeButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slightly transparent white
        elevation: 1,
    },
    modeButtonText: {
        fontSize: 14,
        color: '#7A9181',
        fontWeight: '500',
    },
    modeButtonTextActive: {
        color: colors.text.black,
        fontWeight: '600',
    },
    categoryTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(122, 145, 129, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 5,
        marginBottom: 16,

    },
    categoryTagText: {
        fontSize: 14,
        color: '#7A9181',
        fontWeight: '700',
    },
    promptBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Less white, more translucent
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    promptText: {
        fontSize: 14,
        color: colors.text.black,
        lineHeight: 20,
        fontWeight: 'normal',
        paddingHorizontal: spacing.sm
    },
    entryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.black,
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: 'rgba(122, 145, 129, 0.08)',
        borderRadius: 16,
        padding: 16,
        minHeight: 120,
        fontSize: 14,
        color: colors.text.black,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(122, 145, 129, 0.1)',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#7A9181',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.black,
        marginBottom: 16,
        marginTop: 12,
    },
    recentEntryCard: {
        backgroundColor: 'rgba(243, 241, 232, 0.7)',
        borderRadius: 10,
        padding: 8,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    recentEntryCategory: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(122, 145, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        fontSize: 11,
        color: '#7A9181',
        fontWeight: '600',
        marginBottom: 4,
    },
    recentEntryContent: {
        fontSize: 11,
        color: '#444444',
        lineHeight: 16,
    },
});

export default AddJournalEntryScreen;