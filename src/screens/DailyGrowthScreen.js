import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../theme';
import auth from '@react-native-firebase/auth';
import FirebaseService from '../services/FirebaseService';
import AJRRings from '../components/AJRRings';

// Icons
import prayerIcon from '../../assets/images/habits.png';
import quranIcon from '../../assets/images/quran-pak.png';
import dhikrIcon from '../../assets/images/dhikr.png';
import journalIcon from '../../assets/images/journal.png';
import notificationIcon from '../../assets/images/notification-bing.png';
import note from '../../assets/images/inspiration.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

/**
 * Activity Card Component
 * Shows progress for each activity type (Prayer, Quran, Dhikr, Journaling)
 */
const ActivityCard = ({
    icon,
    title,
    progress,
    progressColor,
    stat,
    streak,
    description,
    buttonText,
    onButtonPress
}) => {
    return (
        <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
                <View style={styles.activityTitleRow}>
                    <View style={styles.activityIconWrapper}>
                        <Image source={icon} style={styles.activityIcon} resizeMode="contain" />
                    </View>
                    <Text style={styles.activityTitle}>{title}</Text>
                </View>
                <Text style={styles.activityPercent}>{progress}%</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: progressColor }]} />
            </View>

            {/* Stat and Streak */}
            {/* <View style={styles.statRow}>
                <Text style={styles.statText}>{stat}</Text>
                {streak > 0 && <Text style={styles.streakText}> · {streak} day streak 🔥</Text>}
            </View> */}

            {/* Description */}
            <Text style={styles.activityDescription}>{description}</Text>

            {/* Action Button */}
            <TouchableOpacity style={styles.activityButton} onPress={onButtonPress}>
                <Text style={styles.activityButtonText}>{buttonText}</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

const DailyGrowthScreen = ({ navigation }) => {
    // Get user name from Firebase Auth
    const user = auth().currentUser;
    const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Friend';

    // State for activity data
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

    // State for Quran stats
    const [quranStats, setQuranStats] = useState({
        seconds: 0,
        streak: 0,
        goalMinutes: 15 // Default goal
    });

    // State for Dhikr stats
    const [dhikrStats, setDhikrStats] = useState({
        totalGoal: 0,
        totalCompleted: 0,
        streak: 0
    });

    // State for Journaling stats
    const [journalStats, setJournalStats] = useState({
        completedToday: false,
        streak: 0,
    });

    // State for Prayer stats
    const [prayerStats, setPrayerStats] = useState({
        Fajr: false,
        Dhuhr: false,
        Asr: false,
        Maghrib: false,
        Isha: false,
    });

    // Get individual percentages with manual toggle support
    const getQuranPercentage = () => {
        const goal = quranStats.goalMinutes || 15;
        const percentage = (quranStats.seconds / (goal * 60)) * 100;
        const actualPercentage = Math.min(Math.round(percentage), 100);
        return activityCompletion.quran ? 100 : actualPercentage;
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
        if (!prayerStats) {
            return { completed: 0, total: 5, percentage: 0, stat: '0 of 5 prayers completed' };
        }
        const completed = Object.values(prayerStats).filter(v => v).length;
        const total = 5;
        const actualPercentage = Math.round((completed / total) * 100);
        const percentage = activityCompletion.prayers ? 100 : actualPercentage;
        return { completed, total, percentage, stat: `${completed} of ${total} prayers completed` };
    };

    const prayerCompletion = getPrayerStats();

    // Calculate overall progress using average of individual percentages
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

    const overallProgress = calculateProgressPercentage();

    // Fetch activity data from Firebase
    useEffect(() => {
        // Listen to prayer completion
        const unsubscribePrayer = FirebaseService.listenToPrayerCompletion(
            (completion) => {
                setPrayerStats(completion);
                console.log('Prayer stats updated:', completion);
            },
            (error) => {
                console.error('Error listening to prayer completion:', error);
            }
        );

        // Listen to onboarding-info for selected activities AND Quran stats
        const unsubscribeOnboarding = FirebaseService.listenToOnboardingInfo(
            async (data) => {
                if (data.selectedActivities) {
                    setSelectedActivities(data.selectedActivities);
                }
                if (data.quran) {
                    setQuranStats(prev => ({
                        ...prev,
                        goalMinutes: data.quran.minutesDay || 15
                    }));
                }

                // Fetch Dhikr stats
                if (data.dikar && Array.isArray(data.dikar)) {
                    const totalGoal = data.dikar.reduce((sum, dhikr) => sum + (dhikr.counter || 0), 0);

                    // Fetch progress
                    try {
                        const dhikrProgress = await FirebaseService.getDhikrProgress();
                        const totalCompleted = Object.values(dhikrProgress).reduce((sum, count) => sum + count, 0);

                        setDhikrStats({
                            totalGoal,
                            totalCompleted,
                            streak: 0 // TODO: Implement dhikr streak if needed
                        });
                    } catch (error) {
                        console.error('Error fetching dhikr progress:', error);
                        setDhikrStats({
                            totalGoal,
                            totalCompleted: 0,
                            streak: 0
                        });
                    }
                }

                // Fetch journaling stats
                try {
                    const stats = await FirebaseService.getJournalStats();
                    setJournalStats(stats);
                } catch (error) {
                    console.error('Error fetching journal stats:', error);
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

        // Listen to daily Quran stats
        const unsubscribeQuran = FirebaseService.listenToDailyQuran((stats) => {
            console.log('Daily Quran Stats Updated:', stats);
            setQuranStats(prev => ({
                ...prev,
                seconds: stats.seconds,
                streak: stats.streak
            }));
        });

        // Listen to daily Journal stats
        const unsubscribeJournal = FirebaseService.listenToDailyJournal((stats) => {
            console.log('Daily Journal Stats Updated:', stats);
            setJournalStats(stats);
        });

        return () => {
            unsubscribePrayer();
            unsubscribeOnboarding();
            unsubscribeProgress();
            unsubscribeQuran();
            unsubscribeJournal();
        };
    }, []);

    // DailyGrowthScreen displays real-time stats via Firebase listeners
    // HomeScreen handles dailyProgress calculation and Firebase sync
    // Removed redundant saveProgress() call - prevents duplicate API calls when opening screen from AJR rings

    // Stats are kept in sync via real-time listeners in useEffect above
    // Removed redundant useFocusEffect API calls - listeners automatically sync when screen refocuses

    // Format seconds to readable string
    const formatReadingTime = (totalSeconds) => {
        if (!totalSeconds) return '0 min read';
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (mins === 0) return `${secs} sec read`;
        return `${mins} min ${secs} sec read`;
    };

    // Activity data with navigation actions
    const handleActivityPress = (activityTitle) => {
        switch (activityTitle) {
            case 'Prayer':
                navigation.navigate('PrayerTimes');
                break;
            case 'Quran':
                navigation.navigate('Quran');
                break;
            case 'Dhikr':
                navigation.navigate('Dhikr');
                break;
            case 'Journaling':
                navigation.navigate('Journal');
                break;
            default:
                break;
        }
    };

    const activities = [
        {
            id: 'prayers',
            icon: prayerIcon,
            title: 'Prayer',
            progress: prayerCompletion.percentage,
            progressColor: colors.rings.layer1,
            stat: prayerCompletion.stat,
            streak: null,
            description: 'Showing up regularly brings light to your day',
            buttonText: 'Review prayer times',
        },
        {
            id: 'quran',
            icon: quranIcon,
            title: 'Quran',
            progress: getQuranPercentage(),
            progressColor: colors.rings.layer2,
            stat: formatReadingTime(quranStats.seconds),
            streak: quranStats.streak,
            description: `Goal: ${quranStats.goalMinutes || 15} mins/day`,
            buttonText: 'Continue Reading',
        },
        {
            id: 'dhikr',
            icon: dhikrIcon,
            title: 'Dhikr',
            progress: getDhikrPercentage(),
            progressColor: colors.rings.layer3,
            stat: `${dhikrStats.totalCompleted} of ${dhikrStats.totalGoal}`,
            streak: dhikrStats.streak,
            description: 'Remembrance keeps the heart awake',
            buttonText: 'Continue Dhikr',
        },
        {
            id: 'journaling',
            icon: journalIcon,
            title: 'Journaling',
            progress: getJournalingPercentage(),
            progressColor: colors.rings.innerCircle,
            stat: journalStats.completedToday ? 'Entry completed' : 'Pending',
            streak: journalStats.streak,
            description: 'Reflection is a form of gratitude',
            buttonText: 'Write a Reflection',
        },
    ];

    // Filter activities based on user selection
    const displayedActivities = activities.filter(activity => selectedActivities[activity.id]);

    // Find the weakest activity for personalized message (fallback to first activity if list empty)
    const weakestActivity = displayedActivities.length > 0
        ? displayedActivities.reduce((min, act) => act.progress < min.progress ? act : min, displayedActivities[0])
        : activities[0]; // Fallback if nothing selected

    return (
        <LinearGradient
            colors={[colors.homeGradient.top, colors.homeGradient.top, colors.homeGradient.bottom]}
            locations={[0, 0.7, 1]}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Daily Growth</Text>
                <TouchableOpacity style={styles.notificationButton}>
                    <Image source={notificationIcon} style={styles.notificationIcon} resizeMode="contain" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Progress Rings */}
                <View style={styles.ringsSection}>
                    <AJRRings
                        variant="detailed"
                        progress={overallProgress}
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
                </View>

                {/* Activity Cards */}
                {displayedActivities.map((activity, index) => (
                    <ActivityCard
                        key={index}
                        icon={activity.icon}
                        title={activity.title}
                        progress={activity.progress}
                        progressColor={activity.progressColor}
                        // stat={activity.stat}
                        streak={activity.streak}
                        description={activity.description}
                        buttonText={activity.buttonText}
                        onButtonPress={() => handleActivityPress(activity.title)}
                    />
                ))}

                {/* Personalized Message Card - Only show if not all activities completed */}
                {weakestActivity.progress < 100 && (
                    <View style={styles.messageCard}>
                        <Text style={styles.messageGreeting}>Hey, {userName}</Text>
                        <Text style={styles.messageText}>
                            Your {weakestActivity.title} reading could use a little love today. Spend a few moments connecting with the {weakestActivity.title}.
                        </Text>
                        <TouchableOpacity
                            style={styles.messageButton}
                            onPress={() => handleActivityPress(weakestActivity.title)}
                        >
                            <Text style={styles.messageButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bottom Inspiration */}
                <View style={styles.inspirationSection}>
                    <View style={styles.inspirationIconWrapper}>
                        <Image source={note} style={styles.activityIcon} resizeMode="contain" />
                    </View>
                    <Text style={styles.inspirationText}>Growth happens one day at a time</Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.06,
        paddingBottom: spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    notificationButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary.sage,
        borderRadius: 20,
    },
    notificationIcon: {
        width: 20,
        height: 20,
        tintColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingBottom: spacing.xxl,
    },
    // Rings Section - matching HomeScreen exactly
    ringsSection: {
        alignItems: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    ringsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringsCenterText: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringsPercentage: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    ringsLabel: {
        fontSize: isSmallDevice ? 12 : 14,
        color: colors.text.black,
        fontWeight: typography.fontWeight.regular,
    },
    // Activity Cards
    activityCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    activityTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityIconWrapper: {
        width: 40,
        height: 40,
        backgroundColor: '#D8EAD7',
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    activityIcon: {
        width: 22,
        height: 22,
    },
    activityTitle: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    activityPercent: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: colors.rings.separator,
        borderRadius: 3,
        marginBottom: spacing.sm,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    statText: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
    },
    streakText: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
    },
    activityDescription: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
        marginBottom: spacing.md,
    },
    activityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors.primary.sage,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    activityButtonText: {
        fontSize: isSmallDevice ? 12 : 13,
        fontWeight: typography.fontWeight.medium,
        color: '#FFFFFF',
        marginRight: spacing.xs,
    },
    // Message Card
    messageCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    messageGreeting: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    messageText: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: colors.primary.sage,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    messageButtonText: {
        fontSize: isSmallDevice ? 12 : 13,
        fontWeight: typography.fontWeight.medium,
        color: '#FFFFFF',
        marginRight: spacing.xs,
    },
    // Inspiration Section
    inspirationSection: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    inspirationIconWrapper: {
        width: 50,
        height: 50,
        borderRadius: borderRadius.sm,
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    inspirationText: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
});

export default DailyGrowthScreen;