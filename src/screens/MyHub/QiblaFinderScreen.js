import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import StorageService from '../../services/StorageService';
import { colors, spacing, typography } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Text as SvgText, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = Math.floor(width * 0.76);
const CENTER = Math.floor(COMPASS_SIZE / 2);
const DIAL_RADIUS = CENTER - 18;
const KAABA_SIZE = 52;

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Custom Vector Kaaba Icon (crisp 3D isometric representation)
const KaabaIcon = () => (
    <Svg width={KAABA_SIZE} height={KAABA_SIZE} viewBox="0 0 40 40">
        {/* Top Face */}
        <Path d="M 20 6 L 34 13 L 20 20 L 6 13 Z" fill="#242424" />
        {/* Left Face */}
        <Path d="M 6 13 L 20 20 L 20 34 L 6 27 Z" fill="#141414" />
        {/* Right Face */}
        <Path d="M 20 20 L 34 13 L 34 27 L 20 34 Z" fill="#1C1C1C" />
        {/* Gold Kiswah Band Left */}
        <Path d="M 6 17 L 20 24 L 20 26.5 L 6 19.5 Z" fill="#D4AF37" />
        {/* Gold Kiswah Band Right */}
        <Path d="M 20 24 L 34 17 L 34 19.5 L 20 26.5 Z" fill="#E5C158" />
        {/* Gold Door on Left Face */}
        <Path d="M 11 22.5 L 16 25 L 16 31 L 11 28.5 Z" fill="#D4AF37" />
        {/* Small door handle/detail */}
        <Path d="M 13 25.5 L 14.5 26.2 L 14.5 29.5 L 13 28.8 Z" fill="#B8860B" />
    </Svg>
);

const QiblaFinderScreen = ({ navigation }) => {
    const [heading, setHeading] = useState(0);
    const [qiblaDirection, setQiblaDirection] = useState(0);
    const [hasPermission, setHasPermission] = useState(false);

    const headingAnim = useRef(new Animated.Value(0)).current;
    const qiblaAnimValue = useRef(new Animated.Value(0)).current;
    const subscription = useRef(null);

    // Smoothing refs — keep last smoothed heading + accumulator to avoid wrap-around spin
    const lastSmoothed = useRef(null);
    const accumulator = useRef(0);

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

                if (isMounted) {
                    setHasPermission(true);
                }

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
                        const raw = data.trueHeading === -1 ? data.magHeading : data.trueHeading;

                        // First reading — snap instantly
                        if (lastSmoothed.current === null) {
                            lastSmoothed.current = raw;
                            accumulator.current = raw;
                            headingAnim.setValue(raw);
                            setHeading(raw);
                            return;
                        }

                        // Find shortest angular distance to avoid wrap-around spin
                        let diff = raw - lastSmoothed.current;
                        if (diff > 180) diff -= 360;
                        else if (diff < -180) diff += 360;

                        // Low-pass filter: alpha=0.12 → very smooth, low sensitivity
                        const alpha = 0.12;
                        const smoothed = lastSmoothed.current + diff * alpha;
                        const normalised = ((smoothed % 360) + 360) % 360;

                        lastSmoothed.current = normalised;
                        accumulator.current += diff * alpha;

                        setHeading(normalised);

                        // Animate using the accumulator (never wraps, so no wild spins)
                        Animated.timing(headingAnim, {
                            toValue: accumulator.current,
                            duration: 150,
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

    useEffect(() => {
        qiblaAnimValue.setValue(qiblaDirection);
    }, [qiblaDirection]);

    // The needle must counter-rotate against the device heading so it always points North.
    // Using a wide inputRange matching the unbounded accumulator prevents interpolation clamping.
    const needleRotation = headingAnim.interpolate({
        inputRange: [-7200, 0, 7200],
        outputRange: ['7200deg', '0deg', '-7200deg'],
    });

    // Kaaba rotation around center
    const qiblaAnim = Animated.subtract(qiblaAnimValue, headingAnim);
    const qiblaRotation = qiblaAnim.interpolate({
        inputRange: [-360, 360],
        outputRange: ['-360deg', '360deg'],
    });
    const qiblaRotationReverse = qiblaAnim.interpolate({
        inputRange: [-360, 360],
        outputRange: ['360deg', '-360deg'],
    });

    // Determine if the phone is currently aligned to the Qibla direction (within 5 degrees)
    const angleDiff = Math.abs(heading - qiblaDirection);
    const aligned = angleDiff < 5 || angleDiff > 355;

    // Radius of the circle path along which the Kaaba moves (under ticks)
    const distance = DIAL_RADIUS - 25;

    const renderTicks = () => {
        const ticks = [];
        for (let i = 0; i < 72; i++) {
            const deg = i * 5;
            const angle = (deg - 90) * (Math.PI / 180);
            const isCardinal = deg % 90 === 0;
            const isMajor = deg % 30 === 0;
            
            const r_outer = DIAL_RADIUS;
            const r_inner = DIAL_RADIUS - (isCardinal ? 12 : isMajor ? 9 : 5);
            
            const x1 = CENTER + r_outer * Math.cos(angle);
            const y1 = CENTER + r_outer * Math.sin(angle);
            const x2 = CENTER + r_inner * Math.cos(angle);
            const y2 = CENTER + r_inner * Math.sin(angle);

            ticks.push(
                <Line
                    key={`tick-${deg}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth={isMajor ? 1.2 : 0.7}
                />
            );
        }
        return ticks;
    };

    const renderDegreeLabels = () => {
        const labels = [];
        const degrees = [0, 90, 180, 270];
        const r_text = DIAL_RADIUS - 26;

        degrees.forEach((deg) => {
            const angle = (deg - 90) * (Math.PI / 180);
            const x = CENTER + r_text * Math.cos(angle);
            const y = CENTER + r_text * Math.sin(angle);

            labels.push(
                <SvgText
                    key={`label-${deg}`}
                    x={x}
                    y={y}
                    fill="rgba(255, 255, 255, 0.55)"
                    fontSize="9.5"
                    fontWeight="500"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    {deg}°
                </SvgText>
            );
        });
        return labels;
    };

    return (
        <LinearGradient colors={['#b8cfc2', '#dfcca9']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Feather name="arrow-left" size={24} color="#2D3D32" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Qibla Finder</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Compass Area */}
                    <View style={styles.compassContainer}>
                        <View style={{
                            width: COMPASS_SIZE,
                            height: COMPASS_SIZE,
                            position: 'relative',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            {/* Static Cardinal Directions (Outside) */}
                            <Text style={styles.cardinalN}>N</Text>
                            <Text style={styles.cardinalE}>E</Text>
                            <Text style={styles.cardinalS}>S</Text>
                            <Text style={styles.cardinalW}>W</Text>

                            {/* Static Compass Dial */}
                            <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} style={StyleSheet.absoluteFill}>
                                <Circle
                                    cx={CENTER}
                                    cy={CENTER}
                                    r={DIAL_RADIUS}
                                    fill="#658576"
                                />
                                {renderTicks()}
                                {renderDegreeLabels()}
                            </Svg>

                            {/* Rotating Red Needle (North Pointer) */}
                            <Animated.View style={[
                                styles.needleContainer,
                                {
                                    transform: [{ rotate: qiblaRotation }]
                                }
                            ]}>
                                <Svg width={COMPASS_SIZE} height={COMPASS_SIZE}>
                                    <Path
                                        d={`M ${CENTER - 4} ${CENTER} L ${CENTER} ${CENTER - DIAL_RADIUS + 20} L ${CENTER + 4} ${CENTER} Z`}
                                        fill="#B84A4A"
                                    />
                                </Svg>
                            </Animated.View>

                            {/* Center Pivot Pin */}
                            <View style={styles.pivotContainer}>
                                <Svg width={24} height={24} viewBox="0 0 24 24">
                                    <Circle cx={12} cy={12} r={5.5} fill="#FFFFFF" stroke="#DFC08A" strokeWidth={3.5} />
                                </Svg>
                            </View>

                            {/* Rotating Kaaba Icon (Stays Upright) */}
                            <Animated.View style={[
                                styles.kaabaContainer,
                                {
                                    transform: [
                                        { rotate: qiblaRotation },
                                        { translateY: -distance },
                                        { rotate: qiblaRotationReverse }
                                    ]
                                }
                            ]}>
                                <KaabaIcon />
                            </Animated.View>
                        </View>
                    </View>

                    {/* Dynamic Bottom Text */}
                    <View style={styles.bottomArea}>
                        {aligned ? (
                            <Text style={styles.alignmentText}>
                                {"You are now aligned to the direction of\nthe Kaaba"}
                            </Text>
                        ) : (
                            <Text style={[styles.alignmentText, styles.alignmentTextInactive]}>
                                {"Rotate your device to align with\nthe Kaaba"}
                            </Text>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
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
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3D32',
    },
    compassContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardinalN: {
        position: 'absolute',
        top: CENTER - DIAL_RADIUS - 28,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        color: '#B03F3F',
    },
    cardinalS: {
        position: 'absolute',
        top: CENTER + DIAL_RADIUS + 8,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '400',
        fontStyle: 'italic',
        color: '#6D8072',
    },
    cardinalE: {
        position: 'absolute',
        top: CENTER - 13,
        left: CENTER + DIAL_RADIUS + 10,
        fontSize: 18,
        fontWeight: '400',
        fontStyle: 'italic',
        color: '#6D8072',
    },
    cardinalW: {
        position: 'absolute',
        top: CENTER - 13,
        right: CENTER + DIAL_RADIUS + 10,
        fontSize: 18,
        fontWeight: '400',
        fontStyle: 'italic',
        color: '#6D8072',
    },
    needleContainer: {
        position: 'absolute',
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
    },
    pivotContainer: {
        position: 'absolute',
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    kaabaContainer: {
        position: 'absolute',
        left: CENTER - KAABA_SIZE / 2,
        top: CENTER - KAABA_SIZE / 2,
        width: KAABA_SIZE,
        height: KAABA_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    bottomArea: {
        paddingBottom: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alignmentText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontStyle: 'italic',
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: 50,
        color: '#5A6B5D',
    },
    alignmentTextInactive: {
        color: 'rgba(90, 107, 93, 0.45)',
    },
});

export default QiblaFinderScreen;
