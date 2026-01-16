import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import MyCircleScreen from '../screens/MyCircleScreen';
import MyHubScreen from '../screens/MyHubScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderTopWidth: 0,
                    height: 85,
                    paddingBottom: 25,
                    paddingTop: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 10,
                },
                tabBarActiveTintColor: colors.primary.sage,
                tabBarInactiveTintColor: colors.text.grey,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: typography.fontWeight.medium,
                    marginTop: 4,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'MyCircle') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'MyHub') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return (
                        <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
                            <Ionicons name={iconName} size={24} color={color} />
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="MyCircle"
                component={MyCircleScreen}
                options={{
                    tabBarLabel: 'My Circle',
                }}
            />
            <Tab.Screen
                name="MyHub"
                component={MyHubScreen}
                options={{
                    tabBarLabel: 'My Hub',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default BottomTabNavigator;
