import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import RowItem from '../../components/RowItem';
import { colors, spacing, typography, borderRadius } from '../../theme';
import notificationImg from '../../../assets/images/notification-bing.png';

// Icons matching the design
const IMAGES = {
    quran: require('../../../assets/images/quran-C.png'),
    dhikr: require('../../../assets/images/dhikar-C.png'),
    qibla: require('../../../assets/images/qibla-C.png'),
    prayers: require('../../../assets/images/prayer-C.png'),
    dua: require('../../../assets/images/duaa-C.png'),
    sadaqah: require('../../../assets/images/sadqah-C.png'),
    journal: require('../../../assets/images/journal-C.png'),
};

const MENU_ITEMS = [
    { id: 'quran', title: 'Quran', icon: IMAGES.quran },
    { id: 'dhikr', title: 'Dhikr Counter', icon: IMAGES.dhikr },
    { id: 'qibla', title: 'Qibla Finder', icon: IMAGES.qibla },
    { id: 'prayer', title: 'Prayer Times', icon: IMAGES.prayers },
    { id: 'dua', title: 'Hadith Collection', icon: IMAGES.dua },
    { id: 'sadaqah', title: 'Sadaqah Tree', icon: IMAGES.sadaqah },
    { id: 'journal', title: 'Journal', icon: IMAGES.journal },
];

const MyClubScreen = ({ navigation }) => {
    const handleBack = () => navigation.goBack();

    const handleRowPress = (id) => {
        if (id === 'sadaqah') {
            navigation.navigate('Sadaqah');
        } else if (id === 'quran') {
            navigation.navigate('Quran');
        } else if (id === 'dhikr') {
            navigation.navigate('Dhikr');
        } else if (id === 'dua') {
            navigation.navigate('DuaCollection');
        } else if (id === 'journal') {
            navigation.navigate('Journal');
        } else if (id === 'qibla') {
            navigation.navigate('QiblaFinder');
        } else if (id === 'prayer') {
            navigation.navigate('PrayerTimes');
        } else {
            console.log('Pressed', id);
        }
    };


    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>MyHub</Text>
                        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications', { source: 'hub' })}>
                            <View style={styles.notificationBadge}>
                                <Image source={notificationImg} style={styles.notificationIcon} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Menu list */}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                        {MENU_ITEMS.map((item) => (
                            <RowItem
                                key={item.id}
                                title={item.title}
                                icon={item.icon}
                                onPress={() => handleRowPress(item.id)}
                                backgroundColor="rgba(255,255,255,0.6)"
                            />
                        ))}
                    </ScrollView>

                    {/* Bottom Tabs Placeholder (Matching image) */}
                    {/* <View style={styles.bottomTab}>
                        <TabItem icon="home-outline" label="Home" />
                        <TabItem icon="people-outline" label="My Circle" />
                        <TabItem icon="grid" label="My Hub" active />
                        <TabItem icon="person-outline" label="Profile" />
                    </View> */}
                </View>
            </SafeAreaView>
        </GradientBackground>
    );
};

const TabItem = ({ icon, label, active }) => (
    <TouchableOpacity style={styles.tabItem}>
        <Ionicons name={icon} size={24} color={active ? colors.primary.darkSage : colors.text.grey} />
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    headerIcon: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.black,
    },
    notificationBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary.sage,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationIcon: {
        width: 20,
        height: 20,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 100,
    },
    bottomTab: {
        position: 'absolute',
        bottom: 20,
        left: spacing.lg,
        right: spacing.lg,
        height: 70,
        backgroundColor: '#FFFFFF',
        borderRadius: 35,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 10,
        color: colors.text.grey,
        marginTop: 2,
    },
    tabLabelActive: {
        color: colors.primary.darkSage,
        fontWeight: 'bold',
    },
});

export default MyClubScreen;
