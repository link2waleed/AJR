import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useSpeech } from '../../hooks/useSpeech';
import HomeGradient from '../../components/HomeGradient';
import { colors, spacing, borderRadius, typography } from '../../theme';
import FirebaseService from '../../services/FirebaseService';
import auth from '@react-native-firebase/auth'; // Keep auth if used
import { filterJihad } from '../../utils/textFilter';


const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.65;
const STROKE_WIDTH = 18;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const dhikrDetails = {
    'SubhanAllah': { arabic: 'سُبْحَانَ اللّٰهِ', translation: 'Glory be to Allah' },
    'Alhamdulillah': { arabic: 'ٱلْحَمْدُ لِلّٰهِ', translation: 'All praise is due to Allah' },
    'Allahu Akbar': { arabic: 'اللّٰهُ أَكْبَر', translation: 'Allah is the Greatest' },
    'Astaghfirullah': { arabic: 'أَسْتَغْفِرُ اللّٰهَ', translation: 'I seek forgiveness from Allah' },
    'La ilaha illa Allah': { arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ', translation: 'There is no god but Allah' },
    'SubhanAllahi wa bihamdih': { arabic: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ', translation: 'Glory be to Allah and all praise is due to Him' },
    'SubhanAllah Al-Adheem': { arabic: 'سُبْحَانَ اللّٰهِ الْعَظِيمِ', translation: 'Glory be to Allah, the Magnificent' },
    'La hawla wa la quwwata illa billah': { arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ', translation: 'There is no power nor strength except by Allah' },
    'Allahumma salli ala Muhammad': { arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', translation: 'O Allah, send prayers upon Muhammad' },
    // Long kalima might need special handling or shortening for UI
    'Laa ilaaha illallaahu wahdahu laa shareeka lahul-mulku wa lahul-hamdu wa Huwa alaa kulli shayin Qadeer': {
        arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        translation: 'There is no god but Allah alone, He has no partner...'
    }
};

const DhikrScreen = ({ navigation }) => {
    const [userDhikrs, setUserDhikrs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dhikrCounts, setDhikrCounts] = useState({}); // Store counts for all dhikrs
    const [scaleAnim] = useState(new Animated.Value(1));
    const [isLoading, setIsLoading] = useState(true);

    // Use speech hook
    const { speak } = useSpeech();

    // Get current active dhikr data
    const activeDhikrItem = userDhikrs[currentIndex] || { word: 'SubhanAllah', counter: 33 };
    const details = dhikrDetails[activeDhikrItem?.word] || { arabic: activeDhikrItem?.word, translation: '' };
    // Total count from DB/State
    const currentCount = (activeDhikrItem?.word && dhikrCounts[activeDhikrItem.word]) || 0;
    const target = activeDhikrItem?.counter || 33;

    // Track current date for midnight reset
    const getLocalYMD = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const currentDateRef = React.useRef(getLocalYMD());

    // Check for midnight reset
    React.useEffect(() => {
        const interval = setInterval(() => {
            const nowStr = getLocalYMD();
            if (nowStr !== currentDateRef.current) {
                console.log('Midnight crossover in DhikrScreen - Resetting counts');
                currentDateRef.current = nowStr;
                setDhikrCounts({});

                // Force a reset in DB for current item (creates new day entry)
                FirebaseService.saveDhikrProgress(activeDhikrItem.word, 0).catch(console.error);
            }
        }, 60000); // Check every 60 seconds (midnight only happens once per day)

        return () => clearInterval(interval);
    }, [activeDhikrItem.word]);

    // Fetch user dhikrs and their saved progress
    React.useEffect(() => {
        const unsubscribe = FirebaseService.listenToOnboardingInfo(async (data) => {
            if (data.dikar && Array.isArray(data.dikar) && data.dikar.length > 0) {
                setUserDhikrs(data.dikar);

                // Load saved progress
                try {
                    const savedProgress = await FirebaseService.getDhikrProgress();
                    setDhikrCounts(savedProgress);
                    console.log('📥 Loaded dhikr progress:', savedProgress);
                } catch (error) {
                    console.error('Failed to load dhikr progress:', error);
                }
            } else {
                // Default if empty
                setUserDhikrs([{ word: 'SubhanAllah', counter: 33 }]);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleBack = () => navigation.goBack();
    const handleNext = () => {
        if (currentIndex < userDhikrs.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };
    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleIncrement = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.05,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 50,
                useNativeDriver: true,
            }),
        ]).start();

        // Increment count
        const newCount = currentCount + 1;

        // Update local state ONLY - will batch save when screen closes
        setDhikrCounts(prev => ({
            ...prev,
            [activeDhikrItem.word]: newCount
        }));

        console.log(`👆 Dhikr incremented locally: ${activeDhikrItem.word} = ${newCount}`);
    };

    const handleReset = () => {
        // Reset local state ONLY - will batch save when screen closes
        setDhikrCounts(prev => ({
            ...prev,
            [activeDhikrItem.word]: 0
        }));
        console.log('🔄 Reset locally - will save when screen closes');
    };

    // Batch save ALL dhikr counts when user navigates away from screen
    React.useEffect(() => {
        return () => {
            // This cleanup runs when component unmounts (user navigates back/away)
            const saveAllDhikrProgress = async () => {
                try {
                    // Save each dhikr count in batch
                    const promises = Object.entries(dhikrCounts).map(
                        ([dhikrName, count]) => FirebaseService.saveDhikrProgress(dhikrName, count)
                    );
                    await Promise.all(promises);
                    console.log('✅ Batch saved all dhikr progress on screen close:', dhikrCounts);

                    // Check if user completed all goals and update streak
                    let totalGoal = 0;
                    let totalCompleted = 0;
                    userDhikrs.forEach(item => {
                        const goal = item.counter || 33;
                        totalGoal += goal;
                        // Cap each dhikr's count at its own target to prevent overflow
                        totalCompleted += Math.min(dhikrCounts[item.word] || 0, goal);
                    });

                    if (totalCompleted >= totalGoal) {
                        await FirebaseService.updateDhikrStreak();
                        console.log('🔥 Streak updated on screen close');
                    }
                } catch (error) {
                    console.warn('⚠️ Dhikr save queued (will sync when online):', error?.message);
                    // Firestore offline persistence will queue this
                }
            };
            saveAllDhikrProgress();
        };
    }, [dhikrCounts, userDhikrs]);

    // const handleResetToday = async () => {
    //     // Reset UI AND database - user wants to undo their progress
    //     setDhikrCounts(prev => ({
    //         ...prev,
    //         [activeDhikrItem.word]: 0
    //     }));

    //     try {
    //         await FirebaseService.saveDhikrProgress(activeDhikrItem.word, 0);
    //         console.log('🔄 Reset Full (UI & DB) for:', activeDhikrItem.word);
    //     } catch (error) {
    //         console.error('Failed to reset dhikr progress in DB:', error);
    //     }
    // };

    const handleReadAloud = async () => {
        speak(details.arabic);
        // Increment count when read aloud is pressed
        await handleIncrement();
    };

    const progress = Math.min(currentCount / target, 1);
    const strokeDashoffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

    return (
        <HomeGradient>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Dhikr</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Main Card */}
                    <View style={styles.mainCard}>
                        {/* Dhikr Label with Navigation */}
                        <View style={styles.navigationContainer}>
                            <TouchableOpacity
                                onPress={handlePrev}
                                disabled={currentIndex === 0}
                                style={[styles.navButton, { opacity: currentIndex === 0 ? 0 : 1 }]}
                            >
                                <Ionicons name="chevron-back-circle" size={32} color={colors.primary.sage} />
                            </TouchableOpacity>

                            <View style={[styles.textGroup, { height: 160, justifyContent: 'center' }]}>
                                <Text
                                    style={[styles.arabicText, activeDhikrItem.word.length > 40 && { fontSize: 21, marginBottom: 2 }]}
                                >
                                    {filterJihad(details.arabic)}
                                </Text>
                                <Text
                                    style={[styles.transliteration, activeDhikrItem.word.length > 40 && { fontSize: 13 }]}
                                >
                                    {filterJihad(activeDhikrItem.word)}
                                </Text>
                                <Text
                                    style={[styles.translation, activeDhikrItem.word.length > 40 && { fontSize: 12, marginTop: 2 }]}
                                >
                                    "{filterJihad(details.translation)}"
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleNext}
                                disabled={currentIndex === userDhikrs.length - 1}
                                style={[styles.navButton, { opacity: currentIndex === userDhikrs.length - 1 ? 0 : 1 }]}
                            >
                                <Ionicons name="chevron-forward-circle" size={32} color={colors.primary.sage} />
                            </TouchableOpacity>
                        </View>

                        {/* Progress Circle Container */}
                        <TouchableOpacity
                            onPress={handleIncrement}
                            activeOpacity={0.9}
                            style={styles.circleContainer}
                        >
                            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                                {/* Background Circle - Light grey track */}
                                <Circle
                                    cx={CIRCLE_SIZE / 2}
                                    cy={CIRCLE_SIZE / 2}
                                    r={RADIUS}
                                    stroke="rgba(0, 0, 0, 0.05)"
                                    strokeWidth={15}
                                    fill="transparent"
                                />
                                {/* Progress Circle - Bold Dark Sage */}
                                <Circle
                                    cx={CIRCLE_SIZE / 2}
                                    cy={CIRCLE_SIZE / 2}
                                    r={RADIUS}
                                    stroke="#7A9181"
                                    strokeWidth={18}
                                    fill="transparent"
                                    strokeDasharray={CIRCUMFERENCE}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                                />
                            </Svg>

                            <View style={styles.countCenter}>
                                <Animated.Text style={[styles.countText, { transform: [{ scale: scaleAnim }] }]}>
                                    {currentCount}
                                </Animated.Text>
                                <Text style={styles.countSubtext}>Count</Text>

                                {/* Completion Message */}
                                {currentCount >= target && (
                                    <View style={styles.completionBadge}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                        <Text style={styles.completionText}>Target Completed!</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Target Display */}
                        <Text style={styles.targetText}>{currentIndex + 1} / {userDhikrs.length} • Target: {target}</Text>

                        {/* Action Bar */}
                        <View style={styles.actionBar}>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleReset}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="refresh" size={18} color="#7A9181" />
                                </View>
                                <Text style={styles.actionBtnText}>Reset</Text>
                            </TouchableOpacity>

                            {/* <TouchableOpacity style={styles.actionBtn} onPress={handleReadAloud}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="volume-medium" size={18} color="#7A9181" />
                                </View>
                                <Text style={styles.actionBtnText}>Read aloud</Text>
                            </TouchableOpacity> */}

                            {/* <TouchableOpacity style={styles.actionBtn} onPress={handleResetToday}>
                                <Text style={styles.actionBtnText}>Reset Today</Text>
                                <Ionicons name="arrow-forward" size={16} color="#7A9181" />
                            </TouchableOpacity> */}
                        </View>
                    </View>
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

    mainCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        borderRadius: 25,
        paddingTop: 30, // Reduced top padding
        paddingBottom: 50,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    navigationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: spacing.xs,
        marginBottom: 40,
    },
    navButton: {
        padding: spacing.xs,
        justifyContent: 'center',
    },
    textGroup: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: spacing.xs,
    },
    arabicText: {
        fontSize: 30, // Slightly smaller to fit
        fontWeight: 'bold',
        color: colors.text.black,
        marginTop: 10,
        marginBottom: 4,
        textAlign: 'center',
        fontFamily: 'Uthmanic',
    },
    transliteration: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.black,
        textAlign: 'center',
    },
    translation: {
        fontSize: 14,
        color: colors.text.grey,
        fontStyle: 'italic',
        marginTop: 2,
        textAlign: 'center',
    },
    circleContainer: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
    },
    countCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 80,
        fontWeight: '700',
        color: '#6B8272',
    },
    countSubtext: {
        fontSize: 16,
        color: '#6B8272',
        fontWeight: '600',
        marginTop: -10,
    },
    targetText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.black,
        marginBottom: 25,
    },
    actionBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Less opaque, matches the reference image look
        borderRadius: 20,
        height: 55,
        width: "auto",
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(122, 145, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666666',
    },
    completionBadge: {
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completionText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#4CAF50',
        marginTop: 2,
    },
});

export default DhikrScreen;
