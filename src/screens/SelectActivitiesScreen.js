import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Image,
} from 'react-native';
import { GradientBackground, Button } from '../components';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const activities = [
    {
        id: 'prayers',
        title: 'Prayers',
        subtitle: 'Show Prayers on Dashboard',
        icon: require('../../assets/images/habits.png'),
    },
    {
        id: 'dhikr',
        title: 'Dhikr',
        subtitle: 'Show Dhikr on Dashboard',
        icon: require('../../assets/images/dhikr.png'),
    },
    {
        id: 'quran',
        title: 'Quran',
        subtitle: 'Show Quran on Dashboard',
        icon: require('../../assets/images/quran-pak.png'),
    },
    {
        id: 'journaling',
        title: 'Journaling',
        subtitle: 'Show Journaling on Dashboard',
        icon: require('../../assets/images/journal.png'),
    },
];

const RadioButton = ({ selected, onPress, label }) => (
    <TouchableOpacity style={styles.radioContainer} onPress={onPress} activeOpacity={0.7}>
        <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
            {selected && <View style={styles.radioInner} />}
        </View>
    </TouchableOpacity>
);

const ActivityCard = ({ activity, selectedValue, onSelect }) => (
    <View style={[styles.card]}>
        <View style={styles.cardIconContainer}>
            <Image source={activity.icon} style={styles.cardIcon} resizeMode="contain" />
        </View>
        <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{activity.title}</Text>
            <Text style={styles.cardSubtitle}>{activity.subtitle}</Text>
        </View>
        <View style={styles.radioGroup}>
            <RadioButton
                selected={selectedValue === 'yes'}
                onPress={() => onSelect('yes')}
                label="Yes"
            />
            <RadioButton
                selected={selectedValue === 'no'}
                onPress={() => onSelect('no')}
                label="No"
            />
        </View>
    </View>
);

const SelectActivitiesScreen = ({ navigation, route }) => {
    const [selections, setSelections] = useState({
        prayers: 'yes',
        dhikr: 'yes',
        quran: 'yes',
        journaling: 'yes',
    });

    const handleSelect = (activityId, value) => {
        setSelections(prev => ({ ...prev, [activityId]: value }));
    };

    const handleContinue = () => {
        // Navigate to main app or next onboarding step
        console.log('Selected activities:', selections);
        // navigation.navigate('Home', { ...route?.params, activities: selections });
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Personalize your dashboard by</Text>
                    <Text style={styles.title}>choosing your AJR Activities</Text>
                </View>

                {/* Subtitle */}
                <Text style={styles.subtitle}>
                    Select the activities you want to see and track in one place
                </Text>

                {/* Activity Cards */}
                <View style={styles.cardsContainer}>
                    {activities.map((activity) => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            selectedValue={selections[activity.id]}
                            onSelect={(value) => handleSelect(activity.id, value)}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
                <Button
                    title="Continue"
                    onPress={handleContinue}
                    icon="arrow-forward"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
        marginTop: spacing.md,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.08,
        paddingBottom: spacing.md,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: isSmallDevice ? 20 : 24,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        textAlign: 'center',
        lineHeight: isSmallDevice ? 28 : 32,
    },
    subtitle: {
        fontSize: isSmallDevice ? 13 : 15,
        color: colors.text.grey,
        textAlign: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },
    cardsContainer: {
        marginBottom: spacing.lg,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    cardIconContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(122, 158, 127, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardIcon: {
        width: 24,
        height: 24,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: isSmallDevice ? 11 : 12,
        color: colors.text.grey,
    },
    radioGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    radioLabel: {
        fontSize: isSmallDevice ? 12 : 14,
        color: colors.text.darkMuted,
        marginRight: spacing.xs,
    },
    radioLabelSelected: {
        color: colors.primary.sage,
        fontWeight: typography.fontWeight.medium,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D0D0D0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: colors.primary.sage,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary.sage,
    },
    buttonContainer: {
        paddingHorizontal: horizontalPadding,
        paddingBottom: spacing.xxl,
        paddingTop: spacing.md,
    },
});

export default SelectActivitiesScreen;
