/**
 * SoftUpdateModal.js  —  src/update-screens/SoftUpdateModal.js
 *
 * Dismissible slide-up modal shown when softUpdate.enabled = true.
 * User can close it with "Maybe Later" and continue using the app.
 * Shown once per session (state lives in UpdateContext).
 */

import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Animated, Easing,
    TouchableOpacity, Linking, Platform, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SoftUpdateModal = ({ visible, config, onDismiss }) => {
    const safeConfig = config || {};
    const title    = safeConfig.title    || 'New Update Available';
    const message  = safeConfig.message  || "We've added new features to enhance your experience.";
    const storeUrl = safeConfig.storeUrl || null;

    const backdropOpacity  = useRef(new Animated.Value(0)).current;
    const sheetTranslateY  = useRef(new Animated.Value(400)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(backdropOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.spring(sheetTranslateY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
                Animated.timing(sheetTranslateY, { toValue: 400, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const handleUpdate = async () => {
        if (!storeUrl) return;
        try {
            if (await Linking.canOpenURL(storeUrl)) await Linking.openURL(storeUrl);
        } catch (e) {
            console.warn('[SoftUpdateModal] Cannot open store URL:', e);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onDismiss} activeOpacity={1} id="soft-update-backdrop" />
            </Animated.View>

            {/* Bottom Sheet */}
            <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY: sheetTranslateY }] }]}>
                <LinearGradient
                    colors={['#1d3d2a', '#2e543d', '#3a6b4d']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.sheet}
                >
                    {/* Drag handle */}
                    <View style={styles.handleBar} />

                    {/* Close × */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} id="soft-update-close">
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>

                    {/* Icon */}
                    <View style={styles.iconWrapper}>
                        <View style={styles.iconGlow} />
                        <View style={styles.iconInner}>
                            <Text style={styles.iconEmoji}>🌿</Text>
                        </View>
                    </View>

                    {/* Badge */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>NEW VERSION AVAILABLE</Text>
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.divider} />

                    {/* Update Now */}
                    <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.85} id="soft-update-now-button">
                        <LinearGradient
                            colors={['#ffffff', '#ddeee3']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.updateButtonGradient}
                        >
                            <Text style={styles.updateButtonText}>Update Now</Text>
                            <Text style={styles.updateButtonSub}>{Platform.OS === 'ios' ? 'App Store' : 'Google Play'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Maybe Later */}
                    <TouchableOpacity onPress={onDismiss} style={styles.laterButton} activeOpacity={0.7} id="soft-update-later-button">
                        <Text style={styles.laterButtonText}>Maybe Later</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },

    sheetWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
    sheet:        { paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 40 : 28, paddingHorizontal: 28, alignItems: 'center' },

    handleBar:    { width: 44, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 20 },

    closeBtn:     { position: 'absolute', top: 18, right: 22, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    closeBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },

    iconWrapper:  { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    iconGlow:     { position: 'absolute', width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.08)' },
    iconInner:    { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
    iconEmoji:    { fontSize: 32 },

    badge:        { backgroundColor: 'rgba(205,180,105,0.25)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(205,180,105,0.4)', marginBottom: 14 },
    badgeText:    { color: '#cdb469', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },

    title:        { fontSize: 22, fontWeight: '700', color: '#ffffff', textAlign: 'center', marginBottom: 10 },
    message:      { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 21, paddingHorizontal: 8 },

    divider:      { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 22 },

    updateButton:         { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
    updateButtonGradient: { paddingVertical: 16, alignItems: 'center' },
    updateButtonText:     { fontSize: 16, fontWeight: '700', color: '#2e543d' },
    updateButtonSub:      { fontSize: 11, color: '#4a7a5a', marginTop: 2, fontWeight: '500' },

    laterButton:     { paddingVertical: 10 },
    laterButtonText: { fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
});

export default SoftUpdateModal;
