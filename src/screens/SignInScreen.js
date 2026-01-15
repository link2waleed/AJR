import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    Dimensions,
} from 'react-native';
import {
    GradientBackground,
    Button,
    Input,
    SocialButton,
    Checkbox,
} from '../components';
import { colors, typography, spacing } from '../theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = screenWidth < 375;
const isMediumDevice = screenWidth >= 375 && screenWidth < 414;
const isLargeDevice = screenWidth >= 414;

// Responsive values
const logoSize = isSmallDevice ? 100 : isMediumDevice ? 120 : 140;
const titleSize = isSmallDevice ? 24 : isMediumDevice ? 26 : 28;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;
const topPadding = screenHeight < 700 ? spacing.xl : spacing.xxl;

const SignInScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleSignIn = () => {
        console.log('Sign in:', { email, password, rememberMe });
        // Navigate to onboarding flow after sign in
        navigation.navigate('Name');
    };

    const handleSignUp = () => {
        navigation.navigate('SignUp');
    };

    const handleForgotPassword = () => {
        console.log('Forgot password');
    };

    const handleAppleSignIn = () => {
        console.log('Apple sign in');
    };

    const handleGoogleSignIn = () => {
        console.log('Google sign in');
    };

    return (
        <GradientBackground>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingHorizontal: horizontalPadding, paddingTop: topPadding }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* Brand Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/images/brand-logo.png')}
                            style={[styles.logo, { width: logoSize, height: logoSize }]}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { fontSize: titleSize }]}>Sign In</Text>

                    {/* Form */}
                    <View style={styles.form}>
                        <Text style={styles.label}>Email</Text>
                        <Input
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter Your Email"
                            iconName="mail-outline"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={[styles.label, styles.labelSpacing]}>Password</Text>
                        <Input
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter Password"
                            iconName="lock-closed-outline"
                            secureTextEntry
                        />

                        {/* Remember Me & Forgot Password */}
                        <View style={styles.optionsRow}>
                            <Checkbox
                                checked={rememberMe}
                                onToggle={() => setRememberMe(!rememberMe)}
                                label="Remember Me"
                            />
                            <TouchableOpacity onPress={handleForgotPassword}>
                                <Text style={styles.forgotPassword}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sign In Button */}
                    <Button
                        title="Sign In"
                        onPress={handleSignIn}
                        icon="arrow-forward"
                        style={styles.actionButton}
                    />

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Buttons */}
                    <SocialButton
                        provider="apple"
                        onPress={handleAppleSignIn}
                        isSignIn={true}
                        style={styles.socialButton}
                    />
                    <SocialButton
                        provider="google"
                        onPress={handleGoogleSignIn}
                        isSignIn={true}
                        style={styles.socialButton}
                    />

                    {/* Sign Up Link */}
                    <View style={styles.linkContainer}>
                        <Text style={styles.linkText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={handleSignUp}>
                            <Text style={styles.linkAction}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: spacing.lg,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: spacing.xl,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    logo: {
        // Size is set dynamically
    },
    title: {
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    form: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: isSmallDevice ? 13 : 14,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    labelSpacing: {
        marginTop: spacing.sm,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    forgotPassword: {
        color: '#FF5A68',
        fontSize: isSmallDevice ? 11 : 14,
        fontWeight: typography.fontWeight.medium,
        flexShrink: 0,
    },
    actionButton: {
        marginBottom: spacing.md,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.text.muted,
    },
    dividerText: {
        marginHorizontal: spacing.md,
        color: colors.text.muted,
        fontSize: isSmallDevice ? 12 : 14,
    },
    socialButton: {
        marginBottom: spacing.sm,
    },
    linkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    linkText: {
        color: colors.text.primary,
        fontSize: isSmallDevice ? 13 : 14,
    },
    linkAction: {
        color: colors.text.primary,
        fontSize: isSmallDevice ? 13 : 14,
        fontWeight: typography.fontWeight.bold,
    },
});

export default SignInScreen;
