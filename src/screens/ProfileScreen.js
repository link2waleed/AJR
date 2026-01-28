import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Switch,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import auth from '@react-native-firebase/auth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.settingIconContainer}>
            <Ionicons name={icon} size={22} color={colors.primary.sage} />
        </View>
        <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {rightComponent ? rightComponent : (
            showArrow && <Ionicons name="chevron-forward" size={20} color={colors.text.grey} />
        )}
    </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
);

const ProfileScreen = ({ navigation }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(user => {
            if (user) {
                // Extract first and last name from display name, or use email
                const displayName = user.displayName || user.email.split('@')[0];
                const nameParts = displayName.split(' ');
                const firstName = nameParts[0];
                const lastName = nameParts[1] || '';

                // Create initials
                const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

                setUserData({
                    name: displayName,
                    email: user.email,
                    avatarInitials: initials.length > 0 ? initials : 'U',
                    memberSince: 'January 2026',
                    streak: 15,
                    totalDays: 45,
                });
            } else {
                navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [navigation]);

    const handleEditProfile = () => {
        console.log('Edit Profile');
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Log Out',
                    onPress: async () => {
                        try {
                            await auth().signOut();
                            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to log out');
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                {/* Profile Card */}
                {userData ? (
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{userData.avatarInitials}</Text>
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{userData.name}</Text>
                            <Text style={styles.profileEmail}>{userData.email}</Text>
                            <Text style={styles.memberSince}>Member since {userData.memberSince}</Text>
                        </View>
                        <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
                            <Ionicons name="create-outline" size={18} color={colors.primary.sage} />
                            <Text style={styles.editProfileText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* Stats Section */}
                {/* <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="flame-outline" size={24} color="#FF6B6B" />
                        </View>
                        <Text style={styles.statValue}>{userData.streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="calendar-outline" size={24} color={colors.primary.sage} />
                        </View>
                        <Text style={styles.statValue}>{userData.totalDays}</Text>
                        <Text style={styles.statLabel}>Total Days</Text>
                    </View>
                </View> */}

                {/* Spiritual Journey Section */}
                <SectionHeader title="Spiritual Journey" />
                <View style={styles.settingsSection}>
                    <SettingItem
                        icon="book-outline"
                        title="My AJR Activities"
                        subtitle="Manage your daily activities"
                        onPress={() => console.log('AJR Activities')}
                    />
                    <SettingItem
                        icon="bar-chart-outline"
                        title="Progress & Statistics"
                        subtitle="View your spiritual growth"
                        onPress={() => console.log('Progress')}
                    />
                    <SettingItem
                        icon="trophy-outline"
                        title="Achievements"
                        subtitle="View your milestones"
                        onPress={() => console.log('Achievements')}
                    />
                </View>

                {/* Preferences Section */}
                <SectionHeader title="Preferences" />
                <View style={styles.settingsSection}>
                    <SettingItem
                        icon="notifications-outline"
                        title="Notifications"
                        subtitle="Prayer reminders, daily prompts"
                        showArrow={false}
                        rightComponent={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor="#E0E0E0"
                            />
                        }
                    />
                    <SettingItem
                        icon="location-outline"
                        title="Location Settings"
                        subtitle="For accurate prayer times"
                        onPress={() => navigation.navigate('LocationPermission', { fromSettings: true })}
                    />
                    <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        showArrow={false}
                        rightComponent={
                            <Switch
                                value={darkModeEnabled}
                                onValueChange={setDarkModeEnabled}
                                trackColor={{ false: '#E0E0E0', true: colors.primary.sage }}
                                thumbColor="#FFFFFF"
                                ios_backgroundColor="#E0E0E0"
                            />
                        }
                    />
                    <SettingItem
                        icon="language-outline"
                        title="Language"
                        subtitle="English"
                        onPress={() => console.log('Language')}
                    />
                </View>

                {/* Support Section */}
                <SectionHeader title="Support" />
                <View style={styles.settingsSection}>
                    <SettingItem
                        icon="heart-outline"
                        title="Support AJR"
                        subtitle="Help us keep the app accessible"
                        onPress={() => console.log('Support')}
                    />
                    <SettingItem
                        icon="help-circle-outline"
                        title="Help & FAQ"
                        onPress={() => console.log('Help')}
                    />
                    <SettingItem
                        icon="chatbubble-outline"
                        title="Contact Us"
                        onPress={() => console.log('Contact')}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title="Terms & Privacy Policy"
                        onPress={() => console.log('Terms')}
                    />
                </View>

                {/* Account Section */}
                <SectionHeader title="Account" />
                <View style={styles.settingsSection}>
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Account Security"
                        onPress={() => console.log('Security')}
                    />
                    <SettingItem
                        icon="cloud-download-outline"
                        title="Export My Data"
                        onPress={() => console.log('Export')}
                    />
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#E57373" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.versionText}>AJR v1.0.0</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.06,
        paddingBottom: spacing.xxl,
    },
    header: {
        marginBottom: spacing.lg,
    },
    headerTitle: {
        fontSize: isSmallDevice ? 28 : 32,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: typography.fontWeight.semibold,
        color: '#FFFFFF',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.primary.light,
    },
    profileInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    profileName: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: isSmallDevice ? 13 : 14,
        color: colors.text.grey,
        marginBottom: 2,
    },
    memberSince: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
        fontStyle: 'italic',
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    editProfileText: {
        fontSize: 14,
        color: colors.primary.sage,
        marginLeft: 4,
        fontWeight: typography.fontWeight.medium,
    },
    statsContainer: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginRight: spacing.sm,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: isSmallDevice ? 22 : 26,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    statLabel: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.grey,
        marginTop: 2,
    },
    sectionHeader: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.grey,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    settingsSection: {
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    settingSubtitle: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(229, 115, 115, 0.1)',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        marginTop: spacing.lg,
    },
    logoutText: {
        fontSize: isSmallDevice ? 15 : 16,
        fontWeight: typography.fontWeight.medium,
        color: '#E57373',
        marginLeft: spacing.sm,
    },
    versionText: {
        fontSize: 12,
        color: colors.text.grey,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
});

export default ProfileScreen;
