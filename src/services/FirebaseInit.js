/**
 * FirebaseInit.js
 * Centralized Firebase initialization
 */

import { initializeApp } from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';

// Initialize Firebase
// The config is automatically loaded from:
// - google-services.json (Android)
// - GoogleService-Info.plist (iOS)
const firebaseApp = initializeApp();

// Enable Firestore offline persistence
// This allows reads/writes to work offline and automatically syncs when connection is restored
try {
    firestore().settings({
        persistence: true,
    });
    console.log('✅ Firestore offline persistence enabled');
} catch (error) {
    console.warn('⚠️ Could not enable offline persistence:', error?.message);
}

console.log('Firebase app initialized:', firebaseApp.name);

export default firebaseApp;
