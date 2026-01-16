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
    PrayerSetupScreen,
    QuranGoalScreen,
    DhikrGoalScreen,
    JournalGoalScreen,
    MyCircleSetupScreen,
    SubscriptionScreen,
    FinalSetupScreen,
} from '../screens';
import BottomTabNavigator from './BottomTabNavigator';

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

                {/* Activity Setup Flow */}
                <Stack.Screen name="PrayerSetup" component={PrayerSetupScreen} />
                <Stack.Screen name="QuranGoal" component={QuranGoalScreen} />
                <Stack.Screen name="DhikrGoal" component={DhikrGoalScreen} />
                <Stack.Screen name="JournalGoal" component={JournalGoalScreen} />
                <Stack.Screen name="MyCircleSetup" component={MyCircleSetupScreen} />

                {/* Final Onboarding */}
                <Stack.Screen name="Subscription" component={SubscriptionScreen} />
                <Stack.Screen name="FinalSetup" component={FinalSetupScreen} />

                {/* Main App with Bottom Tabs */}
                <Stack.Screen
                    name="MainApp"
                    component={BottomTabNavigator}
                    options={{
                        gestureEnabled: false,
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
