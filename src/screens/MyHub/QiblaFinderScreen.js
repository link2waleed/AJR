import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, typography } from '../../theme';
import notificationImg from '../../../assets/images/notification-bing.png';
import Svg, { Circle, Line, Text as SvgText, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.75;
const CENTER = COMPASS_SIZE / 2;

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const QiblaFinderScreen = ({ navigation }) => {
    const [heading, setHeading] = useState(0);
    const [qiblaDirection, setQiblaDirection] = useState(0);
    const [magnetometerSubscription, setMagnetometerSubscription] = useState(null);
    const [hasPermission, setHasPermission] = useState(false);

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
        // Request location permission and get user's location
        const getLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.log('Location permission denied');
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;

                // Calculate Qibla direction
                const qibla = calculateQiblaDirection(latitude, longitude);
                setQiblaDirection(qibla);
                setHasPermission(true);
            } catch (error) {
                console.error('Error getting location:', error);
            }
        };

        getLocation();

        // Subscribe to magnetometer updates
        Magnetometer.setUpdateInterval(100);
        const subscription = Magnetometer.addListener((data) => {
            const { x, y } = data;
            let angle = Math.atan2(y, x) * (180 / Math.PI);
            angle = (angle + 360) % 360;

            // Normalize heading
            let normalizedHeading = 360 - angle;
            setHeading(normalizedHeading);
        });

        setMagnetometerSubscription(subscription);

        // Cleanup
        return () => {
            if (magnetometerSubscription) {
                magnetometerSubscription.remove();
            }
        };
    }, []);

    // Calculate the rotation for the compass
    const compassRotation = -heading;

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Qibla Finder</Text>
                        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications', { source: 'hub' })}>
                            <View style={styles.notificationBadge}>
                                <Image source={notificationImg} style={styles.notificationIcon} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Compass Container */}
                    <View style={styles.compassContainer}>
                        <View style={{ transform: [{ rotate: `${compassRotation}deg` }], marginBottom: 60 }}>
                            {/* Static Cardinal Directions (Outside) */}
                            <Text style={[styles.cardinalOutside, { color: '#D32F2F', top: -28, left: CENTER - 15 }]}>W</Text>
                            <Text style={[styles.cardinalOutside, { color: '#7A8A7A', right: -28, top: CENTER - 15 }]}>E</Text>
                            <Text style={[styles.cardinalOutside, { color: '#7A8A7A', bottom: -28, left: CENTER - 15 }]}>S</Text>
                            <Text style={[styles.cardinalOutside, { color: '#7A8A7A', left: -28, top: CENTER - 15 }]}>N</Text>

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

                                {/* The Fixed Pointer/Arrow as per Reference Image */}
                                <Path
                                    d={`M ${CENTER} 15 L ${CENTER - 20} ${CENTER} L ${CENTER + 20} ${CENTER} Z`}
                                    fill="#D32F2F"
                                />
                                <Path
                                    d={`M ${CENTER} ${COMPASS_SIZE - 15} L ${CENTER - 20} ${CENTER} L ${CENTER + 20} ${CENTER} Z`}
                                    fill="#4EB6AC"
                                />

                                {/* Kaaba icon in center */}
                                <SvgText
                                    x={CENTER}
                                    y={CENTER + 20}
                                    fill="#000000"
                                    fontSize="50"
                                    textAnchor="middle"
                                >
                                    🕋
                                </SvgText>
                            </Svg>
                        </View>

                    </View>
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
    notificationBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationIcon: {
        width: 20,
        height: 20,
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
        position: 'absolute',
        bottom: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    directionText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.black,
        textAlign: 'center',
    },
});

export default QiblaFinderScreen;
