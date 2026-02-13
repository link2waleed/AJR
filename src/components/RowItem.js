import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';

/**
 * RowItem – reusable list row with icon, title and chevron
 * Props:
 *  - title: string
 *  - icon: image source (require(...)) OR React component
 *  - onPress: function
 *  - backgroundColor?: string
 */
const RowItem = ({ title, icon, onPress, backgroundColor = colors.cards.cream }) => {
    return (
        <TouchableOpacity style={[styles.container, { backgroundColor }]} onPress={onPress} activeOpacity={1}>
            {typeof icon === 'number' ? (
                <Image source={icon} style={styles.icon} resizeMode="contain" />
            ) : (
                <View style={styles.icon}>{icon}</View>
            )}
            <Text style={styles.title}>{title}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.dark} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    icon: {
        width: 30,
        height: 30,
        marginRight: spacing.md,
        borderRadius: 8,
        overflow: 'hidden',
    },
    title: {
        flex: 1,
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
    },
});

export default RowItem;
