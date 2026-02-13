import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const { height, width } = Dimensions.get('window');

const GradientBackground = ({ children, style }) => {
    return (
        <LinearGradient
            colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, style]}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        minHeight: height,
        width: width,
    },
});

export default GradientBackground;
