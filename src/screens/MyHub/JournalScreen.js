import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, borderRadius, typography } from '../../theme';
import FirebaseService from '../../services/FirebaseService';
import { useFocusEffect } from '@react-navigation/native';
import notificationImg from '../../../assets/images/notification-bing.png';


const JournalScreen = ({ navigation }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entriesThisWeek, setEntriesThisWeek] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);

    useFocusEffect(
        React.useCallback(() => {
            fetchEntries();
        }, [])
    );

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const fetchedEntries = await FirebaseService.getJournalEntries();
            // Filter out archived entries for display
            setEntries(fetchedEntries.filter(e => !e.isArchived));

            // Calculate basic stats
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thisWeekCount = fetchedEntries.filter(e => new Date(e.createdAt) > oneWeekAgo).length;
            setEntriesThisWeek(thisWeekCount);

            // Fetch and set streak
            const stats = await FirebaseService.getJournalStats();
            setCurrentStreak(stats.streak);

        } catch (error) {
            console.error('Error fetching journal entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return {
            month: date.toLocaleString('default', { month: 'short' }),
            day: date.getDate(),
            weekday: date.toLocaleString('default', { weekday: 'long' }),
        };
    };

    const handleDeleteEntry = (entryId) => {
        Alert.alert(
            "Delete Entry",
            "Are you sure you want to delete this journal entry?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await FirebaseService.deleteJournalEntry(entryId);
                            // Refresh list
                            fetchEntries();
                            Alert.alert("Deleted", "Entry has been deleted.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete entry.");
                        }
                    }
                }
            ]
        );
    };

    const handleBack = () => navigation.goBack();

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Journal</Text>
                        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications', { source: 'hub' })}>
                            <View style={styles.notificationBadge}>
                                <Image source={notificationImg} style={styles.notificationIcon} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Write Reflection Section */}
                        <Text style={styles.sectionTitle}>Write Reflection</Text>

                        {/* Stats Cards */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <View style={styles.statHeader}>
                                    <Ionicons name="calendar-outline" size={16} color={colors.text.grey} />
                                    <Text style={styles.statLabel}>Entries this week</Text>
                                </View>
                                <Text style={styles.statValue}>{entriesThisWeek}</Text>
                            </View>
                            <View style={styles.statCard}>
                                <View style={styles.statHeader}>
                                    <Ionicons name="flame-outline" size={16} color={colors.text.grey} />
                                    <Text style={styles.statLabel}>Current Streak</Text>
                                </View>
                                <Text style={styles.statValue}>{currentStreak}</Text>
                            </View>
                        </View>

                        {/* Add New Entry Button */}
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => navigation.navigate('AddJournalEntry')}
                        >
                            <Text style={styles.addButtonText}>Add New Entry</Text>
                        </TouchableOpacity>

                        {/* Recent Entries Section */}
                        <Text style={styles.sectionTitle}>Recent Entries</Text>

                        {/* Journal Entries */}
                        {/* Journal Entries */}
                        {loading ? (
                            <Text style={{ textAlign: 'center', marginTop: 20, color: colors.text.grey }}>Loading entries...</Text>
                        ) : entries.length === 0 ? (
                            <Text style={{ textAlign: 'center', marginTop: 20, color: colors.text.grey }}>No recent entries. Start journaling!</Text>
                        ) : (
                            entries.map((entry) => {
                                const dateObj = formatDate(entry.createdAt);
                                return (
                                    <View key={entry.id} style={styles.entryCard}>
                                        <View style={styles.entryHeader}>
                                            <View style={styles.dateContainer}>
                                                <Text style={styles.dateDay}>{dateObj.day}</Text>
                                                <View style={styles.dateRightColumn}>
                                                    <Text style={styles.dateMonth}>{dateObj.month}</Text>
                                                    <Text style={styles.dateWeekday}>{dateObj.weekday}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteEntry(entry.id)}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={colors.text.grey} />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.entryTitle}>
                                            {entry.themeTitle ? `${entry.themeTitle} Reflection` : (entry.mode === 'Guided' ? 'Guided Reflection' : 'Free Write')}
                                        </Text>
                                        <Text style={styles.entryContent} numberOfLines={3}>{entry.content}</Text>
                                    </View>
                                );
                            })
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
    notificationBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationIcon: {
        width: 20,
        height: 20,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text.black,
        marginBottom: 12,
        marginTop: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
        padding: 16,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        color: colors.text.grey,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text.black,
    },
    addButton: {
        backgroundColor: '#7A9181',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    entryCard: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateDay: {
        fontSize: 36,
        fontWeight: 'bold', // or use a serif font if available, e.g. fontFamily: 'serif'
        color: colors.text.black,
        marginRight: 8,
        fontFamily: 'serif', // Trying serif to match the image style
    },
    dateRightColumn: {
        justifyContent: 'center',
    },
    dateMonth: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.text.black, // Darker color for month as per image
        marginBottom: 0,
    },
    dateWeekday: {
        fontSize: 13,
        color: colors.text.grey,
    },
    deleteButton: {
        padding: 4,
    },
    entryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.black,
        marginBottom: 8,
    },
    entryContent: {
        fontSize: 13,
        color: colors.text.grey,
        lineHeight: 20,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 20,
        left: spacing.lg,
        right: spacing.lg,
        height: 70,
        backgroundColor: '#FFFFFF',
        borderRadius: 35,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    navItemActive: {
        // Active state
    },
    navLabel: {
        fontSize: 10,
        color: colors.text.grey,
        marginTop: 2,
    },
    navLabelActive: {
        color: colors.primary.darkSage,
        fontWeight: 'bold',
    },
});

export default JournalScreen;
