import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../../theme';

/**
 * JoinCircle redirect screen - handles deep link ajr://join/:code
 * Redirects to MyCircle tab with the invite code as a param
 */
const JoinCircleScreen = ({ navigation, route }) => {
    useEffect(() => {
        const code = route?.params?.code;
        if (code) {
            // Navigate to MainApp > MyCircle tab with the invite code
            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: 'MainApp',
                        state: {
                            routes: [
                                {
                                    name: 'MyCircle',
                                    params: { code },
                                },
                            ],
                        },
                    },
                ],
            });
        } else {
            navigation.goBack();
        }
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.homeGradient.top }}>
            <ActivityIndicator size="large" color={colors.primary.sage} />
        </View>
    );
};

export default JoinCircleScreen;
