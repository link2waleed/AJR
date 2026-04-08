/**
 * FirebaseInit.js
 * Centralized Firebase initialization
 */

import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';

function ensureFirebaseApp() {
  try {
    const apps = Array.isArray(firebase.apps) ? firebase.apps : [];
    if (apps.length === 0) {
      console.log('FirebaseInit: initializing default Firebase app');
      return firebase.initializeApp();
    }

    const defaultApp = firebase.app();
    console.log('FirebaseInit: default Firebase app already initialized:', defaultApp.name);
    return defaultApp;
  } catch (error) {
    if (error?.message?.includes('already exists') || String(error).includes('already exists')) {
      console.warn('FirebaseInit: Firebase app already exists, returning existing instance');
      return firebase.app();
    }
    console.error('FirebaseInit: initializeApp failed:', error);
    throw error;
  }
}

const firebaseApp = ensureFirebaseApp();

try {
  firestore().settings({
    persistence: true,
  });
  console.log('✅ Firestore offline persistence enabled');
} catch (error) {
  console.warn('⚠️ Could not enable offline persistence:', error?.message);
}

console.log('Firebase app initialized:', firebaseApp?.name || 'unknown');

export { ensureFirebaseApp };
export default firebaseApp;
