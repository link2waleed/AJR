import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, typography, borderRadius, spacing } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

const LimitPopupModal = ({ visible, onClose, onUpgrade, title, message }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    
                    <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade} activeOpacity={0.8}>
                        <Text style={styles.upgradeText}>Upgrade Now</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.closeText}>Not now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContainer: {
        width: screenWidth * 0.85,
        backgroundColor: '#fff',
        borderRadius: borderRadius.xxl,
        padding: spacing.xl,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: typography.fontSize.md,
        color: colors.text.dark,
        textAlign: 'left',
        marginBottom: spacing.xl,
        lineHeight: 26,
        alignSelf: 'stretch',
    },
    upgradeButton: {
        backgroundColor: colors.primary.sage, // AJR+ primary subtle color or custom gold, let's use sage for consistency
        width: '100%',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    upgradeText: {
        color: '#fff',
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
    },
    closeButton: {
        width: '100%',
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    closeText: {
        color: colors.text.grey,
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
    },
});

export default LimitPopupModal;
