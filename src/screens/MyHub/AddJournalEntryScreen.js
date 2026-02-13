import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
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

    React.useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const info = await FirebaseService.getOnboardingInfo();
                // Check if prompts are enabled (default to true if not set)
                // Structure saved by saveJournalingGoals is { prompts: boolean }
                let isEnabled = true;
                if (info?.journaling) {
                    if (typeof info.journaling.prompts !== 'undefined') {
                        isEnabled = info.journaling.prompts;
                    } else if (typeof info.journaling.enablePrompts !== 'undefined') {
                        isEnabled = info.journaling.enablePrompts;
                    }
                }

                console.log('Journal Preferences:', { final: isEnabled, raw: info?.journaling });

                setPromptsEnabled(isEnabled);

                // If prompts disabled, force Free write mode
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
                const createdAt = firestoreData.createdAt?.toDate ? firestoreData.createdAt.toDate() : new Date();
                const today = new Date();
                const diffTime = today - createdAt;
                const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                // Cycle through 52 themes
                const index = daysSince % dailyThemes.daily_themes.length;
                setCurrentTheme(dailyThemes.daily_themes[index]);
            } catch (error) {
                console.error('Error fetching daily theme:', error);
                // Fallback to first theme
                setCurrentTheme(dailyThemes.daily_themes[0]);
            }
        };

        const fetchRecentEntries = async () => {
            try {
                const entries = await FirebaseService.getJournalEntries();
                // Take top 3 most recent
                setRecentEntries(entries.slice(0, 3));
            } catch (error) {
                console.error('Error fetching recent entries:', error);
            }
        };

        fetchPreferences();
        fetchDailyTheme();
        fetchRecentEntries();

        // Add listener for journal updates if needed, or just fetch on mount
        const unsubscribe = navigation.addListener('focus', () => {
            fetchRecentEntries();
        });

        return unsubscribe;
    }, [navigation]);

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

    const handleArchive = async () => {
        console.log('🗄️ handleArchive called - Starting archive process');
        try {
            if (!entryText.trim()) {
                Alert.alert('Empty Entry', 'Please write something before archiving.');
                return;
            }

            await FirebaseService.saveJournalEntry({
                mode: mode,
                themeTitle: mode === 'Guided' ? currentTheme?.title : null,
                themeDescription: mode === 'Guided' ? currentTheme?.description : null,
                content: entryText.trim(),
                isArchived: true
            });

            // Mark journal as complete for today (even for archived entries)
            await FirebaseService.markJournalComplete();

            Alert.alert('Archived', 'Journal entry has been archived.');
            navigation.goBack();
        } catch (error) {
            console.error('Error archiving journal entry:', error);
            Alert.alert('Error', 'Failed to archive journal entry. Please try again.');
        }
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Journal Entry</Text>
                        <TouchableOpacity style={styles.headerIcon}>
                            <View style={styles.bellContainer}>
                                <Ionicons name="notifications" size={24} color={colors.primary.darkSage} />
                                <View style={styles.notificationDot} />
                            </View>
                        </TouchableOpacity>
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
                                    <Text style={styles.entryTitle}>{currentTheme?.title ? `${currentTheme.title} Reflection` : 'Reflection'}</Text>
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
                                <TouchableOpacity style={styles.archiveButton} onPress={handleArchive}>
                                    <Text style={styles.archiveButtonText}>Archive</Text>
                                </TouchableOpacity>
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
                                    <View key={entry.id} style={styles.recentEntryCard}>
                                        <Text style={styles.recentEntryCategory}>
                                            {entry.themeTitle || entry.mode || 'Journal Entry'}
                                        </Text>
                                        <Text style={styles.recentEntryContent} numberOfLines={3}>
                                            {entry.content}
                                        </Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </GradientBackground>
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
    bellContainer: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        padding: 6,
        borderRadius: 20,
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 6,
        right: 8,
        width: 8,
        height: 8,
        backgroundColor: colors.accent.coral,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
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
        borderRadius: 20,
        marginBottom: 16,
    },
    categoryTagText: {
        fontSize: 12,
        color: '#7A9181',
        fontWeight: '600',
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
    },
    entryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.black,
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: 'rgba(122, 145, 129, 0.08)', // Muted green-grey tint
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
    archiveButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    archiveButtonText: {
        fontSize: 15,
        color: colors.text.grey,
        fontWeight: '500',
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
        fontSize: 17,
        fontWeight: '700',
        color: colors.text.black,
        marginBottom: 16,
        marginTop: 8,
    },
    recentEntryCard: {
        backgroundColor: 'rgba(243, 241, 232, 0.7)', // Creamy tinted background
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    recentEntryCategory: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(122, 145, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 11,
        color: '#7A9181',
        fontWeight: '600',
        marginBottom: 12,
    },
    recentEntryContent: {
        fontSize: 14,
        color: '#444444',
        lineHeight: 20,
    },
});

export default AddJournalEntryScreen;
