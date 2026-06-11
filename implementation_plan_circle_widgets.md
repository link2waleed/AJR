# Dynamic Circle Widgets implementation

Implementation plan to build out the iOS widget cases correctly syncing dynamically with React Native.

## Proposed Changes

### 1. Update React Native Widget Bridge (`WidgetService.js` & `HomeScreen.js`)
Currently, `WidgetService` expects a simplistic `circleProgress` integer but the Swift widget needs more context to accurately render "No Circles" vs "Multiple Circles".
- **`HomeScreen.js`**: I will add a `useEffect` listener to fetch the user's circles directly from Firebase on app mount (`FirebaseService.getUserCircles()`) and keep it in exact React state.
- **`WidgetService.js`**: I will modify `updateWidgetData` to construct a detailed payload:
  ```json
  "circleData": {
    "hasCircles": true/false,
    "name": "Quran Circle",
    "percentage": 65,
    "otherCirclesCount": 2
  }
  ```

### 2. Update Swift Schemas (`widgets.swift`)
I will modify `AJRWidgetData` decoding structs so iOS properly receives our new `circleData` object instead of the stale placeholder `RingData`.
- Introduce `CircleData: Codable` inside `AJRWidgetData`.
- Update the `.placeholder` variable to mock out valid dummy data for widget previews in iOS.

### 3. Build Swift UI Cases (`AJRWidgetViews.swift`)
I'll replace the static `CircleProgressView` with an intelligent layout handler:
- **No Circles Case**: Built based on your screenshot snippet using the dotted-border circle, dual-person icon, "No Circles Yet" header, and "Join a circle" subtitle.
- **Multiple Circles Case**: Uses the standard circle percentage ring from the center, along with dynamic strings rendering `data.circleData.name` and `+\(data.circleData.otherCirclesCount) more` below it.
- **Single Circle Case**: Directly shows the primary circle's name.

### 4. Deep Linking Enhancements (`AJRWidgets.swift`)
I will verify the deep linking prefix `ajr://mycircle` binds correctly to the `MyCircle` stack.
- The Swift views currently attach `.widgetURL(URL(string: "ajr://mycircle"))`, which works perfectly with the existing React Navigation prefix configurations `ajr://...` routing to `MainApp -> MyCircle`.

## Approach to Group Average Calculation
As requested, the widget will strictly calculate and display the **Entire Group's Average Progress**, not the user's personal progress.

To protect Firestore read quotas from exploding (since `HomeScreen.js` updates widgets every 1.5 seconds), we will implement a strict caching strategy:
1. `HomeScreen.js` will fetch the primary circle's data and run `FirebaseService.getCircleMemberRingAverages(circleId)` **only once** when the component mounts or comes into focus.
2. The calculated group percentage will be held in state and pushed to the widget. This ensures the widget shows the true group average without running 20+ queries every time the user toggles a local prayer ring!
