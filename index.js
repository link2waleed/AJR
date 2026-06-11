import { registerRootComponent } from 'expo';
import './src/services/FirebaseInit'; // Initialize Firebase first for background tasks
import messaging from '@react-native-firebase/messaging';
import WidgetService from './src/services/WidgetService';
import App from './App';

// Register Firebase Cloud Messaging background/headless task handler
try {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('[FCM Background] Silent notification received:', remoteMessage);
        
        // Update home screen widget data automatically in the background
        await WidgetService.updateWidgetDataFromFirestore();
    });
    console.log('[FCM Background] Registered background message handler successfully');
} catch (e) {
    console.warn('[FCM Background] Failed to register background message handler:', e.message);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
