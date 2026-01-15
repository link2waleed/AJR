import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { GradientBackground, Button, Input } from '../components';
import { colors, typography, spacing } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const NameScreen = ({ navigation }) => {
    const [name, setName] = useState('');

    const handleContinue = () => {
        if (name.trim()) {
            navigation.navigate('LocationPermission', { userName: name });
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.primary.light }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
                    {/* Greeting Text */}
                    <View style={styles.greetingContainer}>
                        <Text style={styles.greeting}>"As-salāmu 'alaykum,</Text>
                        <Text style={styles.greeting}>what's your name?"</Text>
                    </View>

                    {/* Name Input */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Name</Text>
                        <Input
                            value={name}
                            onChangeText={setName}
                            placeholder="James Islam"
                            iconName="person-outline"
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Continue Button */}
                    <Button
                        title="Continue"
                        onPress={handleContinue}
                        icon="arrow-forward"
                        style={styles.button}
                        disabled={!name.trim()}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: screenHeight * 0.15,
    },
    greetingContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    greeting: {
        fontSize: isSmallDevice ? 24 : 28,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        textAlign: 'center',
        lineHeight: isSmallDevice ? 34 : 40,
    },
    inputSection: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: isSmallDevice ? 13 : 14,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.black,
        marginBottom: spacing.xs,
    },
    button: {
        marginTop: spacing.sm,
    },
});

export default NameScreen;
