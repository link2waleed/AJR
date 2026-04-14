import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    Easing,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../theme';
import FirebaseService from '../services/FirebaseService';
import auth from '@react-native-firebase/auth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const FinalSetupScreen = ({ navigation }) => {
    // Animation values for moon
    const moonOpacity = useRef(new Animated.Value(0.15)).current;

    // Animation values for flower growing from crescent (grows slowly upward)
    const leafScaleY = useRef(new Animated.Value(0)).current;  // height grows first
    const leafScaleX = useRef(new Animated.Value(0)).current;  // width blooms after
    const leafOpacity = useRef(new Animated.Value(0)).current;
    const leafTranslateY = useRef(new Animated.Value(25)).current; // starts lower, rises up

    // Animation values for text and button
    const textOpacity = useRef(new Animated.Value(0)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;

    const [completing, setCompleting] = useState(false);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        const user = auth().currentUser;
        if (user) {
            const displayName = user.email?.split('@')[0] || 'User';
            setUserName(displayName);
        }
    }, []);

    useEffect(() => {
        // Sequence of animations
        Animated.sequence([
            // Phase 1: Moon fades in first
            Animated.timing(moonOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),

            // Small pause before flower starts growing
            Animated.delay(300),

            // Phase 2: Flower slowly grows upward from the moon base
            Animated.parallel([
                // Fade in gently as it starts growing
                Animated.timing(leafOpacity, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                // Grow height (scaleY) slowly — like a stem rising
                Animated.timing(leafScaleY, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.bezier(0.2, 0.0, 0.3, 1.0),
                    useNativeDriver: true,
                }),
                // Width blooms in slightly after height (organic feel)
                Animated.sequence([
                    Animated.delay(300),
                    Animated.timing(leafScaleX, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
                        useNativeDriver: true,
                    }),
                ]),
                // Rise upward as it grows
                Animated.timing(leafTranslateY, {
                    toValue: 0,
                    duration: 1800,
                    easing: Easing.bezier(0.2, 0.0, 0.3, 1.0),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Phase 3: Text fades in (delayed to wait for longer grow animation)
        Animated.timing(textOpacity, {
            toValue: 1,
            duration: 800,
            delay: 2200,
            useNativeDriver: true,
        }).start();

        // Phase 4: Button fades in
        Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 600,
            delay: 2800,
            useNativeDriver: true,
        }).start();
    }, [moonOpacity, leafScaleY, leafScaleX, leafOpacity, leafTranslateY, textOpacity, buttonOpacity]);

    const handleEnterSpace = async () => {
        setCompleting(true);
        try {
            // Get selected activities and dhikr list
            const onboardingData = await new Promise((resolve) => {
                const unsubscribe = FirebaseService.listenToOnboardingInfo((data) => {
                    unsubscribe();
                    resolve(data);
                });
            });

            const selectedActivities = onboardingData.selectedActivities || {};

            // Reset dhikr progress to zero for all selected dhikrs
            if (selectedActivities.dhikr) {
                const dhikrs = onboardingData.dikar || [];
                for (const dhikrItem of dhikrs) {
                    try {
                        await FirebaseService.saveDhikrProgress(dhikrItem.word, 0);
                    } catch (error) {
                        console.warn(`Failed to reset dhikr ${dhikrItem.word}:`, error);
                    }
                }
            }

            // Reset prayer completion for today to all false
            if (selectedActivities.prayers) {
                try {
                    await FirebaseService.savePrayerCompletion({
                        Fajr: false,
                        Dhuhr: false,
                        Asr: false,
                        Maghrib: false,
                        Isha: false,
                    });
                } catch (error) {
                    console.warn('Failed to reset prayer progress:', error);
                }
            }

            // Reset quran reading time for today to 0
            if (selectedActivities.quran) {
                try {
                    await FirebaseService.saveDailyReadingTime(0);
                } catch (error) {
                    console.warn('Failed to reset quran progress:', error);
                }
            }

            // Reset activityProgress manual-toggle overrides so all rings recalculate
            // from real data instead of persisting stale 100% flags after preference changes
            try {
                const todayStr = FirebaseService.getLocalDateKey();
                await FirebaseService.resetActivityProgress(todayStr);
            } catch (error) {
                console.warn('Failed to reset activityProgress flags:', error);
            }

            // Mark onboarding as complete in Firebase
            await FirebaseService.completeOnboarding();

            // Initialize journals document for future entries
            await FirebaseService.initializeJournals();

            // Navigate to main app with bottom tabs and reset stack so user can't go back
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
            });
        } catch (error) {
            console.error('Error completing onboarding:', error);
            Alert.alert('Error', 'Failed to complete setup. Please try again.');
            setCompleting(false);
        }
    };

    return (
        <LinearGradient
            colors={['#cdb469ff', '#a0aea0ff', '#2e543dff']}
            locations={[0, 0.35, 0.95]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.container}
        >
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        navigation.goBack();
                    }}

                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                </TouchableOpacity>
                {/* Logo Container - Moon and Leaf */}
                <View style={styles.logoContainer}>
                    {/* Moon (Crescent) */}
                    <Animated.Image
                        source={require('../../assets/images/moon.png')}
                        style={[styles.moon, { opacity: moonOpacity }]}
                        resizeMode="contain"
                    />

                    {/* Flower - grows slowly upward from the crescent moon */}
                    <Animated.Image
                        source={require('../../assets/images/leaf.png')}
                        style={[
                            styles.leaf,
                            {
                                opacity: leafOpacity,
                                transform: [
                                    { translateY: leafTranslateY },
                                    { scaleY: leafScaleY },
                                    { scaleX: leafScaleX },
                                ],
                            },
                        ]}
                        resizeMode="contain"
                    />
                </View>

                {/* Title */}
                <Animated.Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.title, { opacity: textOpacity }]}
                >
                    Grounded in intention
                </Animated.Text>
                {/* Subtitle */}
                <Animated.Text style={[styles.subtitle, { opacity: textOpacity }]}>
                    Built to support consistency and purpose
                </Animated.Text>

                {/* Enter Button */}
                <Animated.View style={[styles.buttonWrapper, { opacity: buttonOpacity }]}>
                    <TouchableOpacity
                        style={styles.enterButton}
                        onPress={handleEnterSpace}
                        disabled={completing}
                    >
                        <Text style={styles.enterButtonText}>
                            {completing ? 'Completing...' : 'Enter Your Space'}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: horizontalPadding,
        paddingBottom: screenHeight * 0.1,
    },
    backButton: {
        position: 'absolute',
        top: spacing.lg,
        left: spacing.md,
        padding: spacing.sm,
        zIndex: 10,
    },
    logoContainer: {
        width: 150,
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: spacing.xl,
    },
    moon: {
        width: 130,
        height: 130,
        position: 'absolute',
        tintColor: 'rgba(255, 255, 255, 0.9)',
    },
    leaf: {
        width: 58,
        height: 75,
        position: 'absolute',
        // Anchor at the bottom-center so it grows upward from moon base
        bottom: '26%',
        left: '50%',
        marginLeft: -29,
        tintColor: 'rgba(255, 255, 255, 0.9)',
    },
    title: {
        fontSize: isSmallDevice ? 24 : 24,
        fontWeight: typography.fontWeight.medium,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: spacing.md,
        lineHeight: isSmallDevice ? 32 : 38,
        paddingHorizontal: spacing.sm,
    },
    subtitle: {
        fontSize: isSmallDevice ? 14 : 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: spacing.xxl,
    },
    buttonWrapper: {
        width: '100%',
    },
    enterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(122, 158, 127, 0.8)',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md + 4,
        paddingHorizontal: spacing.xl,
        width: '100%',
        marginTop: spacing.sm,
    },
    enterButtonText: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.medium,
        color: '#FFFFFF',
        marginRight: spacing.sm,
    },
});

export default FinalSetupScreen;
