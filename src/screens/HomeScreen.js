import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Asset } from 'expo-asset';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTheme } from '../context';
import auth from '@react-native-firebase/auth';
import FirebaseService from '../services/FirebaseService';
import duaData from '../data/dua.json';
import AJRRings from '../components/AJRRings';
import { Audio } from 'expo-av';
import whiteClock from '../../assets/images/white-clock.png';
import heart from '../../assets/images/heart.png';
import notifications from '../../assets/images/notification-bing.png';
import themeChange from '../../assets/images/theme-change.png';
import darkBackground from '../../assets/images/dark.png';

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
            <Ionicons name="play" size={14} color="#FFFFFF" />
        </View>
        <View style={styles.adhkarContent}>
            <Text style={styles.adhkarTitle}>{title}</Text>
            <Text style={styles.adhkarSubtitle}>{subtitle}</Text>
        </View>
    </TouchableOpacity>
);

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
    const getAudioUri = () => {
        if (title === 'Morning Adhkar') {
            return require('../../src/data/morning-adkar.mp4');
        } else if (title === 'Evening Adhkar') {
            return require('../../src/data/evening-adkar.mp4');
        }
        return null;
    };

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
                        <Text style={styles.audioModalTitle}>{title}</Text>
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

const HomeScreen = ({ navigation }) => {
    const [adhkarExpanded, setAdhkarExpanded] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showPermissionMessage, setShowPermissionMessage] = useState(false);
    const [userName, setUserName] = useState('');
    const [duaExpanded, setDuaExpanded] = useState(false);
    const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
    const [selectedAdhkar, setSelectedAdhkar] = useState('');
    const [todayDua, setTodayDua] = useState(null);
    const [selectedActivities, setSelectedActivities] = useState({
        prayers: false,
        quran: false,
        dhikr: false,
        journaling: false,
    });
    const [activityCompletion, setActivityCompletion] = useState({
        prayers: false,
        quran: false,
        dhikr: false,
        journaling: false,
    });
    const [togglingActivity, setTogglingActivity] = useState(null);
    const hasAlertShownRef = useRef(false);

    // Use theme context for dynamic Day/Evening switching, prayer data, city, and weather
    const { isEvening, isLoading, isLocationEnabled, hasNoData, location, maghribTime, prayerData, cityName, weather, isManualPreview, refreshTheme, toggleThemePreview } = useTheme();

    /**
     * Get today's Dua based on circular loop through dua.json
     * Each day shows a different dua, cycling through all duas
     */
    const getDuaOfTheDay = async () => {
        try {
            const firestoreData = await FirebaseService.getUserRootData();
            const createdAt = firestoreData.createdAt?.toDate ? firestoreData.createdAt.toDate() : new Date();
            const today = new Date();
            const diffTime = today - createdAt;
            const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            // Circular loop: each day shows a different dua
            const duaIndex = daysSince % duaData.data.length;
            const duaItem = duaData.data[duaIndex];
            
            if (duaItem && duaItem.hadith && duaItem.hadith.length >= 2) {
                const enHadith = duaItem.hadith.find(h => h.lang === 'en');
                const arHadith = duaItem.hadith.find(h => h.lang === 'ar');
                
                setTodayDua({
                    english: enHadith,
                    arabic: arHadith,
                    hadithNumber: duaItem.hadithNumber,
                });
            }
        } catch (error) {
            console.error('Error getting dua of the day:', error);
        }
    };

    // Fetch real user name from Firebase Auth and onboarding data
    useEffect(() => {
        getDuaOfTheDay(); // Get today's dua on component mount

        const unsubscribeAuth = auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    // Fetch user data from Firestore (same as ProfileScreen)
                    const firestoreData = await FirebaseService.getUserRootData();
                    
                    // Extract name from Firestore first (the onboarding name), then fall back to Auth
                    const displayName = firestoreData.name || user.displayName || user.email?.split('@')[0] || 'User';
                    setUserName(displayName);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    // Fallback to Auth email if Firestore fails
                    const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                    setUserName(displayName);
                }
            }
        });

        // Listen to onboarding-info for selected activities
        const unsubscribeOnboarding = FirebaseService.listenToOnboardingInfo(
            (data) => {
                if (data.selectedActivities) {
                    setSelectedActivities(data.selectedActivities);
                }
            },
            (error) => {
                console.error('Error listening to onboarding info:', error);
            }
        );

        // Listen to activity progress for real-time completion updates
        const unsubscribeProgress = FirebaseService.listenToActivityProgress(
            (progress) => {
                setActivityCompletion(progress);
            },
            (error) => {
                console.error('Error listening to activity progress:', error);
            }
        );

        return () => {
            unsubscribeAuth();
            unsubscribeOnboarding();
            unsubscribeProgress();
        };
    }, []);

    /**
     * Calculate overall progress percentage based on selected activities
     */
    const calculateProgressPercentage = () => {
        const selectedCount = Object.values(selectedActivities).filter(v => v).length;
        if (selectedCount === 0) return 0;

        const completedCount = Object.entries(activityCompletion)
            .filter(([activity, completed]) => selectedActivities[activity] && completed)
            .length;

        return Math.round((completedCount / selectedCount) * 100);
    };

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

    // Dynamic data from API, with fallbacks
    // City: prefer Expo Location city, fallback to API timezone city, then fallback text
    const displayCity = cityName || prayerData?.city || (isLoading ? 'Loading...' : (showPermissionMessage ? 'Enable location' : '--'));

    // Weather: use Open-Meteo data with dynamic icon
    const displayTemperature = weather ? `${weather.temperature}°C` : (isLoading ? '--' : (showPermissionMessage ? '--' : '--'));
    const weatherIcon = weather?.icon || 'cloud-outline';

    // Gregorian date from device (always available, no API dependency)
    const getDeviceGregorianDate = () => {
        const now = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    };

    const displayData = {
        name: userName || 'User',
        city: displayCity,
        temperature: displayTemperature,
        hijriDate: prayerData?.hijriDate || (showPermissionMessage ? '--' : '--'),
        gregorianDate: getDeviceGregorianDate(), // Always from device, never from API
        nextPrayer: prayerData?.nextPrayer || (isLoading ? 'Loading' : (showPermissionMessage ? 'Location required' : 'Loading')),
        nextPrayerTime: prayerData?.nextPrayerTime || (showPermissionMessage ? '--:--' : '--:--'),
    };

    // Calculate progress based on selected and completed activities
    const progress = calculateProgressPercentage();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
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
            await FirebaseService.updateActivityCompletion(activity, newStatus);
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
                    <Text style={[styles.greeting, { color: themeColors.greeting }]}>{getGreeting()}, </Text>
                    <Text style={[styles.userName, { color: themeColors.userName }]}>{displayData.name}</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerIconButton}>
                        <View style={styles.notificationBadge}>
                            <Image source={notifications} style={styles.notificationIcon} />
                        </View>
                    </TouchableOpacity>
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
            <View style={styles.locationCard}>
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
            </View>

            {/* Next Prayer Card with Refresh Button */}
            <View style={styles.nextPrayerCard}>
                <View style={styles.nextPrayerLeft}>
                    <Image
                        source={whiteClock}
                        style={styles.clockIcon}
                    />
                    <Text style={styles.nextPrayerText}>
                        Next: {displayData.nextPrayer} • {displayData.nextPrayerTime}
                    </Text>
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

            {/* Dua of the Day */}
            <TouchableOpacity 
                style={styles.duaCard}
                onPress={() => setDuaExpanded(!duaExpanded)}
                activeOpacity={0.7}
            >
                <View style={styles.duaHeader}>
                    <Text style={styles.duaTitle}>Dua of the Day</Text>
                    <TouchableOpacity>
                        <Image source={heart} style={styles.heartIcon} />
                    </TouchableOpacity>
                </View>
                {todayDua?.arabic?.body && (
                    <>
                        {duaExpanded ? (
                            <>
                                <Text style={[styles.duaArabicExpanded, { color: isEvening ? colors.text.black : colors.text.grey }]}>
                                    {todayDua.arabic.body.replace(/<[^>]*>/g, '')}
                                </Text>
                                <Text style={[styles.duaTransliterationExpanded, { color: isEvening ? colors.text.black : colors.text.grey }]}>
                                    {todayDua.english?.body?.replace(/<[^>]*>/g, '')}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.duaArabic, { color: isEvening ? colors.text.black : colors.text.grey }]} numberOfLines={1}>
                                    {todayDua.arabic.body.replace(/<[^>]*>/g, '')}
                                </Text>
                                <Text style={[styles.duaTransliteration, { color: isEvening ? colors.text.black : colors.text.grey }]} numberOfLines={1}>
                                    {todayDua.english?.body?.replace(/<[^>]*>/g, '')}
                                </Text>
                            </>
                        )}
                        <View style={styles.ringsDivider} />
                        {duaExpanded && (
                            <>
                            </>
                        )}
                        <View style={styles.duaFooter}>
                            <Ionicons 
                                name={duaExpanded ? "chevron-up" : "chevron-down"} 
                                size={20} 
                                color={colors.text.grey}
                            />
                        </View>
                    </>
                )}
            </TouchableOpacity>

            {/* Daily Adhkar */}
            <View style={styles.adhkarCard}>
                <TouchableOpacity
                    style={styles.adhkarHeader}
                    onPress={() => setAdhkarExpanded(!adhkarExpanded)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.adhkarSectionTitle}>Daily Adhkar</Text>
                    <Ionicons
                        name={adhkarExpanded ? "chevron-up" : "chevron-down"}
                        size={22}
                        color={colors.text.grey}
                    />
                </TouchableOpacity>

                {adhkarExpanded && (
                    <View style={styles.adhkarList}>
                        <AdhkarItem
                            title="Morning Adhkar"
                            subtitle="A moment of remembrance to begin your day"
                            onPress={() => {
                                setSelectedAdhkar('Morning Adhkar');
                                setAudioPlayerVisible(true);
                            }}
                            isLast={false}
                        />
                        <AdhkarItem
                            title="Evening Adhkar"
                            subtitle="A gentle closing of the day in remembrance"
                            onPress={() => {
                                setSelectedAdhkar('Evening Adhkar');
                                setAudioPlayerVisible(true);
                            }}
                            isLast={true}
                        />
                    </View>
                )}
            </View>

            {/* AJR Rings - Tap to open Daily Growth */}
            <TouchableOpacity
                style={[styles.ringsCard, { backgroundColor: isEvening ? 'rgba(241, 245, 241, 0.85)' : colors.primary.light }]}
                onPress={() => navigation.navigate('DailyGrowth')}
                activeOpacity={0.8}
            >
                <Text style={styles.ringsSectionTitle}>AJR Rings</Text>
                <View style={styles.ringsDivider} />

                <View style={styles.ringsContent}>
                    <AJRRings progress={progress} activities={selectedActivities} />

                    <View style={styles.legendContainer}>
                        {selectedActivities.prayers && (
                            <ActivityLegendItem
                                color={colors.rings.layer1}
                                label="Prayers"
                                completed={activityCompletion.prayers}
                                activity="prayers"
                                onToggle={handleToggleActivity}
                                disabled={togglingActivity === 'prayers'}
                            />
                        )}
                        {selectedActivities.quran && (
                            <ActivityLegendItem
                                color={colors.rings.layer2}
                                label="Qur'an reading"
                                completed={activityCompletion.quran}
                                activity="quran"
                                onToggle={handleToggleActivity}
                                disabled={togglingActivity === 'quran'}
                            />
                        )}
                        {selectedActivities.dhikr && (
                            <ActivityLegendItem
                                color={colors.rings.layer3}
                                label="Dhikr"
                                completed={activityCompletion.dhikr}
                                activity="dhikr"
                                onToggle={handleToggleActivity}
                                disabled={togglingActivity === 'dhikr'}
                            />
                        )}
                        {selectedActivities.journaling && (
                            <ActivityLegendItem
                                color={colors.rings.innerCircle}
                                label="Journaling"
                                completed={activityCompletion.journaling}
                                activity="journaling"
                                onToggle={handleToggleActivity}
                                disabled={togglingActivity === 'journaling'}
                            />
                        )}
                    </View>
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
            </>
        );
    }

    return (
        <>
            <LinearGradient
                colors={[colors.homeGradient.top, colors.homeGradient.top, colors.homeGradient.bottom]}
                locations={[0, 0.7, 1]}
                style={styles.container}
            >
                {renderContent()}
            </LinearGradient>
            <AudioPlayerModal 
                visible={audioPlayerVisible} 
                title={selectedAdhkar}
                onClose={() => setAudioPlayerVisible(false)}
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
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        flex: 1,
    },
    greeting: {
        fontSize: isSmallDevice ? 20 : 24,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
    },
    userName: {
        fontSize: isSmallDevice ? 20 : 24,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconButton: {
        marginLeft: spacing.sm,
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
    // Next Prayer Card with Refresh Button
    nextPrayerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.button.prayer,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
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
    nextPrayerText: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: '#FFFFFF',
        marginLeft: spacing.sm,
    },
    // Dua Card
    duaCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    duaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    heartIcon: {
        width: 22,
        height: 22,
    },
    duaTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    duaArabic: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
        textAlign: 'right',
        marginBottom: spacing.sm,
        lineHeight: 30,
    },
    duaArabicExpanded: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
        textAlign: 'right',
        marginBottom: spacing.md,
        lineHeight: 30,
        flexWrap: 'wrap',
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
    duaTranslation: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        fontStyle: 'italic',
    },
    // Adhkar Card
    adhkarCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    adhkarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: '#FFFFFF',
    },
    adhkarSectionTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    adhkarList: {
        backgroundColor: colors.primary.light,
    },
    adhkarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
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
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    ringsSectionTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    ringsDivider: {
        height: 1,
        backgroundColor: colors.border.grey,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    ringsContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendContainer: {
        flex: 1,
        marginLeft: spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    legendCheck: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    legendLabel: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.black,
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
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: spacing.sm,
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
    audioModalTitle: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        flex: 1,
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
});

export default HomeScreen;
