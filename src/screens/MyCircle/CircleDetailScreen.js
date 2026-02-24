import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Modal,
    Alert,
    ActivityIndicator,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import FirebaseService from '../../services/FirebaseService';
import * as Clipboard from 'expo-clipboard';
import AJRRings from '../../components/AJRRings';
import auth from '@react-native-firebase/auth';
import challengesData from '../../data/challanges.json';

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

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Expandable Group Stat Item Component
const ExpandableGroupStatItem = ({ icon, text, iconColor = colors.primary.sage, count, members, expanded, onToggle, isNamed }) => (
    <View>
        <TouchableOpacity
            style={styles.groupStatItem}
            onPress={isNamed && members?.length > 0 ? onToggle : undefined}
            activeOpacity={isNamed && members?.length > 0 ? 0.7 : 1}
            disabled={!isNamed || !members?.length}
        >
            <View style={[styles.groupStatIconCircle, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon} size={16} color={iconColor} />
            </View>
            <View style={styles.groupStatTextContainer}>
                <Text style={styles.groupStatCount}>{count}</Text>
                <Text style={styles.groupStatText}>{text}</Text>
            </View>
            {isNamed && members?.length > 0 && (
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.text.grey}
                />
            )}
        </TouchableOpacity>
        {expanded && isNamed && members?.length > 0 && (
            <View style={styles.expandedMemberList}>
                {members.map((member, idx) => (
                    <View key={member.userId || idx} style={styles.expandedMemberRow}>
                        <View style={styles.expandedMemberDot} />
                        <Text style={styles.expandedMemberName}>{member.name}</Text>
                    </View>
                ))}
            </View>
        )}
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
const LegendItem = ({ color, label, completed = false, activity, onToggle, disabled }) => (
    <TouchableOpacity
        style={styles.legendItem}
        onPress={() => onToggle && onToggle(activity)}
        activeOpacity={0.7}
        disabled={disabled}
    >
        <View style={[styles.legendCheck, { borderColor: color, backgroundColor: completed ? color : 'transparent' }]}>
            {completed && <Ionicons name="checkmark" size={12} color="white" />}
        </View>
        <Text style={[styles.legendText, !completed && styles.legendTextInactive]}>{label}</Text>
    </TouchableOpacity>
);

const CircleDetailScreen = ({ navigation, route }) => {
    const circleId = route?.params?.circleId;

    // State
    const [circleData, setCircleData] = useState(null);
    const [members, setMembers] = useState([]);
    const [streak, setStreak] = useState(0);
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);

    // Group activity stats state
    const [memberActivityStats, setMemberActivityStats] = useState(null);

    // Weekly Challenge state
    const [challengeParticipants, setChallengeParticipants] = useState([]);
    const [joiningChallenge, setJoiningChallenge] = useState(false);
    const currentUserId = auth().currentUser?.uid;

    // Calculate which week's challenge to show (every 7 days of streak = next week, wrapping at 52)
    const currentChallengeWeek = useMemo(() => {
        const weekIndex = Math.floor(streak / 7) % challengesData.length;
        return weekIndex;
    }, [streak]);

    const currentChallenge = challengesData[currentChallengeWeek];
    const hasJoinedChallenge = challengeParticipants.includes(currentUserId);
    const totalMembers = members.length || 1;
    const challengeProgress = Math.round((challengeParticipants.length / totalMembers) * 100);
    const [expandedStat, setExpandedStat] = useState(null);

    // === AJR Rings State (same logic as HomeScreen) ===
    const [selectedActivities, setSelectedActivities] = useState({
        prayers: false,
        quran: false,
        dhikr: false,
        journaling: false,
    });
    const [quranStats, setQuranStats] = useState({ seconds: 0, goalMinutes: 15 });
    const [prayerStats, setPrayerStats] = useState({ completed: 0, total: 5 });
    const [dhikrStats, setDhikrStats] = useState({ totalGoal: 0, totalCompleted: 0 });
    const [journalStats, setJournalStats] = useState({ completedToday: false });
    const [activityCompletion, setActivityCompletion] = useState({
        prayers: false,
        quran: false,
        dhikr: false,
        journaling: false,
    });
    const [togglingActivity, setTogglingActivity] = useState(null);

    // Derived completion status (same as HomeScreen)
    const isPrayerCompleted = activityCompletion.prayers || (prayerStats.completed >= 5);
    const isQuranCompleted = activityCompletion.quran || (quranStats.seconds >= ((quranStats.goalMinutes || 15) * 60) && quranStats.seconds > 0);
    const isDhikrCompleted = activityCompletion.dhikr || (dhikrStats.totalGoal > 0 && dhikrStats.totalCompleted >= dhikrStats.totalGoal);
    const isJournalCompleted = activityCompletion.journaling || journalStats.completedToday;

    const getQuranPercentage = () => {
        const goalSeconds = (quranStats.goalMinutes || 15) * 60;
        const percentage = goalSeconds > 0 ? Math.min(Math.round((quranStats.seconds / goalSeconds) * 100), 100) : 0;
        return activityCompletion.quran ? 100 : percentage;
    };

    const getDhikrPercentage = () => {
        if (dhikrStats.totalGoal === 0) return 0;
        const percentage = Math.min(Math.round((dhikrStats.totalCompleted / dhikrStats.totalGoal) * 100), 100);
        return activityCompletion.dhikr ? 100 : percentage;
    };

    const getJournalingPercentage = () => {
        return activityCompletion.journaling ? 100 : (journalStats.completedToday ? 100 : 0);
    };

    const getPrayerPercentage = () => {
        const completed = prayerStats.completed || 0;
        const actualPercentage = Math.round((completed / 5) * 100);
        return activityCompletion.prayers ? 100 : actualPercentage;
    };

    const ajrProgress = useMemo(() => {
        let totalPercent = 0;
        let count = 0;
        if (selectedActivities.prayers) { totalPercent += getPrayerPercentage(); count++; }
        if (selectedActivities.quran) { totalPercent += getQuranPercentage(); count++; }
        if (selectedActivities.dhikr) { totalPercent += getDhikrPercentage(); count++; }
        if (selectedActivities.journaling) { totalPercent += getJournalingPercentage(); count++; }
        if (count === 0) return 0;
        return Math.round(totalPercent / count);
    }, [selectedActivities, prayerStats, quranStats, dhikrStats, journalStats, activityCompletion]);

    const handleToggleActivity = async (activity) => {
        if (!selectedActivities[activity]) return;
        setTogglingActivity(activity);
        try {
            const newStatus = !activityCompletion[activity];
            await FirebaseService.updateActivityCompletion(activity, newStatus);
            // Refresh group stats after toggling so UI updates immediately
            if (circleId) {
                FirebaseService.getCircleMemberActivityStats(circleId)
                    .then(stats => setMemberActivityStats(stats))
                    .catch(() => { });
            }
        } catch (error) {
            console.error(`Error toggling ${activity}:`, error);
        } finally {
            setTogglingActivity(null);
        }
    };

    // State for intentions
    const [selectedIntentions, setSelectedIntentions] = useState(['Gratitude']);

    // State for invite modal
    const [showInviteModal, setShowInviteModal] = useState(false);

    const toggleExpandStat = useCallback((statKey) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedStat(prev => prev === statKey ? null : statKey);
    }, []);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!circleId) return;
            try {
                setLoading(true);
                const [details, activityStats] = await Promise.all([
                    FirebaseService.getCircleDetails(circleId),
                    FirebaseService.getCircleMemberActivityStats(circleId),
                ]);
                setCircleData(details.circle);
                setMembers(details.members);
                setStreak(details.streak);
                setInviteCode(details.circle.inviteCode || '');
                setMemberActivityStats(activityStats);

                // Initialize/fetch circle challenge doc and participants for current week
                const weekIndex = Math.floor(details.streak / 7) % challengesData.length;
                await FirebaseService.initOrGetCircleChallenge(circleId, weekIndex, details.members.length);
                const participants = await FirebaseService.getChallengeParticipants(circleId, weekIndex);
                setChallengeParticipants(participants);
            } catch (error) {
                console.error('Error fetching circle details:', error);
                Alert.alert('Error', 'Failed to load circle details.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [circleId]);

    // === AJR Rings Firebase Listeners (same as HomeScreen) ===
    useEffect(() => {
        const unsubscribePrayer = FirebaseService.listenToPrayerCompletion(
            (completion) => {
                const completedCount = Object.values(completion).filter(v => v).length;
                setPrayerStats({ completed: completedCount, total: 5 });
            },
            (error) => console.error(error)
        );

        const unsubscribeOnboarding = FirebaseService.listenToOnboardingInfo(
            (data) => {
                if (data.selectedActivities) {
                    setSelectedActivities(data.selectedActivities);
                }
                if (data.quran) {
                    setQuranStats(prev => ({ ...prev, goalMinutes: data.quran.minutesDay || 15 }));
                }
                if (data.dikar && Array.isArray(data.dikar)) {
                    const totalGoal = data.dikar.reduce((sum, dhikr) => sum + (dhikr.counter || 0), 0);
                    setDhikrStats(prev => ({ ...prev, totalGoal }));
                    FirebaseService.getDhikrProgress()
                        .then((dhikrProgress) => {
                            // Cap each dhikr at its own target to prevent overflow counting
                            const totalCompleted = data.dikar.reduce((sum, item) => {
                                return sum + Math.min(dhikrProgress[item.word] || 0, item.counter || 0);
                            }, 0);
                            setDhikrStats(prev => ({ ...prev, totalCompleted }));
                        })
                        .catch(e => setDhikrStats(prev => ({ ...prev, totalCompleted: 0 })));
                }
            },
            (error) => console.error('Error listening to onboarding info:', error)
        );

        const unsubscribeQuran = FirebaseService.listenToDailyQuran((stats) => {
            setQuranStats(prev => ({ ...prev, seconds: stats.seconds, streak: stats.streak }));
        });

        const unsubscribeJournal = FirebaseService.listenToDailyJournal((stats) => {
            setJournalStats(stats);
        });

        const unsubscribeProgress = FirebaseService.listenToActivityProgress(
            (progress) => setActivityCompletion(progress),
            (error) => { }
        );

        return () => {
            unsubscribeOnboarding();
            unsubscribeQuran();
            unsubscribeProgress();
            unsubscribePrayer();
            unsubscribeJournal();
        };
    }, []);

    const handleCopyCode = async () => {
        try {
            await Clipboard.setStringAsync(inviteCode);
            Alert.alert('Copied!', 'Invite code copied to clipboard.');
        } catch (e) {
            Alert.alert('Info', `Invite code: ${inviteCode}`);
        }
    };

    const isNamedCircle = circleData?.type === 'named';

    // Activity stats config for Group Stats section
    const activityStatsConfig = [
        {
            key: 'prayers',
            icon: 'moon-outline',
            label: 'prayed today',
            iconColor: colors.rings.layer1 || '#4CAF50',
        },
        {
            key: 'quran',
            icon: 'book-outline',
            label: 'read Quran',
            iconColor: colors.rings.layer2 || '#2196F3',
        },
        {
            key: 'dhikr',
            icon: 'heart-outline',
            label: 'recited Dhikr',
            iconColor: colors.rings.layer3 || '#FF9800',
        },
        {
            key: 'journaling',
            icon: 'pencil-outline',
            label: 'did Journaling',
            iconColor: colors.rings.innerCircle || '#9C27B0',
        },
    ];

    const intentions = ['Gratitude', 'Patience', 'Trust', 'Presence', 'Other'];

    const toggleIntention = (intention) => {
        if (selectedIntentions.includes(intention)) {
            setSelectedIntentions(selectedIntentions.filter(i => i !== intention));
        } else {
            setSelectedIntentions([...selectedIntentions, intention]);
        }
    };

    if (loading) {
        return (
            <LinearGradient
                colors={[colors.homeGradient.top, colors.homeGradient.top, colors.homeGradient.bottom]}
                locations={[0, 0.7, 1]}
                style={styles.container}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary.sage} />
                </View>
            </LinearGradient>
        );
    }

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

                    <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
                        <View style={styles.notificationBadge}>
                            <Image source={notifications} style={styles.notificationIcon} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatCard icon="people-outline" value={circleData?.memberCount || members.length} label="Members" />
                    <StatCard icon="calendar-outline" value={streak} label="Day Streak" />
                    {/* <StatCard icon="checkmark-circle-outline" value={`${circle.progress}%`} label="Complete" /> */}
                </View>

                {/* Today's Group Progress */}
                <View style={styles.section}>
                    <View style={styles.progressCard}>
                        <Text style={styles.progressSectionTitle}>Today's Group Progress</Text>
                        <View style={styles.progressDivider} />
                        <View style={styles.progressContent}>
                            <AJRRings
                                variant="detailed"
                                progress={ajrProgress}
                                layer1Completed={isPrayerCompleted}
                                layer2Completed={isQuranCompleted}
                                layer3Completed={isDhikrCompleted}
                                layer1Progress={getPrayerPercentage()}
                                layer2Progress={getQuranPercentage()}
                                layer3Progress={getDhikrPercentage()}
                                journalingProgress={getJournalingPercentage()}
                                layer1Visible={selectedActivities.prayers}
                                layer2Visible={selectedActivities.quran}
                                layer3Visible={selectedActivities.dhikr}
                                journalingVisible={selectedActivities.journaling}
                            />
                            <View style={styles.legendContainer}>
                                {selectedActivities.prayers && (
                                    <LegendItem
                                        color={colors.rings.layer1}
                                        label="Prayers"
                                        completed={isPrayerCompleted}
                                        activity="prayers"
                                        onToggle={handleToggleActivity}
                                        disabled={togglingActivity === 'prayers' || isPrayerCompleted}
                                    />
                                )}
                                {selectedActivities.quran && (
                                    <LegendItem
                                        color={colors.rings.layer2}
                                        label="Quran"
                                        completed={isQuranCompleted}
                                        activity="quran"
                                        onToggle={handleToggleActivity}
                                        disabled={togglingActivity === 'quran' || isQuranCompleted}
                                    />
                                )}
                                {selectedActivities.dhikr && (
                                    <LegendItem
                                        color={colors.rings.layer3}
                                        label="Dhikr"
                                        completed={isDhikrCompleted}
                                        activity="dhikr"
                                        onToggle={handleToggleActivity}
                                        disabled={togglingActivity === 'dhikr' || isDhikrCompleted}
                                    />
                                )}
                                {selectedActivities.journaling && (
                                    <LegendItem
                                        color={colors.rings.innerCircle}
                                        label="Journal"
                                        completed={isJournalCompleted}
                                        activity="journaling"
                                        onToggle={handleToggleActivity}
                                        disabled={togglingActivity === 'journaling' || isJournalCompleted}
                                    />
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Group Stats */}
                <View style={styles.section}>
                    <View style={styles.groupStatsCard}>
                        <Text style={styles.sectionTitle}>Group Stats</Text>
                        {memberActivityStats ? (
                            activityStatsConfig.map((config, index) => {
                                const stat = memberActivityStats[config.key] || { count: 0, members: [] };
                                const isLast = index === activityStatsConfig.length - 1;
                                return (
                                    <View key={config.key}>
                                        <ExpandableGroupStatItem
                                            icon={config.icon}
                                            text={config.label}
                                            iconColor={config.iconColor}
                                            count={stat.count}
                                            members={stat.members}
                                            expanded={expandedStat === config.key}
                                            onToggle={() => toggleExpandStat(config.key)}
                                            isNamed={isNamedCircle}
                                        />

                                        {!isLast && <View style={styles.Divider} />}
                                    </View>
                                );
                            })
                        ) : (
                            <ActivityIndicator size="small" color={colors.primary.sage} style={{ paddingVertical: spacing.md }} />
                        )}
                    </View>
                </View>

                {/* Encouragement Actions */}
                {/* <View style={styles.section}>
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
                </View> */}

                {/* Weekly Challenge */}
                {currentChallenge && (
                    <View style={styles.section}>
                        <View style={styles.challengeCard}>
                            <View style={styles.challengeHeaderRow}>
                                <Text style={styles.sectionTitle}>Weekly Challenge</Text>
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeBadgeText}>Active</Text>
                                </View>
                            </View>
                            <View style={styles.Divider} />
                            <View style={styles.challengeContent}>
                                <View style={styles.challengeHeader}>
                                    <View style={styles.challengeIconContainer}>
                                        <Ionicons name="book-outline" size={18} color={colors.primary.sage} />
                                    </View>
                                    <View style={styles.challengeInfo}>
                                        <Text style={styles.challengeTitle}>{currentChallenge.Title}</Text>
                                        <Text style={styles.challengeWeekLabel}>Week {currentChallenge.Week}</Text>
                                    </View>
                                </View>
                                <Text style={styles.challengeGuidance}>{currentChallenge.Guidance}</Text>
                                <View style={styles.challengeTextContainer}>
                                    <Ionicons name="flag-outline" size={14} color={colors.primary.sage} style={{ marginTop: 2 }} />
                                    <Text style={styles.challengeText}>{currentChallenge.Challenge}</Text>
                                </View>
                                <View style={styles.Divider} />
                                <View style={styles.challengeProgressRow}>
                                    <Text style={styles.challengeProgressLabel}>{challengeParticipants.length}/{totalMembers} joined</Text>
                                    <Text style={styles.challengeProgressPercent}>{challengeProgress}%</Text>
                                </View>
                                <View style={styles.challengeProgressBarContainer}>
                                    <View style={[styles.challengeProgressBar, { width: `${challengeProgress}%` }]} />
                                </View>
                                <TouchableOpacity
                                    style={[styles.joinChallengeButton, hasJoinedChallenge && styles.joinedChallengeButton]}
                                    onPress={async () => {
                                        if (hasJoinedChallenge || joiningChallenge) return;
                                        setJoiningChallenge(true);
                                        try {
                                            await FirebaseService.joinWeeklyChallenge(circleId, currentChallengeWeek);
                                            setChallengeParticipants(prev => [...prev, currentUserId]);
                                        } catch (e) {
                                            console.error('Join challenge error:', e);
                                            Alert.alert('Error', 'Failed to join challenge.');
                                        } finally {
                                            setJoiningChallenge(false);
                                        }
                                    }}
                                    disabled={hasJoinedChallenge || joiningChallenge}
                                    activeOpacity={0.7}
                                >
                                    {joiningChallenge ? (
                                        <ActivityIndicator size="small" color={colors.text.dark} />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={hasJoinedChallenge ? 'checkmark-circle' : 'add-circle-outline'}
                                                size={16}
                                                color={hasJoinedChallenge ? '#11B468' : colors.text.dark}
                                            />
                                            <Text style={[styles.joinChallengeText, hasJoinedChallenge && styles.joinedChallengeText]}>
                                                {hasJoinedChallenge ? 'Joined' : 'Join Challenge'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* What intention are you holding this week? */}
                {/* <View style={styles.section}>
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
                </View> */}

                {/* Member List */}
                <View style={styles.section}>
                    <View style={styles.memberCard}>
                        <Text style={styles.sectionTitle}>Member List</Text>
                        <View style={styles.Divider} />
                        {members.map((member, index) => (
                            <MemberRow key={member.id || index} name={member.name} />
                        ))}
                        {members.length > 5 && (
                            <TouchableOpacity style={styles.showMoreButton}>
                                <Text style={styles.showMoreText}>+ {members.length - 5} others</Text>
                            </TouchableOpacity>
                        )}
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
        paddingBottom: spacing.xxl * 1.75,
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
    progressSectionTitle: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        paddingHorizontal: spacing.xs,
    },
    progressDivider: {
        height: 1,
        backgroundColor: colors.border.grey,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
        marginHorizontal: spacing.xxs
    },
    Divider: {
        height: 1,
        backgroundColor: colors.border.grey,
        marginBottom: spacing.sm,
        marginHorizontal: spacing.xxs
    },
    progressContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
        gap: spacing.md,
    },
    legendContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        marginBottom: spacing.xxs,
        flexWrap: 'wrap',
        width: '100%',
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
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.dark,
        flexShrink: 1,
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
        paddingVertical: spacing.sm + 2,
        // borderBottomWidth: 1,
        // borderBottomColor: colors.border.light,
    },
    groupStatIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    groupStatTextContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    groupStatCount: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    groupStatText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.dark,
    },
    expandedMemberList: {
        paddingLeft: 44,
        paddingBottom: spacing.sm,
    },
    expandedMemberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xxs + 2,
    },
    expandedMemberDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary.sage,
        marginRight: spacing.sm,
    },
    expandedMemberName: {
        fontSize: typography.fontSize.sm,
        color: colors.text.grey,
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
    challengeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    challengeContent: {
        marginTop: spacing.xs,
    },
    challengeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
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
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
        marginBottom: 2,
    },
    challengeWeekLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
    },
    challengeGuidance: {
        fontSize: isSmallDevice ? 12 : 13,
        color: colors.text.dark,
        lineHeight: isSmallDevice ? 18 : 20,
        marginBottom: spacing.md,
    },
    challengeTextContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.cards.mint,
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    challengeText: {
        flex: 1,
        fontSize: isSmallDevice ? 12 : 13,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        lineHeight: isSmallDevice ? 18 : 20,
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
        fontWeight: typography.fontWeight.medium,
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
        flexDirection: 'row',
        backgroundColor: colors.primary.light,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: colors.border.grey,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    joinedChallengeButton: {
        borderColor: '#11B468',
        backgroundColor: '#11B46810',
    },
    joinChallengeText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
    },
    joinedChallengeText: {
        color: '#11B468',
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
        backgroundColor: colors.primary.light,
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
        marginBottom: spacing.xxl,
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
