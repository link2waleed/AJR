import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import createCircleIcon from '../../../assets/images/create-circle.png';
import joinCircleIcon from '../../../assets/images/circle.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const MyCircleSetupScreen = ({ navigation }) => {

    const handleCreateCircle = () => {
        console.log('Create Circle');
        // Navigate to create circle flow
    };

    const handleJoinCircle = () => {
        console.log('Join Circle');
        // Navigate to join circle flow
    };

    const handleSkip = () => {
        // Navigate to subscription screen
        navigation.navigate('Subscription');
    };

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color={colors.text.black} />
            </TouchableOpacity>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Spacer for vertical centering */}
                <View style={styles.spacer} />

                {/* Header */}
                <Text style={styles.title}>Grow together in Good</Text>
                <Text style={styles.subtitle}>
                    Build a supportive space with friends and family to encourage worship, reflection, and consistency
                </Text>

                {/* Circle Options */}
                <View style={styles.optionsContainer}>
                    {/* Create Circle */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleCreateCircle}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionIconContainer}>
                            <Image source={createCircleIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                        </View>
                        <Text style={styles.optionLabel}>Create Circle</Text>
                        {/* <Ionicons name="chevron-forward" size={22} color={colors.text.grey} /> */}
                    </TouchableOpacity>

                    {/* Join Circle */}
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={handleJoinCircle}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionIconContainer}>
                            <Image source={joinCircleIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                        </View>
                        <Text style={styles.optionLabel}>Join Circle</Text>
                        {/* <Ionicons name="chevron-forward" size={22} color={colors.text.grey} /> */}
                    </TouchableOpacity>
                </View>

                {/* Spacer */}
                <View style={styles.spacer} />
            </ScrollView>

            {/* Skip Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.skipButtonFull} onPress={handleSkip}>
                    <Text style={styles.skipText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.text.black} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
    },
    backButton: {
        position: 'absolute',
        top: spacing.lg,
        left: spacing.md,
        padding: spacing.sm,
        zIndex: 10,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalPadding,
        paddingTop: screenHeight * 0.1,
        paddingBottom: spacing.md,
        flexGrow: 1,
    },
    spacer: {
        flex: 1,
    },
    title: {
        fontSize: isSmallDevice ? 22 : 26,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.grey,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
        paddingHorizontal: spacing.sm,
    },
    optionsContainer: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.62)',
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    optionIconContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        backgroundColor: '#D8EAD7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    optionLabel: {
        flex: 1,
        fontSize: isSmallDevice ? 14 : 16,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
    buttonContainer: {
        paddingHorizontal: horizontalPadding,
        paddingBottom: spacing.xxl,
        paddingTop: spacing.md,
    },
    skipButtonFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    skipText: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.black,
        marginRight: spacing.xs,
    },
});

export default MyCircleSetupScreen;
