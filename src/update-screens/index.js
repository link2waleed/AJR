/**
 * src/update-screens/index.js
 *
 * Barrel export for all update-screen related files.
 * Import everything from here — don't import from sub-files directly.
 */

export { default as HardUpdateScreen }           from './HardUpdateScreen';
export { default as SoftUpdateModal }            from './SoftUpdateModal';
export { default as UpdateService, UPDATE_STATE } from './UpdateService';
export { UpdateProvider, useUpdate }             from './UpdateContext';

// GitHub Pages config template (reference only — not imported by app code):
//
// {
//   "hardUpdate": {
//     "enabled": false,   ← set true to force all users to update
//     "title": "Update Required",
//     "message": "Please update the app to continue using AJR.",
//     "androidUrl": "https://play.google.com/store/apps/details?id=com.my.AJR.android",
//     "iosUrl":     "https://apps.apple.com/app/id<YOUR_APP_ID>"
//   },
//   "softUpdate": {
//     "enabled": false,   ← set true to show optional update nudge
//     "title": "New Update Available",
//     "message": "We've added new features to enhance your spiritual journey!",
//     "androidUrl": "https://play.google.com/store/apps/details?id=com.my.AJR.android",
//     "iosUrl":     "https://apps.apple.com/app/id<YOUR_APP_ID>"
//   }
// }
