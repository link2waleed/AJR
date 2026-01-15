// Theme index - single import point
export { colors, default as Colors } from './colors';
export { typography, textStyles } from './typography';
export { spacing, borderRadius, shadows } from './spacing';

// Combined theme object for easy access
import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

const theme = {
    colors,
    typography,
    textStyles,
    spacing,
    borderRadius,
    shadows,
};

export default theme;
