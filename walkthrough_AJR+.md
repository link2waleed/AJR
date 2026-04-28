# AJR+ Circle Feature Gating Implementation

We've successfully established strict limitations on Circle features depending on the user's `isProUser` AJR+ status. This integrates both client-side Paywall UI prompts and backend Firebase enforcement.

## 1. Feature Backend Constraints (`FirebaseService.js`)
We've added strict checks to `createCircle` and `joinCircle` in your app's core services. Existing users automatically default to the 'Free' tier because their `isProUser` status will resolve to false natively if unassigned.
* **Join Circles (Removed Limit)**: Users can now join an unlimited number of circles, bypassing the old hardcoded limit of 5.
* **Create Circle limits**:
  - Free users are restricted to exactly 1 circle they can declare ownership of. If they try to create a second, a `LIMIT_REACHED` error is thrown.
* **Circle Size Constraints**:
  - We dynamically fetch the subscription status of the circle **creator** when someone attempts to join.
  - If the creator is Free, the circle is capped at **8 members**.
  - If the creator is Premium, the circle is capped at **25 members**.

## 2. Subscription Synchronization
Your RevenueCat entitlement (`isProUser`) is now synchronized effortlessly to Firestore!
* Added `updateUserSubscriptionStatus(isProUser)` inside `FirebaseService.js`.
* Linked directly to `SubscriptionContext.js` so it automatically runs every time a user restores their purchase, buys a package, or app-level RevenueCat listeners trigger an update.

## 3. UI Pre-Popup Triggers & Prompts
A smooth UI modal (`LimitPopupModal.js`) is implemented entirely preventing the user from hitting ugly API backend errors by intercepting their taps gracefully:
* **Trigger 1 (Create Circle)**: Found in `MyCircleScreen` and `MyCircleSetupScreen`. When a Free user clicks "Create Circle", if they already own 1 circle, it halts navigation and pops up the *"You’ve reached your free limit of 1 circle"* prompt.
* **Trigger 2 (Invite Friends)**: Found in `CircleDetailScreen`. If the circle owner taps "Invite Friends" and their circle has `>= 8` members (as a Free user), they get the *"Your circle has reached its 8-person limit"* prompt.

## 4. Dynamic Paywall Screens
The `SubscriptionScreen` dynamically adapts when users arrive there from circle limitation triggers!
* **Tailored Messaging**: Replaces the standard pitches with *"Grow Your Circles"* and highlights features like unlimited circles and scaling beyond 8 members.
* **"Got a Referral Code?"**: Added an entryway at the bottom of the Subscriptions layout, linking to a new `RedeemCodeScreen` where promo codes can be typed.

## Testing & Fallbacks
> [!NOTE]
> Because existing Free users do not have an `isProUser` property actively configured in Firebase yet, standard `userDoc.data().isProUser` evaluates as `undefined` (Boolean matching it as `false`). This automatically sweeps existing users into the 'Free' constraint umbrella cleanly, preserving your system rules securely without a migration operation. 

Run `npx expo go` to test this logic. The newly updated flow guarantees that any "Create Circle" attempt handles state locally, blocking progress until AJR+ unlocks these limits.
