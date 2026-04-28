# Implementation Task List — Circle Features Paywall

## 1. Firebase Backend Integration
- `[x]` Sync `isProUser` to Firestore: Create `updateUserSubscriptionStatus` in `FirebaseService.js`
- `[x]` Update `SubscriptionContext.js` to call `updateUserSubscriptionStatus` on state changes
- `[x]` Update `createCircle` limit: Max 1 circle for Free users, infinity for Pro.
- `[x]` Update `joinCircle` limit: Fetch creator's `isProUser` flag. Free creator = 8 max, Pro creator = 25 max. Remove 5-membership hard limit.

## 2. Shared Limit Modal (UI Pre-Popup)
- `[x]` Create a new reusable `LimitPopupModal` component (Modal that shows Title, Message, "Upgrade", "Not Now")

## 3. UI Triggers
- `[x]` `MyCircleSetupScreen` / `MyCircleScreen`: Check if Free user already owns 1 circle when hitting "Create Circle". If so, show modal.
- `[x]` `CircleDetailScreen`: When Free owner hits "Invite Friends" and `members.length >= 8`, show modal.

## 4. Subscription Paywall Screen
- `[x]` Accept `variant="circle"` prop
- `[x]` Swap copy (Title, Subtext, Features) when `variant="circle"`
- `[x]` Swap 'Skip' text to "Continue with 1 Circle"
- `[x]` Swap Footer copy
- `[x]` Add "Got a referral code?" link
- `[x]` Add dummy `RedeemCodeScreen` routing

## 5. Testing
- `[x]` Verified logical fallbacks treat undefined legacy users as Free.
- `[x]` Integrated cleanly without syntax errors
