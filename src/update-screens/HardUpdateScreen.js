/**
 * HardUpdateScreen.js  —  src/update-screens/HardUpdateScreen.js
 *
 * Full-screen, non-dismissible update gate.
 * Shown when hardUpdate.enabled = true in the GitHub Pages config.
 * User cannot go back — they must tap "Update Now" to open the store.
 */

import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Animated, Easing,
    TouchableOpacity, Linking, SafeAreaView, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const HardUpdateScreen = ({ route }) => {
    const config   = route?.params?.config;
    const safeConfig = config || {};
    const title    = safeConfig.title    || 'Update Required';
    const message  = safeConfig.message  || 'A critical update is available. Please update the app to continue using AJR.';
    const storeUrl = safeConfig.storeUrl || null;

    // ─── Animations ──────────────────────────────────────────────────────────
    const iconScale         = useRef(new Animated.Value(0.4)).current;
    const iconOpacity       = useRef(new Animated.Value(0)).current;
    const contentOpacity    = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(30)).current;
    const buttonScale       = useRef(new Animated.Value(0.85)).current;
    const pulseAnim         = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(iconScale,   { toValue: 1, tension: 70, friction: 6, useNativeDriver: true }),
                Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            Animated.delay(150),
            Animated.parallel([
                Animated.timing(contentOpacity,    { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(contentTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.delay(100),
            Animated.spring(buttonScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        ]).start(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            ).start();
        });
    }, []);

    const handleUpdate = async () => {
        if (!storeUrl) return;
        try {
            if (await Linking.canOpenURL(storeUrl)) await Linking.openURL(storeUrl);
        } catch (e) {
            console.warn('[HardUpdateScreen] Cannot open store URL:', e);
        }
    };

    return (
        <LinearGradient
            colors={['#cdb469', '#a0aea0', '#2e543d']}
            locations={[0, 0.35, 0.95]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Decorative background circles */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />

                <View style={styles.container}>
                    {/* ── Animated icon ── */}
                    <Animated.View style={[styles.iconWrapper, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
                        <Animated.View style={[styles.iconGlow, { transform: [{ scale: pulseAnim }] }]} />
                        <View style={styles.iconInner}>
                            <Text style={styles.iconEmoji}>⬆</Text>
                        </View>
                    </Animated.View>

                    {/* ── Badge ── */}
                    <Animated.View style={[styles.badgeWrapper, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>UPDATE REQUIRED</Text>
                        </View>
                    </Animated.View>

                    {/* ── Title & Message ── */}
                    <Animated.View style={[styles.textBlock, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </Animated.View>

                    {/* ── Update Button ── */}
                    <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScale }] }]}>
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={handleUpdate}
                            activeOpacity={0.85}
                            id="hard-update-button"
                        >
                            <LinearGradient
                                colors={['#ffffff', '#e8f0ea']}
                                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>Update Now</Text>
                                <Text style={styles.buttonSubText}>
                                    {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.Text style={[styles.footnote, { opacity: contentOpacity }]}>
                        This update is required to continue using AJR.
                    </Animated.Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient:      { flex: 1, width, minHeight: height },
    safeArea:      { flex: 1 },
    container:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

    decorCircle1: { position: 'absolute', top: -80,  right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.06)' },
    decorCircle2: { position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.04)' },

    iconWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
    iconGlow:    { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.15)' },
    iconInner:   { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
    iconEmoji:   { fontSize: 40, color: '#ffffff' },

    badgeWrapper: { marginBottom: 20 },
    badge:        { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    badgeText:    { color: '#ffffff', fontSize: 11, fontWeight: '700', letterSpacing: 2 },

    textBlock: { alignItems: 'center', marginBottom: 40 },
    title:     { fontSize: 28, fontWeight: '700', color: '#ffffff', textAlign: 'center', marginBottom: 14, letterSpacing: 0.3 },
    message:   { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 23 },

    buttonWrapper:    { width: '100%', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 },
    updateButton:     { borderRadius: 18, overflow: 'hidden' },
    buttonGradient:   { paddingVertical: 18, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
    buttonText:       { fontSize: 18, fontWeight: '700', color: '#2e543d', letterSpacing: 0.3 },
    buttonSubText:    { fontSize: 12, color: '#4a7a5a', marginTop: 2, fontWeight: '500' },

    footnote: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
});

export default HardUpdateScreen;
