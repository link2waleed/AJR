import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, ActivityIndicator, FlatList, Modal, ToastAndroid, Platform, TextInput } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { SURAHS } from '../../data/surahData';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useTafsir } from '../../hooks/useTafsir';
import { useSurahInfo } from '../../hooks/useSurahInfo';
import { useReadingTimer } from '../../hooks/useReadingTimer';
import FirebaseService from '../../services/FirebaseService';

const SurahDetailScreen = ({ navigation, route }) => {
    const { surah, juz, initialTab } = route.params;
    const [activeTab, setActiveTab] = useState(initialTab || 'Translation');

    // Determine context (Surah vs Juz)
    const isJuzMode = !!juz;
    const targetId = isJuzMode ? juz.number : surah.number;

    // Names for Surah mode (safely handled)
    const surahEnglishName = !isJuzMode && surah ? (surah.englishName || surah.name) : '';
    const surahArabicName = !isJuzMode ? (surahDetails?.name || (surah?.arabic || (surah?.englishName ? surah?.name : ''))) : '';

    // Header Titles
    const headerTitle = isJuzMode
        ? `Juz ${juz.number}`
        : surahEnglishName;

    // Subtitles/Arabic for header (Juz range or Surah Arabic name)
    const headerSubtitle = isJuzMode
        ? juz.range
        : surahArabicName;

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const [surahDetails, setSurahDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFullSurah, setShowFullSurah] = useState(false);

    // Pagination for Translation tab
    const [displayedAyahsCount, setDisplayedAyahsCount] = useState(10);
    const [displayedReadingAyahsCount, setDisplayedReadingAyahsCount] = useState(10);

    // Ref for ScrollView to enable scrolling to top
    const scrollViewRef = useRef(null);

    // Use audio hook
    const { playAudio, playSequential, pauseSequential, resumeSequential, stopSequential, currentlyPlaying, isPlaying, isLoading, isSequentialMode, cleanup } = useAudioPlayer();

    // Use tafsir hook
    const { tafsirModalVisible, tafsirContent, tafsirLoading, fetchTafsir, closeTafsir } = useTafsir();

    // Use surah info hook
    const { surahInfoModalVisible, surahInfoContent, surahInfoLoading, fetchSurahInfo, closeSurahInfo } = useSurahInfo();

    // Use global reading timer hook - tracks total Quran reading time
    const { elapsedTime, isRunning, isLoaded, startTimer, pauseTimer, formatTime } = useReadingTimer();

    // Reflection Modal State
    const [reflectionModalVisible, setReflectionModalVisible] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('Gratitude');
    const [reflectionText, setReflectionText] = useState('');

    const openReflectionModal = () => {
        setReflectionModalVisible(true);
    };

    const closeReflectionModal = () => {
        setReflectionModalVisible(false);
        setReflectionText('');
        setSelectedTheme('Gratitude');
    };

    const saveReflection = async () => {
        if (!reflectionText.trim()) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please write your reflection', ToastAndroid.SHORT);
            } else {
                Alert.alert('Empty Reflection', 'Please write your reflection before saving.');
            }
            return;
        }

        try {
            // Create description based on context (Surah or Juz)
            const description = isJuzMode
                ? `Reflection after reading Juz ${juz.number} (${juz.range})`
                : `Reflection after reading Surah ${surahEnglishName} (${surahArabicName})`;

            // Save as journal entry
            await FirebaseService.saveJournalEntry({
                mode: 'Quran Reflection',
                themeTitle: selectedTheme,
                themeDescription: description,
                content: reflectionText.trim()
            });

            if (Platform.OS === 'android') {
                ToastAndroid.show('Reflection saved to journal ✓', ToastAndroid.LONG);
            } else {
                Alert.alert('Success', 'Reflection saved to journal');
            }

            closeReflectionModal();
        } catch (error) {
            console.error('Error saving reflection:', error);
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to save reflection', ToastAndroid.SHORT);
            } else {
                Alert.alert('Error', 'Failed to save reflection. Please try again.');
            }
        }
    };

    const handleBack = async () => {
        // Pause timer when going back
        await pauseTimer();

        // Forcefully stop and cleanup audio when going back
        try {
            if (isSequentialMode || isPlaying) {
                await stopSequential();
                await cleanup();
            }
        } catch (error) {
            console.log('Error stopping audio:', error);
        }
        // Small delay to ensure audio is fully stopped
        setTimeout(() => {
            navigation.goBack();
        }, 100);
    };

    const handleTabSwitch = async (tab) => {
        if (activeTab === tab) return;

        // Stop audio when switching tabs
        if (isPlaying || isSequentialMode) {
            try {
                await stopSequential();
            } catch (error) {
                console.log('Error stopping audio on tab switch:', error);
            }
        }

        setActiveTab(tab);
    };

    // Copy ayah to clipboard
    const copyToClipboard = async (arabic, translation, ayahNumber, surahMeta) => {
        const reference = surahMeta
            ? `(${surahMeta.englishName} ${surahMeta.number}:${ayahNumber})`
            : `(${headerTitle} ${targetId}:${ayahNumber})`;
        const textToCopy = `${arabic}\n\n${translation}\n\n${reference}`;

        try {
            await Clipboard.setStringAsync(textToCopy);

            // Show toast notification
            if (Platform.OS === 'android') {
                ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
            } else {
                Alert.alert('Copied', 'Ayah copied to clipboard');
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            Alert.alert('Error', 'Failed to copy to clipboard');
        }
    };

    const renderFormattedText = (text) => {
        if (!text) return null;

        const parts = text.split(/(\n[A-Z][^:\n]+:)/g);

        return (
            <Text style={styles.surahInfoDescriptionText}>
                {parts.map((part, index) => {
                    // Check if this part is a heading (starts with newline, capital letter, and ends with colon)
                    if (/^\n[A-Z][^:\n]+:$/.test(part)) {
                        return (
                            <Text key={index} style={{ fontWeight: 'normal' }}>
                                {part}
                            </Text>
                        );
                    }
                    return <Text key={index}>{part}</Text>;
                })}
            </Text>
        );
    };

    // Helper function to render Tafsir text with spacing
    const renderTafsirText = (text) => {
        if (!text) return null;
        // Split text by newlines to create paragraphs
        return text.split(/\n+/).map((paragraph, index) => {
            if (!paragraph.trim()) return null;
            return (
                <Text key={index} style={[styles.tafsirText, { marginBottom: 15 }]}>
                    {paragraph.trim()}
                </Text>
            );
        });
    };

    const saveLastRead = async () => {
        try {
            const lastReadData = {
                type: isJuzMode ? 'Juz' : 'Surah',
                number: targetId,
                name: isJuzMode ? `Juz ${juz.number}` : surahEnglishName,
                subtitle: isJuzMode ? juz.range : surahArabicName,
                data: isJuzMode ? juz : surah,
                timestamp: new Date().getTime()
            };
            const key = isJuzMode ? 'lastReadJuz' : 'lastReadSurah';
            await AsyncStorage.setItem(key, JSON.stringify(lastReadData));
        } catch (error) {
            console.error('Error saving last read:', error);
        }
    };

    React.useEffect(() => {
        fetchData();
        saveLastRead();

        // Cleanup audio and pause timer on unmount
        return () => {
            cleanup();
            pauseTimer();
        };
    }, [targetId]);

    // Start timer only after saved time is loaded
    React.useEffect(() => {
        if (isLoaded) {
            console.log('✅ Timer data loaded, starting timer...');
            startTimer();
        }
    }, [isLoaded]);

    // Add navigation listener to stop audio and pause timer before going back
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
            // Pause timer when navigating away
            await pauseTimer();

            // Stop audio immediately when user tries to go back
            if (isSequentialMode || isPlaying) {
                // Prevent default navigation
                e.preventDefault();

                try {
                    await stopSequential();
                    await cleanup();
                } catch (error) {
                    console.log('Error stopping audio on back:', error);
                }

                // Now navigate back after audio is stopped
                navigation.dispatch(e.data.action);
            }
        });

        return unsubscribe;
    }, [navigation, isSequentialMode, isPlaying]);

    // Stop audio when switching from Reading to Translation tab
    React.useEffect(() => {
        const stopAudioOnTabSwitch = async () => {
            if (activeTab === 'Translation') {
                // Stop audio immediately if it's playing when switching to Translation tab
                if (isSequentialMode || isPlaying) {
                    await stopSequential();
                    if (Platform.OS === 'android') {
                        ToastAndroid.show('Audio stopped', ToastAndroid.SHORT);
                    }
                }
            }
        };

        stopAudioOnTabSwitch();
    }, [activeTab]);

    // Helper to clean Arabic text of pause marks/annotations that might render as dots
    const cleanArabicText = (text) => {
        if (!text) return text;
        return text.replace(/[\u06D6-\u06ED]/g, '');
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            if (isJuzMode) {
                // Fetch Juz Data
                const [arRes, enRes] = await Promise.all([
                    fetch(`https://api.alquran.cloud/v1/juz/${targetId}/ar.alafasy`),
                    fetch(`https://api.alquran.cloud/v1/juz/${targetId}/en.asad`)
                ]);

                const arData = await arRes.json();
                const enData = await enRes.json();

                if (arData.code === 200 && enData.code === 200) {
                    const combinedAyahs = arData.data.ayahs.map((ayah, index) => ({
                        ...ayah,
                        // Clean Arabic text
                        text: cleanArabicText(ayah.text),
                        translation: enData.data.ayahs[index].text
                    }));

                    setSurahDetails({
                        ...arData.data,
                        ayahs: combinedAyahs,
                    });
                }
            } else {
                const [arRes, enRes, quranComRes] = await Promise.all([
                    fetch(`https://api.alquran.cloud/v1/surah/${targetId}/ar.alafasy`),
                    fetch(`https://api.alquran.cloud/v1/surah/${targetId}/en.asad`),
                    fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${targetId}`)
                ]);

                const arData = await arRes.json();
                const enData = await enRes.json();
                const quranComData = await quranComRes.json();

                if (arData.code === 200 && enData.code === 200 && quranComData.verses) {
                    const combinedAyahs = arData.data.ayahs.map((ayah, index) => ({
                        ...ayah,
                        // Use text from Quran.com if available, but CLEAN it
                        text: cleanArabicText(quranComData.verses[index] ? quranComData.verses[index].text_uthmani : ayah.text),
                        translation: enData.data.ayahs[index].text,
                        surah: surah
                    }));
                    setSurahDetails({
                        ...arData.data,
                        ayahs: combinedAyahs
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };



    const goToNext = () => {
        if (isJuzMode) {
            if (targetId < 30) {
                const nextJuz = { number: parseInt(targetId) + 1, id: (parseInt(targetId) + 1).toString() };
                navigation.replace('SurahDetail', { juz: nextJuz, initialTab: activeTab });
            } else {
                Alert.alert("End of Quran", "This is the last Juz.");
            }
        } else {
            if (targetId < 114) {
                const nextSurah = SURAHS.find(s => s.number === targetId + 1);
                if (nextSurah) {
                    navigation.replace('SurahDetail', { surah: nextSurah, initialTab: activeTab });
                }
            } else {
                Alert.alert("End of Quran", "This is the last Surah.");
            }
        }
    };

    const goToBeginning = () => {
        // Scroll to top of the page
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };



    const handleContinueReading = () => {
        // Use requestAnimationFrame for instant UI response
        requestAnimationFrame(() => {
            setShowFullSurah(true);
        });
    };

    // Memoized component for Reading mode text to prevent re-renders
    const ReadingText = React.memo(({ ayahs, fontSize }) => {

        return (
            <Text style={[styles.arabicReadingText, { fontSize: fontSize + 4 }]}>
                {ayahs.map((ayah, index, array) => {
                    const isNewSurah = index === 0 || (ayah.surah && array[index - 1].surah && ayah.surah.number !== array[index - 1].surah.number);

                    return (
                        <React.Fragment key={`${ayah.number}-${index}`}>
                            {isNewSurah && isJuzMode && (
                                <Text style={{ color: colors.primary.darkSage, fontSize: fontSize + 4, fontWeight: 'bold' }}>
                                    {index > 0 ? "\n" : ""}{ayah.surah.name}{"\n"}
                                </Text>
                            )}
                            {ayah.text}
                            <View style={styles.ayahMarker}>
                                <Text style={styles.markerText}>{ayah.numberInSurah}</Text>
                            </View>
                            {index < array.length - 1 ? '   ' : ''}
                        </React.Fragment>
                    );
                })}
            </Text>
        );
    });

    const AyahCard = React.memo(({ number, arabic, translation, audio, surahMeta }) => {
        const isThisPlaying = currentlyPlaying === number && isPlaying;

        return (
            <View style={styles.ayahCard}>

                <View style={styles.ayahContent}>
                    {/* Left Action Sidebar */}
                    <View style={styles.actionSidebar}>
                        <Text style={styles.ayahNumber}>{surahMeta ? surahMeta.number : targetId}:{number}</Text>
                        <TouchableOpacity
                            style={styles.actionIcon}
                            onPress={() => copyToClipboard(arabic, translation, number, surahMeta)}
                        >
                            <Ionicons name="copy-outline" size={18} color={colors.text.grey} />
                        </TouchableOpacity>
                        {/* <TouchableOpacity style={styles.actionIcon}><Ionicons name="create-outline" size={18} color={colors.text.grey} /></TouchableOpacity> */}
                        <TouchableOpacity
                            style={styles.actionIcon}
                            onPress={() => {
                                // Stop sequential mode if active
                                if (isSequentialMode) {
                                    stopSequential();
                                }
                                // Play only this ayah
                                playAudio(audio, number);
                            }}
                        >
                            <Ionicons
                                name={isThisPlaying ? "pause" : "play-outline"}
                                size={18}
                                color={isThisPlaying ? colors.primary.darkSage : colors.text.grey}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionIcon} onPress={() => {
                            const sNum = surahMeta ? surahMeta.number : targetId;
                            fetchTafsir(sNum, number);
                        }}>
                            <Ionicons name="book-outline" size={18} color={colors.text.grey} />
                        </TouchableOpacity>
                        {/* <TouchableOpacity style={styles.actionIcon}>
                            <Ionicons name="chatbubble-outline" size={18} color={colors.text.grey} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionIcon}><Ionicons name="ellipsis-horizontal" size={18} color={colors.text.grey} /></TouchableOpacity> */}
                    </View>

                    {/* Main Content Area */}
                    <View style={styles.mainContent}>
                        {/* Wrapper for Surah Name if in Juz Mode */}
                        {isJuzMode && surahMeta && (
                            <View style={{ marginBottom: 4 }}>
                                <Text style={{ fontSize: 10, color: colors.primary.darkSage, fontWeight: 'bold' }}>
                                    {surahMeta.englishName} ({surahMeta.name})
                                </Text>
                            </View>
                        )}

                        {/* Top Info Bar */}
                        <View style={styles.infoBar}>
                            <View style={styles.translationInfo}>
                                <Text style={styles.translationBy}>Translation by</Text>
                                <Text style={styles.translatorName}>Mishary Alafasy,</Text>
                                <Text style={styles.translatorName}>The Clear Quran</Text>
                            </View>
                            <View style={styles.rightActions}>
                                <TouchableOpacity style={styles.infoRow} onPress={() => {
                                    const sNum = surahMeta ? surahMeta.number : targetId;
                                    fetchSurahInfo(sNum);
                                }}>
                                    <Ionicons name="information-circle" size={20} color={colors.text.black} />
                                    <Text style={styles.infoText}>Surah Info</Text>
                                </TouchableOpacity>
                                <View style={styles.infoRow}>
                                    <TouchableOpacity style={styles.changeButton}>
                                        <Text style={styles.changeLink}>(Change)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.playAudioRow}
                                        onPress={() => {
                                            // Stop sequential mode if active
                                            if (isSequentialMode) {
                                                stopSequential();
                                            }
                                            // Play this specific ayah
                                            playAudio(audio, number);
                                        }}
                                    >
                                        <Ionicons
                                            name={currentlyPlaying === number && isPlaying ? "pause-circle" : "play-circle"}
                                            size={20}
                                            color={currentlyPlaying === number && isPlaying ? colors.primary.darkSage : colors.text.grey}
                                        />
                                        <Text style={styles.infoText}>Play Audio</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Arabic & Translation */}
                        <View style={styles.textsContainer}>
                            <Text style={[styles.arabicText, { fontSize: fontSize + 8 }]}>{arabic}</Text>
                            <Text style={[styles.translationText, { fontSize: fontSize }]}>{translation}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    });

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={styles.headerTitle}>{headerTitle}</Text>
                        </View>
                        <TouchableOpacity style={styles.headerIcon}>
                            <View style={styles.bellContainer}>
                                <Ionicons name="notifications" size={24} color={colors.primary.darkSage} />
                                <View style={styles.notificationDot} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Settings Bar */}
                    <View style={styles.settingsBar}>
                        <View style={styles.fontSizeControls}>
                            <View style={styles.fontSizeIconContainer}>
                                <MaterialIcons name="format-size" size={20} color={colors.primary.darkSage} />
                            </View>
                            <Text style={styles.settingsLabel}>Font Size</Text>
                            <View style={styles.stepperContainer}>
                                <TouchableOpacity onPress={() => setFontSize(f => Math.max(12, f - 1))} style={styles.stepperBtn}>
                                    <Text style={styles.stepperText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.currentFontSize}>A</Text>
                                <TouchableOpacity onPress={() => setFontSize(f => Math.min(30, f + 1))} style={styles.stepperBtn}>
                                    <Text style={styles.stepperText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.themeToggle}>
                            <Ionicons name="sunny-outline" size={20} color={colors.text.grey} />
                            <Switch
                                value={isDarkMode}
                                onValueChange={setIsDarkMode}
                                trackColor={{ false: '#D1D1D1', true: colors.primary.darkSage }}
                                thumbColor={isDarkMode ? '#FFFFFF' : '#F4F3F4'}
                            />
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'Translation' && styles.activeTab]}
                            onPress={() => handleTabSwitch('Translation')}
                        >
                            <Text style={[styles.tabText, activeTab === 'Translation' && styles.activeTabText]}>Translation</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'Reading' && styles.activeTab]}
                            onPress={() => handleTabSwitch('Reading')}
                        >
                            <Text style={[styles.tabText, activeTab === 'Reading' && styles.activeTabText]}>Reading</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Reading Timer Display */}
                    <View style={styles.timerContainer}>
                        <Ionicons name="time-outline" size={16} color={colors.primary.darkSage} />
                        <Text style={styles.timerText}>
                            Reading Time: {formatTime(elapsedTime)}
                        </Text>
                        {isRunning && (
                            <View style={styles.timerDot} />
                        )}
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary.darkSage} />
                            <Text style={styles.loadingText}>Fetching Ayahs...</Text>
                        </View>
                    ) : surahDetails ? (
                        activeTab === 'Translation' ? (
                            <FlatList
                                ref={scrollViewRef}
                                data={surahDetails.ayahs.slice(0, displayedAyahsCount)}
                                keyExtractor={(item) => item.number.toString()}
                                renderItem={({ item }) => (
                                    <AyahCard
                                        number={item.numberInSurah}
                                        arabic={item.text}
                                        translation={item.translation}
                                        audio={item.audio}
                                        surahMeta={item.surah}
                                    />
                                )}
                                ListHeaderComponent={
                                    <Text style={styles.surahTitleText}>
                                        {headerTitle} {headerSubtitle ? `- ${headerSubtitle}` : ''}
                                    </Text>
                                }
                                ListFooterComponent={
                                    <>
                                        {/* Load More Button */}
                                        {displayedAyahsCount < surahDetails.ayahs.length && (
                                            <TouchableOpacity
                                                style={styles.continueReadingMainBtn}
                                                onPress={() => setDisplayedAyahsCount(prev => Math.min(prev + 10, surahDetails.ayahs.length))}
                                            >
                                                <Text style={styles.continueReadingMainBtnText}>Load More Ayahs</Text>
                                                <Ionicons name="arrow-down" size={20} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        )}

                                        {/* Complete Reading Button - shown when all ayahs are loaded */}
                                        {displayedAyahsCount >= surahDetails.ayahs.length && (
                                            <TouchableOpacity
                                                style={styles.continueReadingMainBtn}
                                                onPress={openReflectionModal}
                                            >
                                                <Text style={styles.continueReadingMainBtnText}>Complete Reading</Text>
                                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        )}
                                    </>
                                }
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                                initialNumToRender={10}
                                maxToRenderPerBatch={10}
                                windowSize={5}
                                removeClippedSubviews={true}
                                onEndReached={() => {
                                    if (displayedAyahsCount < surahDetails.ayahs.length) {
                                        setDisplayedAyahsCount(prev => Math.min(prev + 10, surahDetails.ayahs.length));
                                    }
                                }}
                                onEndReachedThreshold={0.5}
                            />
                        ) : (
                            <ScrollView
                                ref={scrollViewRef}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContent}
                                onScroll={({ nativeEvent }) => {
                                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                                    const paddingToBottom = 300;
                                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

                                    if (isCloseToBottom && displayedReadingAyahsCount < (surahDetails?.ayahs?.length || 0)) {
                                        setDisplayedReadingAyahsCount(prev => {
                                            const newCount = Math.min(prev + 10, surahDetails.ayahs.length);
                                            console.log(`Reading Tab - Loading ayahs: ${prev} -> ${newCount} of ${surahDetails.ayahs.length}`);
                                            return newCount;
                                        });
                                    }
                                }}
                                scrollEventThrottle={200}
                            >
                                {/* Surah Title */}
                                <Text style={styles.surahTitleText}>
                                    {headerTitle} {headerSubtitle ? `- ${headerSubtitle}` : ''}
                                </Text>
                                <View>
                                    {/* Reading Mode UI */}
                                    <View style={styles.readingSubHeader}>
                                        {!isJuzMode && (
                                            <TouchableOpacity style={styles.readingInfoRow} onPress={() => fetchSurahInfo(targetId)}>
                                                <Ionicons name="information-circle" size={20} color={colors.text.black} />
                                                <Text style={styles.readingInfoText}>Surah Info</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={styles.readingInfoRow}
                                            onPress={() => {
                                                if (isSequentialMode) {
                                                    // If in sequential mode
                                                    if (isPlaying) {
                                                        // Pause the current playback
                                                        pauseSequential();
                                                    } else {
                                                        // Resume the paused playback
                                                        resumeSequential();
                                                    }
                                                } else {
                                                    // Start sequential playback from displayed ayahs
                                                    const ayahsToPlay = surahDetails.ayahs.slice(0, displayedReadingAyahsCount);
                                                    playSequential(ayahsToPlay, 0);
                                                }
                                            }}
                                        >
                                            <Ionicons
                                                name={isPlaying ? "pause-circle" : "play-circle"}
                                                size={20}
                                                color={isPlaying ? colors.primary.darkSage : colors.text.grey}
                                            />
                                            <Text style={styles.readingInfoText}>Play Audio</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.readingCard}>
                                        <View style={styles.arabicReadingContainer}>
                                            <ReadingText
                                                ayahs={surahDetails.ayahs.slice(0, displayedReadingAyahsCount)}
                                                fontSize={fontSize}
                                            />
                                        </View>
                                    </View>

                                    {/* Show navigation buttons only when all ayahs are loaded */}
                                    {displayedReadingAyahsCount >= surahDetails.ayahs.length && (
                                        <>
                                            {/* Navigation Buttons */}
                                            <View style={styles.readingNavButtons}>
                                                <TouchableOpacity style={styles.readingNavBtn} onPress={goToBeginning}>
                                                    <Text style={styles.readingNavBtnText}>
                                                        {isJuzMode ? 'Beginning of Juz' : 'Beginning of Surah'}
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.readingNavBtn}
                                                    onPress={goToNext}
                                                >
                                                    <Text style={styles.readingNavBtnText}>
                                                        {isJuzMode ? 'Next Juz ' : 'Next Surah '}
                                                    </Text>
                                                    <Ionicons name="chevron-forward" size={16} color={colors.text.grey} />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Complete Reading Button */}
                                            <View style={styles.readingActionBar}>
                                                <TouchableOpacity
                                                    style={styles.completeReadingBtn}
                                                    onPress={openReflectionModal}
                                                >
                                                    <Text style={styles.completeReadingBtnText}>Complete Reading</Text>
                                                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                                </TouchableOpacity>
                                                {/* <TouchableOpacity style={styles.readingFavoriteBtn}>
                                                    <Ionicons name="heart-outline" size={24} color={colors.text.black} />
                                                </TouchableOpacity> */}
                                            </View>
                                        </>
                                    )}
                                </View>
                            </ScrollView>
                        )
                    ) : (
                        <Text style={styles.errorText}>Failed to load Surah data.</Text>
                    )}

                    {/* Tafsir Modal */}
                    <Modal
                        visible={tafsirModalVisible}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={closeTafsir}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Tafsir Ibn Kathir</Text>
                                    <TouchableOpacity onPress={closeTafsir}>
                                        <Ionicons name="close" size={28} color={colors.text.black} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                                    {tafsirLoading ? (
                                        <View style={styles.modalLoadingContainer}>
                                            <ActivityIndicator size="large" color={colors.primary.darkSage} />
                                            <Text style={styles.loadingText}>Loading Tafsir...</Text>
                                        </View>
                                    ) : (
                                        renderTafsirText(tafsirContent)
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>

                    {/* Surah Info Modal */}
                    <Modal
                        visible={surahInfoModalVisible}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={closeSurahInfo}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <View style={[styles.modalHeader, { paddingTop: 10, paddingBottom: 10 }]}>
                                    <Text style={styles.modalTitle}>Information</Text>
                                    <TouchableOpacity onPress={closeSurahInfo}>
                                        <Ionicons name="close" size={28} color={colors.text.black} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                                    {surahInfoLoading ? (
                                        <View style={styles.modalLoadingContainer}>
                                            <ActivityIndicator size="large" color={colors.primary.darkSage} />
                                            <Text style={styles.loadingText}>Loading Surah Info...</Text>
                                        </View>
                                    ) : surahInfoContent ? (
                                        <View>
                                            {/* Surah Name Header */}
                                            <View style={[styles.surahInfoHeader, { paddingVertical: 10, marginBottom: 5, borderBottomWidth: 0 }]}>
                                                <Text style={[styles.surahInfoArabicName, { fontSize: 28, marginBottom: 4 }]}>
                                                    {surahInfoContent.name_arabic || surahInfoContent.name || (isJuzMode ? "" : surahArabicName)}
                                                </Text>
                                                <Text style={[styles.surahInfoEnglishName, { fontSize: 16 }]}>
                                                    {surahInfoContent.name_simple || surahInfoContent.englishName || (isJuzMode ? "" : surahEnglishName)}
                                                </Text>
                                            </View>

                                            {/* Metadata Cards */}
                                            <View style={styles.surahInfoMetaContainer}>
                                                <View style={styles.surahInfoMetaCard}>
                                                    <Ionicons name="location" size={20} color={colors.primary.darkSage} />
                                                    <Text style={styles.surahInfoMetaLabel}>Revelation</Text>
                                                    <Text style={styles.surahInfoMetaValue}>
                                                        {surahInfoContent.revelation_place ?
                                                            surahInfoContent.revelation_place.charAt(0).toUpperCase() +
                                                            surahInfoContent.revelation_place.slice(1)
                                                            : 'N/A'}
                                                    </Text>
                                                </View>
                                                <View style={styles.surahInfoMetaCard}>
                                                    <Ionicons name="book" size={20} color={colors.primary.darkSage} />
                                                    <Text style={styles.surahInfoMetaLabel}>Verses</Text>
                                                    <Text style={styles.surahInfoMetaValue}>{surahInfoContent?.verses_count || surah?.verses || 'N/A'}</Text>
                                                </View>
                                            </View>

                                            {/* Description Section */}
                                            {(surahInfoContent.short_text || surahInfoContent.text) && (
                                                <View style={styles.surahInfoDescriptionCard}>
                                                    <View style={styles.surahInfoDescriptionHeader}>
                                                        <Ionicons name="information-circle" size={18} color={colors.primary.darkSage} />
                                                        <Text style={styles.surahInfoDescriptionTitle}>About this Surah</Text>
                                                    </View>
                                                    {surahInfoContent.short_text && (
                                                        renderFormattedText(surahInfoContent.short_text)
                                                    )}
                                                    {surahInfoContent.text && (
                                                        renderFormattedText(surahInfoContent.text)
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <Text style={styles.tafsirText}>Surah information not available.</Text>
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>

                    {/* Reflection Modal */}
                    <Modal
                        visible={reflectionModalVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={closeReflectionModal}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.reflectionModalContainer}>
                                <TouchableOpacity
                                    style={styles.closeReflectionModalBtn}
                                    onPress={closeReflectionModal}
                                >
                                    <Ionicons name="close" size={24} color={colors.text.grey} />
                                </TouchableOpacity>
                                <View style={styles.reflectionDashedBorder}>
                                    <Text style={styles.reflectionCompleteTitle}>Reading Complete!</Text>
                                    <Text style={styles.reflectionSubtitle}>Reflect on your spiritual journey</Text>

                                    <View style={styles.reflectionSection}>
                                        <Text style={styles.reflectionSectionLabel}>Select a Theme</Text>
                                        <View style={styles.themeChipsContainer}>
                                            {['Gratitude', 'Patience', 'Wisdom'].map(theme => (
                                                <TouchableOpacity
                                                    key={theme}
                                                    style={[
                                                        styles.themeChip,
                                                        selectedTheme === theme && styles.themeChipActive
                                                    ]}
                                                    onPress={() => setSelectedTheme(theme)}
                                                >
                                                    <Text style={[
                                                        styles.themeChipText,
                                                        selectedTheme === theme && styles.themeChipTextActive
                                                    ]}>{theme}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={styles.reflectionSection}>
                                        <Text style={styles.reflectionSectionLabel}>Your Reflection</Text>
                                        <TextInput
                                            style={styles.reflectionInput}
                                            placeholder="Write Something...."
                                            placeholderTextColor={colors.text.grey}
                                            multiline
                                            value={reflectionText}
                                            onChangeText={setReflectionText}
                                            textAlignVertical="top"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={styles.saveReflectionBtn}
                                        onPress={saveReflection}
                                    >
                                        <Text style={styles.saveReflectionBtnText}>Save Reflection</Text>
                                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

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
    settingsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.6)',
        marginHorizontal: spacing.lg,
        marginVertical: spacing.md,
        padding: 10,
        borderRadius: borderRadius.lg,
    },
    fontSizeControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fontSizeIconContainer: {
        backgroundColor: 'rgba(122, 158, 127, 0.1)',
        padding: 6,
        borderRadius: 8,
    },
    settingsLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        color: colors.text.black,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 20,
        paddingHorizontal: 4,
    },
    stepperBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperText: {
        fontSize: 18,
        color: colors.text.black,
    },
    currentFontSize: {
        marginHorizontal: 12,
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text.black,
    },
    themeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 12,
        padding: 4,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
    },
    tabText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
        fontWeight: typography.fontWeight.medium,
    },
    activeTabText: {
        color: colors.text.black,
        fontWeight: 'bold',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(122, 158, 127, 0.1)',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(122, 158, 127, 0.2)',
    },
    timerText: {
        fontSize: 14,
        color: colors.text.black,
        fontWeight: '600',
        marginLeft: 8,
    },
    timerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary.darkSage,
        marginLeft: 8,
        opacity: 0.8,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
    },
    surahTitleText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: colors.text.black,
        marginTop: 5,
        marginBottom: 10,
    },
    ayahCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: borderRadius.lg,
        padding: 15,
        paddingBottom: 8,
        marginBottom: spacing.md,
    },
    ayahContent: {
        flexDirection: 'row',
    },
    actionSidebar: {
        width: 35,
        alignItems: 'center',
        borderRightWidth: 0, // In image it seems detached but vertically aligned
        marginRight: 10,
    },
    ayahNumber: {
        fontSize: 12,
        color: colors.text.grey,
        marginBottom: 10,
    },
    actionIcon: {
        marginVertical: 8,
        padding: 4,
        minWidth: 24,
        minHeight: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContent: {
        flex: 1,
    },
    infoBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    translationInfo: {
        flex: 1,
    },
    translationBy: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text.black,
    },
    translatorName: {
        fontSize: 11,
        color: colors.text.grey,
        marginVertical: 2,
    },
    changeLink: {
        fontSize: 11,
        color: colors.text.grey,
    },
    rightActions: {
        alignItems: 'flex-end',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    changeButton: {
        marginRight: 15,
    },
    playAudioRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 12,
        marginLeft: 5,
        color: colors.text.black,
        fontWeight: '500',
    },
    textsContainer: {
        alignItems: 'center',
    },
    arabicText: {
        textAlign: 'right',
        color: colors.text.black,
        fontFamily: 'Uthmanic',
        marginBottom: 15,
        width: '100%',
    },
    translationText: {
        textAlign: 'left',
        color: colors.text.black,
        lineHeight: 22,
        width: '100%',
    },
    readingSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    readingInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    readingInfoText: {
        fontSize: 14,
        marginLeft: 6,
        color: colors.text.black,
        fontWeight: '500',
    },
    readingCard: {
        backgroundColor: 'rgba(223, 228, 224, 0.6)',
        borderRadius: borderRadius.lg,
        padding: 20,
        marginBottom: 20,
    },
    arabicReadingContainer: {
        width: '100%',
    },
    arabicReadingText: {
        textAlign: 'center',
        color: colors.text.black,
        lineHeight: 45,
        fontFamily: 'Uthmanic',
    },
    ayahMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
        transform: [{ translateY: 4 }],
    },
    markerText: {
        fontSize: 10,
        color: colors.text.grey,
        fontWeight: 'bold',
    },
    readingNavButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    readingNavBtn: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    readingNavBtnText: {
        fontSize: 13,
        color: colors.text.grey,
        fontWeight: '600',
    },
    readingActionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    completeReadingBtn: {
        flex: 1,
        backgroundColor: '#7A9181', // Sage green from image
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 30,
        marginRight: 15,
    },
    completeReadingBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
    readingFavoriteBtn: {
        width: 55,
        height: 55,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: colors.text.grey,
        fontSize: 14,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 50,
        color: colors.accent.coral,
        fontSize: 16,
    },
    continueReadingMainBtn: {
        backgroundColor: '#7A9181',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 30,
        marginVertical: 10,
    },
    continueReadingMainBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: colors.primary.light,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.black,
    },
    modalContent: {
        padding: 20,
    },
    modalLoadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    tafsirText: {
        fontSize: 16,
        lineHeight: 26,
        color: colors.text.black,
        textAlign: 'left',
    },
    surahInfoHeader: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        marginBottom: 20,
    },
    surahInfoArabicName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text.black,
        marginBottom: 8,
    },
    surahInfoEnglishName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.grey,
    },
    surahInfoMetaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    surahInfoMetaCard: {
        flex: 1,
        backgroundColor: 'rgba(122, 158, 127, 0.1)',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(122, 158, 127, 0.2)',
    },
    surahInfoMetaLabel: {
        fontSize: 12,
        color: colors.text.grey,
        marginTop: 8,
        marginBottom: 4,
        fontWeight: 'normal',
    },
    surahInfoMetaValue: {
        fontSize: 16,
        fontWeight: 'normal',
        color: colors.primary.darkSage,
    },
    surahInfoDescriptionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    surahInfoDescriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    surahInfoDescriptionTitle: {
        fontSize: 16,
        fontWeight: 'normal',
        color: colors.text.black,
    },
    surahInfoDescriptionText: {
        fontSize: 14,
        lineHeight: 22,
        color: colors.text.black,
        marginBottom: 10,
        textAlign: 'justify',
    },
    reflectionModalContainer: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 5,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    reflectionDashedBorder: {
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
    },
    reflectionCompleteTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.black,
        marginBottom: 4,
    },
    reflectionSubtitle: {
        fontSize: 14,
        color: colors.text.grey,
        marginBottom: 20,
    },
    reflectionSection: {
        width: '100%',
        marginBottom: 20,
    },
    reflectionSectionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.black,
        marginBottom: 12,
    },
    themeChipsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    themeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    themeChipActive: {
        backgroundColor: '#7A9181',
        borderColor: '#7A9181',
    },
    themeChipText: {
        fontSize: 14,
        color: colors.text.grey,
    },
    themeChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    reflectionInput: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 15,
        height: 100,
        fontSize: 14,
        color: colors.text.black,
    },
    saveReflectionBtn: {
        backgroundColor: '#7A9181',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 30,
        width: '100%',
        gap: 8,
    },
    saveReflectionBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeReflectionModalBtn: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
    }
});

export default SurahDetailScreen;
