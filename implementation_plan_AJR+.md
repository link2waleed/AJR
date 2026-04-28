# Implement AJR+ Circle Feature Gating

Currently, all users have hardcoded limits (join up to 5 circles, circle max size 10). We will transition to a model where Free users and Premium (AJR+) users have specific limits regarding circles.

## Goal
Implement circle creation and membership limits based on the user's `isProUser` status, and surface the new AJR+ Paywall when limits are reached.

### Feature Constraints:
**Free Users:**
- Join: Unlimited circles (current limit of 5 removed)
- Create: 1 circle max
- Size: 8 members max per owned circle

**Premium Users (AJR+):**
- Join: Unlimited circles
- Create: Unlimited circles
- Size: 25 members max per owned circle

---

## Proposed Changes

### 1. `FirebaseService.js` (Core Limits)
- **`joinCircle`**: Remove the 5-circle membership limit (so users can join unlimited). Change the hardcoded max members limit from 10 to 25. (Soft 8-member limit for free users handled via UI when sharing invites).
- **`getOwnedCirclesCount`**: Create a new helper to count how many circles the current user has created (`createdBy == user.uid`).

### 2. UI Triggers & Pre-Popups

**A. Create Circle Trigger (MyCircleScreen / CreateCircleScreen / MyCircleSetupScreen)**
- Before navigating to `CreateCircle` flow, check `ownedCirclesCount >= 1` and `!isProUser`.
- If true -> Show Pre-Popup:
  - **Title**: Create Another Circle
  - **Message**: You’ve reached your free limit of 1 circle. Upgrade to continue creating and managing multiple circles.
  - **Buttons**: [Continue to Upgrade] / [Not now]

**B. Max Members Trigger (`CircleDetailScreen.js`)**
- Intercept the "Invite Friends" button. If the current user is the circle owner:
  - Check `members.length >= 8` (if Free) or `members.length >= 25` (if Pro).
- If Free and >= 8 -> Show Pre-Popup:
  - **Title**: Circle Full
  - **Message**: Your circle has reached its 8-person limit. Upgrade to AJR+ to continue growing your circle.
  - **Buttons**: [Continue to Upgrade] / [Not now]
- If Pro and >= 25 -> Show standard alert "Circle Full (25 members max)".

### 3. Dynamic Paywall (`SubscriptionScreen.js`)
Update the paywall to accept a `paywallVariant = 'circle'` prop/route parameter that modifies its content to focus on circles:
- **Title**: Grow Your Circles
- **Subtext**: You’ve created your first circle. Upgrade to keep building, organizing, and growing your communities with ease.
- **Benefits**:
  - Create and manage unlimited circles
  - Grow your circle beyond 8 members
  - Unlock future features and insights
- **Primary CTA**: "Upgrade to AJR+"
- **Skip CTA**: "Continue with 1 Circle"
- **Referral Code**: Add a text link "Got a referral code?" under the buttons.
- **Footer Text**: "Small consistent actions are beloved" instead of standard legal padding.

### 4. Referral Code Redemption (`RedeemCodeScreen.js`)
- Create a minimal separate screen to handle the "Got a referral code?" press. It will contain an input field to enter a code and a submit button (UI only for now, logic can be added later).

---

## User Review Required

> [!WARNING]
> Since we check the membership limits dynamically on the frontend side for the "Invite Friends" button, a Free user's circle technically can still accept members past 8 if an old invite link is reused. Is this acceptable, or should we also strictly block `joinCircle` in `FirebaseService.js` if the circle's creator is currently a Free user? Enforcing it in the database adds overhead (fetching the creator's subscription status on join), so a UI-enforced limit is usually easiest for Paywalls. Please let me know your thoughts.

## Verification Plan
1. Ensure Free users can only create 1 circle. Test the "Create Circle" trigger.
2. Ensure Free user's "Invite Friends" button triggers a popup when members reach 8.
3. Validate `SubscriptionScreen.js` correctly changes its copy and UI when invoked with the circle variant.
4. Verify the user can join an unlimited number of circles, bypassing arbitrary old limits.
