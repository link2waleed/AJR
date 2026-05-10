# AJR v1.0.1 (Build 15) — Production Release Checklist

## 🔴 Critical Issues Found in Codebase

> [!CAUTION]
> These must be fixed before submitting to production.

### 1. RevenueCat Log Level is set to DEBUG
In [RevenueCatService.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_3/src/services/RevenueCatService.js#L43), the log level is `LOG_LEVEL.DEBUG`. This will flood device logs with sensitive purchase data in production.

```diff
- Purchases.setLogLevel(LOG_LEVEL.DEBUG);
+ Purchases.setLogLevel(LOG_LEVEL.INFO);
```

### 2. Missing In-App Purchase Capability in Xcode
Your [AJR.entitlements](file:///Users/waleedahmad/Downloads/AJR_APP_V2_3/ios/AJR/AJR.entitlements) does **NOT** include the In-App Purchase entitlement. RevenueCat works in sandbox without it, but **production purchases will fail** without this capability.

**Fix in Xcode:**
1. Open `AJR.xcworkspace` in Xcode
2. Select the **AJR** target → **Signing & Capabilities** tab
3. Click **+ Capability** → Add **In-App Purchase**
4. This will automatically update `AJR.entitlements`

### 3. TODO Comment Still in Code
Line 15 of `RevenueCatService.js` has: `// TODO: Replace with your actual RevenueCat Public API Key`
- Your key `appl_FVtciaeupgyZtFpCfbojIrgZcZD` appears to be set already ✅
- Just remove the TODO comment for cleanliness

---

## ✅ RevenueCat Dashboard (revenuecat.app)

- [ ] **Verify Products are Active** — Go to **Products** and confirm both `com.my.AJR.ajrplus.weekly` and `com.my.AJR.ajrplus.annually` are imported from App Store Connect and show "Active"
- [ ] **Verify Entitlement** — Confirm `ajr_plus` entitlement is configured and linked to both products
- [ ] **Verify Offering** — Confirm your "current" offering includes both weekly and annual packages
- [ ] **App Store Connect Shared Secret** — Go to **Project Settings → App Store Connect** and verify the **App-Specific Shared Secret** is entered (this is what allows RevenueCat to validate receipts in production!)
- [ ] **Production API Key** — Your iOS API key `appl_FVtciaeupgyZtFpCfbojIrgZcZD` works for both sandbox and production. No change needed here.

> [!IMPORTANT]
> The **App-Specific Shared Secret** is the single most important thing for production paywall. Without it, RevenueCat cannot validate purchase receipts from the production App Store. 
> 
> **To get it:** App Store Connect → Your App → General → App Information → "App-Specific Shared Secret" → Generate/Copy → Paste into RevenueCat dashboard.

---

## ✅ App Store Connect

- [ ] **In-App Purchases Status** — Go to your app → **Subscriptions** or **In-App Purchases** and verify both subscription products (`com.my.AJR.ajrplus.weekly` and `com.my.AJR.ajrplus.annually`) are in **"Ready to Submit"** or **"Approved"** status
- [ ] **Subscription Group** — Verify both products are in the same subscription group
- [ ] **Pricing** — Confirm pricing is set for all territories you want to sell in
- [ ] **Review Screenshots** — If this is the first time submitting IAPs, Apple requires at least one screenshot of your paywall/subscription screen for review
- [ ] **Review Information** — Each subscription product needs review notes describing what users get
- [ ] **Privacy Policy URL** — Your links `https://ajrapp.com/policies/privacy-and-policy` and Terms `https://ajrapp.com/terms-of-services` should be working. Verify they're also set in App Store Connect metadata.

---

## ✅ Xcode / Build Configuration

- [ ] **Add In-App Purchase Capability** — (Critical, see above)
- [ ] **Signing** — Use your **distribution** provisioning profile (not development) for the archive
- [ ] **Version/Build Numbers** — Already correct:
  - `CFBundleShortVersionString`: `1.0.1` ✅
  - `CFBundleVersion`: `15` ✅
  - `app.json` matches: version `1.0.1`, buildNumber `15` ✅
- [ ] **Push Notifications** — `aps-environment` is set to `production` ✅
- [ ] **App Groups** — `group.com.my.AJR` is set in both main app and widget entitlements ✅

---

## ✅ Widget-Specific Checks

- [ ] **Widget Extension Signing** — In Xcode, verify the widget target is also signed with a valid distribution provisioning profile
- [ ] **Widget App Group** — Already matching (`group.com.my.AJR`) ✅
- [ ] **Widget Deployment Target** — Verify the widget minimum iOS version is set correctly (should match or be higher than main app's `12.0`)

> [!NOTE]
> Widgets require iOS 14+, but your main app targets iOS 12. This is fine — the widget extension just won't be available on iOS 12-13 devices. No code change needed.

---

## ✅ Code Changes Before Archive

| # | File | Change | Status |
|---|------|--------|--------|
| 1 | `RevenueCatService.js:43` | Change `LOG_LEVEL.DEBUG` → `LOG_LEVEL.INFO` | 🔴 Required |
| 2 | `RevenueCatService.js:15` | Remove TODO comment | 🟡 Recommended |
| 3 | `AJR.entitlements` | Add In-App Purchase capability via Xcode | 🔴 Required |

---

## ✅ Final Submission Workflow

1. [ ] Make the code changes listed above
2. [ ] Clean build: **Product → Clean Build Folder** in Xcode
3. [ ] Archive: **Product → Archive** (make sure "Any iOS Device" is selected)
4. [ ] Upload to App Store Connect via **Distribute App → App Store Connect**
5. [ ] In App Store Connect, select the new build under your v1.0.1 release
6. [ ] Attach the IAP products to this version if prompted
7. [ ] Fill in "What's New" release notes
8. [ ] Submit for Review

---

## ✅ Post-Submission Verification

- [ ] After Apple approves, do a **production test purchase** on a real device (not sandbox)
- [ ] Verify the subscription appears in **RevenueCat dashboard → Customers**
- [ ] Test **Restore Purchases** flow
- [ ] Verify widgets appear in the widget gallery on a production build

---

## 📋 Quick Summary

The paywall code itself is **production-ready** — RevenueCat automatically handles sandbox vs. production environments based on the receipt. You do NOT need separate API keys or code paths. The only things blocking you are:

1. **Add In-App Purchase capability in Xcode** (entitlements file)
2. **Change log level from DEBUG to INFO**
3. **Verify App-Specific Shared Secret is in RevenueCat dashboard**
