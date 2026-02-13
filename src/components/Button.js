import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const Button = ({
    title,
    onPress,
    variant = 'primary', // 'primary', 'social'
    icon,
    iconComponent,
    style,
    textStyle,
    disabled = false,
}) => {
    const getButtonStyle = () => {
        switch (variant) {
            case 'social':
                return styles.socialButton;
            case 'primary':
            default:
                return styles.primaryButton;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'social':
                return styles.socialText;
            case 'primary':
            default:
                return styles.primaryText;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, getButtonStyle(), disabled && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={variant === 'primary' ? colors.text.primary : colors.text.dark}
                        style={styles.icon}
                    />
                )}
                {iconComponent && (
                    <View style={styles.iconComponent}>{iconComponent}</View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: spacing.md,
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
    primaryButton: {
        backgroundColor: colors.button.primary,
    },
    socialButton: {
        backgroundColor: colors.button.social,
    },
    text: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
    },
    primaryText: {
        color: colors.text.primary,
    },
    socialText: {
        color: colors.text.dark,
    },
    icon: {
        marginLeft: spacing.xs,
    },
    iconComponent: {
        marginLeft: spacing.xs,
    },
    disabled: {
        opacity: 0.6,
    },
});

export default Button;
