import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { SURAHS } from '../../data/surahData';
import { JUZS } from '../../data/juzData';

const QuranScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Surah');
    const [surahs, setSurahs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastReadSurah, setLastReadSurah] = useState(null);
    const [lastReadJuz, setLastReadJuz] = useState(null);
    const isFocused = useIsFocused();

    const handleBack = () => navigation.goBack();

    React.useEffect(() => {
        if (isFocused) {
            loadLastRead();
        }
    }, [isFocused]);

    const loadLastRead = async () => {
        try {
            const [surahData, juzData] = await Promise.all([
                AsyncStorage.getItem('lastReadSurah'),
                AsyncStorage.getItem('lastReadJuz'),
            ]);
            if (surahData) setLastReadSurah(JSON.parse(surahData));
            if (juzData) setLastReadJuz(JSON.parse(juzData));
        } catch (error) {
            console.error('Error loading last read:', error);
        }
    };

    const handleContinuePress = () => {
        const currentLastRead = activeTab === 'Surah' ? lastReadSurah : lastReadJuz;
        if (currentLastRead) {
            if (currentLastRead.type === 'Juz') {
                navigation.navigate('SurahDetail', { juz: currentLastRead.data });
            } else {
                navigation.navigate('SurahDetail', { surah: currentLastRead.data });
            }
        }
    };

    React.useEffect(() => {
        if (activeTab === 'Surah') {
            fetchSurahs();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchSurahs = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await response.json();
            if (data.code === 200) {
                setSurahs(data.data);
            }
        } catch (error) {
            console.error('Error fetching surahs:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        if (activeTab === 'Surah') {
            return (
                <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => navigation.navigate('SurahDetail', { surah: item })}
                >
                    <View style={styles.numberContainer}>
                        <Text style={styles.numberText}>{item.number}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                        <View style={styles.headerRow}>
                            <Text style={styles.nameText}>{item.englishName} - </Text>
                            <Text style={[styles.arabicText, { fontFamily: 'System' }]}>{item.name}</Text>
                        </View>
                        <Text style={styles.detailsText}>{item.englishNameTranslation} | {item.numberOfAyahs} Verses</Text>
                    </View>
                    {/* <TouchableOpacity style={styles.bookmarkButton}>
                        <Ionicons name="bookmark-outline" size={20} color={colors.text.grey} />
                    </TouchableOpacity> */}
                </TouchableOpacity>
            );
        } else {
            return (
                <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => navigation.navigate('SurahDetail', { juz: item })}
                >
                    <View style={styles.numberContainer}>
                        <Text style={styles.numberText}>{item.number}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                        <Text style={styles.juzRangeText}>{item.range}</Text>
                        <Text style={styles.detailsText}>{item.verses} Verses</Text>
                    </View>
                    {/* <TouchableOpacity style={styles.bookmarkButton}>
                        <Ionicons name="bookmark-outline" size={20} color={colors.text.grey} />
                    </TouchableOpacity> */}
                </TouchableOpacity>
            );
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
                        <Text style={styles.headerTitle}>Quran</Text>
                        <TouchableOpacity style={styles.headerIcon}>
                            <View style={styles.bellContainer}>
                                <Ionicons name="notifications" size={24} color={colors.primary.darkSage} />
                                <View style={styles.notificationDot} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={activeTab === 'Surah' ? surahs : JUZS}
                        keyExtractor={(item) => activeTab === 'Surah' ? item.number.toString() : item.id}
                        renderItem={renderItem}
                        refreshing={loading && activeTab === 'Surah'}
                        onRefresh={fetchSurahs}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.scrollContent}
                        ListHeaderComponent={
                            <>
                                {/* Continue Reading Section */}
                                {((activeTab === 'Surah' && lastReadSurah) || (activeTab === 'Juz' && lastReadJuz)) && (
                                    <View style={styles.continueSection}>
                                        <Text style={styles.sectionTitle}>Continue Reading</Text>
                                        <TouchableOpacity style={styles.continueCard} onPress={handleContinuePress}>
                                            <View style={styles.continueInfo}>
                                                <Text style={styles.continueSurah}>
                                                    {activeTab === 'Surah' ? lastReadSurah.name : lastReadJuz.name}
                                                </Text>
                                                <Text style={styles.continueAyah}>
                                                    {activeTab === 'Surah' ? 'Tap to continue' : lastReadJuz.subtitle}
                                                </Text>
                                            </View>
                                            <Ionicons name="arrow-forward" size={20} color={colors.text.black} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Tabs */}
                                <View style={styles.tabContainer}>
                                    <TouchableOpacity
                                        style={[styles.tab, activeTab === 'Surah' && styles.activeTab]}
                                        onPress={() => setActiveTab('Surah')}
                                    >
                                        <Text style={[styles.tabText, activeTab === 'Surah' && styles.activeTabText]}>Surah</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.tab, activeTab === 'Juz' && styles.activeTab]}
                                        onPress={() => setActiveTab('Juz')}
                                    >
                                        <Text style={[styles.tabText, activeTab === 'Juz' && styles.activeTabText]}>Juz</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        }
                    />

                </View>
            </SafeAreaView>
        </GradientBackground>
    );
};

const TabItem = ({ icon, label, active }) => (
    <TouchableOpacity style={styles.tabItem}>
        <Ionicons name={icon} size={24} color={active ? colors.primary.darkSage : colors.text.grey} />
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
);

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
        paddingBottom: 20,
    },
    continueSection: {
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.dark,
        marginBottom: spacing.sm,
    },
    continueCard: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    continueInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    continueSurah: {
        fontSize: 12,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    continueAyah: {
        fontSize: 11,
        color: colors.text.grey,
        marginTop: 2,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 12,
        padding: 4,
        marginBottom: spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#7A8A7A',
    },
    tabText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.black,
        fontWeight: typography.fontWeight.medium,
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    listItem: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    numberContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    numberText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    itemInfo: {
        flex: 1,
        marginRight: spacing.sm,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    juzRangeText: {
        fontSize: 12,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    arabicText: {
        fontSize: typography.fontSize.md,
        color: colors.text.black,
    },
    detailsText: {
        fontSize: 12,
        color: colors.text.grey,
        marginTop: 2,
    },
    bookmarkButton: {
        padding: 4,
    },
    bottomTab: {
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
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 10,
        color: colors.text.grey,
        marginTop: 2,
    },
    tabLabelActive: {
        color: colors.primary.darkSage,
        fontWeight: 'bold',
    },
});

export default QuranScreen;
