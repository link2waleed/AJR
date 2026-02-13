import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

const FeatureCard = ({
    id,
    title,
    icon,
    backgroundColor = colors.cards.cream,
    iconColor = colors.text.dark,
    style,
}) => {
    const titleColor = colors.text.dark;
    return (
        <View style={[styles.card, { backgroundColor }, shadows.sm, style]}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                <Image source={icon} style={styles.icon} resizeMode="contain" />
            </View>
            <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    title: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        flex: 1,
    },
});

export default FeatureCard;
