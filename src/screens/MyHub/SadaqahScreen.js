import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, borderRadius, typography } from '../../theme';
import FirebaseService from '../../services/FirebaseService';
import notificationImg from '../../../assets/images/notification-bing.png';

const SadaqahScreen = ({ navigation }) => {
    const [organizations, setOrganizations] = useState([]);
    const [donations, setDonations] = useState([]);
    const [stats, setStats] = useState({ thisMonth: 0, thisYear: 0 });
    const [loading, setLoading] = useState(true);

    const handleBack = () => navigation.goBack();

    // Fetch data when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        try {
            setLoading(true);
            const [orgs, dons, donationStats] = await Promise.all([
                FirebaseService.getOrganizations(),
                FirebaseService.getDonations(),
                FirebaseService.getDonationStats()
            ]);
            setOrganizations(orgs);
            setDonations(dons);
            setStats(donationStats);
            console.log('📊 Sadaqah Stats:', donationStats);
            console.log('🏢 Orgs:', JSON.stringify(orgs, null, 2));
            console.log('💰 Donations:', dons.length);
        } catch (error) {
            console.error('Error fetching sadaqah data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrganization = (orgId, orgName) => {
        Alert.alert(
            "Delete Organization",
            `Are you sure you want to delete ${orgName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await FirebaseService.deleteOrganization(orgId);
                            fetchData();
                            Alert.alert("Deleted", "Organization has been deleted.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete organization.");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteDonation = (donationId, orgName) => {
        Alert.alert(
            "Delete Donation",
            `Are you sure you want to delete this donation to ${orgName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await FirebaseService.deleteDonation(donationId);
                            fetchData();
                            Alert.alert("Deleted", "Donation has been deleted.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete donation.");
                        }
                    }
                }
            ]
        );
    };

    const handleOpenUrl = (url) => {
        if (url) {
            let finalUrl = url.trim();
            if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                finalUrl = 'https://' + finalUrl;
            }
            Linking.openURL(finalUrl).catch((err) => {
                console.error("Link Error:", err);
                Alert.alert("Error", "Could not open the link. Please check if it's valid.");
            });
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    const formatAmount = (amount) => {
        return `$${parseFloat(amount).toFixed(2)}`;
    };

    const getCurrentMonth = () => {
        return new Date().toLocaleString('default', { month: 'long' });
    };

    const getCurrentYear = () => {
        return new Date().getFullYear();
    };

    const SectionHeader = ({ title, onAdd }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={onAdd} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add +</Text>
            </TouchableOpacity>
        </View>
    );

    const SummaryCard = ({ title, amount, icon, color }) => (
        <View style={styles.summaryCard}>
            <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle}>{title}</Text>
                <Text style={styles.summaryAmount}>{amount}</Text>
            </View>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
        </View>
    );

    const OrganizationItem = ({ id, name, url, color }) => {
        const orgColor = color || '#7A9181';
        return (
            <View style={styles.orgCard}>
                {/* Left color accent strip */}
                <View style={[styles.orgColorStrip, { backgroundColor: orgColor }]} />
                <View style={styles.orgCardContent}>
                    <View style={styles.itemInfo}>
                        <View style={styles.orgNameRow}>
                            <View style={[styles.orgColorDot, { backgroundColor: orgColor }]} />
                            <Text style={styles.itemName}>{name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleOpenUrl(url)}>
                            <Text style={styles.itemLink}>Visit site <Ionicons name="open-outline" size={12} /></Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteOrganization(id, name)}>
                        <Ionicons name="trash-outline" size={20} color={colors.accent.coral} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const DonationItem = ({ id, name, amount, date, category }) => (
        <View style={styles.itemContainer}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{name}</Text>
                <Text style={styles.itemAmount}>{formatAmount(amount)}</Text>
                <Text style={styles.itemDate}>{formatDate(date)}</Text>
            </View>
            <View style={styles.itemRight}>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDonation(id, name)}>
                    <Ionicons name="trash-outline" size={20} color={colors.accent.coral} />
                </TouchableOpacity>
                {category ? <Text style={styles.itemCategory}>{category}</Text> : null}
            </View>
        </View>
    );

    return (
        <GradientBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                            <Ionicons name="arrow-back" size={24} color={colors.text.black} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Sadaqah</Text>
                        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications', { source: 'hub' })}>
                            <View style={styles.notificationBadge}>
                                <Image source={notificationImg} style={styles.notificationIcon} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Summary Cards */}
                        <SummaryCard
                            title={`This Month (${getCurrentMonth()})`}
                            amount={formatAmount(stats.thisMonth)}
                            icon="calendar-outline"
                            color="#7A9E7F"
                        />
                        <SummaryCard
                            title={`This Year (${getCurrentYear()})`}
                            amount={formatAmount(stats.thisYear)}
                            icon="trending-up"
                            color="#7A9E7F"
                        />

                        {/* Organizations Section */}
                        <SectionHeader
                            title="Organizations"
                            onAdd={() => navigation.navigate('AddOrganization')}
                        />
                        {loading ? (
                            <Text style={styles.emptyText}>Loading...</Text>
                        ) : organizations.length === 0 ? (
                            <Text style={styles.emptyText}>No organizations added yet.</Text>
                        ) : (
                            organizations.map((org) => (
                                <OrganizationItem
                                    key={org.id}
                                    id={org.id}
                                    name={org.name}
                                    url={org.url}
                                    color={org.color}
                                />
                            ))
                        )}

                        {/* Donations Section */}
                        <SectionHeader
                            title="Donations"
                            onAdd={() => navigation.navigate('AddDonation')}
                        />
                        {loading ? (
                            <Text style={styles.emptyText}>Loading...</Text>
                        ) : donations.length === 0 ? (
                            <Text style={styles.emptyText}>No donations recorded yet.</Text>
                        ) : (
                            donations.map((donation) => (
                                <DonationItem
                                    key={donation.id}
                                    id={donation.id}
                                    name={donation.organizationName}
                                    amount={donation.amount}
                                    date={donation.date}
                                    category={donation.category}
                                />
                            ))
                        )}
                    </ScrollView>
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
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 100, // Space for bottom tab
    },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    summaryTitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.darkMuted,
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.dark,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.dark,
    },
    addButton: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    addButtonText: {
        fontSize: typography.fontSize.xs,
        color: colors.text.dark,
    },
    // Organization card with color strip
    orgCard: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    orgColorStrip: {
        width: 5,
        borderTopLeftRadius: borderRadius.lg,
        borderBottomLeftRadius: borderRadius.lg,
    },
    orgCardContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    orgNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    orgColorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    itemContainer: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.dark,
        marginBottom: 2,
    },
    itemLink: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
        textDecorationLine: 'underline',
    },
    itemAmount: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.bold,
        color: '#7A9E7F',
        marginVertical: 2,
    },
    itemDate: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
    },
    itemRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    itemCategory: {
        fontSize: typography.fontSize.xs,
        color: colors.text.grey,
    },
    deleteButton: {
        padding: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.text.grey,
        fontSize: typography.fontSize.sm,
        marginVertical: spacing.md,
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

export default SadaqahScreen;
