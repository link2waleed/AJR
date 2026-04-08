/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
  },
  resolver: {
    ...defaultConfig.resolver,
    // Add any extra extensions if needed (usually default is enough)
    sourceExts: defaultConfig.resolver.sourceExts,
  },
};