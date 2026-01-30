# Phase 2 Implementation Plan - HomeScreen & Dashboard Integration

## Overview

Phase 2 focuses on connecting the dashboard (HomeScreen) with Firebase data and implementing real-time updates for the AJR Rings display.

---

## Tasks

### A. HomeScreen Firebase Integration

#### A1. Fetch Onboarding Data on Mount
- [ ] Add `useEffect` to fetch onboarding-info from Firebase
- [ ] Set up real-time listener with `FirebaseService.listenToOnboardingInfo()`
- [ ] Extract selected activities from data
- [ ] Handle loading and error states
- [ ] Unsubscribe on component unmount

#### A2. Display Selected Activities Only
- [ ] Filter AJR Rings to show only selected activities
- [ ] Update ring count based on selectedActivities
- [ ] Show placeholder if no activities selected
- [ ] Update legend to match selected activities

#### A3. Implement Journal Rotation
- [ ] Fetch user creation date
- [ ] Call `FirebaseService.getTodayJournal(createdDate)`
- [ ] Calculate `daysSinceCreated % 100` for journal index
- [ ] Display today's journal title and description
- [ ] Handle missing journal entries

#### A4. Real-time Progress Updates
- [ ] Set up listener for activity progress
- [ ] Update ring percentages in real-time
- [ ] Implement progress calculation logic
- [ ] Handle progress data structure

### B. SignInScreen Updates

#### B1. Onboarding Status Check
- [ ] After successful auth, fetch user root document
- [ ] Check `onboarding-process` flag
- [ ] Route: If true → NameScreen, If false → MainApp
- [ ] Handle missing user document gracefully

#### B2. User Data Persistence
- [ ] Load user name for greeting
- [ ] Initialize location from AsyncStorage
- [ ] Load preferences (notifications, theme)

### C. Activity Progress Tracking (Optional for Phase 2)

#### C1. Progress Model
- [ ] Define progress data structure per activity
- [ ] Implement increment/decrement logic
- [ ] Track daily completion status
- [ ] Calculate streaks

#### C2. UI Updates
- [ ] Add completion checkmarks per activity
- [ ] Display current progress percentage
- [ ] Show streak count
- [ ] Real-time ring percentage updates

### D. MyCircleSetupScreen Firebase Integration (Phase 2B)

#### D1. Circle Type Selection
- [ ] Save circle selection to Firebase
- [ ] Create/Join circle with code
- [ ] Store circle metadata

#### D2. Organization Management
- [ ] Add organization creation
- [ ] Store in organizations subcollection
- [ ] Display user's organizations

### E. Testing & Validation

#### E1. Unit Tests
- [ ] Test HomeScreen data fetching
- [ ] Test journal rotation logic
- [ ] Test activity selection filtering
- [ ] Test progress calculations

#### E2. Integration Tests
- [ ] Complete onboarding → HomeScreen
- [ ] Sign out → Sign in → HomeScreen
- [ ] Real-time progress updates
- [ ] Journal rotation across days

#### E3. Manual Testing
- [ ] [ ] Complete onboarding
- [ ] [ ] Verify HomeScreen shows correct activities
- [ ] [ ] Check today's journal displays
- [ ] [ ] Test back navigation
- [ ] [ ] Test real-time updates
- [ ] [ ] Sign out and sign in
- [ ] [ ] Verify data persists

---

## Code Examples for Phase 2

### A1: Fetch Onboarding Data
```javascript
// HomeScreen.js
useEffect(() => {
  const unsubscribe = FirebaseService.listenToOnboardingInfo(
    (data) => {
      setOnboardingData(data);
      // Extract selected activities
      if (data.selectedActivities) {
        setSelectedActivities(data.selectedActivities);
      }
    },
    (error) => {
      console.error('Error fetching onboarding data:', error);
      setError(error.message);
    }
  );

  return unsubscribe; // Cleanup
}, []);
```

### A3: Journal Rotation
```javascript
// In HomeScreen
const fetchTodayJournal = async () => {
  try {
    const userData = await FirebaseService.getUserRootData();
    const createdDate = new Date(userData.createdAt.toDate());
    
    const todayJournal = await FirebaseService.getTodayJournal(createdDate);
    
    if (todayJournal) {
      setJournalEntry({
        title: todayJournal.entry.title,
        description: todayJournal.entry.description,
        dayNumber: todayJournal.dayInSequence
      });
    }
  } catch (error) {
    console.error('Error fetching journal:', error);
  }
};
```

### B1: OnboardingStatus Check
```javascript
// HomeScreen or NavigationContainer
useEffect(() => {
  const unsubscribe = auth().onAuthStateChanged(async (user) => {
    if (user) {
      const userData = await FirebaseService.getUserRootData();
      
      if (userData['onboarding-process'] === true) {
        // Resume onboarding
        navigation.reset({
          routes: [{ name: 'Name' }]
        });
      } else {
        // Go to main app
        navigation.reset({
          routes: [{ name: 'MainApp' }]
        });
      }
    } else {
      // Not signed in
      navigation.reset({
        routes: [{ name: 'Welcome' }]
      });
    }
  });

  return unsubscribe;
}, []);
```

### C1: Progress Calculation
```javascript
// Calculate progress percentage
const calculateProgressPercentage = (selectedActivities, progress) => {
  const activeActivities = Object.values(selectedActivities).filter(v => v).length;
  
  if (activeActivities === 0) return 0;
  
  let totalProgress = 0;
  for (const [activity, selected] of Object.entries(selectedActivities)) {
    if (selected && progress[activity]) {
      totalProgress += progress[activity];
    }
  }
  
  return Math.round((totalProgress / activeActivities) * 100);
};
```

---

## Database Queries for Phase 2

### Get Selected Activities
```javascript
const onboardingData = await FirebaseService.getOnboardingInfo();
const selectedActivities = onboardingData.selectedActivities;
// Returns: { prayers: true, quran: false, dhikr: true, journaling: false }
```

### Get Today's Journal
```javascript
const userData = await FirebaseService.getUserRootData();
const todayJournal = await FirebaseService.getTodayJournal(userData.createdAt);
// Returns: { entry, index, dayInSequence }
```

### Real-time Activity Updates
```javascript
FirebaseService.listenToOnboardingInfo(
  (data) => {
    // data.prayer, data.quran, data.dikar, data.journaling
    updateActivityRings(data);
  }
);
```

---

## File Changes for Phase 2

### HomeScreen.js Changes
- Add Firebase imports
- Add useEffect for data fetching
- Add useState for selectedActivities
- Add useState for todayJournal
- Update AJRRings component props
- Update legend display
- Update journal display area

### SignInScreen.js Changes (if needed)
- Check onboarding-process after auth
- Route based on flag

### Navigation Updates (if needed)
- Update navigation logic for onboarding check
- Add conditional navigation based on auth state

---

## Performance Considerations

### Real-time Listeners
- Only set up when needed
- Unsubscribe on unmount
- Consider pagination for large datasets

### Data Caching
- Cache onboarding-info locally
- Use React Context for global state
- Minimize re-renders

### Database Queries
- Use direct document access (fast)
- Avoid unnecessary queries
- Batch operations when possible

---

## API Reference for Phase 2

### FirebaseService Methods Used

```javascript
// User data
FirebaseService.getUserRootData()                    // Fetch once
FirebaseService.listenToUserRootData(cb, errCb)    // Real-time

// Onboarding info
FirebaseService.getOnboardingInfo()                 // Fetch once
FirebaseService.listenToOnboardingInfo(cb, errCb) // Real-time

// Journals
FirebaseService.getJournals()                       // Get all
FirebaseService.getTodayJournal(createdDate)       // Get today's entry
FirebaseService.listenToJournals(cb, errCb)        // Real-time

// Progress (if implementing)
FirebaseService.updateActivityProgress(type, bool) // Update completion
```

---

## Testing Strategy

### Unit Tests
```javascript
describe('Journal Rotation', () => {
  test('calculateJournalIndex with daysSinceCreated=0', () => {
    const index = 0 % 100; // Should be 0
    expect(index).toBe(0);
  });

  test('calculateJournalIndex with daysSinceCreated=101', () => {
    const index = 101 % 100; // Should be 1 (loops back)
    expect(index).toBe(1);
  });
});
```

### Integration Tests
- Complete onboarding → HomeScreen shows activities
- Add journal entry → Tomorrow shows next entry
- Sign out → Sign in → Data loads correctly

### Manual Testing
- Follow testing checklist above
- Test across different devices/screen sizes
- Test network disconnection scenarios

---

## Documentation Updates Needed

### Update HomeScreen.js Documentation
- Add JSDoc comments
- Document props flow
- Document state management

### Update Firebase Integration Guide
- Add HomeScreen implementation section
- Add journal rotation explanation
- Add real-time listener setup

### Update QUICK_SETUP.md
- Add Phase 2 section
- Add HomeScreen setup instructions

---

## Dependencies Verification

All required packages should already be installed:
- [x] `@react-native-firebase/firestore`
- [x] `@react-native-firebase/auth`
- [x] `react-native-svg` (for rings)
- [x] `expo-linear-gradient` (for backgrounds)

If missing, install with:
```bash
npm install @react-native-firebase/firestore @react-native-firebase/auth
```

---

## Timeline Estimate

- **A1-A2**: 2 hours (HomeScreen Firebase + activity filtering)
- **A3**: 1.5 hours (Journal rotation logic)
- **A4**: 2 hours (Progress updates)
- **B1**: 1 hour (SignIn onboarding check)
- **Testing**: 2 hours (Manual + unit tests)

**Total**: ~8.5 hours

---

## Success Criteria

✅ Phase 2 is complete when:
1. [ ] HomeScreen fetches data from Firebase on mount
2. [ ] AJR Rings display only selected activities
3. [ ] Daily journal rotates correctly
4. [ ] Real-time listeners update dashboard in real-time
5. [ ] SignIn properly routes based on onboarding status
6. [ ] All 8+ manual tests pass
7. [ ] No console errors or warnings
8. [ ] Performance is smooth (60 FPS)

---

## Rollback Plan

If issues occur:
1. Check console logs for errors
2. Verify Firebase rules allow read access
3. Check network connectivity
4. Verify data structure matches schema
5. Test with Firebase Console directly
6. Revert changes and fix incrementally

---

## Notes

- Journal rotation uses modulo: `daysSinceCreated % 100`
- Selected activities stored as booleans (not strings)
- Real-time listeners are optional (can use periodic polling)
- Progress tracking logic ready but may require additional schema updates

---

**Next Phase**: Phase 2 - HomeScreen Integration  
**Estimated Start**: After Phase 1 review & testing  
**Duration**: ~8-10 hours  
**Complexity**: Medium  
**Risk Level**: Low (no schema changes)

---

**Created**: January 29, 2026  
**Status**: Ready for Phase 2 kickoff
