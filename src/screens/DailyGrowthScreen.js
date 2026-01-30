import React, { useState, useEffect } from 'react';
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
            <View style={styles.statRow}>
                <Text style={styles.statText}>{stat}</Text>
                {streak && <Text style={styles.streakText}> · {streak} day streak 🔥</Text>}
            </View>

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

    // Calculate overall progress
    const calculateProgressPercentage = () => {
        const selectedCount = Object.values(selectedActivities).filter(v => v).length;
        if (selectedCount === 0) return 0;

        const completedCount = Object.entries(activityCompletion)
            .filter(([activity, completed]) => selectedActivities[activity] && completed)
            .length;

        return Math.round((completedCount / selectedCount) * 100);
    };

    const overallProgress = calculateProgressPercentage();

    // Fetch activity data from Firebase
    useEffect(() => {
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
            unsubscribeOnboarding();
            unsubscribeProgress();
        };
    }, []);

    // Activity data - in real app, this would come from context/storage
    const activities = [
        {
            icon: prayerIcon,
            title: 'Prayer',
            progress: 80,
            progressColor: colors.rings.layer1,
            stat: '4 of 5 prayers completed',
            streak: null,
            description: 'Showing up regularly brings light to your day',
            buttonText: 'Review prayer times',
        },
        {
            icon: quranIcon,
            title: 'Quran',
            progress: 45,
            progressColor: colors.rings.layer2,
            stat: '2 pages read',
            streak: 7,
            description: 'Even a single verse is a form of nourishment',
            buttonText: 'Continue Reading',
        },
        {
            icon: dhikrIcon,
            title: 'Dhikr',
            progress: 67,
            progressColor: colors.rings.layer3,
            stat: '67 of 100',
            streak: 5,
            description: 'Remembrance keeps the heart awake',
            buttonText: 'Continue Dhikr',
        },
        {
            icon: journalIcon,
            title: 'Journaling',
            progress: 80,
            progressColor: colors.rings.innerCircle,
            stat: 'Entry completed',
            streak: 12,
            description: 'Reflection is a form of gratitude',
            buttonText: 'Write a Reflection',
        },
    ];

    // Find the weakest activity for personalized message
    const weakestActivity = activities.reduce((min, act) => act.progress < min.progress ? act : min, activities[0]);

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
                    <AJRRings progress={overallProgress} />
                </View>

                {/* Activity Cards */}
                {activities.map((activity, index) => (
                    <ActivityCard
                        key={index}
                        icon={activity.icon}
                        title={activity.title}
                        progress={activity.progress}
                        progressColor={activity.progressColor}
                        stat={activity.stat}
                        streak={activity.streak}
                        description={activity.description}
                        buttonText={activity.buttonText}
                        onButtonPress={() => { }}
                    />
                ))}

                {/* Personalized Message Card */}
                <View style={styles.messageCard}>
                    <Text style={styles.messageGreeting}>Hey, {userName}</Text>
                    <Text style={styles.messageText}>
                        Your {weakestActivity.title} reading could use a little love today. Spend a few moments connecting with the {weakestActivity.title}.
                    </Text>
                    <TouchableOpacity style={styles.messageButton}>
                        <Text style={styles.messageButtonText}>Continue</Text>
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

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
