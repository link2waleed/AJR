// Typography system for AJR app
// Customize fonts and text styles here

export const typography = {
    // Font families (using system fonts, can be replaced with custom fonts)
    fontFamily: {
        regular: 'System',
        medium: 'System',
        semibold: 'System',
        bold: 'System',
    },

    // Font sizes
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 22,
        xxl: 28,
        xxxl: 36,
        display: 48,
    },

    // Font weights
    fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Letter spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 1,
        wider: 2,
        widest: 4,
    },
};

// Pre-defined text styles
export const textStyles = {
    heading1: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.bold,
        letterSpacing: typography.letterSpacing.wide,
    },
    heading2: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.semibold,
        letterSpacing: typography.letterSpacing.normal,
    },
    heading3: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
    },
    body: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.regular,
        lineHeight: typography.lineHeight.normal,
    },
    bodySmall: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.regular,
    },
    caption: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.regular,
    },
    button: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
    },
    label: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
};

export default typography;
