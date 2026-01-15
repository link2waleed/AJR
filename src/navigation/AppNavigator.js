import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    SplashScreen,
    WelcomeScreen,
    SignUpScreen,
    SignInScreen,
    NameScreen,
    LocationPermissionScreen,
    SelectActivitiesScreen,
} from '../screens';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                }}
            >
                {/* Auth Flow */}
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="SignIn" component={SignInScreen} />

                {/* Onboarding Flow (after sign in) */}
                <Stack.Screen name="Name" component={NameScreen} />
                <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
                <Stack.Screen name="SelectActivities" component={SelectActivitiesScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
