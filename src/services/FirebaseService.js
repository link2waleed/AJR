/**
 * FirebaseService.js
 * Centralized Firebase/Firestore operations for user data management
 * 
 * Database Structure:
 * users/{uid}
 *   ├── name: string
 *   ├── onboarding-process: boolean
 *   ├── createdAt: timestamp
 *   ├── updatedAt: timestamp
 *   │
 *   ├── onboarding-info/{uid} (single doc)
 *   │   ├── prayer: {
 *   │   │     ├── fajr: boolean
 *   │   │     ├── dhuhr: boolean
 *   │   │     ├── asr: boolean
 *   │   │     ├── maghrib: boolean
 *   │   │     ├── isha: boolean
 *   │   │     └── soundMode: string (athan|silent|vibrate)
 *   │   ├── quran: {
 *   │   │     ├── pagesDay: number (1-500)
 *   │   │     ├── versesDay: number (1-500)
 *   │   │     └── minutesDay: number (1-500)
 *   │   ├── dikar: {
 *   │   │     ├── counter: number (1-1000)
 *   │   │     └── word: string
 *   │   └── journaling: {
 *   │         └── prompts: boolean
 *   │
 *   ├── journals/{uid} (single doc with 100-entry array)
 *   │   └── entries: [
 *   │         {
 *   │           title: string,
 *   │           description: string
 *   │         },
 *   │         ... (up to 100 entries)
 *   │       ]
 *   │
 *   ├── donations/{uuids} (multiple docs)
 *   │   ├── name: string
 *   │   ├── amount: number
 *   │   ├── date: date
 *   │   └── note: string (optional)
 *   │
 *   └── organizations/{uuids} (multiple docs)
 *       ├── name: string
 *       └── link: string
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

class FirebaseService {
    /**
     * Initialize user profile after signup
     * Creates user root document and onboarding-info subcollection document
     */
    static async initializeUserProfile(name) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // Initialize root user document
            const userData = {
                name: name.trim(),
                email: user.email,
                'onboarding-process': true,
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            await firestore().collection('users').doc(user.uid).set(userData, { merge: true });

            // Initialize onboarding-info subcollection with single document (using uid as doc id)
            const onboardingData = {
                prayer: {
                    fajr: false,
                    dhuhr: false,
                    asr: false,
                    maghrib: false,
                    isha: false,
                    soundMode: 'athan',
                },
                quran: {
                    pagesDay: null,
                    versesDay: null,
                    minutesDay: null,
                },
                dikar: {
                    counter: null,
                    word: null,
                },
                journaling: {
                    prompts: false,
                },
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .set(onboardingData, { merge: true });

            return { userData, onboardingData };
        } catch (error) {
            console.error('FirebaseService: Error initializing user profile:', error);
            throw error;
        }
    }

    /**
     * Update prayer settings in onboarding-info
     */
    static async savePrayerSettings(prayerSettings) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const prayerData = {
                fajr: prayerSettings.fajr || false,
                dhuhr: prayerSettings.dhuhr || false,
                asr: prayerSettings.asr || false,
                maghrib: prayerSettings.maghrib || false,
                isha: prayerSettings.isha || false,
                soundMode: prayerSettings.soundMode || 'athan',
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .update({
                    'prayer': prayerData,
                });
        } catch (error) {
            console.error('FirebaseService: Error saving prayer settings:', error);
            throw error;
        }
    }

    /**
     * Save Quran goals
     */
    static async saveQuranGoals(pagesDay, versesDay, minutesDay) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const quranData = {
                pagesDay: pagesDay ? parseInt(pagesDay, 10) : null,
                versesDay: versesDay ? parseInt(versesDay, 10) : null,
                minutesDay: minutesDay ? parseInt(minutesDay, 10) : null,
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .update({
                    'quran': quranData,
                });
        } catch (error) {
            console.error('FirebaseService: Error saving Quran goals:', error);
            throw error;
        }
    }

    /**
     * Save Dhikr goals (counter and word)
     */
    static async saveDhikrGoals(counter, word) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const dikarData = {
                counter: counter ? parseInt(counter, 10) : null,
                word: word && word.trim() ? word.trim() : null,
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .update({
                    'dikar': dikarData,
                });
        } catch (error) {
            console.error('FirebaseService: Error saving Dhikr goals:', error);
            throw error;
        }
    }

    /**
     * Save Journaling goals (prompts boolean)
     */
    static async saveJournalingGoals(enablePrompts) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const journalingData = {
                prompts: enablePrompts || false,
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .update({
                    'journaling': journalingData,
                });
        } catch (error) {
            console.error('FirebaseService: Error saving Journaling goals:', error);
            throw error;
        }
    }

    /**
     * Update selected activities (from SelectActivitiesScreen)
     */
    static async updateSelectedActivities(activities) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const selectedActivitiesMap = {
                prayers: activities.prayers === 'yes',
                quran: activities.quran === 'yes',
                dhikr: activities.dhikr === 'yes',
                journaling: activities.journaling === 'yes',
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .update({
                    'selectedActivities': selectedActivitiesMap,
                });
        } catch (error) {
            console.error('FirebaseService: Error updating selected activities:', error);
            throw error;
        }
    }

    /**
     * Mark onboarding as complete
     */
    static async completeOnboarding() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            await firestore()
                .collection('users')
                .doc(user.uid)
                .update({
                    'onboarding-process': false,
                    'updatedAt': firestore.FieldValue.serverTimestamp(),
                });
        } catch (error) {
            console.error('FirebaseService: Error completing onboarding:', error);
            throw error;
        }
    }

    /**
     * Get user root document data
     */
    static async getUserRootData() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const doc = await firestore().collection('users').doc(user.uid).get();
            if (!doc.exists) {
                throw new Error('User document not found');
            }

            return doc.data();
        } catch (error) {
            console.error('FirebaseService: Error getting user root data:', error);
            throw error;
        }
    }

    /**
     * Get onboarding-info subcollection document
     * Fast direct access using user UID as document ID
     */
    static async getOnboardingInfo() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const doc = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .get();

            if (!doc.exists) {
                throw new Error('Onboarding info not found');
            }

            return doc.data();
        } catch (error) {
            console.error('FirebaseService: Error getting onboarding info:', error);
            throw error;
        }
    }

    /**
     * Get combined user data (root + onboarding)
     */
    static async getCombinedUserData() {
        try {
            const rootData = await this.getUserRootData();
            const onboardingData = await this.getOnboardingInfo();

            return {
                ...rootData,
                onboarding: onboardingData,
            };
        } catch (error) {
            console.error('FirebaseService: Error getting combined user data:', error);
            throw error;
        }
    }

    /**
     * Initialize or create journals document with empty array
     */
    static async initializeJournals() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const journalsData = {
                entries: [],
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('journals')
                .doc(user.uid)
                .set(journalsData, { merge: true });
        } catch (error) {
            console.error('FirebaseService: Error initializing journals:', error);
            throw error;
        }
    }

    /**
     * Add a journal entry to the 100-entry array
     * If array reaches 100, remove oldest and add new
     */
    static async addJournalEntry(title, description) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const journalsRef = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('journals')
                .doc(user.uid);

            // Get current entries
            const doc = await journalsRef.get();
            let entries = doc.exists ? doc.data().entries || [] : [];

            // Keep only last 99 entries if we're at 100
            if (entries.length >= 100) {
                entries = entries.slice(1);
            }

            // Add new entry
            entries.push({
                title: title.trim(),
                description: description.trim(),
            });

            // Update document
            await journalsRef.set({ entries }, { merge: true });
        } catch (error) {
            console.error('FirebaseService: Error adding journal entry:', error);
            throw error;
        }
    }

    /**
     * Get journals (100-entry array)
     */
    static async getJournals() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const doc = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('journals')
                .doc(user.uid)
                .get();

            if (!doc.exists) {
                return { entries: [] };
            }

            return doc.data();
        } catch (error) {
            console.error('FirebaseService: Error getting journals:', error);
            throw error;
        }
    }

    /**
     * Get today's journal based on sequence
     * daysSinceCreated % 100 = current journal index
     */
    static async getTodayJournal(createdAtDate) {
        try {
            const journalsData = await this.getJournals();
            const entries = journalsData.entries || [];

            if (entries.length === 0) {
                return null;
            }

            // Calculate days since creation
            const createdDate = new Date(createdAtDate);
            const today = new Date();
            const diffTime = today - createdDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Get index (loops back after 100)
            const index = diffDays % entries.length;

            return {
                entry: entries[index],
                index,
                dayInSequence: diffDays + 1,
            };
        } catch (error) {
            console.error('FirebaseService: Error getting today journal:', error);
            return null;
        }
    }

    /**
     * Add donation entry
     */
    static async addDonation(name, amount, date, note = null) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const donationData = {
                name: name.trim(),
                amount: parseFloat(amount),
                date: firestore.Timestamp.fromDate(new Date(date)),
                note: note && note.trim() ? note.trim() : null,
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('donations')
                .add(donationData);
        } catch (error) {
            console.error('FirebaseService: Error adding donation:', error);
            throw error;
        }
    }

    /**
     * Get all donations
     */
    static async getDonations() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const snapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('donations')
                .orderBy('date', 'desc')
                .get();

            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('FirebaseService: Error getting donations:', error);
            return [];
        }
    }

    /**
     * Add organization
     */
    static async addOrganization(name, link) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const orgData = {
                name: name.trim(),
                link: link.trim(),
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('organizations')
                .add(orgData);
        } catch (error) {
            console.error('FirebaseService: Error adding organization:', error);
            throw error;
        }
    }

    /**
     * Get all organizations
     */
    static async getOrganizations() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const snapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('organizations')
                .get();

            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('FirebaseService: Error getting organizations:', error);
            return [];
        }
    }

    /**
     * Listen to user root data changes (real-time)
     */
    static listenToUserRootData(callback, errorCallback) {
        try {
            const user = auth().currentUser;
            if (!user) {
                errorCallback(new Error('No authenticated user'));
                return () => {};
            }

            const unsubscribe = firestore()
                .collection('users')
                .doc(user.uid)
                .onSnapshot(
                    (doc) => {
                        if (doc.exists) {
                            callback(doc.data());
                        }
                    },
                    (error) => {
                        console.error('FirebaseService: Error listening to user data:', error);
                        errorCallback(error);
                    }
                );

            return unsubscribe;
        } catch (error) {
            console.error('FirebaseService: Error setting up listener:', error);
            errorCallback(error);
            return () => {};
        }
    }

    /**
     * Listen to onboarding info changes (real-time)
     */
    static listenToOnboardingInfo(callback, errorCallback) {
        try {
            const user = auth().currentUser;
            if (!user) {
                errorCallback(new Error('No authenticated user'));
                return () => {};
            }

            const unsubscribe = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .onSnapshot(
                    (doc) => {
                        if (doc.exists) {
                            callback(doc.data());
                        }
                    },
                    (error) => {
                        console.error('FirebaseService: Error listening to onboarding info:', error);
                        errorCallback(error);
                    }
                );

            return unsubscribe;
        } catch (error) {
            console.error('FirebaseService: Error setting up onboarding listener:', error);
            errorCallback(error);
            return () => {};
        }
    }

    /**
     * Listen to journals changes (real-time)
     */
    static listenToJournals(callback, errorCallback) {
        try {
            const user = auth().currentUser;
            if (!user) {
                errorCallback(new Error('No authenticated user'));
                return () => {};
            }

            const unsubscribe = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('journals')
                .doc(user.uid)
                .onSnapshot(
                    (doc) => {
                        if (doc.exists) {
                            callback(doc.data());
                        }
                    },
                    (error) => {
                        console.error('FirebaseService: Error listening to journals:', error);
                        errorCallback(error);
                    }
                );

            return unsubscribe;
        } catch (error) {
            console.error('FirebaseService: Error setting up journals listener:', error);
            errorCallback(error);
            return () => {};
        }
    }

    /**
     * Update activity completion status (auto-save per ring)
     * Stores completion status in root user document
     */
    static async updateActivityCompletion(activity, completed) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const updateData = {
                [`activityProgress.${activity}`]: completed,
                'updatedAt': firestore.FieldValue.serverTimestamp(),
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .update(updateData);
        } catch (error) {
            console.error(`FirebaseService: Error updating ${activity} completion:`, error);
            throw error;
        }
    }

    /**
     * Get activity progress (completion status for each activity)
     */
    static async getActivityProgress() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const doc = await firestore().collection('users').doc(user.uid).get();
            if (!doc.exists) {
                throw new Error('User document not found');
            }

            return doc.data().activityProgress || {};
        } catch (error) {
            console.error('FirebaseService: Error getting activity progress:', error);
            throw error;
        }
    }

    /**
     * Listen to activity progress changes (real-time)
     */
    static listenToActivityProgress(callback, errorCallback) {
        try {
            const user = auth().currentUser;
            if (!user) {
                errorCallback(new Error('No authenticated user'));
                return () => {};
            }

            const unsubscribe = firestore()
                .collection('users')
                .doc(user.uid)
                .onSnapshot(
                    (doc) => {
                        if (doc.exists) {
                            const progress = doc.data().activityProgress || {};
                            callback(progress);
                        }
                    },
                    (error) => {
                        console.error('FirebaseService: Error listening to activity progress:', error);
                        errorCallback(error);
                    }
                );

            return unsubscribe;
        } catch (error) {
            console.error('FirebaseService: Error setting up activity progress listener:', error);
            errorCallback(error);
            return () => {};
        }
    }
}

export default FirebaseService;
