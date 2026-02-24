import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import FirebaseService from '../../services/FirebaseService';

// Import notification icon
import notifications from '../../../assets/images/notification-bing.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;


// Circle Card Component
const CircleCard = ({ circle, onPress }) => (
    <TouchableOpacity style={styles.circleCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.circleCardHeader}>
            <Text style={styles.circleCardTitle}>{circle.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.grey} />
        </View>
        <View style={styles.circleCardDivider} />
        <View style={styles.circleCardFooter}>
            <View style={styles.membersRow}>
                <Ionicons name="people-outline" size={14} color={colors.text.grey} />
                <Text style={styles.membersText}>{circle.members} Members</Text>
            </View>
            <View style={styles.streakBadge}>
                <Ionicons name="flame-outline" size={14} color={colors.text.dark} />
                <Text style={styles.streakText}>{circle.streak} Day Streak</Text>
            </View>
        </View>
    </TouchableOpacity>
);

// Encouragement Card Component
const EncouragementCard = ({ encouragement }) => (
    <View style={styles.encouragementCard}>
        <View style={styles.encouragementAvatar}>
            <Ionicons name="person" size={20} color={colors.primary.sage} />
        </View>
        <View style={styles.encouragementContent}>
            <Text style={styles.encouragementMessage}>{encouragement.message}</Text>
            <Text style={styles.encouragementSender}>{encouragement.sender}</Text>
        </View>
    </View>
);

// Challenge Card Component
const ChallengeCard = ({ challenge }) => (
    <View style={styles.challengeCard}>
        <View style={styles.challengeIconContainer}>
            <Ionicons name="checkbox-outline" size={20} color={colors.primary.sage} />
        </View>
        <View style={styles.challengeContent}>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <View style={styles.challengeProgressRow}>
                <Text style={styles.challengeProgressLabel}>Progress</Text>
                <Text style={styles.challengeProgressPercent}>{challenge.progress}% complete</Text>
            </View>
            <View style={styles.challengeProgressBarContainer}>
                <View style={[styles.challengeProgressBar, { width: `${challenge.progress}%` }]} />
            </View>
            <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join</Text>
                <Ionicons name="arrow-forward" size={12} color="#fff" />
            </TouchableOpacity>

        </View>
    </View>
);

const MyCircleScreen = ({ navigation }) => {
    // State to track if user has circles
    const [hasCircles, setHasCircles] = useState(false);
    const [circles, setCircles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Join Circle Modal state
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    const fetchCircles = useCallback(async () => {
        try {
            setLoading(true);
            const userCircles = await FirebaseService.getUserCircles();
            setCircles(userCircles);
            setHasCircles(userCircles.length > 0);
        } catch (error) {
            console.error('Error fetching circles:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch circles on mount and when screen comes into focus
    useEffect(() => {
        fetchCircles();
    }, [fetchCircles]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchCircles();
        });
        return unsubscribe;
    }, [navigation, fetchCircles]);

    const handleJoinCircle = async () => {
        if (!joinCode.trim()) return;
        setJoining(true);
        try {
            const result = await FirebaseService.joinCircle(joinCode.trim());
            setShowJoinModal(false);
            setJoinCode('');
            // Refresh circles list
            await fetchCircles();
            Alert.alert('Success', `You joined "${result.circleName}"!`);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to join circle. Please try again.');
        } finally {
            setJoining(false);
        }
    };

    // Render Empty State (No Circles)
    const renderEmptyState = () => (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>My Circle</Text>

                <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
                    <View style={styles.notificationBadge}>
                        <Image source={notifications} style={styles.notificationIcon} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Featured Circle Section */}
            <View style={styles.featuredSection}>
                <Text style={styles.sectionTitle}>Featured Circle</Text>

                {/* Featured Circle Card */}
                <View style={styles.featuredCard}>
                    {/* Illustration - Magnifying glass with warning triangle */}
                    <View style={styles.illustrationContainer}>
                        {/* Warning Triangle */}
                        <Image source={require('../../../assets/images/objects.png')} style={styles.warningIcon} />
                    </View>

                    {/* Invite Text */}
                    <Text style={styles.inviteText}>Invite friends to grow with you</Text>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.createCircleButton}
                            onPress={() => navigation.navigate('CreateCircle')}
                        >
                            <Text style={styles.createCircleButtonText}>Create Circle</Text>
                            <Ionicons name="add" size={18} color={colors.text.primary} style={styles.buttonIcon} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.inviteFriendsButton} onPress={() => setShowJoinModal(true)}>
                            <Text style={styles.inviteFriendsButtonText}>Join Circle</Text>
                            <Ionicons name="arrow-forward" size={16} color={colors.text.dark} style={styles.buttonIcon} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    // Render Circles State (Has Circles)
    const renderCirclesState = () => (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentWithCircles}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>My Circle</Text>

                <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
                    <View style={styles.notificationBadge}>
                        <Image source={notifications} style={styles.notificationIcon} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Your Circles Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Circles</Text>
                {circles.map((circle) => (
                    <CircleCard
                        key={circle.id}
                        circle={circle}
                        onPress={() => navigation.navigate('CircleDetail', { circleId: circle.id })}
                    />
                ))}
            </View>

            {/* Create / Join Circle Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={styles.createCircleButtonFull}
                    onPress={() => navigation.navigate('CreateCircle')}
                >
                    <Text style={styles.createCircleButtonText}>Create Circle</Text>
                    <Ionicons name="add" size={18} color={colors.text.primary} style={styles.buttonIcon} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.joinCircleButton} onPress={() => setShowJoinModal(true)}>
                    <Text style={styles.joinCircleButtonText}>Join Circle</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.text.dark} />
                </TouchableOpacity>
            </View>

            {/* Today's Collective AJR */}
            {/* <View style={styles.section}>
                <View style={styles.collectiveCard}>
                    <Text style={styles.sectionTitle}>Today's Collective AJR</Text>
                    <View style={styles.collectiveItem}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary.sage} />
                        <Text style={styles.collectiveText}>
                            {collectiveStats.peoplePrayed} people prayed today
                        </Text>
                    </View>
                    <View style={styles.collectiveItem}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary.sage} />
                        <Text style={styles.collectiveText}>
                            {collectiveStats.quranSessions} Quran sessions completed
                        </Text>
                    </View>
                    <View style={styles.collectiveItem}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary.sage} />
                        <Text style={styles.collectiveText}>
                            {collectiveStats.dhikrMoments} dhikr moments recorded
                        </Text>
                    </View>
                </View>
            </View> */}

            {/* Encouragement Stream */}
            {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>Encouragement Stream</Text>
                <View style={styles.encouragementContainer}>
                    {encouragements.map((encouragement) => (
                        <EncouragementCard key={encouragement.id} encouragement={encouragement} />
                    ))}
                </View>
                <TouchableOpacity style={styles.sendEncouragementButton}>
                    <Text style={styles.sendEncouragementText}>Send Encouragement</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
            </View> */}

            {/* Community Challenges */}
            {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>Community Challenges</Text>
                <View style={styles.challengesContainer}>
                    {challenges.map((challenge) => (
                        <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                </View>
            </View> */}

            {/* Featured Circle */}
            {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured Circle</Text>
                <View style={styles.featuredCircleCard}>
                    <View style={styles.featuredCircleHeader}>
                        <View style={styles.featuredCircleIcon}>
                            <Ionicons name="checkmark-circle" size={24} color={colors.primary.sage} />
                        </View>
                        <Text style={styles.featuredCircleName}>{featuredCircle.name}</Text>
                    </View>
                    <Text style={styles.featuredCircleDescription}>
                        {featuredCircle.description}
                    </Text>
                    <Text style={styles.featuredCircleAdmin}>{featuredCircle.admin}</Text>
                </View>
            </View> */}
        </ScrollView>
    );

    return (
        <LinearGradient
            colors={[colors.homeGradient.top, colors.homeGradient.top, colors.homeGradient.bottom]}
            locations={[0, 0.7, 1]}
            style={styles.container}
        >
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary.sage} />
                </View>
            ) : hasCircles ? renderCirclesState() : renderEmptyState()}

            {/* Join Circle Modal */}
            <Modal
                visible={showJoinModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowJoinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Join a Circle</Text>
                        <Text style={styles.modalSubtitle}>Enter the invite code you received</Text>

                        <Text style={styles.modalInputLabel}>Code</Text>
                        <View style={styles.modalInputContainer}>
                            <Ionicons name="copy-outline" size={18} color={colors.text.grey} />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="GRW-2K9X"
                                placeholderTextColor={colors.text.grey}
                                value={joinCode}
                                onChangeText={setJoinCode}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setShowJoinModal(false);
                                    setJoinCode('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                                <Ionicons name="arrow-forward" size={16} color={colors.text.dark} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalJoinButton}
                                onPress={handleJoinCircle}
                            >
                                <Text style={styles.modalJoinText}>Join</Text>
                                <Ionicons name="arrow-forward" size={16} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    scrollContentWithCircles: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.06,
        paddingBottom: spacing.xxl * 2,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    notificationButton: {
        // Wrapper for notification icon
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
    // Section
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: isSmallDevice ? 17 : 19,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.md,
        marginLeft: spacing.xxs
    },
    // Your Circles
    circleCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.sm,
    },
    circleCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    circleCardTitle: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        flex: 1,
    },
    circleCardDivider: {
        height: 1,
        backgroundColor: colors.border.grey,
        marginBottom: spacing.sm,
    },
    circleCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cards.mint,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.sm,
    },
    streakText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
        marginLeft: 4,
    },
    membersRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    membersText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
        marginLeft: 4,
    },
    // Action Buttons
    actionButtonsContainer: {
        marginBottom: spacing.lg,
    },
    createCircleButtonFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.button.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    joinCircleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.primary.light,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    joinCircleButtonText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
    },
    // Collective AJR
    collectiveCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    collectiveItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    collectiveText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.dark,
        marginLeft: spacing.sm,
    },
    // Encouragement Stream
    encouragementContainer: {
        marginBottom: spacing.md,
    },
    encouragementCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    encouragementAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.cards.mint,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    encouragementContent: {
        flex: 1,
    },
    encouragementMessage: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: 2,
    },
    encouragementSender: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
    },
    sendEncouragementButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.button.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
    },
    sendEncouragementText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    // Community Challenges
    challengesContainer: {
        marginBottom: spacing.md,
    },
    challengeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    challengeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: colors.cards.mint,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    challengeContent: {
        flex: 1,
    },
    challengeTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    challengeProgressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    challengeProgressLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
    },
    challengeProgressPercent: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
    },
    challengeProgressBarContainer: {
        height: 5,
        backgroundColor: colors.border.light,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    challengeProgressBar: {
        height: '100%',
        backgroundColor: colors.primary.sage,
        borderRadius: 3,
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: colors.button.primary,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    joinButtonText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
    },
    // Featured Circle Card (with circles state)
    featuredCircleCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    featuredCircleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    featuredCircleIcon: {
        marginRight: spacing.sm,
    },
    featuredCircleName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    featuredCircleDescription: {
        fontSize: typography.fontSize.sm,
        color: colors.text.dark,
        marginBottom: spacing.xxs,
    },
    featuredCircleAdmin: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
    },
    // Empty State Styles
    featuredSection: {
        marginTop: screenHeight * 0.20,
    },
    featuredCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    // Illustration
    illustrationContainer: {
        width: 100,
        height: 80,
        marginBottom: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    warningIcon: {
        height: 100,
        width: 100,
        resizeMode: 'contain',
    },
    inviteText: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.lg,
        textAlign: 'center',
        
    },
    // Buttons
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        width: '100%',
    },
    createCircleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.button.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.sm,
        flex: 1,
    },
    createCircleButtonText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    inviteFriendsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.sm,
        borderWidth: 1.5,
        borderColor: colors.border.grey,
        flex: 1,
        flexWrap: 'nowrap',
    },
    inviteFriendsButtonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
    },
    buttonIcon: {
        marginLeft: spacing.xxs,
    },
    // Join Circle Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    modalInputLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    modalInput: {
        flex: 1,
        fontSize: typography.fontSize.sm,
        color: colors.text.black,
        marginLeft: spacing.sm,
        padding: 0,
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    modalCancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        gap: spacing.xxs,
    },
    modalCancelText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
    },
    modalJoinButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.button.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        gap: spacing.xxs,
    },
    modalJoinText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
});

export default MyCircleScreen;
