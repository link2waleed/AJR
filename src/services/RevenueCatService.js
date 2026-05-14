/**
 * RevenueCatService.js
 * 
 * Service layer for RevenueCat subscription management.
 * Handles SDK initialization, purchases, restores, and entitlement checks.
 * 
 * IMPORTANT: Replace the placeholder API key with your real key from
 * RevenueCat Dashboard → Project → API Keys → Apple Public API Key
 */

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// ── Configuration ──────────────────────────────────────────────────────────
// TODO: Replace with your actual RevenueCat Public API Key (starts with 'appl_')
const REVENUECAT_API_KEY_IOS = 'appl_FVtciaeupgyZtFpCfbojIrgZcZD';
const REVENUECAT_API_KEY_ANDROID = 'goog_rvDbrXDRBmMHmiCfljqSXBTlYcF';

// Entitlement identifier — must match what you create in RevenueCat dashboard
const ENTITLEMENT_ID = 'ajr_plus';

// Product identifiers — must match store configuration & RevenueCat
// iOS: com.my.ajr.weekly / com.my.ajr.annually
// Android: com.my.ajr.weekly:wk299 / com.my.ajr.annually:an3199
const PRODUCT_IDS = {
    weekly: 'com.my.ajr.weekly',
    yearly: 'com.my.ajr.annually',
};
class RevenueCatService {
    _initialized = false;

    /**
     * Initialize the RevenueCat SDK.
     * Call this once at app start (in SubscriptionContext).
     */
    async initialize() {
        if (this._initialized) {
            console.log('[RevenueCat] Already initialized, skipping');
            return;
        }

        try {
            // Set log level — use DEBUG during development, INFO for production
            // Set log level — use DEBUG during development, INFO for production
            //Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            Purchases.setLogLevel(LOG_LEVEL.INFO);

            const apiKey = Platform.OS === 'ios'
                ? REVENUECAT_API_KEY_IOS
                : REVENUECAT_API_KEY_ANDROID;

            await Purchases.configure({ apiKey });

            this._initialized = true;
            console.log('[RevenueCat] SDK initialized successfully');
        } catch (error) {
            console.error('[RevenueCat] Initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Get available subscription offerings.
     * Returns the "current" offering which contains our weekly + yearly packages.
     */
    async getOfferings() {
        try {
            const offerings = await Purchases.getOfferings();

            if (!offerings.current) {
                console.warn('[RevenueCat] No current offering found');
                return null;
            }

            console.log('[RevenueCat] Offerings loaded:', {
                identifier: offerings.current.identifier,
                packages: offerings.current.availablePackages.map(p => ({
                    identifier: p.identifier,
                    product: p.product.identifier,
                    price: p.product.priceString,
                })),
            });

            return offerings.current;
        } catch (error) {
            console.error('[RevenueCat] Error fetching offerings:', error.message);
            throw error;
        }
    }

    /**
     * Purchase a specific package.
     * @param {Object} pkg — A RevenueCat Package object from getOfferings()
     * @returns {Object} customerInfo after purchase
     */
    async purchasePackage(pkg) {
        try {
            console.log('[RevenueCat] Purchasing package:', pkg.identifier);
            const { customerInfo } = await Purchases.purchasePackage(pkg);

            const isActive = this._hasEntitlement(customerInfo);
            console.log('[RevenueCat] Purchase complete, AJR+ active:', isActive);

            return customerInfo;
        } catch (error) {
            // User cancelled purchase — not an error
            if (error.userCancelled) {
                console.log('[RevenueCat] Purchase cancelled by user');
                return null;
            }

            console.error('[RevenueCat] Purchase error:', error.message);
            throw error;
        }
    }

    /**
     * Restore previous purchases (e.g. after reinstall or new device).
     * @returns {Object} customerInfo with restored entitlements
     */
    async restorePurchases() {
        try {
            console.log('[RevenueCat] Restoring purchases...');
            const customerInfo = await Purchases.restorePurchases();

            const isActive = this._hasEntitlement(customerInfo);
            console.log('[RevenueCat] Restore complete, AJR+ active:', isActive);

            return customerInfo;
        } catch (error) {
            console.error('[RevenueCat] Restore error:', error.message);
            throw error;
        }
    }

    /**
     * Get current customer info (entitlements, subscriptions, etc.)
     */
    async getCustomerInfo() {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return customerInfo;
        } catch (error) {
            console.error('[RevenueCat] Error getting customer info:', error.message);
            throw error;
        }
    }

    /**
     * Check if user has active AJR+ entitlement.
     * @returns {boolean}
     */
    async checkProAccess() {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return this._hasEntitlement(customerInfo);
        } catch (error) {
            console.error('[RevenueCat] Error checking pro access:', error.message);
            return false;
        }
    }

    /**
     * Add a listener for customer info changes.
     * Called when subscription status changes (purchase, expiry, renewal).
     * @param {Function} callback — receives customerInfo
     * @returns {Function} unsubscribe function
     */
    addCustomerInfoListener(callback) {
        Purchases.addCustomerInfoUpdateListener(callback);
        // Return a no-op unsubscribe — the SDK manages listeners internally
        return () => {
            // Note: RevenueCat SDK does not expose removeListener.
            // The listener is cleaned up when the SDK is deinitialized.
        };
    }

    /**
     * Identify user with RevenueCat (link purchases to user account).
     * Call after user signs in with Firebase Auth.
     * @param {string} userId — Firebase UID
     */
    async identifyUser(userId) {
        try {
            console.log('[RevenueCat] Identifying user:', userId);
            const { customerInfo } = await Purchases.logIn(userId);
            console.log('[RevenueCat] User identified, AJR+ active:', this._hasEntitlement(customerInfo));
            return customerInfo;
        } catch (error) {
            console.error('[RevenueCat] Error identifying user:', error.message);
            throw error;
        }
    }

    /**
     * Log out the current RevenueCat user (e.g. on Firebase sign-out).
     * Resets to anonymous user.
     */
    async logOut() {
        try {
            console.log('[RevenueCat] Logging out user');
            const customerInfo = await Purchases.logOut();
            return customerInfo;
        } catch (error) {
            if (error.message && error.message.includes('anonymous')) {
                console.log('[RevenueCat] User is already anonymous, skipping logout');
            } else {
                console.error('[RevenueCat] Error logging out:', error.message);
            }
            // Non-critical — don't throw
        }
    }

    /**
     * Check if the current user is anonymous in RevenueCat.
     */
    async isAnonymous() {
        try {
            return await Purchases.isAnonymous();
        } catch (error) {
            console.error('[RevenueCat] Error checking anonymous status:', error.message);
            return false;
        }
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Check if customerInfo contains active AJR+ entitlement.
     */
    _hasEntitlement(customerInfo) {
        if (!customerInfo?.entitlements?.active) return false;
        return ENTITLEMENT_ID in customerInfo.entitlements.active;
    }
}

// Export singleton
export default new RevenueCatService();

// Export constants for use in other files
export { ENTITLEMENT_ID, PRODUCT_IDS };
