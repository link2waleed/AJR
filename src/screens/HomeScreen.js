import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
    ImageBackground,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTheme } from '../context';
import auth from '@react-native-firebase/auth';
import whiteClock from '../../assets/images/white-clock.png';
import heart from '../../assets/images/heart.png';
import notifications from '../../assets/images/notification-bing.png';
import themeChange from '../../assets/images/theme-change.png';
import darkBackground from '../../assets/images/dark.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

// AJR Rings Component - matching exact design with 3 ellipse layers
const AJRRings = ({ progress = 45, activities }) => {
    const size = isSmallDevice ? 155 : 175;
    const center = size / 2;

    // Ring configuration matching exact design
    const strokeWidth = isSmallDevice ? 8 : 10;
    const separatorWidth = isSmallDevice ? 8 : 10;

    // Calculate radii for 3 layers with separators
    const layer1Radius = center - strokeWidth / 2;
    const layer2Radius = layer1Radius - strokeWidth - separatorWidth;
    const layer3Radius = layer2Radius - strokeWidth - separatorWidth;
    const innerCircleRadius = layer3Radius * 0.70;

    return (
        <View style={styles.ringsContainer}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    {/* Layer 1 - Outer (Green) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer1Radius}
                        stroke={colors.rings.layer1}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {/* Separator 1 */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer1Radius - strokeWidth / 2 - separatorWidth / 2}
                        stroke={colors.rings.separator}
                        strokeWidth={separatorWidth}
                        fill="none"
                    />

                    {/* Layer 2 (Gold) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer2Radius}
                        stroke={colors.rings.layer2}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {/* Separator 2 */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer2Radius - strokeWidth / 2 - separatorWidth / 2}
                        stroke={colors.rings.separator}
                        strokeWidth={separatorWidth}
                        fill="none"
                    />

                    {/* Layer 3 (Darker Gold) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer3Radius}
                        stroke={colors.rings.layer3}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {/* Separator 3 (before inner circle) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={layer3Radius - strokeWidth / 2 - separatorWidth / 2}
                        stroke={colors.rings.separator}
                        strokeWidth={separatorWidth}
                        fill="none"
                    />

                    {/* Inner Circle (Teal) */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={innerCircleRadius}
                        fill={colors.rings.innerCircle}
                    />
                </G>
            </Svg>
            {/* Center text */}
            <View style={styles.ringsCenterText}>
                <Text style={styles.ringsPercentage}>{progress}%</Text>
                <Text style={styles.ringsLabel}>Complete</Text>
            </View>
        </View>
    );
};

// Activity Legend Item
const ActivityLegendItem = ({ color, label, completed }) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendCheck, { borderColor: color, backgroundColor: completed ? color : 'transparent' }]}>
            {completed && <Ionicons name="checkmark" size={12} color={'white'} />}
        </View>
        <Text style={[styles.legendLabel, !completed && styles.legendLabelInactive]}>{label}</Text>
    </View>
);

// Daily Adhkar Item
const AdhkarItem = ({ title, subtitle, onPress, isLast }) => (
    <TouchableOpacity
        style={[styles.adhkarItem, !isLast && styles.adhkarItemBorder]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.adhkarPlayButton}>
            <Ionicons name="play" size={14} color="#FFFFFF" />
        </View>
        <View style={styles.adhkarContent}>
            <Text style={styles.adhkarTitle}>{title}</Text>
            <Text style={styles.adhkarSubtitle}>{subtitle}</Text>
        </View>
    </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
    const [adhkarExpanded, setAdhkarExpanded] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showPermissionMessage, setShowPermissionMessage] = useState(false);
    const [userName, setUserName] = useState('');
    const hasAlertShownRef = useRef(false);

    // Use theme context for dynamic Day/Evening switching, prayer data, city, and weather
    const { isEvening, isLoading, isLocationEnabled, hasNoData, location, maghribTime, prayerData, cityName, weather, isManualPreview, refreshTheme, toggleThemePreview } = useTheme();

    // Fetch real user name from Firebase Auth
    useEffect(() => {
        const user = auth().currentUser;
        if (user) {
            // Use display name if available, otherwise use email prefix
            const displayName = user.displayName || user.email?.split('@')[0] || 'User';
            setUserName(displayName);
        }
    }, []);

    /**
     * Show alert after 3 seconds if location is disabled and no cached data
     * Only shows once per app session to avoid annoying user
     */
    useEffect(() => {
        if (hasNoData && !hasAlertShownRef.current) {
            const timer = setTimeout(() => {
                hasAlertShownRef.current = true;
                Alert.alert(
                    'Location Access Required',
                    'Prayer times and location data could not be loaded because location access is disabled.\n\nTo enable this feature:\nProfile → Preferences → Location Settings',
                    [
                        {
                            text: 'OK',
                            onPress: () => setShowPermissionMessage(true)
                        }
                    ]
                );
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [hasNoData]);

    // Dynamic data from API, with fallbacks
    // City: prefer Expo Location city, fallback to API timezone city, then fallback text
    const displayCity = cityName || prayerData?.city || (isLoading ? 'Loading...' : (showPermissionMessage ? 'Enable location' : '--'));

    // Weather: use Open-Meteo data with dynamic icon
    const displayTemperature = weather ? `${weather.temperature}°C` : (isLoading ? '--' : (showPermissionMessage ? '--' : '--'));
    const weatherIcon = weather?.icon || 'cloud-outline';

    // Gregorian date from device (always available, no API dependency)
    const getDeviceGregorianDate = () => {
        const now = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    };

    const displayData = {
        name: userName || 'User',
        city: displayCity,
        temperature: displayTemperature,
        hijriDate: prayerData?.hijriDate || (showPermissionMessage ? '--' : '--'),
        gregorianDate: getDeviceGregorianDate(), // Always from device, never from API
        nextPrayer: prayerData?.nextPrayer || (isLoading ? 'Loading' : (showPermissionMessage ? 'Location required' : 'Loading')),
        nextPrayerTime: prayerData?.nextPrayerTime || (showPermissionMessage ? '--:--' : '--:--'),
    };

    const activities = {
        prayers: true,
        quran: false,
        dhikr: true,
        journaling: false,
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    /**
     * Handle manual refresh button press
     * Re-fetches location and prayer times
     * Shows alert if location is disabled
     */
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const result = await refreshTheme();

            // Check if location is disabled and show professional guidance
            if (result && result.locationDisabled) {
                Alert.alert(
                    'Location Disabled',
                    'To refresh prayer times and location data, please enable location access.\n\nGo to:\nProfile → Preferences → Location Settings',
                    [
                        { text: 'OK', style: 'default' }
                    ]
                );
            }
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Dynamic text colors based on theme (isEvening from context)
    const themeColors = {
        greeting: isEvening ? 'rgba(255,255,255,0.7)' : colors.text.grey,
        userName: isEvening ? '#FFFFFF' : colors.text.black,
    };

    const renderContent = () => (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.greeting, { color: themeColors.greeting }]}>{getGreeting()}, </Text>
                    <Text style={[styles.userName, { color: themeColors.userName }]}>{displayData.name}</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerIconButton}>
                        <View style={styles.notificationBadge}>
                            <Image source={notifications} style={styles.notificationIcon} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.headerIconButtonOutline,
                            isEvening && styles.headerIconButtonDark
                        ]}
                        onPress={toggleThemePreview}
                    >
                        <Image
                            source={themeChange}
                            style={[
                                styles.themeChangeIcon,
                                isEvening && styles.themeChangeIconDark
                            ]}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Location Card */}
            <View style={styles.locationCard}>
                <View style={styles.locationCardContent}>
                    <View style={styles.locationLeft}>
                        <Text style={styles.locationCity}>{displayData.city}</Text>
                        <View style={styles.weatherRow}>
                            <Ionicons name={weatherIcon} size={20} color={colors.text.black} />
                            <Text style={styles.temperature}>{displayData.temperature}</Text>
                        </View>
                    </View>
                    <View style={styles.locationRight}>
                        <Text style={styles.hijriDate}>{displayData.hijriDate}</Text>
                        <Text style={styles.gregorianDate}>{displayData.gregorianDate}</Text>
                    </View>
                </View>
            </View>

            {/* Next Prayer Card with Refresh Button */}
            <View style={styles.nextPrayerCard}>
                <View style={styles.nextPrayerLeft}>
                    <Image
                        source={whiteClock}
                        style={styles.clockIcon}
                    />
                    <Text style={styles.nextPrayerText}>
                        Next: {displayData.nextPrayer} • {displayData.nextPrayerTime}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.refreshIconButton}
                    onPress={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    activeOpacity={0.7}
                >
                    {isRefreshing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Dua of the Day */}
            <View style={styles.duaCard}>
                <View style={styles.duaHeader}>
                    <Text style={styles.duaTitle}>Dua of the Day</Text>
                    <TouchableOpacity>
                        <Image source={heart} style={styles.heartIcon} />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.duaArabic, { color: isEvening ? colors.text.black : colors.text.grey }]}>
                    رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً
                </Text>
                <Text style={[styles.duaTransliteration, { color: isEvening ? colors.text.black : colors.text.grey }]}>
                    Rabbana ātinā fid-dunyā hasanat wa fil-ākhirati hasanatan
                </Text>
                <View style={styles.ringsDivider} />
                <Text style={[styles.duaTranslation, { color: isEvening ? colors.text.black : colors.text.grey }]}>
                    "Our Lord, give us good in this world and good in the Hereafter"
                </Text>
            </View>

            {/* Daily Adhkar */}
            <View style={styles.adhkarCard}>
                <TouchableOpacity
                    style={styles.adhkarHeader}
                    onPress={() => setAdhkarExpanded(!adhkarExpanded)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.adhkarSectionTitle}>Daily Adhkar</Text>
                    <Ionicons
                        name={adhkarExpanded ? "chevron-up" : "chevron-down"}
                        size={22}
                        color={colors.text.grey}
                    />
                </TouchableOpacity>

                {adhkarExpanded && (
                    <View style={styles.adhkarList}>
                        <AdhkarItem
                            title="Morning Adhkar"
                            subtitle="A moment of remembrance to begin your day"
                            onPress={() => console.log('Morning Adhkar')}
                            isLast={false}
                        />
                        <AdhkarItem
                            title="Evening Adhkar"
                            subtitle="A gentle closing of the day in remembrance"
                            onPress={() => console.log('Evening Adhkar')}
                            isLast={true}
                        />
                    </View>
                )}
            </View>

            {/* AJR Rings - Tap to open Daily Growth */}
            <TouchableOpacity
                style={[styles.ringsCard, { backgroundColor: isEvening ? 'rgba(241, 245, 241, 0.85)' : colors.primary.light }]}
                onPress={() => navigation.navigate('DailyGrowth')}
                activeOpacity={0.8}
            >
                <Text style={styles.ringsSectionTitle}>AJR Rings</Text>
                <View style={styles.ringsDivider} />

                <View style={styles.ringsContent}>
                    <AJRRings progress={45} activities={activities} />

                    <View style={styles.legendContainer}>
                        <ActivityLegendItem
                            color={colors.rings.layer1}
                            label="Prayers"
                            completed={activities.prayers}
                        />
                        <ActivityLegendItem
                            color={colors.rings.layer2}
                            label="Qur'an reading"
                            completed={activities.quran}
                        />
                        <ActivityLegendItem
                            color={colors.rings.layer3}
                            label="Dhikr"
                            completed={activities.dhikr}
                        />
                        <ActivityLegendItem
                            color={colors.rings.innerCircle}
                            label="Journaling"
                            completed={activities.journaling}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </ScrollView>
    );

    // Render with dark background image (Evening) or light gradient (Day)
    if (isEvening) {
        return (
            <ImageBackground
                source={darkBackground}
                style={styles.container}
                resizeMode="cover"
            >
                {renderContent()}
            </ImageBackground>
        );
    }

    return (
        <LinearGradient
            colors={[colors.homeGradient.top, colors.homeGradient.top, colors.homeGradient.bottom]}
            locations={[0, 0.7, 1]}
            style={styles.container}
        >
            {renderContent()}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.06,
        paddingBottom: spacing.xxl,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        flex: 1,
    },
    greeting: {
        fontSize: isSmallDevice ? 20 : 24,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
    },
    userName: {
        fontSize: isSmallDevice ? 20 : 24,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconButton: {
        marginLeft: spacing.sm,
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
    themeChangeIcon: {
        width: 20,
        height: 20,
    },
    headerIconButtonOutline: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#fff',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    // Dark theme variant for theme toggle button
    headerIconButtonDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    themeChangeIconDark: {
        tintColor: '#FFFFFF',
    },
    // Location Card
    locationCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    locationCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    locationLeft: { justifyContent: 'space-between' },
    locationCity: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    temperature: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.black,
        marginLeft: spacing.xs,
        fontWeight: typography.fontWeight.bold,
    },
    locationRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between'
    },
    hijriDate: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: 2,
    },
    gregorianDate: {
        fontSize: isSmallDevice ? 13 : 15,
        color: colors.text.black,
        fontWeight: typography.fontWeight.medium,
    },
    // Next Prayer Card with Refresh Button
    nextPrayerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.button.prayer,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    nextPrayerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    // Small Refresh Icon Button (in prayer card)
    refreshIconButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    clockIcon: {
        width: 20,
        height: 20,
    },
    nextPrayerText: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: '#FFFFFF',
        marginLeft: spacing.sm,
    },
    // Dua Card
    duaCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    duaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    heartIcon: {
        width: 22,
        height: 22,
    },
    duaTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    duaArabic: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.grey,
        textAlign: 'right',
        marginBottom: spacing.sm,
        lineHeight: 30,
    },
    duaTransliteration: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        fontStyle: 'italic',
    },
    duaTranslation: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        fontStyle: 'italic',
    },
    // Adhkar Card
    adhkarCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    adhkarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: '#FFFFFF',
    },
    adhkarSectionTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    adhkarList: {
        backgroundColor: colors.primary.light,
    },
    adhkarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    adhkarItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.grey,
    },
    adhkarPlayButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    adhkarContent: {
        flex: 1,
    },
    adhkarTitle: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: 2,
    },
    adhkarSubtitle: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
    },
    // AJR Rings Card
    ringsCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    ringsSectionTitle: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    ringsDivider: {
        height: 1,
        backgroundColor: colors.border.grey,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    ringsContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ringsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    ringsCenterText: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringsPercentage: {
        fontSize: isSmallDevice ? 16 : 18,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    ringsLabel: {
        fontSize: isSmallDevice ? 9 : 10,
        color: colors.text.black,
    },
    legendContainer: {
        flex: 1,
        marginLeft: spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    legendCheck: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    legendLabel: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.black,
    },
    legendLabelInactive: {
        color: colors.text.grey,
    },
});

export default HomeScreen;
