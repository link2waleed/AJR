import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/GradientBackground';
import { colors, spacing, borderRadius, typography } from '../../theme';
import FirebaseService from '../../services/FirebaseService';

const AddDonationScreen = ({ navigation }) => {
    const [organizationName, setOrganizationName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [note, setNote] = useState('');

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDay, setTempDay] = useState('');
    const [tempMonth, setTempMonth] = useState('');
    const [tempYear, setTempYear] = useState('');

    const handleBack = () => navigation.goBack();

    const openDatePicker = () => {
        const currentDate = date ? new Date(date) : new Date();
        if (!isNaN(currentDate.getTime())) {
            setTempDay(currentDate.getDate().toString());
            setTempMonth((currentDate.getMonth() + 1).toString());
            setTempYear(currentDate.getFullYear().toString());
        } else {
            const now = new Date();
            setTempDay(now.getDate().toString());
            setTempMonth((now.getMonth() + 1).toString());
            setTempYear(now.getFullYear().toString());
        }
        setShowDatePicker(true);
    };

    const handleDateConfirm = () => {
        const d = parseInt(tempDay);
        const m = parseInt(tempMonth);
        const y = parseInt(tempYear);

        if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) {
            Alert.alert('Invalid Date', 'Please enter a valid day, month, and year.');
            return;
        }

        const newDate = new Date(y, m - 1, d);
        if (isNaN(newDate.getTime())) {
            Alert.alert('Invalid Date', 'The date you entered is invalid.');
            return;
        }

        // Format as YYYY-MM-DD for consistency
        const formattedDate = newDate.toISOString().split('T')[0];
        setDate(formattedDate);
        setShowDatePicker(false);
    };

    const handleSetToday = () => {
        const now = new Date();
        setDate(now.toISOString().split('T')[0]);
        setShowDatePicker(false);
    };

    const handleSave = async () => {
        if (!organizationName.trim()) {
            Alert.alert('Missing Information', 'Please enter an organization name.');
            return;
        }
        if (!amount.trim()) {
            Alert.alert('Missing Information', 'Please enter an amount.');
            return;
        }

        // Validate amount is a number
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
            return;
        }

        // Validate and Parse Date
        let finalDate = new Date().toISOString();
        if (date.trim()) {
            const parsedDate = new Date(date.trim());
            if (isNaN(parsedDate.getTime())) {
                Alert.alert('Invalid Date', 'Please enter a valid date (e.g., YYYY-MM-DD) or leave empty for today.');
                return;
            }
            finalDate = parsedDate.toISOString();
        }

        try {
            await FirebaseService.saveDonation({
                organizationName: organizationName.trim(),
                amount: numAmount,
                date: finalDate,
                category: note.trim(),
            });
            Alert.alert('Success', 'Donation recorded successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving donation:', error);
            Alert.alert('Error', 'Failed to save donation. Please try again.');
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
                        <Text style={styles.headerTitle}>Add Donations</Text>
                        <TouchableOpacity style={styles.headerIcon}>
                            <View style={styles.bellContainer}>
                                <Ionicons name="notifications" size={24} color={colors.primary.darkSage} />
                                <View style={styles.notificationDot} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Section Title */}
                        <Text style={styles.sectionTitle}>Donations</Text>

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

                        {/* Amount */}
                        <Text style={styles.fieldLabel}>Amount</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="cash-outline" size={20} color={colors.text.grey} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Amount"
                                placeholderTextColor={colors.text.grey}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Date - Manual Entry or Picker via Icons */}
                        <Text style={styles.fieldLabel}>Date</Text>
                        <View style={styles.inputContainer}>
                            <TouchableOpacity onPress={openDatePicker}>
                                <Ionicons name="calendar-outline" size={20} color={colors.text.grey} style={styles.inputIcon} />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.text.grey}
                                value={date}
                                onChangeText={setDate}
                            />
                            <TouchableOpacity onPress={openDatePicker}>
                                <Ionicons name="chevron-down" size={20} color={colors.text.grey} />
                            </TouchableOpacity>
                        </View>

                        {/* Note (Optional) */}
                        <Text style={styles.fieldLabel}>Note (Optional)</Text>
                        <View style={styles.noteContainer}>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="Write Something..."
                                placeholderTextColor={colors.text.grey}
                                value={note}
                                onChangeText={setNote}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Donation</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Custom Date Picker Modal */}
                    <Modal
                        visible={showDatePicker}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowDatePicker(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Select Date</Text>
                                <View style={styles.dateInputsRow}>
                                    <View style={styles.dateInputGroup}>
                                        <Text style={styles.dateLabel}>DD</Text>
                                        <TextInput
                                            style={styles.dateInput}
                                            value={tempDay}
                                            onChangeText={setTempDay}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                            placeholder="DD"
                                        />
                                    </View>
                                    <View style={styles.dateInputGroup}>
                                        <Text style={styles.dateLabel}>MM</Text>
                                        <TextInput
                                            style={styles.dateInput}
                                            value={tempMonth}
                                            onChangeText={setTempMonth}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                            placeholder="MM"
                                        />
                                    </View>
                                    <View style={styles.dateInputGroup}>
                                        <Text style={styles.dateLabel}>YYYY</Text>
                                        <TextInput
                                            style={[styles.dateInput, { width: 80 }]}
                                            value={tempYear}
                                            onChangeText={setTempYear}
                                            keyboardType="number-pad"
                                            maxLength={4}
                                            placeholder="YYYY"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.todayButton} onPress={handleSetToday}>
                                    <Text style={styles.todayButtonText}>Set to Today</Text>
                                </TouchableOpacity>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setShowDatePicker(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.confirmButton]}
                                        onPress={handleDateConfirm}
                                    >
                                        <Text style={styles.confirmButtonText}>Confirm</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

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
    bellContainer: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        padding: 6,
        borderRadius: 20,
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 6,
        right: 8,
        width: 8,
        height: 8,
        backgroundColor: colors.accent.coral,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
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
    noteContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
        minHeight: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    noteInput: {
        fontSize: 15,
        color: colors.text.black,
        minHeight: 80,
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: colors.text.black,
    },
    dateInputsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    dateInputGroup: {
        alignItems: 'center',
    },
    dateLabel: {
        marginBottom: 4,
        fontSize: 12,
        color: colors.text.grey,
    },
    dateInput: {
        width: 60,
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 18,
        backgroundColor: '#F9F9F9',
    },
    todayButton: {
        marginBottom: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
    },
    todayButtonText: {
        color: colors.primary.darkSage,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
    },
    confirmButton: {
        backgroundColor: colors.primary.darkSage,
    },
    cancelButtonText: {
        color: colors.text.grey,
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default AddDonationScreen;
