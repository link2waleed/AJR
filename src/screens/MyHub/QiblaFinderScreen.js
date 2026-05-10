import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import StorageService from '../../services/StorageService';
import HomeGradient from '../../components/HomeGradient';
import { colors, spacing, typography } from '../../theme';
import Svg, { Circle, Line, Text as SvgText, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = Math.floor(width * 0.75);
const CENTER = Math.floor(COMPASS_SIZE / 2);

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const QiblaFinderScreen = ({ navigation }) => {
    const [heading, setHeading] = useState(0);
    const [qiblaDirection, setQiblaDirection] = useState(0);
    const [hasPermission, setHasPermission] = useState(false);

    const headingAnim = useRef(new Animated.Value(0)).current;
    const subscription = useRef(null);

    const handleBack = () => navigation.goBack();

    // Calculate Qibla direction based on user's location
    const calculateQiblaDirection = (userLat, userLng) => {
        const toRadians = (deg) => (deg * Math.PI) / 180;
        const toDegrees = (rad) => (rad * 180) / Math.PI;

        const lat1 = toRadians(userLat);
        const lng1 = toRadians(userLng);
        const lat2 = toRadians(KAABA_LAT);
        const lng2 = toRadians(KAABA_LNG);

        const dLng = lng2 - lng1;

        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

        let bearing = toDegrees(Math.atan2(y, x));
        bearing = (bearing + 360) % 360;

        return bearing;
    };

    useEffect(() => {
        let isMounted = true;

        const setupLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                setHasPermission(true);

                // 1. Try to get cached location from StorageService first (Instant)
                const storedLoc = await StorageService.getLocation();
                if (isMounted && storedLoc) {
                    const qibla = calculateQiblaDirection(storedLoc.latitude, storedLoc.longitude);
                    setQiblaDirection(qibla);
                }

                // 2. Try to get last known location from device (Very Fast)
                const lastKnown = await Location.getLastKnownPositionAsync({});
                if (isMounted && lastKnown) {
                    const qibla = calculateQiblaDirection(lastKnown.coords.latitude, lastKnown.coords.longitude);
                    setQiblaDirection(qibla);
                }

                // Watch heading for compass rotation (True North)
                subscription.current = await Location.watchHeadingAsync((data) => {
                    if (isMounted) {
                        const newHeading = data.trueHeading === -1 ? data.magHeading : data.trueHeading;
                        setHeading(newHeading);

                        Animated.timing(headingAnim, {
                            toValue: newHeading,
                            duration: 100,
                            useNativeDriver: true,
                        }).start();
                    }
                });

                // 3. Get fresh location for maximum accuracy (Standard Speed)
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(location => {
                    if (isMounted && location) {
                        const qibla = calculateQiblaDirection(location.coords.latitude, location.coords.longitude);
                        setQiblaDirection(qibla);
                    }
                }).catch(e => console.warn(e));

            } catch (error) {
                console.error('Error setting up Qibla sensors:', error);
            }
        };

        setupLocation();

        return () => {
            isMounted = false;
            if (subscription.current) {
                subscription.current.remove();
            }
        };
    }, []);

    // Interpolate rotation for smooth movement
    const rotation = headingAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '-360deg'],
    });

    return (
        <HomeGradient>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Qibla Finder</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Compass Container */}
                    <View style={styles.compassContainer}>
                        <Animated.View style={{
                            width: COMPASS_SIZE,
                            height: COMPASS_SIZE,
                            transform: [{ rotate: rotation }],
                            marginBottom: 60,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            {/* Static Cardinal Directions (Outside) */}
                            {/* Fixed positions to be correct: N at top, E at right, S at bottom, W at left */}
                            <Text style={[styles.cardinalOutside, { color: '#D32F2F', top: -28, left: CENTER - 15 }]}>N</Text>
                            <Text style={[styles.cardinalOutside, { color: '#7A8A7A', right: -28, top: CENTER - 15 }]}>E</Text>
                            <Text style={[styles.cardinalOutside, { color: '#7A8A7A', bottom: -28, left: CENTER - 15 }]}>S</Text>
                            <Text style={[styles.cardinalOutside, { color: '#7A8A7A', left: -28, top: CENTER - 15 }]}>W</Text>

                            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE}>
                                <Defs>
                                    <LinearGradient id="compassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <Stop offset="0%" stopColor="#7A9181" stopOpacity="1" />
                                        <Stop offset="100%" stopColor="#6A8171" stopOpacity="1" />
                                    </LinearGradient>
                                </Defs>

                                {/* Outer Circle */}
                                <Circle
                                    cx={CENTER}
                                    cy={CENTER}
                                    r={CENTER - 10}
                                    fill="url(#compassGrad)"
                                    stroke="#5A7161"
                                    strokeWidth="2"
                                />

                                {/* Inner Circle Area */}
                                <Circle
                                    cx={CENTER}
                                    cy={CENTER}
                                    r={CENTER - 50}
                                    fill="#7A9181"
                                    opacity="0.9"
                                />

                                {/* Degree markers and labels */}
                                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((degree) => {
                                    const angle = (degree - 90) * (Math.PI / 180);
                                    const x1 = CENTER + (CENTER - 15) * Math.cos(angle);
                                    const y1 = CENTER + (CENTER - 15) * Math.sin(angle);
                                    const x2 = CENTER + (CENTER - 35) * Math.cos(angle);
                                    const y2 = CENTER + (CENTER - 35) * Math.sin(angle);

                                    const textX = CENTER + (CENTER - 50) * Math.cos(angle);
                                    const textY = CENTER + (CENTER - 50) * Math.sin(angle);

                                    return (
                                        <React.Fragment key={degree}>
                                            <Line
                                                x1={x1}
                                                y1={y1}
                                                x2={x2}
                                                y2={y2}
                                                stroke="#E8E8E8"
                                                strokeWidth="1"
                                            />
                                            <SvgText
                                                x={textX}
                                                y={textY}
                                                fill="#E8E8E8"
                                                fontSize="10"
                                                fontWeight="500"
                                                textAnchor="middle"
                                                alignmentBaseline="middle"
                                            >
                                                {degree}°
                                            </SvgText>
                                        </React.Fragment>
                                    );
                                })}

                                {/* Red Needle pointing towards Qibla */}
                                <G transform={`rotate(${qiblaDirection}, ${CENTER}, ${CENTER})`}>
                                    <Path
                                        d={`M ${CENTER - 3} ${CENTER} L ${CENTER + 3} ${CENTER} L ${CENTER} 25 Z`}
                                        fill="#D32F2F"
                                    />
                                </G>
                            </Svg>

                            {/* Kaaba icon in center (Using View for perfect alignment) */}
                            <View
                                style={[
                                    StyleSheet.absoluteFill,
                                    { justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }
                                ]}
                            >
                                <Text style={{
                                    fontSize: 35,
                                    transform: [{ rotate: '180deg' }],
                                    marginTop: Platform.OS === 'ios' ? -12 : 0 // Significant nudge UP to align with needle base
                                }}>
                                    🕋
                                </Text>
                            </View>
                        </Animated.View>

                        {/* Direction Text */}
                        <View style={styles.directionInfo}>
                            <Text style={styles.directionText}>
                                Qibla: {Math.round(qiblaDirection)}°
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </HomeGradient>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
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
    compassContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cardinalOutside: {
        position: 'absolute',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        width: 30,
    },
    directionInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        marginTop: 20,
    },
    directionText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.black,
        textAlign: 'center',
    },
});

export default QiblaFinderScreen;
