# Circle Module Upgrade — Task Checklist

## Phase 1: Front-End & Firestore ✅

### FirebaseService.js
- [x] Modified `joinCircle()` — status: 'pending' instead of immediate join
- [x] New `approveJoinRequest(circleId, memberDocId)`
- [x] New `declineJoinRequest(circleId, memberDocId)`
- [x] New `getPendingRequests(circleId)` (handled via getCircleDetails)
- [x] New `leaveCircle(circleId)`
- [x] New `deleteCircle(circleId)`
- [x] New `removeMember(circleId, memberDocId)`
- [x] New `saveFCMToken(token)`
- [x] Modified `getUserCircles()` — include pending circles with status field
- [x] Modified `getCircleDetails()` — return pendingMembers separately

### CircleDetailScreen.js
- [x] Header options menu (ellipsis icon) — Leave/Delete based on role
- [x] Pending Requests section (creator-only) with approve/decline buttons
- [x] Member List — Admin badge + remove button for creator
- [x] Ring Legend interactivity fix — disable unselected activities
- [x] Leave Circle flow with confirmation
- [x] Delete Circle flow with confirmation
- [x] Remove Member flow with confirmation

### MyCircleScreen.js
- [x] Updated join flow alert for pending status
- [x] Pending circles in list with "Pending" badge (orange)
- [x] CircleCard pending styling (greyed out, non-navigable)
- [x] Handle deep link code param to auto-trigger join

### AppNavigator.js
- [x] Add `JoinCircle: 'join/:code'` deep link route
- [x] Register JoinCircleScreen

### JoinCircleScreen.js (NEW)
- [x] Deep link redirect to MyCircle tab with code param

### firestore.rules
- [x] Allow creator to delete circleMembers docs
- [x] Allow creator to delete circle doc
- [x] Allow status updates on circleMembers

### Verification
- [x] Build with `npx expo run:ios` — 0 errors, 3 warnings (existing)
- [ ] Test creator flow (manual)
- [ ] Test member flow (manual)
- [ ] Test ring interactivity (manual)

## Phase 2: Cloud Functions (Code Written, Pending Deploy)
- [x] Create `functions/` directory with `index.js` and `package.json`
- [x] Implement `onCircleMemberCreate` trigger
- [x] FCM token storage in NotificationService + App.js boot
- [x] Update `firebase.json`
- [ ] Install functions dependencies: `cd functions && npm install`
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
