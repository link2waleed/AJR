import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import AJRRings from '../../components/AJRRings';

// Import notification icon
import notifications from '../../../assets/images/notification-bing.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

// Stat Card Component
const StatCard = ({ icon, value, label }) => (
    <View style={styles.statCard}>
        <View style={styles.statIconContainer}>
            <Ionicons name={icon} size={20} color={colors.text.dark} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// Group Stat Item Component
const GroupStatItem = ({ icon, text, iconColor = colors.primary.sage }) => (
    <View style={styles.groupStatItem}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={styles.groupStatText}>{text}</Text>
    </View>
);

// Encouragement Chip Component
const EncouragementChip = ({ text, onPress }) => (
    <TouchableOpacity style={styles.encouragementChip} onPress={onPress}>
        <Text style={styles.encouragementChipText}>{text}</Text>
    </TouchableOpacity>
);

// Intention Chip Component
const IntentionChip = ({ text, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.intentionChip, selected && styles.intentionChipSelected]}
        onPress={onPress}
    >
        <Text style={[styles.intentionChipText, selected && styles.intentionChipTextSelected]}>
            {text}
        </Text>
    </TouchableOpacity>
);

// Member Row Component
const MemberRow = ({ name }) => (
    <View style={styles.memberRow}>
        <View style={styles.memberAvatar}>
            <Ionicons name="person" size={16} color={colors.primary.sage} />
        </View>
        <Text style={styles.memberName}>{name}</Text>
    </View>
);

// Legend Item Component - Tickable like HomeScreen
const LegendItem = ({ color, label, completed = true }) => (
    <View style={styles.legendItem}>
        <View style={[styles.legendCheck, { borderColor: color, backgroundColor: completed ? color : 'transparent' }]}>
            {completed && <Ionicons name="checkmark" size={12} color="white" />}
        </View>
        <Text style={[styles.legendText, !completed && styles.legendTextInactive]}>{label}</Text>
    </View>
);

const CircleDetailScreen = ({ navigation, route }) => {
    // Get circle data from route params or use defaults
    const circle = route?.params?.circle || {
        id: '1',
        name: 'Morning Prayer',
        members: 11,
        streak: 14,
        progress: 82,
    };

    // State for intentions
    const [selectedIntentions, setSelectedIntentions] = useState(['Gratitude']);

    // State for invite modal
    const [showInviteModal, setShowInviteModal] = useState(false);
    const inviteCode = 'GRW-2K9X'; // This would come from Firebase in production

    const handleCopyCode = () => {
        // TODO: Implement clipboard copy
        console.log('Copying code:', inviteCode);
        // Could show a toast here
    };

    // Mock data
    const groupStats = [
        { icon: 'people-outline', text: `${circle.members} members prayed today` },
        { icon: 'book-outline', text: '5 read Quran' },
        { icon: 'people-outline', text: '8 members prayed today' },
        { icon: 'checkmark-circle-outline', text: '140 dhikr recited' },
    ];

    const encouragementActions = [
        'MashaAllah',
        "You're doing great",
        'Keep going',
        'Almost there',
        'May Allah ease your heart',
    ];

    const intentions = ['Gratitude', 'Patience', 'Trust', 'Presence', 'Other'];

    const members = ['Amira', 'Bilal', 'Hana', 'Omar', 'Zara'];

    const toggleIntention = (intention) => {
        if (selectedIntentions.includes(intention)) {
            setSelectedIntentions(selectedIntentions.filter(i => i !== intention));
        } else {
            setSelectedIntentions([...selectedIntentions, intention]);
        }
    };

    return (
        <LinearGradient
            colors={[colors.homeGradient.top, colors.homeGradient.top, colors.homeGradient.bottom]}
            locations={[0, 0.7, 1]}
            style={styles.container}
        >
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

                    <TouchableOpacity style={styles.notificationButton}>
                        <View style={styles.notificationBadge}>
                            <Image source={notifications} style={styles.notificationIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatCard icon="people-outline" value={circle.members} label="Members" />
                    <StatCard icon="calendar-outline" value={circle.streak} label="Day Streak" />
                    {/* <StatCard icon="checkmark-circle-outline" value={`${circle.progress}%`} label="Complete" /> */}
                </View>

                {/* Today's Group Progress */}
                <View style={styles.section}>
                    <View style={styles.progressCard}>
                        <Text style={styles.sectionTitle}>Today's Group Progress</Text>
                        <View style={styles.progressContent}>
                            <AJRRings
                                progress={45}
                                // variant="detailed"
                                layer1Visible={true}
                                layer2Visible={true}
                                layer3Visible={true}
                                journalingVisible={true}
                                layer1Progress={80}
                                layer2Progress={60}
                                layer3Progress={40}
                                journalingProgress={20}
                            />
                            <View style={styles.legendContainer}>
                                <LegendItem color={colors.rings.layer1} label="Prayers" />
                                <LegendItem color={colors.rings.layer2} label="Quran reading" />
                                <LegendItem color={colors.rings.layer3} label="Dhikr" />
                                <LegendItem color={colors.rings.innerCircle} label="Journaling" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Group Stats */}
                <View style={styles.section}>
                    <View style={styles.groupStatsCard}>
                        <Text style={styles.sectionTitle}>Group Stats</Text>
                        {groupStats.map((stat, index) => (
                            <GroupStatItem
                                key={index}
                                icon={stat.icon}
                                text={stat.text}
                            />
                        ))}
                    </View>
                </View>

                {/* Encouragement Actions */}
                <View style={styles.section}>
                    <View style={styles.encouragementCard}>
                        <Text style={styles.sectionTitle}>Encouragement Actions</Text>
                        <View style={styles.chipsContainer}>
                            {encouragementActions.map((action, index) => (
                                <EncouragementChip
                                    key={index}
                                    text={action}
                                    onPress={() => console.log('Send:', action)}
                                />
                            ))}
                        </View>
                    </View>
                </View>

                {/* Weekly Challenge */}
                <View style={styles.section}>
                    <View style={styles.challengeCard}>
                        <Text style={styles.sectionTitle}>Weekly Challenge</Text>
                        <View style={styles.challengeContent}>
                            <View style={styles.challengeHeader}>
                                <View style={styles.challengeIconContainer}>
                                    <Ionicons name="book-outline" size={18} color={colors.primary.sage} />
                                </View>
                                <View style={styles.challengeInfo}>
                                    <Text style={styles.challengeTitle}>Surah Al-Kahf Friday</Text>
                                    <Text style={styles.challengeSubtitle}>Read completely before sunset</Text>
                                </View>
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeBadgeText}>Active</Text>
                                </View>
                            </View>
                            <View style={styles.challengeProgressRow}>
                                <Text style={styles.challengeProgressPercent}>60%</Text>
                            </View>
                            <View style={styles.challengeProgressBarContainer}>
                                <View style={[styles.challengeProgressBar, { width: '60%' }]} />
                            </View>
                            <TouchableOpacity style={styles.joinChallengeButton}>
                                <Text style={styles.joinChallengeText}>Join Challenge</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* What intention are you holding this week? */}
                <View style={styles.section}>
                    <View style={styles.intentionCard}>
                        <Text style={styles.intentionTitle}>What intention are you holding this week?</Text>
                        <View style={styles.intentionChipsContainer}>
                            {intentions.map((intention, index) => (
                                <IntentionChip
                                    key={index}
                                    text={intention}
                                    selected={selectedIntentions.includes(intention)}
                                    onPress={() => toggleIntention(intention)}
                                />
                            ))}
                        </View>
                    </View>
                </View>

                {/* Member List */}
                <View style={styles.section}>
                    <View style={styles.memberCard}>
                        <Text style={styles.sectionTitle}>Member List</Text>
                        {members.map((member, index) => (
                            <MemberRow key={index} name={member} />
                        ))}
                        <TouchableOpacity style={styles.showMoreButton}>
                            <Text style={styles.showMoreText}>+ 5 others</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Invite Friends Button */}
                <TouchableOpacity style={styles.inviteButton} onPress={() => setShowInviteModal(true)}>
                    <Text style={styles.inviteButtonText}>Invite Friends</Text>
                    <Ionicons name="share-social" size={20} color={colors.text.primary} />
                </TouchableOpacity>

                {/* Share Invite Link Modal */}
                <Modal
                    visible={showInviteModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowInviteModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowInviteModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Share Invite Link</Text>
                            <Text style={styles.modalSubtitle}>Share Invite Link</Text>

                            <Text style={styles.modalInputLabel}>Link</Text>
                            <View style={styles.modalLinkContainer}>
                                <Ionicons name="link-outline" size={18} color={colors.text.grey} />
                                <Text style={styles.modalLinkText}>{inviteCode}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.modalCopyButton}
                                onPress={handleCopyCode}
                            >
                                <Text style={styles.modalCopyText}>Copy Code</Text>
                                <Ionicons name="copy-outline" size={18} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Footer Message */}
                <View style={styles.footerContainer}>
                    <View style={styles.footerIconContainer}>
                        <Image
                            source={require('../../../assets/images/habits.png')}
                            style={styles.footerIcon}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.footerText}>
                        Every effort counts. May Allah accept from all of us.
                    </Text>
                </View>
            </ScrollView>
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
    notificationButton: {},
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
    // Stats Row
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: '#fff',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        marginHorizontal: spacing.xxs,
        alignItems: 'center',
    },
    statIconContainer: {
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: isSmallDevice ? 18 : 20,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    statLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
        marginTop: 2,
    },
    // Section
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: spacing.md,
    },
    // Progress Card
    progressCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.md,
    },
    progressContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    legendContainer: {
        marginLeft: spacing.md,
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
    legendText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.dark,
    },
    legendTextInactive: {
        color: colors.text.grey,
    },
    // Group Stats Card
    groupStatsCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.md,
    },
    groupStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    groupStatText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.dark,
        marginLeft: spacing.sm,
    },
    // Encouragement Card
    encouragementCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.md,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    encouragementChip: {
        backgroundColor: colors.cards.mint,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border.grey,
    },
    encouragementChipText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.dark,
    },
    // Challenge Card
    challengeCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.md,
    },
    challengeContent: {},
    challengeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
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
    challengeInfo: {
        flex: 1,
    },
    challengeTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    challengeSubtitle: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
    },
    activeBadge: {
        backgroundColor: colors.cards.mint,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.xxs,
        paddingHorizontal: spacing.xs,
    },
    activeBadgeText: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: '#11B468',
    },
    challengeProgressRow: {
        alignItems: 'flex-end',
        marginBottom: spacing.xs,
    },
    challengeProgressPercent: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
    },
    challengeProgressBarContainer: {
        height: 6,
        backgroundColor: colors.border.light,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    challengeProgressBar: {
        height: '100%',
        backgroundColor: colors.primary.sage,
        borderRadius: 3,
    },
    joinChallengeButton: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.sm,
        borderWidth: 1.5,
        borderColor: colors.border.grey,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    joinChallengeText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
    },
    // Intention Card
    intentionCard: {
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.md,
    },
    intentionTitle: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.md,
    },
    intentionChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    intentionChip: {
        backgroundColor: colors.text.primary,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border.grey,
    },
    intentionChipSelected: {
        backgroundColor: colors.cards.mint,
        borderColor: colors.primary.sage,
    },
    intentionChipText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.dark,
    },
    intentionChipTextSelected: {
        color: colors.primary.darkSage,
        fontWeight: typography.fontWeight.medium,
    },
    // Member Card
    memberCard: {
        backgroundColor: colors.cards.cream,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
        padding: spacing.md,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    memberAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary.light,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    memberName: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    showMoreButton: {
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    showMoreText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
    },
    // Invite Button
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.button.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.xs,
    },
    inviteButtonText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    // Footer
    footerContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    footerIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.cards.mint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerIcon: {
        width: 20,
        height: 20,
    },
    footerText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.dark,
        flex: 1,
    },
    // Share Invite Link Modal Styles
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
    modalLinkContainer: {
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
    modalLinkText: {
        flex: 1,
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
        marginLeft: spacing.sm,
    },
    modalCopyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.button.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        gap: spacing.xs,
    },
    modalCopyText: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
});

export default CircleDetailScreen;
