import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Image,
    Animated,
    Easing,
    Dimensions
} from 'react-native';
import { GradientBackground } from '../components';
import { spacing } from '../theme';
import auth from '@react-native-firebase/auth';
import FirebaseService from '../services/FirebaseService';
import firebase from '@react-native-firebase/app';
import { ensureFirebaseApp } from '../services/FirebaseInit';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
    // Animation values for AJR letters
    const letterAOpacity = useRef(new Animated.Value(0)).current;
    const letterJOpacity = useRef(new Animated.Value(0)).current;
    const letterROpacity = useRef(new Animated.Value(0)).current;

    // Animation values for moon
    const moonOpacity = useRef(new Animated.Value(0)).current;

    // Animation values for "Water your soul" text
    const brandTextOpacity = useRef(new Animated.Value(0)).current;

    // Animation values for flower growing from crescent (grows slowly upward)
    const leafScaleY = useRef(new Animated.Value(0)).current;  // scale from bottom
    const leafScaleX = useRef(new Animated.Value(0)).current;  // width blooms in slightly after
    const leafOpacity = useRef(new Animated.Value(0)).current;
    const leafTranslateY = useRef(new Animated.Value(30)).current; // starts lower, rises up

    useEffect(() => {
        // Calmer, sequential animation flow
        Animated.sequence([
            // Phase 1: Moon and AJR letters fade in together (1s)
            Animated.parallel([
                // Moon fades in
                Animated.timing(moonOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                // AJR letters appear with slight stagger
                Animated.stagger(120, [
                    Animated.timing(letterAOpacity, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(letterJOpacity, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(letterROpacity, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]),
            ]),

            // Small pause for calm effect
            Animated.delay(400),

            // Phase 2: "Water your soul" text fades in (0.8s)
            Animated.timing(brandTextOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),

            // Small pause before flower starts growing
            Animated.delay(500),

            // Phase 3: Flower slowly grows upward from the moon base
            Animated.parallel([
                // Fade in gently as it starts growing
                Animated.timing(leafOpacity, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                // Grow height (scaleY) slowly from 0 → 1, like a stem rising
                Animated.timing(leafScaleY, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.bezier(0.2, 0.0, 0.3, 1.0), // slow start, smooth finish
                    useNativeDriver: true,
                }),
                // Width blooms in slightly after height starts (feels organic)
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

        // Check auth state and navigate after animation completes
        const timer = setTimeout(() => {
            ensureFirebaseApp();
            const currentUser = auth().currentUser;
            if (currentUser) {
                // User is logged in - check onboarding-process flag
                FirebaseService.getUserRootData()
                    .then((userData) => {
                        if (userData['onboarding-process'] === true) {
                            // Onboarding is incomplete - resume from Name screen
                            navigation.replace('Name');
                        } else {
                            // Onboarding is complete - go to MainApp
                            navigation.replace('MainApp');
                        }
                    })
                    .catch((error) => {
                        console.error('Error checking onboarding status:', error);
                        // Default to MainApp on error
                        navigation.replace('MainApp');
                    });
            } else {
                // User is not logged in - navigate to Welcome screen
                navigation.replace('Welcome');
            }
        }, 5500);

        return () => clearTimeout(timer);
    }, [
        navigation,
        moonOpacity,
        leafScaleY,
        leafScaleX,
        leafOpacity,
        leafTranslateY,
        letterAOpacity,
        letterJOpacity,
        letterROpacity,
        brandTextOpacity
    ]);

    return (
        <GradientBackground>
            <View style={styles.container}>
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

                {/* AJR Letters Container */}
                <View style={styles.lettersContainer}>
                    <Animated.Image
                        source={require('../../assets/images/A.png')}
                        style={[styles.letter, styles.letterA, { opacity: letterAOpacity }]}
                        resizeMode="contain"
                    />
                    <Animated.Image
                        source={require('../../assets/images/J.png')}
                        style={[styles.letter, styles.letterJ, { opacity: letterJOpacity }]}
                        resizeMode="contain"
                    />
                    <Animated.Image
                        source={require('../../assets/images/R.png')}
                        style={[styles.letter, styles.letterR, { opacity: letterROpacity }]}
                        resizeMode="contain"
                    />
                </View>

                {/* Brand Text - WATER YOUR SOUL */}
                <Animated.Image
                    source={require('../../assets/images/brand-text.png')}
                    style={[styles.brandText, { opacity: brandTextOpacity }]}
                    resizeMode="contain"
                />
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    logoContainer: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: spacing.md,
    },
    moon: {
        width: 140,
        height: 140,
        position: 'absolute',
    },
    leaf: {
        width: 68,
        height: 88,
        position: 'absolute',
        // Anchor at the bottom-center of the flower so it grows upward from moon base
        bottom: '26%',
        left: '50%',
        marginLeft: -34, // Half of width to center horizontally
    },
    lettersContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    letter: {
        height: 60,
    },
    letterA: {
        width: 50,
        marginRight: 8,
    },
    letterJ: {
        width: 30,
        marginRight: 8,
    },
    letterR: {
        width: 50,
    },
    brandText: {
        width: width * 0.55,
        height: 20,
        marginTop: spacing.sm,
    },
});

export default SplashScreen;
