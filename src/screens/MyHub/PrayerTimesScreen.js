import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, typography, borderRadius } from '../../theme';
import PrayerTimeService from '../../services/PrayerTimeService';
import FirebaseService from '../../services/FirebaseService';
import StorageService from '../../services/StorageService';
import * as Location from 'expo-location';

const PrayerTimesScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [prayerData, setPrayerData] = useState(null);
    const [location, setLocation] = useState(null);
    const [customAlarms, setCustomAlarms] = useState([]);
    const [notificationStates, setNotificationStates] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSchool, setSelectedSchool] = useState(1); // 0 = Shafi, 1 = Hanafi
    const schoolLoadedRef = React.useRef(false);

    useEffect(() => {
        // Load school preference and prayer times only once on mount
        const initializeScreen = async () => {
            try {
                const school = await StorageService.getSchoolPreference();
                setSelectedSchool(school);
                schoolLoadedRef.current = true;
                setLoading(true);
                await loadPrayerTimes(new Date(), school);
            } catch (error) {
                console.error('Error initializing screen:', error);
                schoolLoadedRef.current = true;
                setLoading(true);
                await loadPrayerTimes(new Date(), 1);
            }
        };

        initializeScreen();
    }, []);

    useEffect(() => {
        // Only reload prayer times when selected date changes (not on mount/school change)
        if (schoolLoadedRef.current && selectedDate) {
            loadPrayerTimes(selectedDate);
        }
    }, [selectedDate]);

    // Update current time every second for countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const loadPrayerTimes = async (date = new Date(), schoolOverride = null) => {
        try {
            setLoading(true);
            console.log('🕌 Starting to load prayer times for date:', date.toDateString());

            let lat = location?.latitude;
            let lng = location?.longitude;

            // Get location if not already available
            if (!lat || !lng) {
                console.log('Requesting location permission...');
                const { status } = await Location.requestForegroundPermissionsAsync();
                console.log('Location permission status:', status);

                if (status !== 'granted') {
                    Alert.alert(
                        'Permission Denied',
                        'Location permission is required to fetch prayer times for your area.',
                        [
                            { text: 'OK', onPress: () => navigation.goBack() }
                        ]
                    );
                    setLoading(false);
                    return;
                }

                console.log('Getting current location...');
                const currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                lat = currentLocation.coords.latitude;
                lng = currentLocation.coords.longitude;
                console.log('Location obtained:', { lat, lng });
                setLocation({ latitude: lat, longitude: lng });
            }

            // Fetch prayer times for specific date
            console.log('Fetching prayer times from API...');
            const data = await PrayerTimeService.getCompletePrayerData(lat, lng, date, schoolOverride ?? selectedSchool);
            console.log('Prayer data received:', data);

            if (!data) {
                throw new Error('Failed to fetch prayer times from API');
            }

            setPrayerData(data);

            // Initialize notification states (all enabled by default)
            if (data.timings) {
                const initialStates = {};
                Object.keys(data.timings).forEach(prayer => {
                    if (prayer !== 'Sunrise') {
                        initialStates[prayer] = true;
                    }
                });
                setNotificationStates(initialStates);
                console.log('✅ Prayer times loaded successfully!');
            }

        } catch (error) {
            console.error('❌ Error loading prayer times:', error);
            console.error('❌ Error details:', error.message);
            Alert.alert(
                'Error Loading Prayer Times',
                `Unable to fetch prayer times. Please check your internet connection and try again.\n\nError: ${error.message}`,
                [
                    { text: 'Retry', onPress: () => loadPrayerTimes(selectedDate) },
                    { text: 'Go Back', onPress: () => navigation.goBack() }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => navigation.goBack();

    const handleRefresh = () => {
        // Clear location to force re-fetch, update times for current selected date
        setLocation(null);
        setTimeout(() => loadPrayerTimes(selectedDate), 0);
    };

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 1);
        console.log('⬅️ Previous day clicked. New date:', newDate.toDateString());
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 1);
        console.log('➡️ Next day clicked. New date:', newDate.toDateString());
        setSelectedDate(newDate);
    };

    const handleSettings = () => {
        // Navigate to prayer settings screen
        Alert.alert('Settings', 'Prayer settings coming soon!');
    };

    const handleSchoolChange = async (school) => {
        setSelectedSchool(school);
        await StorageService.saveSchoolPreference(school);
        console.log('🕌 School preference changed to:', school === 0 ? 'Shafi' : 'Hanafi');
    };

    const toggleNotification = (prayerName) => {
        setNotificationStates(prev => ({
            ...prev,
            [prayerName]: !prev[prayerName]
        }));
    };

    const handleAddAlarm = () => {
        Alert.alert('Add Alarm', 'Custom alarm feature coming soon!');
    };

    const getNextPrayerInfo = () => {
        if (!prayerData || !prayerData.timings || !prayerData.timezone) return null;

        // Use location's timezone (same as HomeScreen for sync)
        const timezone = prayerData.timezone;

        try {
            // Get current time in location's timezone
            const now = currentTime;
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });

            const parts = formatter.formatToParts(now);
            const tzYear = parseInt(parts.find(p => p.type === 'year').value, 10);
            const tzMonth = parseInt(parts.find(p => p.type === 'month').value, 10) - 1;
            const tzDay = parseInt(parts.find(p => p.type === 'day').value, 10);
            const tzHours = parseInt(parts.find(p => p.type === 'hour').value, 10);
            const tzMinutes = parseInt(parts.find(p => p.type === 'minute').value, 10);
            const tzSeconds = parseInt(parts.find(p => p.type === 'second').value, 10);

            const currentSeconds = tzHours * 3600 + tzMinutes * 60 + tzSeconds;

            const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

            for (const prayer of prayerOrder) {
                const timeString = prayerData.timings[prayer];
                if (!timeString) continue;

                const [hours, minutes] = timeString.split(':').map(Number);
                const prayerSeconds = hours * 3600 + minutes * 60;

                if (prayerSeconds > currentSeconds) {
                    const diffSeconds = prayerSeconds - currentSeconds;
                    const hoursLeft = Math.floor(diffSeconds / 3600);
                    const minutesLeft = Math.floor((diffSeconds % 3600) / 60);
                    const secondsLeft = diffSeconds % 60;

                    // Format countdown like "starts in 14m 18s" or "starts in 2h 14m 18s"
                    let countdownText = 'starts in ';
                    if (hoursLeft > 0) {
                        countdownText += `${hoursLeft}h `;
                    }
                    if (minutesLeft > 0 || hoursLeft > 0) {
                        countdownText += `${minutesLeft}m `;
                    }
                    countdownText += `${secondsLeft}s`;

                    console.log(`🕌 PrayerTimesScreen: Highlighting next prayer (${timezone}): ${prayer} at ${timeString}`);

                    return {
                        name: prayer,
                        time: timeString,
                        countdown: countdownText
                    };
                }
            }

            // If no prayer left today, return Fajr for tomorrow
            return {
                name: 'Fajr',
                time: prayerData.timings.Fajr,
                countdown: 'tomorrow'
            };
        } catch (error) {
            console.error('Error getting next prayer info with timezone:', error);
            // Fallback to device time if timezone processing fails
            const now = currentTime;
            const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

            const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

            for (const prayer of prayerOrder) {
                const timeString = prayerData.timings[prayer];
                if (!timeString) continue;

                const [hours, minutes] = timeString.split(':').map(Number);
                const prayerSeconds = hours * 3600 + minutes * 60;

                if (prayerSeconds > currentSeconds) {
                    const diffSeconds = prayerSeconds - currentSeconds;
                    const hoursLeft = Math.floor(diffSeconds / 3600);
                    const minutesLeft = Math.floor((diffSeconds % 3600) / 60);
                    const secondsLeft = diffSeconds % 60;

                    let countdownText = 'starts in ';
                    if (hoursLeft > 0) {
                        countdownText += `${hoursLeft}h `;
                    }
                    if (minutesLeft > 0 || hoursLeft > 0) {
                        countdownText += `${minutesLeft}m `;
                    }
                    countdownText += `${secondsLeft}s`;

                    return {
                        name: prayer,
                        time: timeString,
                        countdown: countdownText
                    };
                }
            }

            return {
                name: 'Fajr',
                time: prayerData.timings.Fajr,
                countdown: 'tomorrow'
            };
        }
    };

    const [completedPrayers, setCompletedPrayers] = useState({
        Fajr: false,
        Dhuhr: false,
        Asr: false,
        Maghrib: false,
        Isha: false
    });

    const [prayersSelected, setPrayersSelected] = useState(true);

    // Load prayer completion and preferences from Firebase on mount
    useEffect(() => {
        const loadPrayerCompletion = async () => {
            try {
                const completion = await FirebaseService.getPrayerCompletion();
                setCompletedPrayers(completion);
                console.log('📿 Loaded prayer completion:', completion);
            } catch (error) {
                console.error('Error loading prayer completion:', error);
            }
        };

        const loadPreferences = async () => {
            try {
                const info = await FirebaseService.getOnboardingInfo();
                if (info && info.selectedActivities) {
                    setPrayersSelected(info.selectedActivities.prayers ?? true);
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
            }
        };

        loadPrayerCompletion();
        loadPreferences();

        // Listen to real-time updates
        const unsubscribe = FirebaseService.listenToPrayerCompletion(
            (completion) => {
                setCompletedPrayers(completion);
                console.log('📿 Prayer completion updated:', completion);
            },
            (error) => {
                console.error('Error listening to prayer completion:', error);
            }
        );

        return () => unsubscribe();
    }, []);

    const togglePrayerCompletion = async (prayerName) => {
        if (!completedPrayers) {
            console.error('completedPrayers is undefined');
            return;
        }

        const newCompletion = {
            ...completedPrayers,
            [prayerName]: !(completedPrayers[prayerName] ?? false)
        };

        setCompletedPrayers(newCompletion);

        try {
            await FirebaseService.savePrayerCompletion(newCompletion);
            console.log('Prayer completion saved:', prayerName, newCompletion[prayerName]);
        } catch (error) {
            console.error('Error saving prayer completion:', error);
            // Revert on error
            setCompletedPrayers(completedPrayers);
        }
    };

    const renderPrayerRow = (prayerName, displayName) => {
        if (!prayerData || !prayerData.timings || !prayerData.timings[prayerName]) return null;

        const time = prayerData.timings[prayerName];
        const nextPrayer = getNextPrayerInfo();
        const isNextPrayer = nextPrayer && nextPrayer.name === prayerName;
        const notificationEnabled = notificationStates[prayerName];
        const isCompleted = completedPrayers ? completedPrayers[prayerName] : false;
        const isSunrise = prayerName === 'Sunrise';

        return (
            <View key={prayerName} style={styles.prayerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {/* Prayer Completion Checkbox */}
                    {prayersSelected && !isSunrise && (
                        <TouchableOpacity
                            style={[
                                styles.checkboxBase,
                                isCompleted && styles.checkboxChecked
                            ]}
                            onPress={() => togglePrayerCompletion(prayerName)}
                        >
                            {isCompleted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                        </TouchableOpacity>
                    )}

                    <View style={[styles.prayerNameContainer, (!prayersSelected || isSunrise) && { marginLeft: 0 }]}>
                        <Text style={[
                            styles.prayerName,
                            isNextPrayer && styles.nextPrayerName
                        ]}>
                            {displayName || prayerName}
                        </Text>
                        {isNextPrayer && nextPrayer.countdown !== 'tomorrow' && (
                            <Text style={styles.countdownText}>{nextPrayer.countdown}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.prayerTimeContainer}>
                    <Text style={[
                        styles.prayerTime,
                        isNextPrayer && styles.nextPrayerTime
                    ]}>
                        {time}
                    </Text>
                    {/* {!isSunrise && (
                        <TouchableOpacity
                            onPress={() => toggleNotification(prayerName)}
                            style={styles.notificationButton}
                        >
                            <Ionicons
                                name={notificationEnabled ? "notifications" : "notifications-off-outline"}
                                size={20}
                                color={notificationEnabled ? colors.primary.darkSage : colors.text.grey}
                            />
                        </TouchableOpacity>
                    )} */}
                </View>
            </View>
        );
    };

    if (loading && !prayerData) { // Only show full screen loading if no prayerData is available yet
        return (
            <GradientBackground>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary.sage} />
                        <Text style={styles.loadingText}>Loading Prayer Times...</Text>
                    </View>
                </SafeAreaView>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Prayer Times</Text>
                        <View style={styles.headerRight}>
                            <TouchableOpacity onPress={handleRefresh} style={styles.headerIcon}>
                                <Ionicons name="refresh" size={24} color={colors.text.black} />
                            </TouchableOpacity>
                            {/* <TouchableOpacity onPress={handleSettings} style={styles.headerIcon}>
                                <Ionicons name="settings-outline" size={24} color={colors.text.black} />
                            </TouchableOpacity> */}
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Loading State for date changes */}
                        {loading && prayerData && (
                            <View style={styles.inlineLoadingContainer}>
                                <ActivityIndicator size="small" color={colors.primary.darkSage} />
                                <Text style={styles.inlineLoadingText}>Updating...</Text>
                            </View>
                        )}

                        {/* Location Card */}
                        {prayerData && (
                            <View style={styles.locationCard}>
                                <View style={styles.locationIconContainer}>
                                    <Ionicons name="location" size={24} color={colors.primary.darkSage} />
                                </View>
                                <View style={styles.locationTextContainer}>
                                    <Text style={styles.locationCity}>
                                        {prayerData.city || 'Your Location'}
                                        {prayerData.country && prayerData.country !== 'Asia' && prayerData.country !== 'Europe' && `, ${prayerData.country}`}
                                    </Text>
                                    <Text style={styles.locationSubtext}>
                                        Prayer times for your location ✓
                                    </Text>
                                </View>
                                {/* <TouchableOpacity style={styles.settingsIconContainer}>
                                    <Ionicons name="settings-outline" size={20} color={colors.primary.darkSage} />
                                </TouchableOpacity> */}
                            </View>
                        )}

                        {/* Date Display */}
                        {prayerData && (
                            <View style={styles.dateContainer}>
                                <TouchableOpacity style={styles.dateArrow} onPress={handlePrevDay}>
                                    <Ionicons name="chevron-back" size={24} color={colors.text.black} />
                                </TouchableOpacity>
                                <View style={styles.dateTextContainer}>
                                    <Text style={styles.dateGregorian}>
                                        {prayerData.gregorianDate || selectedDate.toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                    <Text style={styles.dateHijri}>
                                        {prayerData.hijriDate ? `${prayerData.hijriDate} AH` : 'Hijri Date'}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.dateArrow} onPress={handleNextDay}>
                                    <Ionicons name="chevron-forward" size={24} color={colors.text.black} />
                                </TouchableOpacity>
                            </View>
                        )}


                        {/* Hijri Note */}
                        {/* <Text style={styles.hijriNote}>
                            * Note: Hijri date is an approximated value.{' '}
                            <Text style={styles.hijriLink}>Set the offset</Text>
                        </Text> */}

                        <View style={styles.prayerTimesCard}>
                            {prayersSelected && <Text style={styles.markCompletedText}>Mark prayers as completed</Text>}
                            {renderPrayerRow('Fajr')}
                            {renderPrayerRow('Sunrise')}
                            {renderPrayerRow('Dhuhr', 'Zohr')}
                            {renderPrayerRow('Asr')}
                            {renderPrayerRow('Maghrib')}
                            {renderPrayerRow('Isha')}
                        </View>

                        {/* Important Note */}
                        {/* <Text style={styles.importantNote}>
                            * <Text style={styles.importantLink}>Important Note / Contact us</Text> regarding prayer times
                        </Text> */}

                        {/* Custom Alarms Section */}
                        {/* <View style={styles.customAlarmsCard}>
                            <Text style={styles.customAlarmsTitle}>No Custom Alarms</Text>
                        </View> */}

                        {/* Add Alarm Button */}
                        {/* <TouchableOpacity style={styles.addAlarmButton} onPress={handleAddAlarm}>
                            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.addAlarmText}>Alarm</Text>
                        </TouchableOpacity> */}


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
        paddingTop: spacing.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.fontSize.md,
        color: colors.text.black,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 100,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    locationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationCity: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    locationSubtext: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
        marginTop: 2,
    },
    settingsIconContainer: {
        padding: spacing.xs,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    dateArrow: {
        padding: spacing.xs,
    },
    dateTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    dateGregorian: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    dateHijri: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
        marginTop: 2,
    },
    hijriNote: {
        fontSize: 11,
        color: colors.text.grey,
        textAlign: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
    },
    hijriLink: {
        color: '#4A90E2',
        textDecorationLine: 'underline',
    },
    prayerTimesCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    markCompletedText: {
        fontSize: 14,
        color: colors.text.grey,
        marginBottom: spacing.sm,
        textAlign: 'center',
        fontWeight: '500',
    },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    prayerNameContainer: {
        flex: 1,
        flexDirection: 'column',
        marginLeft: spacing.sm, // Add margin to separate from checkbox
    },
    checkboxBase: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.primary.darkSage,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
        backgroundColor: 'transparent',
    },
    checkboxChecked: {
        backgroundColor: colors.primary.darkSage,
    },
    prayerName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    nextPrayerName: {
        fontWeight: typography.fontWeight.bold,
        color: colors.primary.darkSage,
    },
    countdownText: {
        fontSize: 12,
        fontWeight: typography.fontWeight.normal,
        color: colors.text.grey,
        marginTop: 2,
    },
    prayerTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    prayerTime: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    nextPrayerTime: {
        fontWeight: typography.fontWeight.bold,
        color: colors.primary.darkSage,
    },
    notificationButton: {
        padding: spacing.xs,
    },
    importantNote: {
        fontSize: 11,
        color: colors.text.grey,
        textAlign: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
    },
    importantLink: {
        color: '#4A90E2',
        textDecorationLine: 'underline',
    },
    customAlarmsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    customAlarmsTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
    },
    addAlarmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary.sage,
        borderRadius: 30,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        alignSelf: 'flex-end',
        gap: spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    addAlarmText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: '#FFFFFF',
    },
    inlineLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xs,
        marginBottom: spacing.xs,
        gap: spacing.xs,
    },
    inlineLoadingText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
    },
});

export default PrayerTimesScreen;
