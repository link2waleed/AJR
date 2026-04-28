import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const { height, width } = Dimensions.get('window');

const GradientBackground = ({ children, style }) => {
    return (
        <LinearGradient
            colors={['#cdb469', '#a0aea0', '#2e543d']}
                locations={[0, 0.35, 0.95]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.gradient, style]}
        >
            {children}
        </LinearGradient>
    )
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        minHeight: height,
        width: width,
    },
});

export default GradientBackground;
