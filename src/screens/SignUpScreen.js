import React, { useState, useEffect } from 'react';
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
    Alert,
} from 'react-native';
import {
    GradientBackground,
    Button,
    Input,
    SocialButton,
    Checkbox,
} from '../components';
import BrandLogo from '../components/BrandLogo';
import { colors, typography, spacing } from '../theme';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isSmallDevice = screenWidth < 375;
const isMediumDevice = screenWidth >= 375 && screenWidth < 414;
const isLargeDevice = screenWidth >= 414;

// Responsive values
const logoSize = isSmallDevice ? 100 : isMediumDevice ? 120 : 140;
const titleSize = isSmallDevice ? 21 : isMediumDevice ? 23 : 25;
const horizontalPadding = isSmallDevice ? spacing.md : spacing.lg;
const topPadding = screenHeight < 700 ? spacing.xl : spacing.xxl;

const SignUpScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Configure Google Sign-In
        GoogleSignin.configure({
            webClientId: '6867275830-tpr0c9h43d8m3rl3u8fpu2akt19vhekb.apps.googleusercontent.com',
        });
    }, []);

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        // if (!agreeToTerms) {
        //     Alert.alert('Agreement Required', 'Please review and accept the Terms of Service and Privacy Policy to continue.');
        //     return;
        // }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            console.log('User account created:', userCredential.user);
            // Navigate to onboarding flow after sign up
            navigation.navigate('Name');
        } catch (error) {
            console.error('Sign up error:', error);
            let errorMessage = 'Failed to create account';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            }

            Alert.alert('Sign Up Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const GoToSignIn = () => {
        navigation.navigate('SignIn');
    };

    // const handleAppleSignUp = () => {
    //     console.log('Apple sign up');
    // };

    const handleGoogleSignUp = async () => {
        // if (!agreeToTerms) {
        //     Alert.alert('Agreement Required', 'Please review and accept the Terms of Service and Privacy Policy to continue.');
        //     return;
        // }

        setLoading(true);
        try {
            // Sign out from Google to clear cached account and show account picker
            await GoogleSignin.signOut();

            // Check if your device supports Google Play
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Get user info - now with account picker
            const userInfo = await GoogleSignin.signIn();

            console.log('Full user info:', JSON.stringify(userInfo, null, 2));

            // Try to get idToken from different possible locations
            const idToken = userInfo.idToken || userInfo?.data?.idToken;

            if (!idToken) {
                console.error('User info structure:', userInfo);
                throw new Error('No ID token received from Google Sign-In');
            }

            console.log('Got idToken:', idToken);

            // Create a Google credential with the token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // Sign-in the user with the credential
            const userCredential = await auth().signInWithCredential(googleCredential);
            console.log('User signed up with Google:', userCredential.user.email);

            // Navigate to onboarding flow after sign up
            navigation.navigate('Name');
            Alert.alert('Success', `Signed up with Google: ${userCredential.user.email}`);
        } catch (error) {
            console.error('Google sign up error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            let errorMessage = 'Failed to sign up with Google';

            if (error.code === 'sign_in_cancelled') {
                return; // User cancelled, don't show error
            } else if (error.code === 'in_progress') {
                errorMessage = 'Sign up is already in progress';
            } else if (error.code === 'play_services_not_available') {
                errorMessage = 'Google Play Services not available';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Google Sign Up Error', errorMessage);
        } finally {
            setLoading(false);
        }
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
                        <BrandLogo size={logoSize} />
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
                            editable={!loading}
                        />

                        <Text style={[styles.label, styles.labelSpacing]}>Password</Text>
                        <Input
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter Password"
                            iconName="lock-closed-outline"
                            secureTextEntry
                            editable={!loading}
                        />

                        <Text style={[styles.label, styles.labelSpacing]}>Confirm Password</Text>
                        <Input
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Enter Password"
                            iconName="lock-closed-outline"
                            secureTextEntry
                            editable={!loading}
                        />

                        {/* <Checkbox
                            checked={agreeToTerms}
                            onToggle={() => setAgreeToTerms(!agreeToTerms)}
                            label="I agree to the "
                            linkText="Terms & Privacy Policy"
                            onLinkPress={() => console.log('Open Terms')}
                            style={styles.checkbox}
                        /> */}
                    </View>

                    {/* Sign Up Button */}
                    <Button
                        title={loading ? "Signing Up..." : "Sign Up"}
                        onPress={handleSignUp}
                        icon="arrow-forward"
                        style={styles.actionButton}
                        disabled={loading}
                    />

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Buttons */}

                    {/*<SocialButton
                        provider="apple"
                        onPress={handleAppleSignUp}
                        style={styles.socialButton}
                    /> */}
                    <SocialButton
                        provider="google"
                        onPress={handleGoogleSignUp}
                        style={styles.socialButton}
                        disabled={loading}
                    />

                    {/* Sign In Link */}
                    <View style={styles.linkContainer}>
                        <Text style={styles.linkText}>Already have an account? </Text>
                        <TouchableOpacity onPress={GoToSignIn} disabled={loading}>
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