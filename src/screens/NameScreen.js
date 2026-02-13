import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground, Button, Input } from '../components';
import { colors, typography, spacing } from '../theme';
import FirebaseService from '../services/FirebaseService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = screenWidth < 375;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;

const NameScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setLoading(true);
        try {
            // Initialize Firebase user profile with name
            await FirebaseService.initializeUserProfile(name.trim());
            navigation.navigate('LocationPermission', { userName: name });
        } catch (error) {
            console.error('Error saving name:', error);
            Alert.alert('Error', 'Failed to save your name. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.primary.light }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Back Button */}
                {/* <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    disabled={loading}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                </TouchableOpacity> */}

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
                            editable={!loading}
                        />
                    </View>

                    {/* Continue Button */}
                    <Button
                        title={loading ? "Saving..." : "Continue"}
                        onPress={handleContinue}
                        icon="arrow-forward"
                        style={styles.button}
                        disabled={!name.trim() || loading}
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
    backButton: {
        position: 'absolute',
        top: spacing.lg,
        left: spacing.md,
        padding: spacing.sm,
        zIndex: 10,
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
