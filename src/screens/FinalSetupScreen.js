import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
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

    // Animation values for leaf growing from crescent
    const leafScale = useRef(new Animated.Value(0)).current;
    const leafOpacity = useRef(new Animated.Value(0)).current;
    const leafTranslateY = useRef(new Animated.Value(15)).current;

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

            // Phase 2: Leaf grows from the crescent
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

        // Phase 3: Text fades in
        Animated.timing(textOpacity, {
            toValue: 1,
            duration: 800,
            delay: 800,
            useNativeDriver: true,
        }).start();

        // Phase 4: Button fades in
        Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 600,
            delay: 1200,
            useNativeDriver: true,
        }).start();
    }, [moonOpacity, leafScale, leafOpacity, leafTranslateY, textOpacity, buttonOpacity]);

    const handleEnterSpace = async () => {
        setCompleting(true);
        try {
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
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
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

                {/* Title */}
                <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
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
        width: 180,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: spacing.xl,
    },
    moon: {
        width: 160,
        height: 160,
        position: 'absolute',
        tintColor: 'rgba(255, 255, 255, 0.9)',
    },
    leaf: {
        width: 70,
        height: 90,
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -45,
        marginLeft: -35,
        tintColor: 'rgba(255, 255, 255, 0.9)',
    },
    title: {
        fontSize: isSmallDevice ? 24 : 28,
        fontWeight: typography.fontWeight.semibold,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: spacing.md,
        lineHeight: isSmallDevice ? 32 : 38,
        paddingHorizontal: spacing.md,
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
