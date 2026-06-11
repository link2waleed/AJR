import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
    ImageBackground,
    ActivityIndicator,
    Alert,
    Modal,
    AppState,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import YoutubeIframe from 'react-native-youtube-iframe';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTheme, useSubscription, useUpdate } from '../context';
import auth from '@react-native-firebase/auth';
import FirebaseService from '../services/FirebaseService';
import PrayerTimeService from '../services/PrayerTimeService';
import StorageService from '../services/StorageService';
import WidgetService from '../services/WidgetService';
import NotificationService from '../services/NotificationService';
import hadithsData from '../data/UpdatedHadits.json';
import AJRRings from '../components/AJRRings';
import { Audio } from 'expo-av';
import whiteClock from '../../assets/images/white-clock.png';
import themeChange from '../../assets/images/theme-change.png';
import darkBackground from '../../assets/images/dark.png';
import SoftUpdateModal from '../update-screens/SoftUpdateModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

// AJR Rings Component is now imported from components

// Activity Legend Item - Now clickable for toggle
const ActivityLegendItem = ({ color, label, completed, activity, onToggle, disabled }) => (
    <TouchableOpacity
        style={styles.legendItem}
        onPress={() => onToggle && onToggle(activity)}
        activeOpacity={0.7}
        disabled={disabled}
    >
        <View style={[styles.legendCheck, { borderColor: color, backgroundColor: completed ? color : 'transparent' }]}>
            {completed && <Ionicons name="checkmark" size={12} color={'white'} />}
        </View>
        <Text style={[styles.legendLabel, !completed && styles.legendLabelInactive]}>{label}</Text>
    </TouchableOpacity>
);

// Daily Adhkar Item
const AdhkarItem = ({ title, subtitle, onPress, isLast }) => (
    <TouchableOpacity
        style={[styles.adhkarItem, !isLast && styles.adhkarItemBorder]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.adhkarPlayButton}>
            <Ionicons name="play" size={12} color="#FFFFFF" />
        </View>
        <View style={styles.adhkarContent}>
            <Text style={styles.adhkarTitle}>{title}</Text>
            <Text style={styles.adhkarSubtitle}>{subtitle}</Text>
        </View>
    </TouchableOpacity>
);

// YouTube Player Modal Component
const YouTubeModal = ({ visible, videoId, title, onClose }) => {
    const [playing, setPlaying] = useState(false);

    // Auto-play when modal opens, pause when closes
    useEffect(() => {
        if (visible) {
            setPlaying(true);
        } else {
            setPlaying(false);
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.ytModalOverlay}>
                <View style={styles.ytModalContainer}>
                    {/* Header */}
                    <View style={styles.ytModalHeader}>
                        <Text style={styles.ytModalTitle} numberOfLines={1}>{title}</Text>
                        <TouchableOpacity
                            onPress={() => { setPlaying(false); onClose(); }}
                            style={styles.ytCloseButton}
                        >
                            <Ionicons name="close" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* YouTube Player */}
                    <View style={styles.ytVideoWrapper}>
                        {visible && (
                            <YoutubeIframe
                                height={screenWidth * (9 / 16)}
                                width={screenWidth}
                                videoId={videoId}
                                play={playing}
                                onChangeState={(state) => {
                                    if (state === 'ended') setPlaying(false);
                                }}
                                webViewProps={{
                                    androidLayerType: 'hardware',
                                }}
                            />
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};


// Audio Player Modal Component
const AudioPlayerModal = ({ visible, title, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const soundRef = useRef(null);
    const playbackIntervalRef = useRef(null);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get audio URI based on title
    // const getAudioUri = () => {
    //     if (title === 'Morning Adhkar') {
    //         return require('../../src/data/morning-adkar.mp4');
    //     } else if (title === 'Evening Adhkar') {
    //         return require('../../src/data/evening-adkar.mp4');
    //     }
    //     return null;
    // };

    // Cleanup and unload audio
    const cleanupAudio = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }
        } catch (error) {
            console.log('Cleanup error:', error);
        }
        setCurrentTime(0);
        setIsPlaying(false);
        if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
        }
    };

    // Load audio when modal opens
    useEffect(() => {
        const loadAudio = async () => {
            try {
                // Clean up previous audio first
                await cleanupAudio();

                if (visible) {
                    const audioUri = getAudioUri();
                    if (audioUri) {
                        const { sound } = await Audio.Sound.createAsync(audioUri, {
                            shouldPlay: false,
                            isLooping: false,
                        });
                        soundRef.current = sound;

                        // Get duration
                        const status = await sound.getStatusAsync();
                        const dur = status.durationMillis ? Math.round(status.durationMillis / 1000) : 180;
                        setDuration(dur);
                        setCurrentTime(0);
                    }
                }
            } catch (error) {
                console.error('Error loading audio:', error);
                setDuration(180);
            }
        };

        loadAudio();

        return () => {
            cleanupAudio();
        };
    }, [visible, title]);

    // Update current time during playback
    useEffect(() => {
        if (isPlaying && soundRef.current) {
            playbackIntervalRef.current = setInterval(async () => {
                try {
                    const status = await soundRef.current.getStatusAsync();
                    if (!isSeeking && status.isLoaded) {
                        const currentMillis = status.positionMillis || 0;
                        const currentSecs = Math.round(currentMillis / 1000);
                        setCurrentTime(currentSecs);

                        // Check if playback finished
                        if (status.didJustFinish) {
                            setIsPlaying(false);
                            setCurrentTime(0);
                        }
                    }
                } catch (error) {
                    console.log('Error getting playback status:', error);
                }
            }, 100);
        } else {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
            }
        }

        return () => {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
            }
        };
    }, [isPlaying, isSeeking]);

    const handlePlayPause = async () => {
        try {
            if (soundRef.current) {
                if (isPlaying) {
                    await soundRef.current.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await soundRef.current.playAsync();
                    setIsPlaying(true);
                }
            }
        } catch (error) {
            console.error('Play/Pause error:', error);
            Alert.alert('Error', 'Failed to control audio playback');
        }
    };

    const handleSeek = async (value) => {
        if (soundRef.current) {
            try {
                const positionMillis = Math.round(value * 1000);
                await soundRef.current.setPositionAsync(positionMillis);
                setCurrentTime(value);
            } catch (error) {
                console.error('Seek error:', error);
            }
        }
    };

    const handleClose = async () => {
        await cleanupAudio();
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.audioModalOverlay}>
                <View style={styles.audioModalContent}>
                    <View style={styles.audioModalHeader}>
                        <View style={styles.audioModalTitleContainer}>
                            <Text style={styles.audioModalTitle}>{title}</Text>
                            <Text style={styles.audioModalSubtitle}>Mufti Ismail Menk</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.audioCloseButton}>
                            <Ionicons name="close" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.audioPlayer}>
                        <TouchableOpacity style={styles.audioPlayButton} onPress={handlePlayPause}>
                            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.audioTimeContainer}>
                            <Text style={styles.audioTime}>{formatTime(currentTime)}</Text>
                            <Text style={styles.audioTimeSlash}> / </Text>
                            <Text style={styles.audioTime}>{formatTime(duration)}</Text>
                        </View>
                    </View>

                    {/* Audio Progress Slider */}
                    <View style={styles.audioSliderContainer}>
                        <Slider
                            style={styles.audioSlider}
                            minimumValue={0}
                            maximumValue={duration || 1}
                            value={currentTime}
                            onValueChange={handleSeek}
                            onSlidingStart={() => setIsSeeking(true)}
                            onSlidingComplete={() => setIsSeeking(false)}
                            minimumTrackTintColor={colors.primary.sage}
                            maximumTrackTintColor={colors.border.grey}
                            thumbTintColor={colors.primary.sage}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Daily Adhkar Item

import { filterJihad } from '../utils/textFilter';

const renderArabicTextWithSimpleFullStop = (text) => {
    if (!text) return null;
    
    // Check if the text ends with a period/full stop character (standard or RTL-wrapped)
    const trailingPeriodRegex = /[\u200f]*\.[\u200f]*\s*$/;
    const cleanText = text.replace(trailingPeriodRegex, '');
    
    // Split by either Arabic comma '،' or standard comma ','
    const parts = cleanText.split(/,|،/);
    
    return (
        <>
            {parts.map((part, index) => (
                <React.Fragment key={index}>
                    {part}
                    {index < parts.length - 1 && (
                        <Text style={{ fontFamily: 'System', fontSize: 12 }}> ○ </Text>
                    )}
                </React.Fragment>
            ))}
            {trailingPeriodRegex.test(text) && (
                <Text style={{ fontFamily: 'System' }}>.</Text>
            )}
        </>
    );
};

const HomeScreen = ({ navigation }) => {
    const [adhkarExpanded, setAdhkarExpanded] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showPermissionMessage, setShowPermissionMessage] = useState(false);
    const [userName, setUserName] = useState('');
    const [duaExpanded, setDuaExpanded] = useState(false);
    const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
    const [selectedAdhkar, setSelectedAdhkar] = useState('');
    // YouTube modal state
    const [ytModalVisible, setYtModalVisible] = useState(false);
    const [ytVideoId, setYtVideoId] = useState('');
    const [ytModalTitle, setYtModalTitle] = useState('');

    const openYouTube = (videoId, title) => {
        setYtVideoId(videoId);
        setYtModalTitle(title);
        setYtModalVisible(true);
    };
    const [todayDua, setTodayDua] = useState(null);
    const [isSavingHadith, setIsSavingHadith] = useState(false);
    const [isDuaSaved, setIsDuaSaved] = useState(false);
    const [savedDuaId, setSavedDuaId] = useState(null);
    const [selectedActivities, setSelectedActivities] = useState({
        prayers: false,
        quran: false,
        dhikr: false,
        journaling: false,
    });
    // Detailed stats state matching DailyGrowthScreen
    const [quranStats, setQuranStats] = useState({ seconds: 0, goalMinutes: 15 });
    const [prayerStats, setPrayerStats] = useState({ completed: 0, total: 5 });
    const [dhikrStats, setDhikrStats] = useState({ totalGoal: 0, totalCompleted: 0 });
    const [journalStats, setJournalStats] = useState({ completedToday: false });

    // Legacy simple completion state (still used for manual toggles if needed, but derived stats take precedence for display)
    const [activityCompletion, setActivityCompletion] = useState({
        prayers: false,
        quran: false,
        dhikr: false,
        journaling: false,
    });
    const [togglingActivity, setTogglingActivity] = useState(null);
    const [weatherUnit, setWeatherUnit] = useState('C');
    const hasSavedWeatherUnit = useRef(false);
    const [minuteTick, setMinuteTick] = useState(0); // For triggering re-renders every minute based on location timezone
    const hasAlertShownRef = useRef(false);
    const saveProgressTimeoutRef = useRef(null);

    const getAutomaticWeatherUnit = (country) => {
        const fahrenheitCountries = new Set([
            'united states',
            'united states of america',
            'usa',
            'bahamas',
            'cayman islands',
            'liberia',
        ]);

        if (!country) {
            return 'C';
        }

        const normalizedCountry = country.trim().toLowerCase();
        return fahrenheitCountries.has(normalizedCountry) ? 'F' : 'C';
    };

    useEffect(() => {
        const loadWeatherUnit = async () => {
            try {
                // Check if country has changed and reset weather unit if needed
                const { countryChanged, wasManuallySet } = await StorageService.checkAndResetWeatherUnitIfCountryChanged(countryName);

                // Load the saved weather unit (or null if auto-detect)
                const unit = await StorageService.getWeatherUnit();
                if (unit) {
                    setWeatherUnit(unit);
                    hasSavedWeatherUnit.current = true;
                } else {
                    // Auto-detect based on country
                    const autoUnit = getAutomaticWeatherUnit(countryName);
                    setWeatherUnit(autoUnit);
                    hasSavedWeatherUnit.current = false;
                }

                // Log if country changed and manual override was reset
                if (countryChanged && wasManuallySet) {
                    console.log('🌍 HomeScreen: Weather unit reset due to country change');
                }
            } catch (error) {
                console.error('HomeScreen: Error loading weather unit:', error);
                setWeatherUnit(getAutomaticWeatherUnit(countryName));
            }
        };

        if (countryName) {
            loadWeatherUnit();
        }
    }, [countryName]);

    // Reload weather unit when screen comes back into focus (in case it was changed in ProfileScreen)
    useFocusEffect(
        React.useCallback(() => {
            const reloadWeatherUnit = async () => {
                try {
                    const unit = await StorageService.getWeatherUnit();
                    if (unit) {
                        setWeatherUnit(unit);
                        hasSavedWeatherUnit.current = true;
                    } else {
                        // No manual override, use auto-detection
                        const autoUnit = getAutomaticWeatherUnit(countryName);
                        setWeatherUnit(autoUnit);
                        hasSavedWeatherUnit.current = false;
                    }
                    console.log('🌡️ HomeScreen: Weather unit refreshed on focus:', unit || 'auto');
                } catch (error) {
                    console.error('HomeScreen: Error reloading weather unit on focus:', error);
                }
            };

            reloadWeatherUnit();
        }, [countryName])
    );

    const formatTemperature = (celsius, unit) => {
        if (typeof celsius !== 'number') return '--';
        if (unit === 'F') {
            return `${Math.round((celsius * 9) / 5 + 32)}°F`;
        }
        return `${Math.round(celsius)}°C`;
    };

    // Use theme context for dynamic Day/Evening switching, prayer data, city, and weather
    const { isEvening, isLoading, isLocationEnabled, hasNoData, location, maghribTime, prayerData, cityName, countryName, weather, isManualPreview, refreshTheme, toggleThemePreview } = useTheme();
    const { isProUser } = useSubscription();
    const { softUpdateVisible, updateConfig, dismissSoftUpdate } = useUpdate();

    // Derived completion status
    // Derived completion status based on toggle
    const isPrayerCompleted = activityCompletion.prayers || (prayerStats.completed >= 5);
    const isQuranCompleted = activityCompletion.quran || (quranStats.seconds >= ((quranStats.goalMinutes || 15) * 60) && quranStats.seconds > 0);
    const isDhikrCompleted = activityCompletion.dhikr || (dhikrStats.totalGoal > 0 && dhikrStats.totalCompleted >= dhikrStats.totalGoal);
    const isJournalCompleted = activityCompletion.journaling || journalStats.completedToday;

    // Calculate individual ring progress percentages (with manual toggle support)
    const getQuranPercentage = () => {
        const goalSeconds = (quranStats.goalMinutes || 15) * 60;
        const percentage = goalSeconds > 0 ? Math.min(Math.round((quranStats.seconds / goalSeconds) * 100), 100) : 0;
        return activityCompletion.quran ? 100 : percentage;
    };

    const getDhikrPercentage = () => {
        if (dhikrStats.totalGoal === 0) return 0;
        const percentage = Math.min(Math.round((dhikrStats.totalCompleted / dhikrStats.totalGoal) * 100), 100);
        return activityCompletion.dhikr ? 100 : percentage;
    };

    const getJournalingPercentage = () => {
        return activityCompletion.journaling ? 100 : (journalStats.completedToday ? 100 : 0);
    };

    const getPrayerStats = () => {
        const completed = prayerStats.completed || 0;
        const total = 5;
        const actualPercentage = Math.round((completed / total) * 100);
        const percentage = activityCompletion.prayers ? 100 : actualPercentage;
        return { completed, total, percentage };
    };

    // State to store overall progress synced from DailyGrowthScreen
    const [overallProgress, setOverallProgress] = useState(0);

    const prayerCompletion = getPrayerStats();

    // Calculate overall progress based on selected activities and their completion
    const calculateProgressPercentage = () => {
        let totalPercent = 0;
        let count = 0;

        if (selectedActivities.prayers) {
            totalPercent += prayerCompletion.percentage;
            count++;
        }
        if (selectedActivities.quran) {
            totalPercent += getQuranPercentage();
            count++;
        }
        if (selectedActivities.dhikr) {
            totalPercent += getDhikrPercentage();
            count++;
        }
        if (selectedActivities.journaling) {
            totalPercent += getJournalingPercentage();
            count++;
        }

        if (count === 0) return 0;
        return Math.round(totalPercent / count);
    };

    // Memoize calculated progress to prevent recalculation on every render
    const calculatedProgress = useMemo(() => {
        return calculateProgressPercentage();
    }, [selectedActivities, prayerCompletion, quranStats, dhikrStats, journalStats, activityCompletion]);

    // Memoize individual ring percentages
    const currentRingPercentages = useMemo(() => ({
        prayers: prayerCompletion.percentage,
        quran: getQuranPercentage(),
        dhikr: getDhikrPercentage(),
        journal: getJournalingPercentage(),
    }), [prayerCompletion, quranStats, dhikrStats, journalStats, activityCompletion]);

    // Track last saved ring percentages to detect changes
    const savedRingPercentagesRef = useRef(null);

    // Listen to overall progress from Firebase (synced from DailyGrowthScreen)
    useEffect(() => {
        const unsubscribeProgress = FirebaseService.listenToOverallProgress((progress, ringPercentages) => {
            setOverallProgress(progress);
            savedRingPercentagesRef.current = ringPercentages;
        });

        return () => {
            if (unsubscribeProgress) unsubscribeProgress();
        };
    }, []);

    // Save progress to Firebase when overall OR individual percentages change
    useEffect(() => {
        // Do not attempt to save until we have received the baseline from Firebase
        if (!savedRingPercentagesRef.current) {
            return;
        }

        const ringChanged =
            currentRingPercentages.prayers !== savedRingPercentagesRef.current.prayers ||
            currentRingPercentages.quran !== savedRingPercentagesRef.current.quran ||
            currentRingPercentages.dhikr !== savedRingPercentagesRef.current.dhikr ||
            currentRingPercentages.journal !== savedRingPercentagesRef.current.journal;

        const overallChanged = calculatedProgress !== overallProgress;

        if (overallChanged || ringChanged) {
            // Clear existing timeout
            if (saveProgressTimeoutRef.current) {
                clearTimeout(saveProgressTimeoutRef.current);
            }

            // Set new timeout to save progress after 1 second of no changes
            saveProgressTimeoutRef.current = setTimeout(async () => {
                try {
                    await FirebaseService.updateOverallProgress(calculatedProgress, currentRingPercentages);
                    setOverallProgress(calculatedProgress);
                    savedRingPercentagesRef.current = { ...currentRingPercentages };
                } catch (error) {
                    console.error('Error saving overall progress:', error);
                }
            }, 1000);
        }

        // Cleanup
        return () => {
            if (saveProgressTimeoutRef.current) {
                clearTimeout(saveProgressTimeoutRef.current);
            }
        };
    }, [calculatedProgress, overallProgress, currentRingPercentages]);

    // ── Push data to iOS/Android Home Screen Widgets ──
    const lastWidgetDataRef = useRef(null);

    const performWidgetUpdate = useCallback((force = false) => {
        const payload = {
            prayerStats,
            quranStats,
            dhikrStats,
            journalStats,
            activityCompletion,
            selectedActivities,
            nextSalah: prayerData ? { name: prayerData.nextPrayer, timeString: prayerData.nextPrayerTime } : null,
            prayerTimings: prayerData?.timings || null,
            timezone: prayerData?.timezone || null,
        };

        const serialized = JSON.stringify(payload);
        if (!force && lastWidgetDataRef.current === serialized) {
            return;
        }
        lastWidgetDataRef.current = serialized;

        WidgetService.updateWidgetData(payload);
    }, [
        prayerStats,
        quranStats,
        dhikrStats,
        journalStats,
        activityCompletion,
        selectedActivities,
        prayerData,
    ]);

    const widgetUpdateTimeoutRef = useRef(null);
    useEffect(() => {
        if (widgetUpdateTimeoutRef.current) {
            clearTimeout(widgetUpdateTimeoutRef.current);
        }
        widgetUpdateTimeoutRef.current = setTimeout(() => {
            performWidgetUpdate();
        }, 100);
        return () => {
            if (widgetUpdateTimeoutRef.current) clearTimeout(widgetUpdateTimeoutRef.current);
        };
    }, [calculatedProgress, currentRingPercentages, prayerData, overallProgress, journalStats, performWidgetUpdate]);

    // Flush widget update immediately on background transitions
    useEffect(() => {
        const appStateWidgetListener = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                performWidgetUpdate(true);
            }
        });
        return () => {
            appStateWidgetListener.remove();
        };
    }, [performWidgetUpdate]);

    // Use the calculated progress for real-time updates
    const progress = calculatedProgress;

    // ── Sync Notifications Automatically ──
    // Ensures scheduled notifications are always up-to-date with current channels and sounds
    const hasSyncedNotificationsRef = useRef(false);
    useEffect(() => {
        const syncNotifications = async () => {
            if (!prayerData?.timings || !prayerData?.timezone) return;
            if (hasSyncedNotificationsRef.current) return;
            hasSyncedNotificationsRef.current = true;

            try {
                const info = await FirebaseService.getOnboardingInfo();
                if (info?.prayer) {
                    const { fajr, dhuhr, asr, maghrib, isha, soundMode } = info.prayer;
                    const globalSoundMode = soundMode || 'athan';

                    const parsePrayer = (val) => {
                        if (val && typeof val === 'object') {
                            return {
                                enabled: val.enabled ?? false,
                                soundMode: val.soundMode || globalSoundMode,
                                reminderEnabled: val.reminderEnabled ?? false,
                            };
                        }
                        return { enabled: val ?? false, soundMode: globalSoundMode, reminderEnabled: false };
                    };

                    const prayerSettings = {
                        fajr: parsePrayer(fajr),
                        dhuhr: parsePrayer(dhuhr),
                        asr: parsePrayer(asr),
                        maghrib: parsePrayer(maghrib),
                        isha: parsePrayer(isha),
                    };

                    await NotificationService.schedulePrayerNotifications(
                        prayerSettings,
                        prayerData.timings,
                        prayerData.timezone
                    );
                    console.log('✅ HomeScreen: Background notification sync complete');
                }
            } catch (error) {
                console.error('HomeScreen: Error syncing notifications automatically:', error);
                hasSyncedNotificationsRef.current = false; // allow retry
            }
        };

        syncNotifications();
    }, [prayerData?.timings]);


    /**
     * Get today's Dua based on circular loop through dua.json
     * Each day shows a different dua, cycling through all duas
     */
    const getDuaOfTheDay = async () => {
        try {
            const today = new Date();
            // Use canonical local date key format
            const dateString = FirebaseService.getLocalDateKey(today);
            const dateHash = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

            // Filter valid hadiths that have both arabic and translation
            const validHadiths = hadithsData.filter(item => item && item.arabic && item.translation);

            // Circular loop: each day at 12am shows a different hadith
            const hadithIndex = dateHash % validHadiths.length;
            const hadithItem = validHadiths[hadithIndex];

            if (hadithItem) {
                setTodayDua({
                    english: hadithItem.translation,
                    arabic: filterJihad(hadithItem.arabic), // Apply jihad filter
                    transliteration: '',
                    id: hadithItem.id,
                    source: hadithItem.source,
                    narrator: '',
                });
            }
        } catch (error) {
            console.error('Error getting hadith of the day:', error);
        }
    };

    /**
     * Check if current dua is already saved
     */
    const checkIfDuaSaved = async () => {
        try {
            if (!todayDua) return;

            const savedDuas = await FirebaseService.getSavedDuas();
            const found = savedDuas.find(d => String(d.id) === String(todayDua.id));

            if (found) {
                setIsDuaSaved(true);
                setSavedDuaId(found.id);
            } else {
                setIsDuaSaved(false);
                setSavedDuaId(null);
            }
        } catch (error) {
            console.error('Error checking if dua is saved:', error);
        }
    };

    // Check if dua is saved when todayDua loads (on mount)
    useEffect(() => {
        if (todayDua) {
            checkIfDuaSaved();
        }
    }, [todayDua]);

    // Check if dua is saved when returning to this screen (from collection)
    useEffect(() => {
        return navigation.addListener('focus', () => {
            if (todayDua) checkIfDuaSaved();
            // Refresh stats on focus
            refreshStats();
        });
    }, [navigation, todayDua]);

    const refreshStats = async () => {
        try {
            // Journal
            const jStats = await FirebaseService.getJournalStats();
            setJournalStats(jStats);

            // Dhikr Progress
            const onboardingData = await FirebaseService.getOnboardingInfo();
            if (onboardingData.dikar && Array.isArray(onboardingData.dikar)) {
                const totalGoal = onboardingData.dikar.reduce((sum, dhikr) => sum + (dhikr.counter || 0), 0);
                const dhikrProgress = await FirebaseService.getDhikrProgress();
                // Cap each dhikr at its own target to prevent overflow counting
                const totalCompleted = onboardingData.dikar.reduce((sum, item) => {
                    return sum + Math.min(dhikrProgress[item.word] || 0, item.counter || 0);
                }, 0);
                setDhikrStats({ totalGoal, totalCompleted });
            }
        } catch (e) {
            console.error("Error refreshing stats", e);
        }
    };

    // Fetch real user name from Firebase Auth and onboarding data (only once)
    useEffect(() => {
        const user = auth().currentUser;
        if (user) {
            const StorageService = require('../services/StorageService').default;
            // First load from local storage cache
            StorageService.getUserName(user.uid)
                .then((cachedName) => {
                    if (cachedName) {
                        setUserName(cachedName);
                    } else if (user.displayName) {
                        setUserName(user.displayName);
                    }
                })
                .catch(() => {});

            // Fetch fresh data from Firestore
            FirebaseService.getUserRootData()
                .then((firestoreData) => {
                    if (firestoreData.name) {
                        setUserName(firestoreData.name);
                        StorageService.saveUserName(user.uid, firestoreData.name);
                        
                        // Sync Firebase Auth profile if it differs (e.g. after login on a new device)
                        if (user.displayName !== firestoreData.name) {
                            user.updateProfile({ displayName: firestoreData.name }).catch(() => {});
                        }
                    } else if (user.displayName) {
                        setUserName(user.displayName);
                    }
                })
                .catch((error) => {
                    console.error('Error fetching user data:', error);
                });
        }

        getDuaOfTheDay(); // Get today's dua on component mount

        // Listen to prayer completion
        const unsubscribePrayer = FirebaseService.listenToPrayerCompletion(
            (completion) => {
                const completedCount = Object.values(completion).filter(v => v).length;
                setPrayerStats({ completed: completedCount, total: 5 });
            },
            (error) => console.error(error)
        );

        // Listen to onboarding-info for selected activities AND Quran/Dhikr stats
        const unsubscribeOnboarding = FirebaseService.listenToOnboardingInfo(
            (data) => {
                if (data.selectedActivities) {
                    setSelectedActivities(data.selectedActivities);
                }

                // Quran Stats - get goal from onboarding
                if (data.quran) {
                    setQuranStats(prev => ({
                        ...prev,
                        goalMinutes: data.quran.minutesDay || 15
                    }));
                }

                // Dhikr Logic - set goal, fetch progress once
                if (data.dikar && Array.isArray(data.dikar)) {
                    const totalGoal = data.dikar.reduce((sum, dhikr) => sum + (dhikr.counter || 0), 0);
                    setDhikrStats(prev => {
                        const dhikrProgress = prev.rawProgress || {};
                        const totalCompleted = data.dikar.reduce((sum, item) => {
                            return sum + Math.min(dhikrProgress[item.word] || 0, item.counter || 0);
                        }, 0);
                        return {
                            ...prev,
                            totalGoal,
                            totalCompleted,
                            goals: data.dikar
                        };
                    });
                }
            },
            (error) => {
                console.error('Error listening to onboarding info:', error);
            }
        );

        // Listen to daily Quran stats for real-time reading progress
        const unsubscribeQuran = FirebaseService.listenToDailyQuran((stats) => {
            setQuranStats(prev => ({
                ...prev,
                seconds: stats.seconds,
                streak: stats.streak
            }));
        });

        // Listen to daily Journal stats for real-time updates
        const unsubscribeJournal = FirebaseService.listenToDailyJournal((stats) => {
            setJournalStats(stats);
        });

        // Listen to daily Dhikr stats for real-time updates and midnight reset
        const unsubscribeDhikr = FirebaseService.listenToDailyDhikr((progress) => {
            setDhikrStats(prev => {
                const goals = prev.goals || [];
                const totalCompleted = goals.reduce((sum, item) => {
                    return sum + Math.min(progress[item.word] || 0, item.counter || 0);
                }, 0);
                return {
                    ...prev,
                    rawProgress: progress,
                    totalCompleted
                };
            });
        });

        // Keep legacy listener for backward compatibility if needed, but we rely on calculated stats now
        const unsubscribeProgress = FirebaseService.listenToActivityProgress(
            (progress) => {
                setActivityCompletion(progress);
            },
            (error) => { }
        );

        // --- Midnight & Background Reset Logic ---
        const lastResetDateRef = { current: FirebaseService.getLocalDateKey() };
        let midnightTimeout = null;

        const resetDailyHomeScreenState = async () => {
            const todayKey = FirebaseService.getLocalDateKey();
            lastResetDateRef.current = todayKey;
            console.log('🗓️ HomeScreen: Local midnight reached, resetting daily rings and refresh state...');

            setActivityCompletion({
                prayers: false,
                quran: false,
                dhikr: false,
                journaling: false,
            });
            setPrayerStats({ completed: 0, total: 5 });
            setQuranStats((prev) => ({ ...prev, seconds: 0 }));
            setDhikrStats((prev) => ({ ...prev, totalCompleted: 0 }));
            setJournalStats({ completedToday: false });

            getDuaOfTheDay();
            refreshStats();
            if (refreshTheme) refreshTheme();
        };

        const checkAndResetForNewDay = async () => {
            const todayKey = FirebaseService.getLocalDateKey();
            if (todayKey !== lastResetDateRef.current) {
                await resetDailyHomeScreenState();
            }
        };

        const scheduleMidnightReset = () => {
            if (midnightTimeout) {
                clearTimeout(midnightTimeout);
            }

            const now = new Date();
            const nextMidnight = new Date(now);
            nextMidnight.setHours(24, 0, 0, 0, 0);
            const delay = nextMidnight.getTime() - now.getTime();

            midnightTimeout = setTimeout(async () => {
                await checkAndResetForNewDay();
                scheduleMidnightReset();
            }, Math.max(delay, 1000));
        };

        scheduleMidnightReset();

        // Check every minute as a fallback and to catch any missed date transitions
        const midnightInterval = setInterval(checkAndResetForNewDay, 60000);

        // Check when app returns from background
        const appStateListener = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkAndResetForNewDay();
                // Also trigger a general stats refresh
                refreshStats();
            }
        });

        return () => {
            unsubscribeOnboarding();
            unsubscribeQuran();
            unsubscribeProgress();
            unsubscribePrayer();
            unsubscribeJournal();
            unsubscribeDhikr();
            clearInterval(midnightInterval);
            if (midnightTimeout) clearTimeout(midnightTimeout);
            appStateListener.remove();
        };
    }, []);


    /**
     * Show alert after 3 seconds if location is disabled and no cached data
     * Only shows once per app session to avoid annoying user
     */
    useEffect(() => {
        if (hasNoData && !hasAlertShownRef.current) {
            const timer = setTimeout(() => {
                hasAlertShownRef.current = true;
                Alert.alert(
                    'Location Access Required',
                    'Prayer times and location data could not be loaded because location access is disabled.\n\nTo enable this feature:\nProfile → Preferences → Location Settings',
                    [
                        {
                            text: 'OK',
                            onPress: () => setShowPermissionMessage(true)
                        }
                    ]
                );
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [hasNoData]);

    /**
     * Update next prayer every minute based on location timezone
     * Ensures real-time accuracy using geolocation, not device time
     */
    useEffect(() => {
        if (!prayerData?.timezone || !prayerData?.timings) {
            return;
        }

        // Set up interval to recalculate next prayer every minute
        const interval = setInterval(() => {
            setMinuteTick(prev => prev + 1);
            console.log('🕌 HomeScreen: Recalculating next prayer based on location timezone:', prayerData.timezone);
        }, 60000); // Every 60 seconds

        return () => clearInterval(interval);
    }, [prayerData?.timezone, prayerData?.timings]);

    // Dynamic data from API, with fallbacks
    // City: prefer Expo Location city, fallback to API timezone city, then fallback text
    const displayCity = cityName || prayerData?.city || (isLoading ? 'Loading...' : (showPermissionMessage ? 'Enable location' : '--'));

    // Weather: use Open-Meteo data with dynamic icon
    const displayTemperature = weather ? formatTemperature(weather.temperature, weatherUnit) : (isLoading ? '--' : (showPermissionMessage ? '--' : '--'));
    const weatherIcon = weather?.icon || 'cloud-outline';

    // Gregorian date from device (always available, no API dependency)
    const getDeviceGregorianDate = () => {
        const now = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    };

    /**
     * Recalculate next prayer based on location timezone (geolocation), not device time
     * This ensures accuracy even if time passes without a component refresh
     */
    const calculateNextPrayerByLocation = () => {
        if (!prayerData?.timings || !prayerData?.timezone) {
            return {
                name: prayerData?.nextPrayer || 'Loading',
                time: prayerData?.nextPrayerTime || '--:--'
            };
        }

        const timezone = prayerData.timezone;
        const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const PRAYER_DISPLAY_NAMES = {
            Fajr: 'Fajr',
            Dhuhr: 'Dhuhr',
            Asr: 'Asr',
            Maghrib: 'Maghrib',
            Isha: 'Isha',
            Sunrise: 'Sunrise'
        };

        try {
            const now = new Date();
            const nowInLocationTz = PrayerTimeService.parseTimeToDateWithTimezone(
                `${new Intl.DateTimeFormat('en-US', {
                    timeZone: timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }).format(now)}`,
                timezone,
                now
            );

            for (const prayerName of PRAYER_ORDER) {
                if (prayerName === 'Sunrise') continue; // Skip Sunrise

                const prayerTimeStr = prayerData.timings[prayerName];
                if (!prayerTimeStr) continue;

                const prayerDate = PrayerTimeService.parseTimeToDateWithTimezone(prayerTimeStr, timezone, now);

                if (prayerDate && nowInLocationTz && prayerDate > nowInLocationTz) {
                    console.log(`✅ HomeScreen: Next prayer by geolocation (${timezone}): ${prayerName} at ${prayerTimeStr}`);
                    return {
                        name: PRAYER_DISPLAY_NAMES[prayerName] || prayerName,
                        time: prayerTimeStr
                    };
                }
            }

            // All prayers passed, next is tomorrow's Fajr
            console.log(`✅ HomeScreen: All prayers passed, next is tomorrow's Fajr in ${timezone}`);
            return {
                name: 'Fajr',
                time: prayerData.timings?.Fajr || '--:--'
            };
        } catch (error) {
            console.error('HomeScreen: Error calculating next prayer by location:', error);
            return {
                name: prayerData?.nextPrayer || 'Loading',
                time: prayerData?.nextPrayerTime || '--:--'
            };
        }
    };

    /**
     * Calculate CURRENT prayer - which prayer is happening right now
     * Returns which prayer window we're currently in (or null if between prayers)
     */
    const calculateCurrentPrayer = () => {
        if (!prayerData?.timings || !prayerData?.timezone) {
            return null;
        }

        const timezone = prayerData.timezone;
        const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        try {
            const now = new Date();
            const nowFormatted = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }).format(now);

            const nowInLocationTz = PrayerTimeService.parseTimeToDateWithTimezone(nowFormatted, timezone, now);

            // Check which prayer window we're in
            for (let i = 0; i < PRAYER_ORDER.length; i++) {
                const currentPrayerName = PRAYER_ORDER[i];
                const nextPrayerName = PRAYER_ORDER[i + 1];

                const currentPrayerStr = prayerData.timings[currentPrayerName];
                const nextPrayerStr = nextPrayerName ? prayerData.timings[nextPrayerName] : null;

                if (!currentPrayerStr) continue;

                const currentPrayerTime = PrayerTimeService.parseTimeToDateWithTimezone(currentPrayerStr, timezone, now);

                let nextPrayerTime;
                if (nextPrayerStr) {
                    nextPrayerTime = PrayerTimeService.parseTimeToDateWithTimezone(nextPrayerStr, timezone, now);
                } else {
                    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    nextPrayerTime = PrayerTimeService.parseTimeToDateWithTimezone('00:00', timezone, tomorrow);
                }

                if (currentPrayerTime && nextPrayerTime && nowInLocationTz >= currentPrayerTime && nowInLocationTz < nextPrayerTime) {
                    console.log(`🕌 HomeScreen: Current prayer (${timezone}): ${currentPrayerName} (${currentPrayerStr})`);
                    return {
                        name: currentPrayerName,
                        time: currentPrayerStr,
                        isCurrent: true
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('HomeScreen: Error calculating current prayer by location:', error);
            return null;
        }
    };

    /**
     * Convert 12-hour time format to 24-hour format
     * Handles both AM/PM and plain HH:MM formats
     */
    const convertTo24Hour = (timeStr) => {
        if (!timeStr) return '--:--';

        // If already in 24-hour format (no AM/PM), return as is
        if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
            return timeStr.split(' ')[0]; // Remove any extra spaces
        }

        const parts = timeStr.trim().split(' ');
        const timePart = parts[0];
        const period = parts[1]?.toUpperCase() || '';

        const [hours, minutes] = timePart.split(':').map(Number);
        let hour24 = hours;

        if (period === 'PM' && hours !== 12) {
            hour24 = hours + 12;
        } else if (period === 'AM' && hours === 12) {
            hour24 = 0;
        }

        return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    /**
     * Get all prayer times with upcoming prayer highlighted (24-hour format)
     */
    const getAllPrayerTimesFormatted = () => {
        if (!prayerData?.timings || !prayerData?.timezone) {
            return [];
        }

        const timezone = prayerData.timezone;
        const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const PRAYER_ICONS = {
            Fajr: 'sunrise',
            Dhuhr: 'sunny',
            Asr: 'cloudy',
            Maghrib: 'sunset',
            Isha: 'moon'
        };

        try {
            // Get current time in location's timezone
            const now = new Date();
            const nowFormatted = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }).format(now);

            const nowInLocationTz = PrayerTimeService.parseTimeToDateWithTimezone(nowFormatted, timezone, now);

            // Build prayer times array
            const prayerTimes = PRAYER_ORDER.map((prayerName) => {
                const prayerTimeStr = prayerData.timings[prayerName];
                if (!prayerTimeStr) return null;

                const prayerDate = PrayerTimeService.parseTimeToDateWithTimezone(prayerTimeStr, timezone, now);
                const isUpcoming = prayerDate && nowInLocationTz && prayerDate > nowInLocationTz;

                const [prayerHours, prayerMinutes] = prayerTimeStr.split(':').map(Number);
                const time24 = `${prayerHours.toString().padStart(2, '0')}:${prayerMinutes.toString().padStart(2, '0')}`;

                return {
                    name: prayerName,
                    time: time24,
                    isUpcoming,
                    icon: PRAYER_ICONS[prayerName],
                };
            }).filter(p => p !== null);

            return prayerTimes;
        } catch (error) {
            console.error('Error getting all prayer times:', error);
            return [];
        }
    };

    /**
     * Get next prayer time formatted in the prayer location's timezone
     * Now uses real-time geolocation-based calculation instead of cached value
     */
    const getNextPrayerTimeInLocationTz = () => {
        if (!prayerData?.nextPrayerTime) {
            return showPermissionMessage ? '--:--' : '--:--';
        }

        // prayerData.nextPrayerTime is already formatted by PrayerTimeService
        // and includes timezone conversion if needed
        // Just return it with timezone indicator if available
        const timezone = prayerData?.timezone || '';
        const timeStr = prayerData.nextPrayerTime;

        // If timezone is available and not UTC, show timezone abbreviation
        if (timezone && timezone !== 'UTC') {
            const tzParts = timezone.split('/');
            const tzCity = tzParts[tzParts.length - 1]?.replace(/_/g, ' ');
            return timeStr; // Time is already correct for location
        }

        return timeStr;
    };

    const displayData = {
        name: userName || 'User',
        city: displayCity,
        temperature: displayTemperature,
        hijriDate: prayerData?.hijriDate || (showPermissionMessage ? '--' : '--'),
        gregorianDate: getDeviceGregorianDate(), // Always from device, never from API
        // Use geolocation-based calculation for current and next prayer (synced and recalculated every minute)
        currentPrayer: calculateCurrentPrayer()?.name || 'Between prayers',
        currentPrayerTime: calculateCurrentPrayer()?.time || '--:--',
        nextPrayer: calculateNextPrayerByLocation().name,
        nextPrayerTime: calculateNextPrayerByLocation().time,
        timezone: prayerData?.timezone || '',
        _minuteTick: minuteTick, // Ensures re-render every minute for location-based updates
    };

    // Calculate progress based on selected and completed activities
    // const progress = calculateProgressPercentage(); // Replaced with useMemo

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';

        // If it's evening time (after 5 PM) but theme is still 'Day' (before Maghrib),
        // we stay with 'Good Afternoon' to match the bright UI.
        // Once Maghrib hits and theme becomes 'Evening', we say 'Good Evening'.
        if (isEvening) return 'Good Evening';
        return 'Good Afternoon';
    };

    /**
     * Handle manual refresh button press
     * Re-fetches location and prayer times
     * Shows alert if location is disabled
     */
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const result = await refreshTheme();

            // Check if location is disabled and show professional guidance
            if (result && result.locationDisabled) {
                Alert.alert(
                    'Location Disabled',
                    'To refresh prayer times and location data, please enable location access.\n\nGo to:\nProfile → Preferences → Location Settings',
                    [
                        { text: 'OK', style: 'default' }
                    ]
                );
            }
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    /**
     * Toggle activity completion and auto-save to Firebase
     */
    const handleToggleActivity = async (activity) => {
        // Only toggle if activity was selected by user
        if (!selectedActivities[activity]) {
            return;
        }

        setTogglingActivity(activity);
        try {
            const newStatus = !activityCompletion[activity];

            // Calculate the percentage for this ring after toggle
            let ringPercentage = 0;
            if (newStatus) {
                // Toggling ON means 100%
                ringPercentage = 100;
            } else {
                // Toggling OFF — use the actual calculated percentage
                if (activity === 'prayers') ringPercentage = getPrayerStats().percentage;
                else if (activity === 'quran') ringPercentage = getQuranPercentage();
                else if (activity === 'dhikr') ringPercentage = getDhikrPercentage();
                else if (activity === 'journaling') ringPercentage = getJournalingPercentage();
            }

            await FirebaseService.updateActivityCompletion(activity, newStatus, ringPercentage);
            // UI updates automatically via real-time listener
        } catch (error) {
            console.error(`Error toggling ${activity}:`, error);
            Alert.alert('Error', `Failed to update ${activity}. Please try again.`);
        } finally {
            setTogglingActivity(null);
        }
    };

    /**
     * Calculate overall progress percentage based on selected activities
     */

    // Dynamic text colors based on theme (isEvening from context)
    const themeColors = {
        greeting: isEvening ? 'rgba(255,255,255,0.7)' : colors.text.grey,
        userName: isEvening ? '#FFFFFF' : colors.text.black,
    };

    const renderContent = () => (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.greeting, { color: themeColors.greeting }]}>{getGreeting()}</Text>
                    <View style={styles.userNameContainer}>
                        <Text
                            style={[styles.userName, { color: themeColors.userName }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {displayData.name}
                        </Text>
                        {isProUser && (
                            <View style={styles.premiumPlusContainer}>
                                <Text style={styles.premiumPlusText}>+</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.headerRight}>

                    <TouchableOpacity
                        style={[
                            styles.headerIconButtonOutline,
                            isEvening && styles.headerIconButtonDark
                        ]}
                        onPress={toggleThemePreview}
                    >
                        <Image
                            source={themeChange}
                            style={[
                                styles.themeChangeIcon,
                                isEvening && styles.themeChangeIconDark
                            ]}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Location Card */}
            <TouchableOpacity
                style={styles.locationCard}
                onPress={() => {
                    if (!isLocationEnabled || !prayerData) {
                        navigation.navigate('LocationPermission', { fromSettings: true });
                    }
                }}
                activeOpacity={isLocationEnabled && !!prayerData ? 1 : 0.7}
                disabled={isLocationEnabled && !!prayerData}
            >
                <View style={styles.locationCardContent}>
                    <View style={styles.locationLeft}>
                        <Text style={styles.locationCity}>{displayData.city}</Text>
                        <View style={styles.weatherRow}>
                            <Ionicons name={weatherIcon} size={20} color={colors.text.black} />
                            <Text style={styles.temperature}>{displayData.temperature}</Text>
                        </View>
                    </View>
                    <View style={styles.locationRight}>
                        <Text style={styles.hijriDate}>{displayData.hijriDate}</Text>
                        <Text style={styles.gregorianDate}>{displayData.gregorianDate}</Text>
                    </View>
                </View>
                {(!isLocationEnabled || !prayerData) && (
                    <View style={styles.locationTapHint}>
                        <Ionicons name="location-outline" size={14} color={colors.primary.sage} />
                        <Text style={styles.locationTapHintText}>
                            {!isLocationEnabled
                                ? 'Tap to enable location'
                                : isLoading
                                ? 'Fetching location data...'
                                : 'Tap to retry location'}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Next Prayer Card with Refresh Button */}
            <View style={styles.nextPrayerCard}>
                <View style={styles.nextPrayerLeft}>
                    {/* <Image
                        source={whiteClock}
                        style={styles.clockIcon}
                        resizeMode='contain'
                        tintColor='white'
                    /> */}
                    <View style={styles.nextPrayerTextContainer}>
                        <Text style={styles.nextPrayerText}>
                            Upcoming Prayer : {displayData.nextPrayer} • {convertTo24Hour(displayData.nextPrayerTime)}
                        </Text>
                        {/* {displayData.timezone && displayData.timezone !== 'UTC' && (
                            <Text style={styles.nextPrayerTimezone}>
                                {displayData.timezone}
                            </Text>
                        )} */}
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.refreshIconButton}
                    onPress={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    activeOpacity={0.7}
                >
                    {isRefreshing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>


            {/* Hadith of the Day */}
            <View
                style={styles.duaCard}
            >
                <View style={styles.duaHeader}>
                    <Text style={styles.duaTitle}>Hadith of the Day</Text>
                    <TouchableOpacity
                        disabled={isSavingHadith}
                        onPress={async () => {
                            try {
                                if (!todayDua || isSavingHadith) return;
                                setIsSavingHadith(true);

                                if (isDuaSaved && savedDuaId) {
                                    await FirebaseService.removeFavoriteDua(savedDuaId);
                                    setIsDuaSaved(false);
                                    setSavedDuaId(null);
                                } else {
                                    const newId = await FirebaseService.saveFavoriteDua({
                                        arabic: todayDua.arabic || '',
                                        english: todayDua.english || '',
                                        category: 'Hadith of the Day',
                                        id: todayDua.id
                                    });
                                    setIsDuaSaved(true);
                                    setSavedDuaId(newId);
                                }
                            } catch (error) {
                                console.error('Error toggling hadith save:', error);
                            } finally {
                                setIsSavingHadith(false);
                            }
                        }}>
                        <Ionicons
                            name={isDuaSaved ? "heart" : "heart-outline"}
                            size={22}
                            color={isDuaSaved ? colors.primary.darkSage : colors.text.grey}
                            style={{ opacity: isSavingHadith ? 0.5 : 1 }}
                        />
                    </TouchableOpacity>
                </View>
                {todayDua?.arabic && (
                    <>
                        {duaExpanded ? (
                            <>
                                <Text style={[styles.duaTranslationExpanded, { color: isEvening ? colors.text.black : colors.text.grey }]}>
                                    {todayDua.english || ''}
                                </Text>
                                <Text style={[styles.duaArabicExpanded, { color: isEvening ? colors.text.black : colors.text.grey }]}>
                                    {renderArabicTextWithSimpleFullStop(todayDua.arabic)}
                                </Text>
                                {todayDua.transliteration ? (
                                    <Text style={[styles.duaTransliterationExpanded, { color: isEvening ? colors.text.black : colors.text.grey }]}>
                                        {todayDua.transliteration}
                                    </Text>
                                ) : null}
                                {todayDua.source ? (
                                    <View style={[styles.referenceContainer, { backgroundColor: isEvening ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.6)' }]}>
                                        <View style={styles.referenceRow}>
                                            <Ionicons name="book-outline" size={14} color={isEvening ? colors.text.black : colors.text.grey} style={styles.referenceIcon} />
                                            <Text style={[styles.duaReferenceExpanded, { color: isEvening ? colors.text.black : colors.text.grey }]}>
                                                <Text style={{ fontWeight: '600' }}>Source: </Text>{todayDua.source}
                                            </Text>
                                        </View>
                                    </View>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <Text style={[styles.duaTranslation, { color: isEvening ? colors.text.black : colors.text.grey, marginBottom: spacing.xs }]} numberOfLines={2}>
                                    {todayDua.english || ''}
                                </Text>
                                <Text style={[styles.duaArabic, { color: isEvening ? colors.text.black : colors.text.grey }]} numberOfLines={2}>
                                    {renderArabicTextWithSimpleFullStop(todayDua.arabic)}
                                </Text>
                                {todayDua.transliteration ? (
                                    <Text style={[styles.duaTransliteration, { color: isEvening ? colors.text.black : colors.text.grey }]} numberOfLines={1}>
                                        {todayDua.transliteration}
                                    </Text>
                                ) : null}
                            </>
                        )}
                        <LinearGradient
                            colors={['transparent', 'rgba(0, 0, 0, 0.08)']}
                            style={styles.duaCardInnerShadow}
                            pointerEvents="none"
                        />
                        <TouchableOpacity
                            style={styles.duaFooter}
                            onPress={() => setDuaExpanded(!duaExpanded)}
                        >
                            <Ionicons
                                name={duaExpanded ? "chevron-down" : "chevron-up"}
                                size={22}
                                color={colors.text.grey}
                            />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Daily Adhkar */}
            <View style={styles.adhkarCard}>
                <TouchableOpacity
                    style={styles.adhkarHeader}
                    onPress={() => setAdhkarExpanded(!adhkarExpanded)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.adhkarSectionTitle}>Daily Adhkar</Text>
                    <Ionicons
                        name={adhkarExpanded ? "chevron-down" : "chevron-up"}
                        size={22}
                        color={colors.text.grey}
                    />
                </TouchableOpacity>

                {adhkarExpanded && (
                    <View style={styles.adhkarList}>
                        <AdhkarItem
                            title="Morning Adhkar"
                            subtitle="A moment of remembrance to begin your day"
                            onPress={() => openYouTube('P8EIBksC0MA', 'Morning Adhkar')}
                            isLast={false}
                        />
                        <AdhkarItem
                            title="Evening Adhkar"
                            subtitle="A gentle closing of the day in remembrance"
                            onPress={() => openYouTube('fQUbhEHetks', 'Evening Adhkar')}
                            isLast={true}
                        />
                    </View>
                )}
            </View>

            {/* AJR Rings - Tap to open Daily Growth */}
            <TouchableOpacity
                style={[styles.ringsCard, { backgroundColor: isEvening ? 'rgba(241, 245, 241, 0.85)' : colors.primary.light }]}
                onPress={() => {
                    const hasNoActivities = !selectedActivities.prayers && !selectedActivities.quran && !selectedActivities.dhikr && !selectedActivities.journaling;
                    if (!hasNoActivities) {
                        navigation.navigate('DailyGrowth');
                    }
                }}
                activeOpacity={(!selectedActivities.prayers && !selectedActivities.quran && !selectedActivities.dhikr && !selectedActivities.journaling) ? 1 : 0.8}
            >
                <Text style={styles.ringsSectionTitle}>AJR Rings</Text>
                <View style={styles.ringsDivider} />

                <View style={styles.ringsContent}>
                    {(!selectedActivities.prayers && !selectedActivities.quran && !selectedActivities.dhikr && !selectedActivities.journaling) ? (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md }}>
                            <Text style={{ textAlign: 'center', color: colors.text.grey, marginBottom: spacing.xl, fontSize: isSmallDevice ? 13 : 15, lineHeight: 22 }}>
                                You're not tracking any activities. Tap below to add one.
                            </Text>
                            <TouchableOpacity
                                style={{ backgroundColor: colors.primary.sage, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.pill }}
                                onPress={() => navigation.navigate('SelectActivities', { fromSettings: true })}
                            >
                                <Text style={{ color: '#FFFFFF', fontWeight: typography.fontWeight.medium, fontSize: isSmallDevice ? 14 : 15 }}>My AJR Activities</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <AJRRings
                                variant="detailed"
                                progress={progress}
                                layer1Completed={prayerCompletion.percentage >= 100}
                                layer2Completed={getQuranPercentage() >= 100}
                                layer3Completed={getDhikrPercentage() >= 100}
                                layer1Progress={prayerCompletion.percentage}
                                layer2Progress={getQuranPercentage()}
                                layer3Progress={getDhikrPercentage()}
                                journalingProgress={getJournalingPercentage()}
                                layer1Visible={selectedActivities.prayers}
                                layer2Visible={selectedActivities.quran}
                                layer3Visible={selectedActivities.dhikr}
                                journalingVisible={selectedActivities.journaling}
                            />

                            <View style={styles.legendContainer}>
                                {selectedActivities.prayers && (
                                    <ActivityLegendItem
                                        color={colors.rings.layer1}
                                        label="Prayers"
                                        completed={isPrayerCompleted}
                                        activity="prayers"
                                        onToggle={handleToggleActivity}
                                        disabled={togglingActivity === 'prayers' || isPrayerCompleted}
                                    />
                                )}
                                {selectedActivities.quran && (
                                    <ActivityLegendItem
                                        color={colors.rings.layer2}
                                        label="Quran"
                                        completed={isQuranCompleted}
                                        activity="quran"
                                        onToggle={handleToggleActivity}
                                        disabled={togglingActivity === 'quran' || isQuranCompleted}
                                    />
                                )}
                                {selectedActivities.dhikr && (
                                    <ActivityLegendItem
                                        color={colors.rings.layer3}
                                        label="Dhikr"
                                        completed={isDhikrCompleted}
                                        activity="dhikr"
                                        onToggle={handleToggleActivity}
                                        disabled={togglingActivity === 'dhikr' || isDhikrCompleted}
                                    />
                                )}
                                {selectedActivities.journaling && (
                                    <ActivityLegendItem
                                        color={colors.rings.innerCircle}
                                        label="Journal"
                                        completed={isJournalCompleted}
                                        activity="journaling"
                                        onToggle={handleToggleActivity}
                                        disabled={togglingActivity === 'journaling' || isJournalCompleted}
                                    />
                                )}
                            </View>
                        </>
                    )}
                </View>
            </TouchableOpacity>
        </ScrollView>
    );

    // Render with dark background image (Evening) or light gradient (Day)
    if (isEvening) {
        return (
            <>
                <ImageBackground
                    source={darkBackground}
                    style={styles.container}
                    resizeMode="cover"
                >
                    {renderContent()}
                </ImageBackground>
                <AudioPlayerModal
                    visible={audioPlayerVisible}
                    title={selectedAdhkar}
                    onClose={() => setAudioPlayerVisible(false)}
                />
                <YouTubeModal
                    visible={ytModalVisible}
                    videoId={ytVideoId}
                    title={ytModalTitle}
                    onClose={() => setYtModalVisible(false)}
                />
            </>
        );
    }

    return (
        <>
            <LinearGradient
                colors={[colors.homeGradient.top, colors.homeGradient.top, colors.homeGradient.bottom, colors.homeGradient.bottom]}
                locations={[0, 0.30, 0.70, 1]}
                style={styles.container}
            >
                {renderContent()}
            </LinearGradient>
            <AudioPlayerModal
                visible={audioPlayerVisible}
                title={selectedAdhkar}
                onClose={() => setAudioPlayerVisible(false)}
            />
            <YouTubeModal
                visible={ytModalVisible}
                videoId={ytVideoId}
                title={ytModalTitle}
                onClose={() => setYtModalVisible(false)}
            />
            {/* ── Soft Update Modal — shown once per session ── */}
            <SoftUpdateModal
                visible={softUpdateVisible}
                config={updateConfig}
                onDismiss={dismissSoftUpdate}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.06,
        paddingBottom: spacing.xxl,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerLeft: {
        flex: 1,
        marginRight: spacing.sm,
        justifyContent: 'center',
    },
    greeting: {
        fontSize: isSmallDevice ? 22 : 26,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
    },
    userNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        marginTop: 2,
    },
    userName: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    premiumPlusContainer: {
        marginLeft: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    premiumPlusText: {
        fontSize: 18,
        fontWeight: '300',
        color: '#D4AF37', // Premium Gold
        lineHeight: 22,
        textShadowColor: 'rgba(212, 175, 55, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeChangeIcon: {
        width: 20,
        height: 20,
    },
    headerIconButtonOutline: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#fff',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    // Dark theme variant for theme toggle button
    headerIconButtonDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    themeChangeIconDark: {
        tintColor: '#FFFFFF',
    },
    // Location Card
    locationCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    locationCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    locationLeft: { justifyContent: 'space-between' },
    locationCity: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    temperature: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.black,
        marginLeft: spacing.xs,
        fontWeight: typography.fontWeight.bold,
    },
    locationRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between'
    },
    hijriDate: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: 2,
    },
    gregorianDate: {
        fontSize: isSmallDevice ? 13 : 15,
        color: colors.text.black,
        fontWeight: typography.fontWeight.medium,
    },
    locationTapHint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    locationTapHintText: {
        fontSize: 12,
        color: colors.primary.sage,
        marginLeft: spacing.xs,
        fontWeight: typography.fontWeight.medium,
    },
    // Next Prayer Card with Refresh Button
    nextPrayerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.button.prayer,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.lg,
    },
    nextPrayerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    // Small Refresh Icon Button (in prayer card)
    refreshIconButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    clockIcon: {
        width: 20,
        height: 20,
    },
    nextPrayerTextContainer: {
        flex: 1,
        marginLeft: spacing.xxs,
        
    },
    nextPrayerText: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.regular,
        color: "#FFFFFF"
    },
    nextPrayerTimezone: {
        fontSize: isSmallDevice ? 11 : 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: spacing.xxs,
        fontStyle: 'italic',
    },
    // Prayer Times Card - 24-hour format
    prayerTimesCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    prayerTimesTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.md,
    },
    prayerTimesContainer: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    prayerTimeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: '#FFFFFF',
    },
    prayerTimeItemUpcoming: {
        backgroundColor: colors.primary.sage,
    },
    prayerTimeItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.grey,
    },
    prayerTimeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    prayerTimeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary.light,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    prayerTimeIconUpcoming: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    prayerTimeName: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    prayerTimeNameUpcoming: {
        color: '#FFFFFF',
        fontWeight: typography.fontWeight.semibold,
    },
    prayerTimeRight: {
        alignItems: 'flex-end',
    },
    prayerTimeValue: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    prayerTimeValueUpcoming: {
        color: '#FFFFFF',
        fontSize: isSmallDevice ? 16 : 18,
    },
    upcomingBadge: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: spacing.xxs,
        fontWeight: typography.fontWeight.medium,
    },
    // Dua Card
    duaCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        paddingBottom: 40,
        marginBottom: spacing.md,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    duaCardInnerShadow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 35,
        borderBottomLeftRadius: borderRadius.lg,
        borderBottomRightRadius: borderRadius.lg,
    },
    duaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    heartIcon: {
        width: 22,
        height: 22,
    },
    duaTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom:8
    },
    duaArabic: {
        fontSize: isSmallDevice ? 16 : 18,
        color: colors.text.grey,
        textAlign: 'right',
        marginBottom: spacing.sm,
        lineHeight: 30,
        fontFamily: 'Uthmanic',
    },
    duaArabicExpanded: {
        fontSize: isSmallDevice ? 16 : 18,
        color: colors.text.grey,
        textAlign: 'right',
        marginBottom: spacing.md,
        lineHeight: 30,
        flexWrap: 'wrap',
        fontFamily: 'Uthmanic',
    },
    duaTransliteration: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        fontStyle: 'italic',
    },
    duaTransliterationExpanded: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        fontStyle: 'italic',
        marginBottom: spacing.md,
        flexWrap: 'wrap',
        lineHeight: 20,
    },
    duaTranslationExpanded: {
        fontSize: isSmallDevice ? 15 : 16,
        color: colors.text.grey,
        marginBottom: spacing.md,
        flexWrap: 'wrap',
        lineHeight: 22,
        textAlign: 'left',
    },
    duaReferenceExpanded: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
        flexWrap: 'wrap',
        lineHeight: 18,
        textAlign: 'left',
        flex: 1,
    },
    referenceContainer: {
        marginTop: spacing.xs,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    referenceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    referenceIcon: {
        marginTop: 2,
        marginRight: spacing.xs,
        opacity: 0.7,
    },
    duaTranslation: {
        fontSize: isSmallDevice ? 15 : 16,
        color: colors.text.grey,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    // Adhkar Card
    adhkarCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.md,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    adhkarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: 'transparent',
    },
    adhkarSectionTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    adhkarList: {
        backgroundColor: 'transparent',
    },
    adhkarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xs,
        paddingHorizontal: spacing.lg,
    },
    adhkarItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.grey,
    },
    adhkarPlayButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    adhkarContent: {
        flex: 1,
    },
    adhkarTitle: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: 2,
    },
    adhkarSubtitle: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
    },
    // AJR Rings Card
    ringsCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    ringsSectionTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        paddingHorizontal: spacing.xs,
    },
    ringsDivider: {
        height: 1,
        backgroundColor: colors.border.grey,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    ringsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
        gap: spacing.xs
    },
    legendContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: spacing.xs,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: "center",
        paddingVertical: spacing.xs,
        marginBottom: spacing.xs,
        flexWrap: "nowrap",
        width: '100%',
    },
    legendCheck: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xxs,
    },
    legendLabel: {
        fontSize: isSmallDevice ? 10 : 12,
        color: colors.text.black,
        flexShrink: 1,
    },
    legendLabelInactive: {
        color: colors.text.grey,
    },
    // Dua Details Dropdown Styles
    duaDetailsSection: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
    },
    duaDetailsDivider: {
        height: 1,
        backgroundColor: colors.border.grey,
        marginBottom: spacing.md,
    },
    duaDetailsTitle: {
        fontSize: isSmallDevice ? 14 : 15,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.sm,
    },
    duaDetailsText: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
        marginBottom: spacing.xs,
        lineHeight: 18,
    },
    duaFooter: {
        position: 'absolute',
        bottom: 4,
        alignSelf: 'center',
        width: 36,
        height: 36,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Audio Player Modal Styles
    audioModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    audioModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        width: '100%',
    },
    audioModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    audioModalTitleContainer: {
        flex: 1,
    },
    audioModalTitle: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    audioModalSubtitle: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        marginTop: spacing.xxs,
    },
    audioCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary.light,
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioPlayer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
    },
    audioPlayButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    audioTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioTime: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    audioTimeSlash: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.grey,
        marginHorizontal: spacing.sm,
    },
    audioSliderContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    audioSlider: {
        width: '100%',
        height: 40,
    },

    ytModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    ytModalContainer: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
        paddingBottom: 20,
    },
    ytModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#111',
    },
    ytModalTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 10,
    },
    ytCloseButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ytVideoWrapper: {
        width: '100%',
        height: screenWidth * (9 / 16), // 16:9 aspect ratio
        backgroundColor: '#000',
    },
    ytWebView: {
        flex: 1,
        backgroundColor: '#000',
    },
});

export default HomeScreen;
