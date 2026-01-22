// Expandable color palette for AJR app
// To update theme, modify these values - all components reference this file

export const colors = {
  // Primary brand colors
  primary: {
    sage: '#7A9E7F',
    gold: '#C4B896',
    darkSage: '#5A7A5F',
    light: 'rgba(241, 245, 241, 0.62);' //#F1F5F1
  },

  // Gradient colors for backgrounds
  gradient: {
    start: '#7A9E7F',   // Sage green (top-left)
    middle: '#9AAF8F',  // Blend
    end: '#C4B896',     // Muted gold (bottom-right)
  },

  // Home screen gradient
  homeGradient: {
    top: '#BEE5E3',     // Light teal (70% at top)
    bottom: '#FBE3C0',  // Light peach/gold (30% at bottom)
  },

  // Feature card colors (Welcome screen)
  cards: {
    cream: '#F5F3E8',
    mint: '#D4E4D1',
    gold: '#DAC88A',
    softGreen: '#E8EDD8',
    lightMint: '#C8DBC4',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.9)',
    muted: 'rgba(255, 255, 255, 0.7)',
    dark: '#5A6B5A',
    darkMuted: '#7A8A7A',
    placeholder: '#9AA99A',
    black: '#202020',
    grey: '#757575',
  },

  // Accent colors
  accent: {
    coral: '#E57373',
    link: '#D4635C',
    icon: '#D8EAD7',
  },

  // AJR Ring colors (circular progress) - matching exact design
  rings: {
    layer1: '#8FAF9A',      // First layer (outer) - sage green
    layer2: '#E3C27A',      // Second layer - gold
    layer3: '#D1AD73',      // Third layer - darker gold
    innerCircle: '#9ECED1', // Inner circle - teal
    separator: '#F3EEDE',   // Between layers - cream
  },

  // Input and button colors
  input: {
    background: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(255, 255, 255, 0.3)',
  },

  // Button colors
  button: {
    primary: '#7C8E7B',
    social: 'rgba(255, 255, 255, 0.9)',
    prayer: '#134B43',    // Dark teal for Next Prayer button
  },

  // Border colors
  border: {
    grey: '#E0E0E0',
    light: '#F0F0F0',
  },
};

export default colors;
