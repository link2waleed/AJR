import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, borderRadius, typography } from '../../theme';
import FirebaseService from '../../services/FirebaseService';
import notificationImg from '../../../assets/images/notification-bing.png';

const COLOR_PALETTE = [
    '#7A9181', // Sage (default)
    '#4CAF50', // Green
    '#2E7D32', // Dark Green
    '#1B5E20', // Forest Green
    '#00897B', // Teal
    '#00695C', // Dark Teal
    '#0288D1', // Blue
    '#1565C0', // Dark Blue
    '#5C6BC0', // Indigo
    '#7E57C2', // Purple
    '#AB47BC', // Violet
    '#EC407A', // Pink
    '#EF5350', // Red
    '#FF7043', // Deep Orange
    '#FFA726', // Orange
    '#FDD835', // Yellow
    '#8D6E63', // Brown
    '#78909C', // Blue Grey
    '#546E7A', // Dark Blue Grey
    '#37474F', // Charcoal
    '#D7CCC8', // Warm Light Beige
];

const AddOrganizationScreen = ({ navigation }) => {
    const [organizationName, setOrganizationName] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [selectedColor, setSelectedColor] = useState('#7A9181');

    const handleBack = () => navigation.goBack();

    const handleSave = async () => {
        if (!organizationName.trim()) {
            Alert.alert('Missing Information', 'Please enter an organization name.');
            return;
        }
        if (!websiteUrl.trim()) {
            Alert.alert('Missing Information', 'Please enter a website URL.');
            return;
        }

        try {
            await FirebaseService.saveOrganization({
                name: organizationName.trim(),
                url: websiteUrl.trim(),
                color: selectedColor,
            });
            Alert.alert('Success', 'Organization added successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving organization:', error);
            Alert.alert('Error', 'Failed to save organization. Please try again.');
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
                        <Text style={styles.headerTitle}>Add Organization</Text>
                        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications', { source: 'hub' })}>
                            <View style={styles.notificationBadge}>
                                <Image source={notificationImg} style={styles.notificationIcon} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Section Title */}
                        <Text style={styles.sectionTitle}>Add Organization</Text>

                        {/* Organization Name */}
                        <Text style={styles.fieldLabel}>Organization Name</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="business-outline" size={20} color={colors.text.grey} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Organization Name"
                                placeholderTextColor={colors.text.grey}
                                value={organizationName}
                                onChangeText={setOrganizationName}
                            />
                        </View>

                        {/* Website URL */}
                        <Text style={styles.fieldLabel}>Website URL</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="globe-outline" size={20} color={colors.text.grey} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Website URL"
                                placeholderTextColor={colors.text.grey}
                                value={websiteUrl}
                                onChangeText={setWebsiteUrl}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Color Selection */}
                        <Text style={styles.fieldLabel}>Organization Color</Text>

                        {/* Selected Color Preview */}
                        <View style={styles.colorPreview}>
                            <View style={[styles.colorPreviewCircle, { backgroundColor: selectedColor }]} />
                            <Text style={styles.colorPreviewText}>{selectedColor}</Text>
                        </View>

                        {/* Color Grid */}
                        <View style={styles.colorGrid}>
                            {COLOR_PALETTE.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: color },
                                        selectedColor === color && styles.colorCircleSelected,
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                    activeOpacity={0.7}
                                >
                                    {selectedColor === color && (
                                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Organization</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </GradientBackground>
    );
};

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
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text.black,
        marginBottom: 24,
    },
    fieldLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.black,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.text.black,
    },
    // Color Preview
    colorPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    colorPreviewCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    colorPreviewText: {
        marginLeft: 14,
        fontSize: 15,
        fontWeight: '500',
        color: colors.text.grey,
    },
    // Color Grid
    colorGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 32,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorCircleSelected: {
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    saveButton: {
        backgroundColor: '#7A9181',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddOrganizationScreen;
