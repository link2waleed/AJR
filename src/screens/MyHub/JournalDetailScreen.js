import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeGradient from '../../components/HomeGradient';
import { colors, spacing, borderRadius, typography } from '../../theme';


const JournalDetailScreen = ({ navigation, route }) => {
    const { entry } = route.params || {};

    const handleBack = () => navigation.goBack();

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
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
                        <View style={styles.entryCard}>
                            <Text style={styles.dateText}>{formatDate(entry?.createdAt)}</Text>

                            {entry?.mode === 'Guided' && entry?.themeTitle && (
                                <View style={styles.categoryTag}>
                                    <Text style={styles.categoryTagText}>{entry.themeTitle}</Text>
                                </View>
                            )}

                            {entry?.themeDescription && (
                                <View style={styles.promptBox}>
                                    <Text style={styles.promptText}>{entry.themeDescription}</Text>
                                </View>
                            )}
                            {entry?.mode !== 'Guided' && (
                                <Text style={styles.entryTitle}>Free Write</Text>
                            )}
                            <Text style={styles.contentText}>{entry?.content}</Text>
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </HomeGradient>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    headerIcon: { padding: spacing.xs },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },

    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 40, paddingTop: 10 },
    entryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    dateText: {
        fontSize: 14,
        color: colors.text.grey,
        fontWeight: '600',
        marginBottom: 16,
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
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
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
    },
    entryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.black,
        marginBottom: 12,
    },
    contentText: {
        fontSize: 15,
        color: colors.text.black,
        lineHeight: 24,
    },
});

export default JournalDetailScreen;
