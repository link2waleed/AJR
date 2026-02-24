import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

const NotificationPermissionModal = ({ visible, onClose }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Icon */}
                    <View style={styles.iconCircle}>
                        <Ionicons name="notifications-outline" size={32} color="#FFFFFF" />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Enable Notifications</Text>

                    {/* Description */}
                    <Text style={styles.description}>
                        AJR needs notification permission to send you prayer reminders and daily alerts. You can change this anytime in your device settings.
                    </Text>

                    {/* Primary Button */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => {
                            onClose();
                            Linking.openSettings().catch(() => { });
                        }}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="settings-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryButtonText}>Open Settings</Text>
                    </TouchableOpacity>

                    {/* Secondary Button */}
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.secondaryButtonText}>Not Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    card: {
        width: screenWidth - 64,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingTop: 36,
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: typography.fontWeight.semibold,
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 28,
        paddingHorizontal: 4,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 14,
        backgroundColor: colors.primary.sage,
        borderRadius: 14,
        marginBottom: 10,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: typography.fontWeight.semibold,
        color: '#FFFFFF',
    },
    secondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: typography.fontWeight.medium,
        color: '#999999',
    },
});

export default NotificationPermissionModal;
