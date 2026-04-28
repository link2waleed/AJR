# RevenueCat Integration — AJR+ Subscription System

## Overview

Integrate RevenueCat into the AJR app (Bundle ID: `com.my.AJR`) to support two auto-renewable subscription plans branded as **AJR+**. The app is already deployed on the App Store (v1.0.1, build 11). This integration will ship with Version 2.

**Plans:**
| Plan | Price | Duration | Save |
|------|-------|----------|------|
| Weekly | $2.99/week | 1 week | — |
| Yearly | $31.99/year | 1 year | ~80% vs weekly |

> [!NOTE]
> Apple fully supports 1-week auto-renewable subscriptions. No need shift to monthly.

---

## Part A: Code Changes (What I Will Implement)

### 1. Install SDK

#### [MODIFY] [package.json](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/package.json)
- Add `react-native-purchases` dependency

#### [MODIFY] [Podfile](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/ios/Podfile)
- Run `pod install` after npm install

#### [MODIFY] [app.json](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/app.json)  
- Add `expo-dev-client` StoreKit entitlement if needed (already using dev-client, so Expo handles this)

---

### 2. RevenueCat Service Layer

#### [NEW] [RevenueCatService.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/services/RevenueCatService.js)
- `initialize()` — Configure Purchases SDK with API key
- `getOfferings()` — Fetch current offerings (weekly + yearly packages)
- `purchasePackage(pkg)` — Execute a purchase
- `restorePurchases()` — Restore previous purchases
- `getCustomerInfo()` — Check current entitlements
- `checkProAccess()` — Returns `true` if user has active `ajr_plus` entitlement
- Listeners for customer info changes

---

### 3. Subscription Context (State Management)

#### [NEW] [SubscriptionContext.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/context/SubscriptionContext.js)
- `SubscriptionProvider` wrapping the app
- Tracks: `isProUser`, `offerings`, `customerInfo`, `loading`
- Auto-initializes RevenueCat on mount
- Provides `purchaseWeekly()`, `purchaseYearly()`, `restorePurchases()`
- `useSubscription()` hook for consuming components

#### [MODIFY] [context/index.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/context/index.js)
- Export `SubscriptionProvider` and `useSubscription`

#### [MODIFY] [App.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/App.js)
- Wrap app with `<SubscriptionProvider>` inside `<ThemeProvider>`

---

### 4. Redesigned Subscription Screen (AJR+)

#### [MODIFY] [SubscriptionScreen.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/screens/SubscriptionScreen.js)
Complete redesign featuring:
- **AJR+ branding** with premium golden styling
- **Two plan cards** — Weekly ($2.99/week) and Yearly ($31.99/year with "Save 80%" badge)
- **Feature list** showing what AJR+ includes
- **Subscribe button** that triggers RevenueCat purchase flow
- **Restore purchases** link
- **Terms/Privacy** links (required by Apple)
- Loading states and error handling
- Works in both onboarding flow and settings access

---

### 5. Profile Screen — AJR+ Entry Point

#### [MODIFY] [ProfileScreen.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/screens/ProfileScreen.js)
- Add "AJR+ Subscription" setting item under Settings section
- Shows current status (Active / Not subscribed)
- Navigates to SubscriptionScreen
- Add "Restore Purchases" option

---

### 6. Services Index Update

#### [MODIFY] [services/index.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/services/index.js)
- Export `RevenueCatService`

---

## Part B: Apple App Store Connect Setup (Manual Steps — Guided)

> [!IMPORTANT]
> These steps must be done by you in App Store Connect BEFORE testing. I'll provide exact values to use.

### Step 1: Verify Agreements
1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **Agreements, Tax, and Banking**
2. Ensure **Paid Applications** agreement is signed ✅
3. Complete tax and banking info if not already done

### Step 2: Create Subscription Group
1. Select your app **AJR** → go to sidebar **Monetization** → **Subscriptions**
2. Click **"+"** to create a new Subscription Group
3. **Group Name:** `AJR+ Premium`

### Step 3: Create Weekly Subscription
1. Inside the `AJR+ Premium` group, click **"+"** to add subscription
2. **Reference Name:** `AJR+ Weekly`
3. **Product ID:** `com.my.AJR.ajrplus.weekly`
4. **Duration:** `1 Week`
5. **Price:** Select the price tier closest to **$2.99** (Tier 3 = $2.99)
6. **Add Localization:**
   - Language: English (U.S.)
   - Display Name: `AJR+ Weekly`
   - Description: `Full access to all AJR+ premium features, billed weekly.`
7. **Review Screenshot:** Upload a screenshot of your subscription screen (640×920 or similar)

### Step 4: Create Yearly Subscription
1. Inside the same `AJR+ Premium` group, click **"+"**
2. **Reference Name:** `AJR+ Yearly`
3. **Product ID:** `com.my.AJR.ajrplus.yearly`
4. **Duration:** `1 Year`
5. **Price:** Select the price tier closest to **$31.99** (Tier 48 = $31.99)
6. **Add Localization:**
   - Language: English (U.S.)
   - Display Name: `AJR+ Yearly`
   - Description: `Full access to all AJR+ premium features, billed yearly. Save 80%!`
7. **Review Screenshot:** Same or similar screenshot

### Step 5: Set Subscription Group Hierarchy
1. In the `AJR+ Premium` group, arrange subscriptions:
   - **Level 1 (highest):** `AJR+ Yearly` (most value)
   - **Level 2:** `AJR+ Weekly`

### Step 6: Generate App-Specific Shared Secret
1. Go to your app in App Store Connect → **General** → **App Information**
2. Scroll to **App-Specific Shared Secret** → click **Manage**
3. Click **Generate** and copy the secret
4. You'll paste this into RevenueCat dashboard later

---

## Part C: RevenueCat Dashboard Setup (Manual Steps — Guided)

### Step 1: Create Project
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Click **"+ New Project"**
3. **Project Name:** `AJR`

### Step 2: Add Apple App Store App
1. Inside the AJR project, click **"+ New App"**
2. **Platform:** Apple App Store
3. **App Name:** `AJR`
4. **Bundle ID:** `com.my.AJR`
5. **App-Specific Shared Secret:** Paste the secret from Step B6
6. Save

### Step 3: Copy Your Public API Key
1. After saving the app, go to **API Keys** section
2. Copy the **Apple Public API Key** (starts with `appl_`)
3. **This key goes into our code** in `RevenueCatService.js`

### Step 4: Add Products
1. Go to **Product Catalog** → **Products**
2. Click **"+ New"** for each:
   - **Product 1:** Identifier = `com.my.AJR.ajrplus.weekly`, Store = Apple
   - **Product 2:** Identifier = `com.my.AJR.ajrplus.yearly`, Store = Apple

### Step 5: Create Entitlement
1. Go to **Product Catalog** → **Entitlements**
2. Click **"+ New"**
3. **Identifier:** `ajr_plus`
4. **Description:** `AJR+ Premium Access`
5. Click into the entitlement → **Attach** both products (`weekly` and `yearly`)

### Step 6: Create Offering
1. Go to **Product Catalog** → **Offerings**
2. Click **"+ New"**
3. **Identifier:** `default`
4. **Description:** `Default AJR+ Offering`
5. Add Packages:
   - **Package 1:** Identifier = `$rc_weekly`, Product = `com.my.AJR.ajrplus.weekly`
   - **Package 2:** Identifier = `$rc_annual`, Product = `com.my.AJR.ajrplus.yearly`
6. Make sure this offering is set as **Current** (default)

---

## Part D: Sandbox Testing

> [!TIP]
> Sandbox subscriptions renew at accelerated rates: 1 week = 3 minutes, 1 year = 1 hour. Subscriptions auto-renew up to 6 times then expire.

### How to Test
1. **Create Sandbox Tester Account:**
   - App Store Connect → **Users and Access** → **Sandbox** → **Testers**
   - Create a new tester with a real email you can access
   - Don't use your real Apple ID email

2. **On Your Test Device (iPhone):**
   - Go to **Settings** → **App Store** → scroll down → **Sandbox Account**
   - Sign in with the sandbox tester email
   - This is separate from your real Apple ID

3. **Run the App:**
   - Build via `npx expo run:ios`
   - Navigate to the subscription screen
   - Tap Subscribe — the Sandbox payment sheet will appear
   - Confirm the purchase — it charges $0 in sandbox

4. **Verify in RevenueCat:**
   - Go to RevenueCat Dashboard → **Customers**
   - Search for the app user ID
   - Verify the entitlement `ajr_plus` is active

---

## Part E: Production Migration Checklist

> [!WARNING]
> Do these steps ONLY when you're ready to submit version 2 to the App Store.

1. **Change Log Level:** In `RevenueCatService.js`, change `LOG_LEVEL.DEBUG` → `LOG_LEVEL.INFO`
2. **Submit Subscriptions for Review:** When you submit your app binary (v2.0), the subscriptions will be submitted for review automatically alongside the app
3. **No Code Changes Needed:** RevenueCat automatically detects sandbox vs production environment — the same API key works for both
4. **Verify in App Store Connect:** Ensure subscription status shows "Ready to Submit" before submitting the app
5. **Post-Approval:** Once Apple approves v2, the subscriptions go live for all users

---

## Verification Plan

### Automated
- Install dependency and verify build succeeds (`npx expo run:ios`)
- Verify RevenueCat initializes without errors in console logs

### Manual (Requires Your Action)
- Complete App Store Connect setup (Part B)
- Complete RevenueCat Dashboard setup (Part C)
- Create sandbox tester and test purchases (Part D)
- Verify entitlement status in RevenueCat dashboard

---

## Open Questions

> [!IMPORTANT]
> 1. **RevenueCat API Key:** Have you created a RevenueCat account yet? I'll use a placeholder in the code — you'll replace it with your actual public API key after completing Part C Step 3.
> 2. **AJR+ Features:** You mentioned you'll guide later about feature differences. For now, I'll create the infrastructure (entitlement checking via `useSubscription().isProUser`) but won't gate any specific features yet.
> 3. **Free Trial:** Would you like to offer a free trial period (e.g., 3-day or 7-day free trial) for the weekly or yearly plan? This can be configured in App Store Connect.
