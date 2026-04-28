# Circle Module Upgrade — Final Implementation Plan

Upgrade the Circle module with leaving/deleting, invite approval system, ring interactivity fixes, deep links, push notifications, and pending circle visibility.

## Decisions Made

1. **Deep links for invites** → Use the existing `ajr://` scheme (`ajr://join/CODE`) and React Navigation linking config. Share links display code + instructions.
2. **Push notifications for pending requests** → Cloud Functions triggered on Firestore `circleMembers` document creation with `status: 'pending'`. Requires FCM token storage in user docs.
3. **Pending circles visible** → Show pending circles in "Your Circles" list with a greyed-out "Pending" badge, non-navigable.

---

## Implementation Phases

### Phase 1: Front-End & Firestore (Immediate — this session)
All client-side code + Firestore service methods + rules updates.

### Phase 2: Cloud Functions (Follow-up — requires `firebase-tools` deploy)
Cloud Function for push notifications. Created locally, deployed separately.

---

## Proposed Changes

### Component 1: Firebase Service — New & Modified Methods

#### [MODIFY] [FirebaseService.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/services/FirebaseService.js)

**Modified: `joinCircle(inviteCode)`**
- Create `circleMembers` doc with `status: 'pending'` instead of `role: 'member'`.
- Do **not** increment `memberCount` (happens on approval).
- Return `{ circleId, circleName, status: 'pending' }`.

**New methods:**
| Method | Description |
|--------|-------------|
| `approveJoinRequest(circleId, memberDocId)` | Verify caller is creator, set `status: 'approved'`, increment `memberCount` |
| `declineJoinRequest(circleId, memberDocId)` | Verify caller is creator, delete the `circleMembers` doc |
| `getPendingRequests(circleId)` | Query `circleMembers` with `status: 'pending'`, fetch user names |
| `leaveCircle(circleId)` | Verify caller is NOT creator, delete membership, decrement count |
| `deleteCircle(circleId)` | Verify caller IS creator, delete all members + subcollections + circle doc |
| `removeMember(circleId, memberDocId)` | Verify caller is creator, delete member doc, decrement count |
| `saveFCMToken(token)` | Store FCM push token in `users/{uid}.fcmToken` |

**Modified: `getUserCircles()`**
- Include pending circles with `status: 'pending'` flag, so UI can show them with badge.

**Modified: `getCircleDetails(circleId)`**
- Return `pendingMembers` array separately for creator's approval UI.
- Filter active members by `status !== 'pending'`.

---

### Component 2: Circle Detail Screen — Full UI Upgrade

#### [MODIFY] [CircleDetailScreen.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/screens/MyCircle/CircleDetailScreen.js)

**Header options (gear/menu icon):**
- **Creator sees**: "Delete Circle" option → confirmation alert → calls `deleteCircle()` → navigates back.
- **Member sees**: "Leave Circle" option → confirmation alert → calls `leaveCircle()` → navigates back.

**Pending Requests Section (creator-only, above Member List):**
- Card with "Pending Requests (N)" header.
- Each request shows user name + Approve/Decline buttons.
- Calls `approveJoinRequest()` / `declineJoinRequest()`.

**Member List Enhancement:**
- "Admin" badge next to creator's name.
- Creator sees remove (✕) button next to non-admin members.
- Confirmation dialog before removal.

**Ring Legend Interactivity Fix:**
- Add `!selectedActivities[activity]` to `disabled` prop on each `LegendItem`.
- When user hasn't selected an activity, the checkbox is visually disabled and non-interactive.

---

### Component 3: MyCircle Screen — Pending State + Join Flow

#### [MODIFY] [MyCircleScreen.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/screens/MyCircle/MyCircleScreen.js)

- **Join flow**: Show "Your request has been sent. The circle owner will review it." alert when `joinCircle()` returns `status: 'pending'`.
- **Pending circles in list**: Show pending circles with a "Pending" label and greyed-out styling. Not navigable (no `onPress`).
- Update `CircleCard` component to accept and display `isPending` prop.

---

### Component 4: Navigation — Deep Link for Circle Invites

#### [MODIFY] [AppNavigator.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/navigation/AppNavigator.js)

- Add `JoinCircle: 'join/:code'` to the linking config so `ajr://join/ABC-1234` auto-opens join flow.
- The MyCircleScreen will handle the `code` param from navigation route and auto-trigger the join modal.

---

### Component 5: Firestore Rules — Permission Updates

#### [MODIFY] [firestore.rules](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/firestore.rules)

- Allow `delete` on `circleMembers` for:
  - The member themselves (already exists: `resource.data.userId == request.auth.uid`)
  - The circle creator (new: admin can remove any member)
- Allow `delete` on `circles` for the creator (`resource.data.createdBy == request.auth.uid`).

---

### Component 6: Cloud Functions — Push Notification (Phase 2)

#### [NEW] `functions/` directory

```
functions/
  ├── package.json
  ├── index.js          # onCircleMemberCreate trigger
  └── .eslintrc.js
```

**`index.js`** — Firestore `onCreate` trigger on `circleMembers`:
1. When a new `circleMembers` doc is created with `status: 'pending'`:
2. Look up the circle's `createdBy` userId.
3. Fetch the creator's `fcmToken` from `users/{creatorId}`.
4. Send FCM push notification: "New join request for [Circle Name] from [Requester Name]".

#### [MODIFY] [firebase.json](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/firebase.json)

- Add `"functions": { "source": "functions" }` config.

---

### Component 7: FCM Token Storage

#### [MODIFY] [App.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/App.js) or [NotificationService.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/services/NotificationService.js)

- On app boot (after auth), get the Expo push token and store it in Firestore via `FirebaseService.saveFCMToken()`.
- This enables Cloud Functions to send targeted push notifications.

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| [FirebaseService.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/services/FirebaseService.js) | MODIFY | 1 |
| [CircleDetailScreen.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/screens/MyCircle/CircleDetailScreen.js) | MODIFY | 1 |
| [MyCircleScreen.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/screens/MyCircle/MyCircleScreen.js) | MODIFY | 1 |
| [AppNavigator.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/navigation/AppNavigator.js) | MODIFY | 1 |
| [firestore.rules](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/firestore.rules) | MODIFY | 1 |
| `functions/index.js` | NEW | 2 |
| `functions/package.json` | NEW | 2 |
| [firebase.json](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/firebase.json) | MODIFY | 2 |
| [NotificationService.js](file:///Users/waleedahmad/Downloads/AJR_APP_V2_2/src/services/NotificationService.js) or App.js | MODIFY | 2 |

---

## Verification Plan

### Phase 1 Testing
1. **Build**: `npx expo run:ios` — verify no compilation errors.
2. **Creator flow**: Create circle → share code → another user joins → creator sees pending request → approve/decline → member appears/disappears.
3. **Member flow**: Enter invite code → see "pending" alert → circle shows in list with "Pending" badge → not navigable → after approval, fully accessible.
4. **Leave flow**: Member opens circle → taps options → "Leave Circle" → confirms → removed from circle.
5. **Delete flow**: Creator opens circle → taps options → "Delete Circle" → confirms → circle deleted for all members.
6. **Remove member**: Creator opens member list → taps ✕ → confirms → member removed.
7. **Ring interactivity**: Verify unselected activities show disabled checkboxes.
8. **Deep link**: Open `ajr://join/CODE` → auto-triggers join flow.

### Phase 2 Testing
1. **Deploy**: `firebase deploy --only functions` from project root.
2. **Notification**: When user joins, verify creator receives push notification.
