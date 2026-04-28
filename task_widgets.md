# AJR Widgets — Implementation Tasks

## Phase 1: Setup & Dependencies
- [ ] Install `@bacons/apple-targets`
- [ ] Create widget target via `npx create-target widget`
- [ ] Update `app.json` with plugin config + App Group entitlement

## Phase 2: React Native Data Bridge
- [ ] Create `WidgetService.js` — collects & writes widget data to UserDefaults
- [ ] Integrate widget updates in HomeScreen.js
- [ ] Integrate widget updates in DailyGrowthScreen.js

## Phase 3: iOS Widget Extension (SwiftUI)
- [ ] Create shared data model (`AJRWidgetEntry.swift`, `SharedDataReader.swift`)
- [ ] Create `DailyRingsView.swift` — 3 concentric rings
- [ ] Create `NextSalahView.swift` — prayer name + countdown
- [ ] Create `CircleProgressView.swift` — single ring
- [ ] Create main widget bundle (`AJRWidgets.swift`) with all 3 widgets
- [ ] Implement widget sizes (small/medium/large layouts)

## Phase 4: Deep Linking
- [ ] Register `ajr://` URL scheme
- [ ] Handle deep links in AppNavigator.js
- [ ] Wire widget tap URLs

## Phase 5: Verification
- [x] Run `npx expo prebuild -p ios --clean`
- [x] Verify Xcode build compiles
- [x] Document manual testing steps
