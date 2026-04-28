/**
 * SubscriptionContext.js
 * 
 * React context for managing AJR+ subscription state.
 * Wraps the RevenueCatService and provides reactive state to all components.
 * 
 * Usage:
 *   const { isProUser, offerings, purchaseWeekly, purchaseYearly } = useSubscription();
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Platform, AppState } from 'react-native';
import auth from '@react-native-firebase/auth';
import RevenueCatService, { ENTITLEMENT_ID } from '../services/RevenueCatService';
import FirebaseService from '../services/FirebaseService';

// ── Context & Hook ──────────────────────────────────────────────────────────

const SubscriptionContext = createContext({
    isProUser: false,
    offerings: null,
    customerInfo: null,
    loading: true,
    purchasing: false,
    purchaseWeekly: async () => {},
    purchaseYearly: async () => {},
    restorePurchases: async () => {},
    refreshStatus: async () => {},
});

export const useSubscription = () => {
    const ctx = useContext(SubscriptionContext);
    if (!ctx) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return ctx;
};

// ── Provider Component ──────────────────────────────────────────────────────

export const SubscriptionProvider = ({ children }) => {
    const [isProUser, setIsProUser] = useState(false);
    const [offerings, setOfferings] = useState(null);
    const [customerInfo, setCustomerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const initRef = useRef(false);

    /**
     * Check entitlement from customer info object
     */
    const checkEntitlement = useCallback((info) => {
        if (!info?.entitlements?.active) return false;
        return ENTITLEMENT_ID in info.entitlements.active;
    }, []);

    /**
     * Handle customer info updates (from purchases, restores, or listener)
     */
    const handleCustomerInfoUpdate = useCallback((info) => {
        setCustomerInfo(info);
        const isPro = checkEntitlement(info);
        setIsProUser(isPro);
        
        // Sync to backend for data validation
        FirebaseService.updateUserSubscriptionStatus(isPro);
        
        console.log('[Subscription] Customer info updated, AJR+ active:', isPro);
    }, [checkEntitlement]);

    /**
     * Initialize RevenueCat and load initial state
     */
    const initializeRevenueCat = useCallback(async () => {
        if (initRef.current) return;
        initRef.current = true;

        try {
            // 1. Initialize SDK
            await RevenueCatService.initialize();

            // 2. If user is logged in with Firebase, identify them
            const currentUser = auth().currentUser;
            if (currentUser) {
                try {
                    await RevenueCatService.identifyUser(currentUser.uid);
                } catch (identifyError) {
                    console.warn('[Subscription] Could not identify user, continuing as anonymous:', identifyError.message);
                }
            }

            // 3. Get customer info
            const info = await RevenueCatService.getCustomerInfo();
            handleCustomerInfoUpdate(info);

            // 4. Get offerings
            const currentOffering = await RevenueCatService.getOfferings();
            setOfferings(currentOffering);

            // 5. Listen for future changes
            RevenueCatService.addCustomerInfoListener(handleCustomerInfoUpdate);

            console.log('[Subscription] Initialization complete');
        } catch (error) {
            console.error('[Subscription] Initialization error:', error.message);
        } finally {
            setLoading(false);
        }
    }, [handleCustomerInfoUpdate]);

    // Initialize on mount
    useEffect(() => {
        initializeRevenueCat();
    }, [initializeRevenueCat]);

    // Listen for auth state changes to link RevenueCat user
    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(async (user) => {
            if (!initRef.current) return; // Wait for RC init

            try {
                if (user) {
                    await RevenueCatService.identifyUser(user.uid);
                    const info = await RevenueCatService.getCustomerInfo();
                    handleCustomerInfoUpdate(info);
                } else {
                    await RevenueCatService.logOut();
                    setIsProUser(false);
                    setCustomerInfo(null);
                }
            } catch (error) {
                console.warn('[Subscription] Auth state change handler error:', error.message);
            }
        });

        return unsubscribe;
    }, [handleCustomerInfoUpdate]);

    /**
     * Find a package by identifier from current offerings
     */
    const findPackage = useCallback((packageType) => {
        if (!offerings?.availablePackages) return null;
        return offerings.availablePackages.find(p => p.packageType === packageType) || null;
    }, [offerings]);

    /**
     * Purchase the Weekly plan
     */
    const purchaseWeekly = useCallback(async () => {
        const weeklyPkg = offerings?.availablePackages?.find(
            p => p.packageType === 'WEEKLY' || p.identifier === '$rc_weekly'
        );

        if (!weeklyPkg) {
            Alert.alert('Error', 'Weekly plan is not available right now. Please try again later.');
            return false;
        }

        setPurchasing(true);
        try {
            const info = await RevenueCatService.purchasePackage(weeklyPkg);
            if (info) {
                handleCustomerInfoUpdate(info);
                return true;
            }
            return false; // Cancelled
        } catch (error) {
            Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
            return false;
        } finally {
            setPurchasing(false);
        }
    }, [offerings, handleCustomerInfoUpdate]);

    /**
     * Purchase the Yearly plan
     */
    const purchaseYearly = useCallback(async () => {
        const yearlyPkg = offerings?.availablePackages?.find(
            p => p.packageType === 'ANNUAL' || p.identifier === '$rc_annual'
        );

        if (!yearlyPkg) {
            Alert.alert('Error', 'Yearly plan is not available right now. Please try again later.');
            return false;
        }

        setPurchasing(true);
        try {
            const info = await RevenueCatService.purchasePackage(yearlyPkg);
            if (info) {
                handleCustomerInfoUpdate(info);
                return true;
            }
            return false; // Cancelled
        } catch (error) {
            Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
            return false;
        } finally {
            setPurchasing(false);
        }
    }, [offerings, handleCustomerInfoUpdate]);

    /**
     * Restore previous purchases
     */
    const restorePurchases = useCallback(async () => {
        setPurchasing(true);
        try {
            const info = await RevenueCatService.restorePurchases();
            handleCustomerInfoUpdate(info);

            const isPro = checkEntitlement(info);
            if (isPro) {
                Alert.alert('Restored!', 'Your AJR+ subscription has been restored successfully.');
            } else {
                Alert.alert('No Subscription Found', 'We couldn\'t find any active subscriptions to restore.');
            }
            return isPro;
        } catch (error) {
            Alert.alert('Restore Failed', error.message || 'Could not restore purchases. Please try again.');
            return false;
        } finally {
            setPurchasing(false);
        }
    }, [handleCustomerInfoUpdate, checkEntitlement]);

    /**
     * Manually refresh subscription status
     */
    const refreshStatus = useCallback(async () => {
        try {
            const info = await RevenueCatService.getCustomerInfo();
            handleCustomerInfoUpdate(info);
        } catch (error) {
            console.error('[Subscription] Refresh error:', error.message);
        }
    }, [handleCustomerInfoUpdate]);

    const value = {
        isProUser,
        offerings,
        customerInfo,
        loading,
        purchasing,
        purchaseWeekly,
        purchaseYearly,
        restorePurchases,
        refreshStatus,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export default SubscriptionContext;
