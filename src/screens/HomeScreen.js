import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Home</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
    },
});

export default HomeScreen;
