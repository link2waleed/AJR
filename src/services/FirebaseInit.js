/**
 * FirebaseInit.js
 * Centralized Firebase initialization
 */

import { initializeApp } from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';

// Initialize Firebase
// The config is automatically loaded from:
// - google-services.json (Android)
// - GoogleService-Info.plist (iOS)
const firebaseApp = initializeApp();

console.log('Firebase app initialized:', firebaseApp.name);

export default firebaseApp;
