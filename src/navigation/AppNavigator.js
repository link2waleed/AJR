import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    // Auth
    SplashScreen,
    WelcomeScreen,
    SignUpScreen,
    SignInScreen,

    // Onboarding
    NameScreen,
    LocationPermissionScreen,
    SelectActivitiesScreen,

    // Setup / Goals
    PrayerSetupScreen,
    QuranGoalScreen,
    DhikrGoalScreen,
    SubscriptionScreen,
    RedeemCodeScreen,
    FinalSetupScreen,

    // Main Features
    DailyGrowthScreen,
    CircleDetailScreen,
    CreateCircleScreen,
    CreateCircleStep2Screen,
    MyClubScreen,
    SadaqahScreen,
    QuranScreen,
    SurahDetailScreen,
    DhikrScreen,
    DuaCollectionScreen,
    JournalScreen,
    AddJournalEntryScreen,
    JournalDetailScreen,
    AddOrganizationScreen,
    AddDonationScreen,
    QiblaFinderScreen,
    PrayerTimesScreen,
    NotificationsScreen,
    PrayerAdjustmentsScreen,
    JoinCircleScreen,
} from '../screens';

import BottomTabNavigator from './BottomTabNavigator';

const Stack = createNativeStackNavigator();

const linking = {
    prefixes: ['ajr://'],
    config: {
        initialRouteName: 'MainApp',
        screens: {
            MainApp: {
                initialRouteName: 'Home',
                screens: {
                    Home: 'dashboard',
                    MyCircle: {
                        path: 'mycircle',
                    },
                },
            },
            PrayerTimes: 'salah',
            DailyGrowth: 'dailygrowth',
            JoinCircle: 'join/:code',
        },
    },
};

const AppNavigator = () => {
    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                }}
            >
                {/* ================= AUTH FLOW ================= */}
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="SignIn" component={SignInScreen} />

                {/* ================= ONBOARDING ================= */}
                <Stack.Screen name="Name" component={NameScreen} />
                <Stack.Screen
                    name="LocationPermission"
                    component={LocationPermissionScreen}
                />
                <Stack.Screen
                    name="SelectActivities"
                    component={SelectActivitiesScreen}
                />

                {/* ================= ACTIVITY / GOAL SETUP ================= */}
                <Stack.Screen name="PrayerSetup" component={PrayerSetupScreen} />
                <Stack.Screen name="QuranGoal" component={QuranGoalScreen} />
                <Stack.Screen name="DhikrGoal" component={DhikrGoalScreen} />

                {/* ================= FINAL ONBOARDING ================= */}
                <Stack.Screen name="Subscription" component={SubscriptionScreen} />
                <Stack.Screen name="RedeemCode" component={RedeemCodeScreen} />
                <Stack.Screen name="FinalSetup" component={FinalSetupScreen} />

                {/* ================= MAIN APP (BOTTOM TABS) ================= */}
                <Stack.Screen
                    name="MainApp"
                    component={BottomTabNavigator}
                    options={{ gestureEnabled: false }}
                />

                {/* ================= FEATURE SCREENS ================= */}
                <Stack.Screen name="DailyGrowth" component={DailyGrowthScreen} />
                <Stack.Screen name="CircleDetail" component={CircleDetailScreen} />
                <Stack.Screen name="CreateCircle" component={CreateCircleScreen} />
                <Stack.Screen name="CreateCircleStep2" component={CreateCircleStep2Screen} />
                <Stack.Screen name="JoinCircle" component={JoinCircleScreen} />
                <Stack.Screen name="MyClub" component={MyClubScreen} />
                <Stack.Screen name="Sadaqah" component={SadaqahScreen} />
                <Stack.Screen name="Quran" component={QuranScreen} />
                <Stack.Screen name="SurahDetail" component={SurahDetailScreen} />
                <Stack.Screen name="Dhikr" component={DhikrScreen} />
                <Stack.Screen
                    name="DuaCollection"
                    component={DuaCollectionScreen}
                />
                <Stack.Screen name="Journal" component={JournalScreen} />
                <Stack.Screen
                    name="AddJournalEntry"
                    component={AddJournalEntryScreen}
                />
                <Stack.Screen
                    name="JournalDetail"
                    component={JournalDetailScreen}
                />
                <Stack.Screen
                    name="AddOrganization"
                    component={AddOrganizationScreen}
                />
                <Stack.Screen
                    name="AddDonation"
                    component={AddDonationScreen}
                />
                <Stack.Screen
                    name="QiblaFinder"
                    component={QiblaFinderScreen}
                />
                <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="PrayerAdjustments" component={PrayerAdjustmentsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
