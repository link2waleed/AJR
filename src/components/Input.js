import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme';

const Input = ({
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    iconName,
    keyboardType = 'default',
    autoCapitalize = 'none',
    style,
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <View style={[styles.container, isFocused && styles.focused, style]}>
            {iconName && (
                <Ionicons
                    name={iconName}
                    size={20}
                    color={colors.text.black}
                    style={styles.icon}
                />
            )}
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.text.placeholder}
                secureTextEntry={secureTextEntry && !isPasswordVisible}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
            {secureTextEntry && (
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                    <Ionicons
                        name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.text.placeholder}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.input.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: '#C5C5C5',
    },
    focused: {
        borderColor: colors.primary.sage,
    },
    icon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: colors.text.black,
        paddingVertical: spacing.xs,
    },
    eyeIcon: {
        padding: spacing.xs,
    },
});

export default Input;
