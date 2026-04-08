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
    Checkbox,
} from '../components';
import BrandLogo from '../components/BrandLogo';
import { colors, typography, spacing } from '../theme';
import auth from '@react-native-firebase/auth';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import FirebaseService from '../services/FirebaseService';

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

const SignInScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    // useEffect(() => {
    //     // Configure Google Sign-In
    //     GoogleSignin.configure({
    //         webClientId: '6867275830-tpr0c9h43d8m3rl3u8fpu2akt19vhekb.apps.googleusercontent.com',
    //         offlineAccess: true,
    //         scopes: ['profile', 'email'],
    //     });
    // }, []);

    const navigateAfterAuth = async () => {
        try {
            const userData = await FirebaseService.getUserRootData();
            if (userData['onboarding-process'] === true) {
                // Onboarding not finished – resume from Name screen
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Name' }],
                });
            } else {
                // Onboarding complete – go to main app
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainApp' }],
                });
            }
        } catch (error) {
            console.error('Post-auth navigation error:', error);
            // If user root document does not exist yet, treat as new user and start onboarding
            navigation.reset({
                index: 0,
                routes: [{ name: 'Name' }],
            });
        }
    };

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, password);
            console.log('User signed in:', userCredential.user);
            // Navigate based on onboarding status
            await navigateAfterAuth();
        } catch (error) {
            console.error('Sign in error:', error);
            let errorMessage = 'Failed to sign in';

            if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password';
            }

            Alert.alert('Sign In Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = () => {
        navigation.navigate('SignUp');
    };



    // const handleGoogleSignIn = async () => {
    //     setLoading(true);
    //     try {
    //         await GoogleSignin.signOut();
    //         await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    //         const userInfo = await GoogleSignin.signIn();
    //         const idToken = userInfo.idToken || userInfo?.data?.idToken;
    //         if (!idToken) throw new Error('No ID token received from Google Sign-In');
    //         const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    //         const userCredential = await auth().signInWithCredential(googleCredential);
    //         console.log('User signed in with Google:', userCredential.user.email);
    //         await navigateAfterAuth();
    //     } catch (error) {
    //         console.error('Google sign in error:', error);
    //         if (error.code === 'sign_in_cancelled') return;
    //         Alert.alert('Google Sign In Error', error.message || 'Failed to sign in with Google');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

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


                    </View>

                    {/* Sign In Button */}
                    <Button
                        title={loading ? "Signing In..." : "Sign In"}
                        onPress={handleSignIn}
                        icon="arrow-forward"
                        style={styles.actionButton}
                        disabled={loading}
                    />



                    {/* Sign Up Link */}
                    <View style={styles.linkContainer}>
                        <Text style={styles.linkText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={handleSignUp} disabled={loading}>
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