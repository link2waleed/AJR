import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const SubscriptionScreen = ({ navigation }) => {

    const handleSupportMonthly = () => {
        navigation.navigate('FinalSetup');

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
                {/* Support Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/images/support.png')}
                        style={styles.supportImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Title */}
                <Text style={styles.title}>A Ramadan Gift 🌙</Text>

                {/* Description */}
                <Text style={styles.description}>
                    AJR is free for everyone this Ramadan so you can focus fully on your worship, reflection, and routines together.
                </Text>

                {/* Blessing Text */}


                {/* Monthly Support Button */}
                <TouchableOpacity style={styles.supportButton} onPress={handleSupportMonthly}>
                    <Text style={styles.supportButtonText}>Try free for 30 days</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
        marginTop: spacing.md
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalPadding,
    paddingBottom: spacing.md,
},
    imageContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    supportImage: {
        width: screenWidth * 0.5,
        height: screenWidth * 0.4,
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
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.xl
    },
    highlightText: {
        fontSize: isSmallDevice ? 14 : 16,
        color: '#5768C7', // Teal/green highlight color from design
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: spacing.lg,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary.sage,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md + 4,
        paddingHorizontal: spacing.xl,
        width: '100%',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    supportButtonText: {
        fontSize: isSmallDevice ? 15 : 17,
        fontWeight: typography.fontWeight.regular,
        color: '#FFFFFF',
        marginRight: spacing.sm,
    },
    yearlyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingVertical: spacing.md + 4,
        paddingHorizontal: spacing.lg,
        width: '100%',
        marginBottom: spacing.lg,
    },
    yearlyButtonText: {
        fontSize: isSmallDevice ? 13 : 15,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginRight: spacing.sm,
    },
    tryFreeLink: {
        marginBottom: spacing.md,
    },
    tryFreeText: {
        fontSize: isSmallDevice ? 14 : 16,
        color: colors.text.black,
        textDecorationLine: 'underline',
    },
    cancelLink: {
        marginTop: spacing.xs,
    },
    cancelText: {
        fontWeight: typography.fontWeight.regular,
        fontSize: isSmallDevice ? 13 : 15,
        color: colors.text.grey,
    },
});

export default SubscriptionScreen;
