# Firebase Integration - Quick Setup Guide

## What Was Implemented ✅

Complete Firebase Firestore integration for the AJR onboarding flow and dashboard data persistence.

### New Services
- **FirebaseService.js** - All Firebase operations
- **OnboardingValidator.js** - Data validation

### Updated Screens (All with Back Buttons)
- ✅ NameScreen - Saves name to Firebase
- ✅ LocationPermissionScreen - Back button added
- ✅ SelectActivitiesScreen - Saves activity selections to Firebase
- ✅ PrayerSetupScreen - Saves prayer settings to Firebase
- ✅ QuranGoalScreen - Saves quran goals (1-500 validation)
- ✅ DhikrGoalScreen - Saves dhikr goals (1-1000 validation, mutual exclusivity)
- ✅ JournalGoalScreen - Saves journal preferences to Firebase
- ✅ FinalSetupScreen - Marks onboarding complete & initializes journals

### Documentation
- **FIREBASE_INTEGRATION_GUIDE.md** - Complete implementation guide
- **IMPLEMENTATION_SUMMARY.md** - Changes summary with testing checklist

---

## Database Schema

```
users/{uid}
├── name, email, onboarding-process, timestamps
├── onboarding-info/{uid}
│   ├── prayer: {fajr, dhuhr, asr, maghrib, isha, soundMode}
│   ├── quran: {pagesDay, versesDay, minutesDay}
│   ├── dikar: {counter, word}
│   ├── journaling: {prompts}
│   └── selectedActivities: {prayers, quran, dhikr, journaling}
├── journals/{uid}
│   └── entries: [{title, description}, ...] (100-entry rotation)
├── donations/{docId}
└── organizations/{docId}
```

---

## How It Works

### Onboarding Flow
```
User Signs Up
    ↓
NameScreen: User enters name → FirebaseService.initializeUserProfile(name)
    ↓
LocationPermissionScreen: Stores in AsyncStorage (not Firebase)
    ↓
SelectActivitiesScreen: Selects activities → FirebaseService.updateSelectedActivities()
    ↓
PrayerSetupScreen: Configures prayers → FirebaseService.savePrayerSettings()
    ↓
QuranGoalScreen: Sets goals (1-500) → FirebaseService.saveQuranGoals()
    ↓
DhikrGoalScreen: Sets goals (1-1000) → FirebaseService.saveDhikrGoals()
    ↓
JournalGoalScreen: Sets preferences → FirebaseService.saveJournalingGoals()
    ↓
FinalSetupScreen: Complete onboarding → FirebaseService.completeOnboarding()
    ↓
MainApp: Dashboard with data from Firebase
```

### Key Features
1. **Data Persistence** - Each screen saves to Firebase
2. **Back Buttons** - All screens have back buttons with confirmation
3. **Validation** - Input validation before Firebase writes
4. **Error Handling** - User-friendly error messages
5. **Loading States** - Visual feedback during saves
6. **Journal Rotation** - 100-entry circular buffer
7. **Real-time Sync** - Dashboard listeners ready

---

## Setup Instructions

### 1. Firebase Project Setup

```bash
# Create Firebase project in Firebase Console
# 1. Go to Firebase Console (console.firebase.google.com)
# 2. Create new project
# 3. Enable Firestore Database
# 4. Enable Email/Password Authentication
# 5. Update google-services.json (Android)
# 6. Update GoogleService-Info.plist (iOS)
```

### 2. Deploy Firestore Rules

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy security rules
firebase deploy --only firestore:rules
```

### 3. Test in Your App

```bash
# Run app
npm start

# Complete onboarding flow
# Check Firebase Console → Firestore → users collection
# Verify documents created with correct structure
```

---

## Code Examples

### Save Data from Screen
```javascript
// Example from QuranGoalScreen.js
try {
  await FirebaseService.saveQuranGoals(pagesPerDay, versesPerDay, minutesPerDay);
  navigation.navigate('DhikrGoal');
} catch (error) {
  Alert.alert('Error', 'Failed to save. Please try again.');
}
```

### Validate Data
```javascript
// Example validation
const validateInput = (value) => {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > 500) {
    Alert.alert('Invalid', 'Must be 1-500');
    return false;
  }
  return true;
};
```

### Load Dashboard Data
```javascript
// Real-time listener (ready for HomeScreen)
useEffect(() => {
  const unsubscribe = FirebaseService.listenToOnboardingInfo(
    (data) => setOnboardingData(data),
    (error) => console.error(error)
  );
  return unsubscribe;
}, []);
```

---

## Data Validation Rules

| Screen | Field | Validation | Examples |
|--------|-------|-----------|----------|
| Quran | Pages/Verses/Minutes | 1-500, numbers only | ✅ 100, ❌ abc, ❌ 501 |
| Dhikr | Counter | 1-1000, numbers only | ✅ 500, ❌ 1001 |
| Dhikr | Word | Can't have both predefined + custom | ✅ Only one selected |
| Prayer | All fields | Boolean | ✅ true/false |
| Journal | Prompts | Boolean | ✅ true/false |
| Location | Lat/Lng | Valid coordinates | ✅ -180 to 180 |

---

## Testing Checklist

### Phase 1: Onboarding
- [ ] New user signup works
- [ ] NameScreen saves name to Firebase
- [ ] Back button works at each screen
- [ ] Quran validation rejects >500
- [ ] Dhikr validation rejects >1000
- [ ] Dhikr mutual exclusivity works
- [ ] FinalSetup marks onboarding complete
- [ ] Check Firebase Console → documents exist

### Phase 2: Sign In
- [ ] Existing user signin works
- [ ] onboarding-process=false skips onboarding
- [ ] onboarding-process=true resumes onboarding

### Phase 3: Data Integrity
- [ ] All fields match schema
- [ ] No extra fields created
- [ ] Document sizes reasonable
- [ ] Timestamps correct

---

## Key Methods

### Initialize User
```javascript
FirebaseService.initializeUserProfile(name)
```

### Update Activities
```javascript
FirebaseService.updateSelectedActivities({
  prayers: 'yes',
  quran: 'yes',
  dhikr: 'yes',
  journaling: 'yes'
})
```

### Save Settings
```javascript
FirebaseService.savePrayerSettings(prayerSettings)
FirebaseService.saveQuranGoals(pages, verses, minutes)
FirebaseService.saveDhikrGoals(counter, word)
FirebaseService.saveJournalingGoals(enablePrompts)
```

### Complete Onboarding
```javascript
await FirebaseService.completeOnboarding()
await FirebaseService.initializeJournals()
```

### Get Data
```javascript
const data = await FirebaseService.getOnboardingInfo()
const journals = await FirebaseService.getJournals()
const todayJournal = await FirebaseService.getTodayJournal(createdDate)
```

### Real-time Listeners
```javascript
FirebaseService.listenToOnboardingInfo(
  (data) => { /* update state */ },
  (error) => { /* handle error */ }
)
```

---

## Firestore Rules Overview

The `firestore.rules` file ensures:
- ✅ Users can only access their own data
- ✅ Each user is isolated from others
- ✅ All reads/writes require authentication
- ✅ Document paths must match user UID

---

## What's Left (Phase 2)

1. **HomeScreen Integration**
   - Fetch data from Firebase
   - Display AJR Rings with selected activities
   - Show daily journal rotation
   - Real-time progress updates

2. **SignInScreen Update**
   - Check onboarding-process flag
   - Route to onboarding or MainApp

3. **Activity Progress**
   - Track completed checkmarks
   - Update percentages
   - Calculate streaks

---

## Troubleshooting

### "No authenticated user" Error
→ User not logged in. Check auth().currentUser

### "Permission denied" Error
→ Check Firestore rules. Verify UID matches document path.

### Data not saving
→ Check console logs. Check network connection. Check Firebase quota.

### Slow performance
→ Check document sizes. Use Firestore indexing. Monitor reads/writes.

---

## Important Notes

✅ **What Works**
- Complete onboarding flow with Firebase
- All data validation
- Back buttons with confirmations
- Error handling
- Real-time listeners set up

⏳ **Not Yet Implemented**
- HomeScreen Firebase integration
- Activity progress tracking
- Dashboard AJR Rings updates
- SignIn onboarding check
- MyCircle and Subscription Firebase

📍 **Storage Strategy**
- **Firebase**: User profile, onboarding settings, journals, donations, organizations
- **AsyncStorage**: Location, notification preferences (by design)

---

## Documentation Files

1. **FIREBASE_INTEGRATION_GUIDE.md** (800 lines)
   - Complete implementation guide
   - Database schema explanation
   - Method reference
   - Testing checklist

2. **IMPLEMENTATION_SUMMARY.md** (400 lines)
   - All changes made
   - File summary
   - Testing recommendations
   - Next steps

3. **firestore.rules** (65 lines)
   - Security rules
   - User isolation
   - Access control

---

## Support

For detailed information:
- Read **FIREBASE_INTEGRATION_GUIDE.md** for complete documentation
- Check **IMPLEMENTATION_SUMMARY.md** for all changes
- Review **firestore.rules** for security logic
- Check console logs for debugging

---

**Status**: ✅ Phase 1 Complete - Ready for Phase 2  
**Last Updated**: January 29, 2026  
**Maintained by**: Development Team
