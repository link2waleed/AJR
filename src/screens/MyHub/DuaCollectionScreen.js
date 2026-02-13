import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, borderRadius, typography } from '../../theme';
import FirebaseService from '../../services/FirebaseService';

const DuaCollectionScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [savedDuas, setSavedDuas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleBack = () => navigation.goBack();

    // Fetch saved duas on mount
    useEffect(() => {
        loadSavedDuas();
    }, []);

    const loadSavedDuas = async () => {
        try {
            setIsLoading(true);
            const duas = await FirebaseService.getSavedDuas();
            setSavedDuas(duas);
        } catch (error) {
            console.error('Error loading duas:', error);
            Alert.alert('Error', 'Failed to load saved duas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveDua = async (duaId) => {
        try {
            await FirebaseService.removeFavoriteDua(duaId);
            setSavedDuas(prev => prev.filter(d => d.id !== duaId));
        } catch (error) {
            console.error('Error removing dua:', error);
            Alert.alert('Error', 'Failed to remove dua');
        }
    };

    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Extract unique categories
    const categories = ['All', ...new Set(savedDuas.map(d => d.category || 'Uncategorized'))];

    // ... (existing loadSavedDuas)

    const filteredDuas = savedDuas.filter(dua => {
        const matchesSearch = (dua.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dua.english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dua.arabic?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'All' || (dua.category || 'Uncategorized') === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Group duas by category
    const groupedDuas = filteredDuas.reduce((acc, dua) => {
        const category = dua.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(dua);
        return acc;
    }, {});

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Dua Collection</Text>
                        <TouchableOpacity style={styles.headerIcon}>
                            <View style={styles.bellContainer}>
                                <Ionicons name="notifications" size={24} color={colors.primary.darkSage} />
                                <View style={styles.notificationDot} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar with Filter */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search-outline" size={20} color={colors.text.grey} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search..."
                                placeholderTextColor={colors.text.grey}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedCategory !== 'All' && styles.filterButtonActive]}
                            onPress={() => setIsFilterVisible(!isFilterVisible)}
                        >
                            <Ionicons name="options-outline" size={24} color={selectedCategory !== 'All' ? colors.primary.darkSage : colors.text.black} />
                        </TouchableOpacity>
                    </View>

                    {/* Filter Options (Collapsible View) */}
                    {isFilterVisible && (
                        <View style={styles.filterOptionsContainer}>
                            <Text style={styles.filterTitle}>Filter by Category:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollView}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.filterChip,
                                            selectedCategory === cat && styles.filterChipActive
                                        ]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <Text style={[
                                            styles.filterChipText,
                                            selectedCategory === cat && styles.filterChipTextActive
                                        ]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Duas List */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {isLoading ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="large" color={colors.primary.sage} />
                                <Text style={styles.loadingText}>Loading your duas...</Text>
                            </View>
                        ) : filteredDuas.length === 0 ? (
                            <View style={styles.centerContainer}>
                                <Ionicons name="heart-outline" size={64} color={colors.text.grey} />
                                <Text style={styles.emptyTitle}>No Duas Found</Text>
                                <Text style={styles.emptySubtitle}>
                                    {searchQuery ? 'No duas match your search' : 'Save duas from the Dashboard to see them here'}
                                </Text>
                            </View>
                        ) : (
                            Object.keys(groupedDuas).map((category) => (
                                <View key={category} style={styles.categorySection}>
                                    {(category !== 'Dua of the Day' || selectedCategory !== 'All') && (
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.categoryTitle}>{category}</Text>
                                        </View>
                                    )}
                                    {groupedDuas[category].map((dua) => (
                                        <View key={dua.id} style={styles.duaCard}>
                                            <View style={[styles.cardHeader, { justifyContent: 'flex-end' }]}>
                                                <TouchableOpacity onPress={() => handleRemoveDua(dua.id)}>
                                                    <Ionicons name="heart" size={20} color="#4CAF50" />
                                                </TouchableOpacity>
                                            </View>

                                            <Text style={styles.arabicText}>{dua.arabic?.replace(/<[^>]*>/g, '')}</Text>
                                            <Text style={styles.translationText}>{dua.english?.replace(/<[^>]*>/g, '')}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        gap: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text.black,
    },
    filterButton: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        padding: 10,
        borderRadius: borderRadius.lg,
    },
    filterButtonActive: {
        backgroundColor: colors.primary.sage + '40', // light highlight
        borderWidth: 1,
        borderColor: colors.primary.darkSage,
    },
    filterOptionsContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    filterTitle: {
        fontSize: 12,
        color: colors.text.grey,
        marginBottom: 8,
        marginLeft: 4,
    },
    filterScrollView: {
        paddingRight: spacing.lg,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    filterChipActive: {
        backgroundColor: colors.primary.darkSage,
        borderColor: colors.primary.darkSage,
    },
    filterChipText: {
        fontSize: 12,
        color: colors.text.black,
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 100,
    },
    categorySection: {
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text.black,
    },
    duaCard: {
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    arabicText: {
        fontSize: 22,
        textAlign: 'center',
        color: colors.text.black,
        fontWeight: '600',
        lineHeight: 38,
        marginVertical: 10,
    },
    transliterationBox: {
        backgroundColor: 'rgba(230, 235, 230, 0.6)', // Light greenish-grey bubble
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
    },
    transliterationText: {
        fontSize: 12,
        color: colors.text.grey,
        lineHeight: 18,
        textAlign: 'left',
    },
    translationText: {
        fontSize: 13,
        color: colors.text.black,
        lineHeight: 18,
        textAlign: 'left',
        opacity: 0.8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: spacing.lg,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: 16,
        color: colors.text.grey,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.black,
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        fontSize: 14,
        color: colors.text.grey,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
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

export default DuaCollectionScreen;
