import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

const RedeemCodeScreen = ({ navigation }) => {
    const [code, setCode] = useState('');

    const handleRedeem = () => {
        if (!code.trim()) {
            Alert.alert('Invalid Code', 'Please enter a valid referral code.');
            return;
        }
        
        // Handle code redemption logic here in the future
        Alert.alert('Code Applied', 'Your code has been successfully recorded. Any eligible benefits will be applied to your account.', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Redeem Code</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Got a Special Code?</Text>
                <Text style={styles.subtitle}>
                    Enter your referral or promo code below to unlock special AJR+ offers.
                </Text>

                <View style={styles.inputContainer}>
                    <Ionicons name="ticket-outline" size={20} color={colors.text.grey} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter code"
                        placeholderTextColor={colors.text.grey}
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.redeemButton, !code.trim() && styles.redeemButtonDisabled]} 
                    onPress={handleRedeem}
                    disabled={!code.trim()}
                >
                    <Text style={styles.redeemButtonText}>Redeem</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary.light,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xl + spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.black,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: colors.text.dark,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    input: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.md,
        color: colors.text.black,
    },
    redeemButton: {
        backgroundColor: colors.primary.sage,
        width: '100%',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    redeemButtonDisabled: {
        opacity: 0.5,
    },
    redeemButtonText: {
        color: '#fff',
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
    },
});

export default RedeemCodeScreen;
