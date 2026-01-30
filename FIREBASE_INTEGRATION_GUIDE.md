# AJR Firebase Integration Implementation Guide

## Overview

This guide documents the complete Firebase integration for the AJR app, including the onboarding flow, dashboard, and data persistence.

---

## Database Schema

### Firestore Structure

```
users/{uid}  [Root Document]
├── name: string
├── email: string
├── onboarding-process: boolean
├── createdAt: timestamp
├── updatedAt: timestamp
│
├── onboarding-info/{uid}  [Subcollection - Single Document]
│   ├── prayer: map
│   │   ├── fajr: boolean
│   │   ├── dhuhr: boolean
│   │   ├── asr: boolean
│   │   ├── maghrib: boolean
│   │   ├── isha: boolean
│   │   └── soundMode: string (athan|beep|vibration|silent)
│   ├── quran: map
│   │   ├── pagesDay: number (1-500 or null)
│   │   ├── versesDay: number (1-500 or null)
│   │   └── minutesDay: number (1-500 or null)
│   ├── dikar: map
│   │   ├── counter: number (1-1000 or null)
│   │   └── word: string (or null)
│   ├── journaling: map
│   │   └── prompts: boolean
│   └── selectedActivities: map
│       ├── prayers: boolean
│       ├── quran: boolean
│       ├── dhikr: boolean
│       └── journaling: boolean
│
├── journals/{uid}  [Subcollection - Single Document]
│   └── entries: array [max 100 entries]
│       └── { title: string, description: string }
│
├── donations/{uuids}  [Subcollection - Multiple Documents]
│   ├── name: string
│   ├── amount: number
│   ├── date: timestamp
│   └── note: string (optional)
│
└── organizations/{uuids}  [Subcollection - Multiple Documents]
    ├── name: string
    └── link: string
```

---

## Onboarding Flow Implementation

### Flow Sequence

```
SignUp
  ↓
NameScreen (saves name to users/{uid})
  ↓
LocationPermissionScreen (stores locally in AsyncStorage, not Firebase)
  ↓
SelectActivitiesScreen (updates selectedActivities map in onboarding-info)
  ↓
PrayerSetupScreen (updates prayer map in onboarding-info)
  ↓
QuranGoalScreen (updates quran map in onboarding-info)
  ↓
DhikrGoalScreen (updates dikar map in onboarding-info)
  ↓
JournalGoalScreen (updates journaling map in onboarding-info)
  ↓
MyCircleSetupScreen (stores locally or in organizations subcollection)
  ↓
SubscriptionScreen (future implementation)
  ↓
FinalSetupScreen (calls completeOnboarding() - sets onboarding-process to false)
  ↓
MainApp (Dashboard)
```

### Key Features by Screen

#### 1. NameScreen
- **Action**: Initializes user profile with name
- **Firebase Call**: `FirebaseService.initializeUserProfile(name)`
- **Creates**: 
  - User root document with name, email, onboarding-process=true
  - Onboarding-info subcollection document with empty maps
- **Back Button**: Yes (returns to SignUp)

#### 2. LocationPermissionScreen
- **Action**: Requests location permission, stores preference locally
- **Storage**: AsyncStorage only (LocationService)
- **Firebase**: None (by design - reduce writes)
- **Back Button**: Yes (with confirmation alert)

#### 3. SelectActivitiesScreen
- **Action**: User selects which activities to track (prayers/quran/dhikr/journaling)
- **Firebase Call**: `FirebaseService.updateSelectedActivities(selections)`
- **Updates**: `onboarding-info.selectedActivities` map
- **Back Button**: Yes (with confirmation alert)

#### 4. PrayerSetupScreen
- **Action**: Configure prayer notifications and sound mode
- **Firebase Call**: `FirebaseService.savePrayerSettings(prayerSettings)`
- **Updates**: `onboarding-info.prayer` map
- **Sound Mode Storage**: Firebase (also backup in AsyncStorage via StorageService)
- **Back Button**: Yes (with confirmation alert)

#### 5. QuranGoalScreen
- **Action**: Set daily Quran reading goals
- **Validation**: Numbers only, 1-500 range
- **Firebase Call**: `FirebaseService.saveQuranGoals(pagesDay, versesDay, minutesDay)`
- **Updates**: `onboarding-info.quran` map
- **Back Button**: Yes (returns to Prayer)

#### 6. DhikrGoalScreen
- **Action**: Set dhikr goals and select/create custom dhikr
- **Validation**: 
  - Counter: 1-1000
  - Mutual exclusivity: Cannot select predefined AND custom dhikr simultaneously
- **Firebase Call**: `FirebaseService.saveDhikrGoals(counter, word)`
- **Updates**: `onboarding-info.dikar` map (counter + word fields)
- **Back Button**: Yes (returns to Quran)

#### 7. JournalGoalScreen
- **Action**: Set journaling prompt preferences
- **Options**: Morning | Evening | Both | None
- **Firebase Call**: `FirebaseService.saveJournalingGoals(enablePrompts)`
- **Updates**: `onboarding-info.journaling.prompts` boolean
- **Back Button**: Yes (returns to Dhikr)

#### 8. MyCircleSetupScreen & SubscriptionScreen
- **Status**: Not yet Firebase integrated
- **Future**: Store in organizations/donations subcollections
- **Back Button**: Yes

#### 9. FinalSetupScreen
- **Actions**:
  1. Calls `FirebaseService.completeOnboarding()`
  2. Calls `FirebaseService.initializeJournals()`
  3. Navigates to MainApp (resets navigation stack)
- **Updates**: `onboarding-process = false`
- **Creates**: Empty journals document

---

## Dashboard (HomeScreen) Implementation

### Data Fetching Strategy

1. **Real-time Listener**:
   ```javascript
   FirebaseService.listenToOnboardingInfo(
     (data) => {
       // Update state with activity data
       setOnboardingData(data);
     },
     (error) => console.error(error)
   );
   ```

2. **Journal Rotation**:
   ```javascript
   const todayJournal = await FirebaseService.getTodayJournal(createdDate);
   // Returns: { entry, index, dayInSequence }
   // Logic: daysSinceCreated % 100 = current journal index
   ```

3. **AJR Rings Display**:
   - Only show rings for selectedActivities that are true
   - Number of rings = number of selected activities
   - Ring colors by activity type
   - Real-time percentage updates based on completed status

### Activity Progress Tracking

**Note**: Progress tracking (completed checkmarks) not yet implemented. Placeholder:
```javascript
FirebaseService.updateActivityProgress(activityType, completed);
// For future implementation when activity completion feature is added
```

---

## Sign-In Flow

### For Existing Users

```javascript
// After Firebase auth().signInWithEmailAndPassword()
const userData = await FirebaseService.getUserRootData();

if (userData['onboarding-process'] === false) {
  // Onboarding complete → go to MainApp
  navigation.reset({ routes: [{ name: 'MainApp' }] });
} else {
  // Onboarding incomplete → resume at Name screen
  navigation.reset({ routes: [{ name: 'Name' }] });
}
```

---

## Validation Service

All onboarding data is validated using `OnboardingValidator` before Firebase writes.

### Validators Available

- `validateQuranGoals()` - Ensures 1-500 range
- `validateDhikrGoals()` - Ensures 1-1000, mutual exclusivity
- `validateSelectedActivities()` - Ensures valid activity selections
- `validateLocation()` - Validates lat/lng coordinates
- `validatePrayerSettings()` - Validates prayer booleans and sound mode
- `validateJournalEntry()` - Validates title/description length
- `validateDonation()` - Validates donation amount and date
- `validateOrganization()` - Validates organization name and URL

---

## Security Rules

Firestore rules are in `firestore.rules`. Key principles:

1. **User Isolation**: Users can only read/write their own data
2. **Subcollection Access**: Direct access to onboarding-info/{uid}, journals/{uid}
3. **No Public Access**: All documents require authentication
4. **Document-level Control**: Each subcollection restricts to user's UID

**Deployment**:
```bash
firebase deploy --only firestore:rules
```

---

## Firebase Service Methods Reference

### User Profile
```javascript
initializeUserProfile(name)           // Called on signup
getUserRootData()                     // Get user profile
listenToUserRootData(callback)        // Real-time user data
```

### Onboarding Info
```javascript
getOnboardingInfo()                   // Get all onboarding settings
listenToOnboardingInfo(callback)      // Real-time onboarding updates
updateSelectedActivities(activities)  // Save activity selections
savePrayerSettings(prayerSettings)   // Save prayer config
saveQuranGoals(pages, verses, mins)  // Save Quran goals
saveDhikrGoals(counter, word)        // Save Dhikr goals
saveJournalingGoals(enablePrompts)   // Save Journal config
completeOnboarding()                  // Mark onboarding complete
```

### Journals
```javascript
initializeJournals()                  // Create empty journals doc
getJournals()                         // Get all 100 journal entries
addJournalEntry(title, description)  // Add entry (auto-rotates at 100)
getTodayJournal(createdDate)         // Get today's journal entry
listenToJournals(callback)           // Real-time journal updates
```

### Donations & Organizations
```javascript
addDonation(name, amount, date, note)
getDonations()
addOrganization(name, link)
getOrganizations()
```

---

## Edge Cases Handled

### 1. Onboarding Interruption
- User can go back at any screen
- Firebase saves state after each step
- Resume from where left off by checking `onboarding-process` flag

### 2. Network Failures
- Retry logic built into Firebase SDK
- AsyncStorage fallbacks for critical data (location, sound mode)
- Try/catch blocks in all screen handlers

### 3. Journal Array Management
- Array auto-rotates: keeps last 99, adds new
- Handles < 100 entries (mod operation safe)
- Frontend pagination ready for future

### 4. Activity Selection Validation
- Ensures at least one activity selected (future enforcement)
- Prevents invalid state combinations

### 5. Dhikr Mutual Exclusivity
- Selecting predefined clears custom field
- Entering custom clears predefined field
- UI warning if both populated

### 6. Quran Input Validation
- Numbers only (regex validation)
- Max 500 per field
- Prevents invalid submissions

---

## Testing Checklist

- [ ] New user signup → complete onboarding flow → Firebase data created
- [ ] Go back at each screen → data persists on forward movement
- [ ] Check Firestore console → documents exist with correct structure
- [ ] Existing user signin → onboarding-process=false → goes to MainApp
- [ ] Location disabled → works without location data
- [ ] Prayer settings saved → FinalSetup completes onboarding flag
- [ ] Journal array → add entry, check rotation at 100
- [ ] AJR Rings → only selected activities show rings
- [ ] Sign out/in → data persists and loads correctly
- [ ] Offline mode → Firebase caching works (if enabled)

---

## Future Enhancements

1. **Activity Progress Tracking**
   - Track completed status per activity per day
   - Calculate streaks
   - Update progress counts for AJR Rings

2. **Journal Publishing**
   - Allow users to share journal entries
   - Add media support (images, voice notes)

3. **Community Features**
   - MyCircle integration with Firestore
   - Real-time sync for group activities

4. **Analytics**
   - Track user engagement
   - Streak analytics
   - Activity preferences

5. **Subscription Management**
   - Track subscription status
   - Integrate with payment system

---

## Migration from AsyncStorage

Currently, location and notification settings are stored in AsyncStorage. To migrate to Firestore:

1. Add `location` document to users/{uid}
2. Add `preferences` map for notifications
3. Update LocationService to sync with Firebase
4. Deprecate AsyncStorage getters

---

## Deployment Steps

1. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Enable Firestore**:
   - Go to Firebase Console
   - Create Firestore Database
   - Set region (closest to your users)

3. **Enable Authentication**:
   - Email/Password auth already configured
   - Test with Firebase Console

4. **Create Composite Indexes** (if needed):
   - Donations ordered by date
   - Future analytics queries

5. **Test All Screens**:
   - Run through onboarding on simulator
   - Verify Firestore documents created
   - Check security rules allow/deny correctly

---

## Debugging Tips

1. **Firebase Console**:
   - Check `collections` tab → `users` → browse documents
   - Verify subcollections and fields

2. **Console Logs**:
   - FirebaseService logs all operations
   - Check for: "Error:", "Error saving", "Error getting"

3. **Network Tab**:
   - Monitor Firestore requests
   - Check latency and data sizes

4. **Firestore Rules Simulator**:
   - Test rules before deployment
   - Simulate reads/writes with different UIDs

---

## Support & Troubleshooting

### "No authenticated user" Error
- User not logged in
- Check Firebase auth() status before making calls

### "Permission denied" Error
- Check Firestore rules
- Verify user UID matches document path
- Test rules in Firebase Console

### Data Not Persisting
- Check console for errors
- Verify network connection
- Check Firestore quota usage

### Slow Performance
- Check document sizes (keep under 1MB)
- Use indexing for frequent queries
- Consider pagination for large arrays

---

**Last Updated**: January 29, 2026  
**Version**: 1.0.0
