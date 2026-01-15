import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground, Button } from '../components';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import locationImage from '../../assets/images/location.png';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const LocationPermissionScreen = ({ navigation, route }) => {
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const userName = route?.params?.userName || '';

    const handleContinue = () => {
        navigation.navigate('SelectActivities', {
            userName,
            locationEnabled,
            notificationsEnabled
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.primary.light }}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Location Pin Icon */}
                <View style={styles.iconContainer}>
                    <Image
                        source={locationImage}
                        style={styles.locationImage}
                        resizeMode="contain"
                    />
                </View>


                {/* Title */}
                <Text style={styles.title}>Allow AJR to stay precise</Text>

                {/* Description */}
                <Text style={styles.description}>
                    AJR uses your location to provide precise salah times, local weather updates, and notifications that offer gentle prayer and habit reminders
                </Text>

                {/* Permission Cards */}
                <View style={styles.cardsContainer}>
                    {/* Location Permission Card */}
                    <View style={[styles.card]}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="location-outline" size={24} color={colors.primary.sage} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Allow location while using the app</Text>
                            <TouchableOpacity>
                                <Text style={styles.learnMore}>Learn more</Text>
                            </TouchableOpacity>
                        </View>
                        <Switch
                            value={locationEnabled}
                            onValueChange={setLocationEnabled}
                            trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E0E0E0"
                        />
                    </View>

                    {/* Notifications Permission Card */}
                    <View style={[styles.card]}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="notifications-outline" size={24} color={colors.primary.sage} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Allow Notifications & reminders</Text>
                            <TouchableOpacity>
                                <Text style={styles.learnMore}>Learn more</Text>
                            </TouchableOpacity>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E0E0E0"
                        />
                    </View>
                </View>

                {/* Privacy Promise */}
                <View style={styles.privacyContainer}>
                    <Text style={styles.privacyTitle}>Privacy Promise</Text>
                    <Text style={styles.privacyText}>
                        No selling. No sharing. No ads. Your data stays yours.
                    </Text>
                </View>
                {/* Continue Button */}
                <Button
                    title="Continue"
                    onPress={handleContinue}
                    icon="arrow-forward"
                    style={styles.button}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: spacing.xxl,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.08,
        paddingBottom: spacing.xxl,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    locationImage: {
        width: 120,
        height: 120,
    },
    title: {
        fontSize: isSmallDevice ? 22 : 26,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    description: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.grey,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.sm,
    },
    cardsContainer: {
        marginBottom: spacing.xl,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary.light,
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    cardIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: isSmallDevice ? 14 : 15,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: 2,
    },
    learnMore: {
        fontSize: 12,
        color: colors.text.grey,
        textDecorationLine: 'underline',
    },
    privacyContainer: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    privacyTitle: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
        marginBottom: spacing.xs,
    },
    privacyText: {
        fontSize: isSmallDevice ? 12 : 14,
        fontWeight: typography.fontWeight.regular,
        color: colors.text.grey,
        textAlign: 'center',
        opacity: 0.8,
    },
    button: {
        marginTop: spacing.xxl,
    },
});

export default LocationPermissionScreen;
