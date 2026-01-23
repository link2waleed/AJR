import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Image,
    Animated,
    Dimensions
} from 'react-native';
import { GradientBackground } from '../components';
import { spacing } from '../theme';
import auth from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
    // Animation values for text fade (faint to dark)
    const letterAOpacity = useRef(new Animated.Value(0.15)).current;
    const letterJOpacity = useRef(new Animated.Value(0.15)).current;
    const letterROpacity = useRef(new Animated.Value(0.15)).current;
    const brandTextOpacity = useRef(new Animated.Value(0.15)).current;

    // Animation values for moon
    const moonOpacity = useRef(new Animated.Value(0.15)).current;

    // Animation values for leaf growing from crescent
    const leafScale = useRef(new Animated.Value(0)).current;
    const leafOpacity = useRef(new Animated.Value(0)).current;
    const leafTranslateY = useRef(new Animated.Value(15)).current;

    useEffect(() => {
        // Sequence of animations
        Animated.sequence([
            // Phase 1: Moon fades in first (0.3s)
            Animated.timing(moonOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),

            // Phase 2: Leaf grows from the crescent (0.8s)
            Animated.parallel([
                Animated.timing(leafOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(leafScale, {
                    toValue: 1,
                    tension: 60,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(leafTranslateY, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Phase 3: Letters fade from faint to dark (staggered)
        Animated.stagger(150, [
            Animated.timing(letterAOpacity, {
                toValue: 1,
                duration: 800,
                delay: 400,
                useNativeDriver: true,
            }),
            Animated.timing(letterJOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(letterROpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Phase 4: Brand text fades in
        Animated.timing(brandTextOpacity, {
            toValue: 1,
            duration: 800,
            delay: 1200,
            useNativeDriver: true,
        }).start();

        // Check auth state and navigate after animation completes
        const timer = setTimeout(() => {
            const currentUser = auth().currentUser;
            if (currentUser) {
                // User is logged in - navigate to MainApp (home screen)
                navigation.replace('MainApp');
            } else {
                // User is not logged in - navigate to Welcome screen
                navigation.replace('Welcome');
            }
        }, 3500);

        return () => clearTimeout(timer);
    }, [
        navigation,
        moonOpacity,
        leafScale,
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

                    {/* Leaf - positioned to grow from inside the crescent */}
                    <Animated.Image
                        source={require('../../assets/images/leaf.png')}
                        style={[
                            styles.leaf,
                            {
                                opacity: leafOpacity,
                                transform: [
                                    { scale: leafScale },
                                    { translateY: leafTranslateY },
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
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: spacing.md,
    },
    moon: {
        width: 120,
        height: 120,
        position: 'absolute',
    },
    leaf: {
        width: 55,
        height: 70,
        position: 'absolute',
        // Center the leaf within the moon container
        top: '50%',
        left: '50%',
        marginTop: -35, // Half of height to center vertically
        marginLeft: -27.5, // Half of width to center horizontally
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
