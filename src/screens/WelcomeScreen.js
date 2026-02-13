import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { GradientBackground, Button, FeatureCard } from '../components';
import { colors, typography, spacing } from '../theme';

const { height } = Dimensions.get('window');

const features = [
    {
        id: 1,
        title: 'Building consistent prayer habits',
        icon: require('../../assets/images/habits.png'),
        backgroundColor: '#B6D3C0',
    },
    {
        id: 2,
        title: 'Reading Quran daily',
        icon: require('../../assets/images/quran-pak.png'),
        backgroundColor: '#E3C27A',
    },
    {
        id: 3,
        title: 'Practicing Dhikr',
        icon: require('../../assets/images/dhikr.png'),
        backgroundColor: '#D1AD73', // Warm tan
    },
    {
        id: 4,
        title: 'Reflecting through journaling',
        icon: require('../../assets/images/journal.png'),
        backgroundColor: '#9ECED1',
    },
    {
        id: 5,
        title: 'Staying motivated with your circle',
        icon: require('../../assets/images/circle.png'),
        backgroundColor: '#DDF0B9',
    },
];

const WelcomeScreen = ({ navigation }) => {
    const handleGetStarted = () => {
        navigation.navigate('SignUp');
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <Text style={styles.header}>
                        Increase your daily AJR by
                    </Text>

                    {/* Feature Cards */}
                    <View style={styles.cardsContainer}>
                        {features.map((feature) => (
                            <FeatureCard
                                key={feature.id}
                                id={feature.id}
                                title={feature.title}
                                icon={feature.icon}
                                backgroundColor={feature.backgroundColor}
                            />
                        ))}
                    </View>
                </ScrollView>

                {/* Bottom Button */}
                <View style={styles.buttonContainer}>
                    <Button
                        title="Let's Get Started"
                        onPress={handleGetStarted}
                        icon="arrow-forward"
                        style={styles.button}
                    />
                </View>
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: spacing.xxl,
        paddingTop: spacing.xxl + spacing.lg,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    header: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.regular,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    cardsContainer: {
        marginTop: spacing.md,
    },
    buttonContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
        paddingTop: spacing.md,
    },
    button: {
        width: '100%',
    },
});

export default WelcomeScreen;
