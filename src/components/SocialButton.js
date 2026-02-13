import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

// Responsive sizing
const isSmallDevice = screenWidth < 375;
const buttonPadding = isSmallDevice ? spacing.sm : spacing.md;
const fontSize = isSmallDevice ? 14 : 16;
const iconSize = isSmallDevice ? 18 : 22;

const SocialButton = ({
    provider, // 'apple' or 'google'
    onPress,
    style,
    isSignIn = false, // To show "Sign in" vs "Sign up"
}) => {
    const getIcon = () => {
        if (provider === 'apple') {
            return (
                <Image
                    source={require('../../assets/images/apple.png')}
                    style={[styles.icon, { width: iconSize, height: iconSize }]}
                    resizeMode="contain"
                />
            );
        }
        return (
            <Image
                source={require('../../assets/images/google.png')}
                style={[styles.icon, { width: iconSize, height: iconSize }]}
                resizeMode="contain"
            />
        );
    };

    const getText = () => {
        const action = isSignIn ? 'Sign in' : 'Sign up';
        return provider === 'apple' ? `${action} with Apple` : `${action} with Google`;
    };

    return (
        <TouchableOpacity
            style={[styles.button, { paddingVertical: buttonPadding }, style]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                <Text style={[styles.text, { fontSize }]}>{getText()}</Text>
                <View style={styles.iconContainer}>
                    {getIcon()}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.button.social,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
    },
    iconContainer: {
        marginLeft: spacing.sm,
    },
    icon: {
        // Size is set dynamically based on device
    },
});

export default SocialButton;
