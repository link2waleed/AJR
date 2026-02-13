import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

const { width: screenWidth } = Dimensions.get('window');
const isSmallDevice = screenWidth < 375;

const Checkbox = ({
    checked,
    onToggle,
    label,
    linkText,
    onLinkPress,
    style,
}) => {
    const checkboxSize = isSmallDevice ? 18 : 20;
    const fontSize = isSmallDevice ? 12 : 14;

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={[styles.checkbox, checked && styles.checked, { width: checkboxSize, height: checkboxSize }]}>
                {checked && (
                    <Ionicons name="checkmark" size={checkboxSize - 6} color={colors.text.primary} />
                )}
            </View>
            <View style={styles.labelContainer}>
                <Text style={[styles.label, { fontSize }]}>{label}</Text>
                {linkText && (
                    <TouchableOpacity onPress={onLinkPress}>
                        <Text style={[styles.link, { fontSize }]}>{linkText}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    checkbox: {
        borderRadius: borderRadius.sm / 2,
        borderWidth: 2,
        borderColor: colors.text.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.xs,
    },
    checked: {
        backgroundColor: colors.primary.sage,
        borderColor: colors.primary.sage,
    },
    labelContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flexShrink: 1,
    },
    label: {
        color: colors.text.primary,
    },
    link: {
        color: colors.text.primary,
        textDecorationLine: 'underline',
        marginLeft: 4,
    },
});

export default Checkbox;
