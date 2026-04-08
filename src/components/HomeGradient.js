import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const { height, width } = Dimensions.get('window');

const HomeGradient = ({ children, style }) => {
    return (
        <LinearGradient
            colors={[colors.homeGradient.top, colors.homeGradient.bottom]}
            locations={[0, 1]}
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

export default HomeGradient;
