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

const SignUpScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    const handleSignUp = () => {
        console.log('Sign up:', { email, password, confirmPassword, agreeToTerms });
        // Navigate to onboarding flow after sign up
        navigation.navigate('Name');
    };

    const handleSignIn = () => {
        navigation.navigate('SignIn');
    };

    const handleAppleSignUp = () => {
        console.log('Apple sign up');
    };

    const handleGoogleSignUp = () => {
        console.log('Google sign up');
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
                    <Text style={[styles.title, { fontSize: titleSize }]}>Sign Up</Text>

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

                        <Text style={[styles.label, styles.labelSpacing]}>Confirm Password</Text>
                        <Input
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Enter Password"
                            iconName="lock-closed-outline"
                            secureTextEntry
                        />

                        <Checkbox
                            checked={agreeToTerms}
                            onToggle={() => setAgreeToTerms(!agreeToTerms)}
                            label="I agree to the "
                            linkText="Terms & Privacy Policy"
                            onLinkPress={() => console.log('Open Terms')}
                            style={styles.checkbox}
                        />
                    </View>

                    {/* Sign Up Button */}
                    <Button
                        title="Sign Up"
                        onPress={handleSignUp}
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
                        onPress={handleAppleSignUp}
                        style={styles.socialButton}
                    />
                    <SocialButton
                        provider="google"
                        onPress={handleGoogleSignUp}
                        style={styles.socialButton}
                    />

                    {/* Sign In Link */}
                    <View style={styles.linkContainer}>
                        <Text style={styles.linkText}>Already have an account? </Text>
                        <TouchableOpacity onPress={handleSignIn}>
                            <Text style={styles.linkAction}>Sign In</Text>
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
        marginBottom: spacing.md,
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
    checkbox: {
        marginTop: spacing.md,
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

export default SignUpScreen;
