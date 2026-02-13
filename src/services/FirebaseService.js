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
 *   │   │     └── minutesDay: number (1-500)
 *   │   ├── dikar: [
 *   │   │     {
 *   │   │       word: string,
 *   │   │       counter: number (1-1000)
 *   │   │     },
 *   │   │     ... (multiple dhikrs)
 *   │   │   ]
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
                    minutesDay: null,
                },
                dikar: [],
                journaling: {
                    prompts: true,
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
     * Save Quran goals (minutes per day only)
     */
    static async saveQuranGoals(minutesDay) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const quranData = {
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


    static async saveDhikrGoals(selectedDhikrs) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // Convert selected dhikrs object to array format for storage
            const dikarArray = Object.entries(selectedDhikrs).map(([word, counter]) => ({
                word: word.trim(),
                counter: parseInt(counter, 10),
            }));

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .update({
                    'dikar': dikarArray,
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
                return () => { };
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
            return () => { };
        }
    }

    /**
     * Listen to onboarding info changes (real-time)
     */
    /**
     * Listen to onboarding-info changes (real-time)
     * Automatically resets Quran daily reading stats if data is from a previous day
     * This ensures HomeScreen and DailyGrowthScreen always show fresh data after midnight
     */
    static listenToOnboardingInfo(callback, errorCallback) {
        try {
            const user = auth().currentUser;
            if (!user) {
                errorCallback(new Error('No authenticated user'));
                return () => { };
            }

            const unsubscribe = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .onSnapshot(
                    (doc) => {
                        if (doc.exists) {
                            const data = doc.data();

                            // Check if Quran reading data is from today
                            if (data.quran && data.quran.lastReadingDate) {
                                const lastReadingDate = data.quran.lastReadingDate.toDate();
                                const today = new Date();

                                // Compare dates (YYYY-MM-DD format) - LOCAL TIME
                                const getLocalYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                const lastReadingDateStr = getLocalYMD(lastReadingDate);
                                const todayStr = getLocalYMD(today);

                                // If last reading was on a previous day, reset the daily stats
                                if (lastReadingDateStr !== todayStr) {
                                    console.log('Quran data is from previous day. Resetting daily stats in listener.');
                                    data.quran = {
                                        ...data.quran,
                                        actualSecondsDay: 0,
                                        actualMinutesDay: 0,
                                        actualMinutesInt: 0
                                    };
                                }
                            }

                            callback(data);
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
            return () => { };
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
                return () => { };
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
            return () => { };
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
                return () => { };
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
            return () => { };
        }
    }

    /**
     * Save Dhikr goals to Firebase
     * @param {Object} dhikrGoals - Object with dhikr names as keys and counters as values
     * Example: { "SubhanAllah": 33, "Alhamdulillah": 100 }
     */
    static async saveDhikrGoals(dhikrGoals) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // Transform object to array format for database
            // { "SubhanAllah": 33 } => [{ word: "SubhanAllah", counter: 33 }]
            const dhikrArray = Object.entries(dhikrGoals).map(([word, counter]) => ({
                word,
                counter
            }));

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('onboarding-info')
                .doc(user.uid)
                .set({
                    dikar: dhikrArray
                }, { merge: true });

            console.log(`Saved Dhikr goals: ${dhikrArray.length} dhikrs`);
        } catch (error) {
            console.error('FirebaseService: Error saving Dhikr goals:', error);
            throw error;
        }
    }

    // Old saveDhikrProgress removed


    /**
     * Get all dhikr progress
     * @returns {Object} Object with dhikr names as keys and counts as values
     * Example: { "SubhanAllah": 5, "Alhamdulillah": 10 }
     */
    static async getDhikrProgress() {
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
                return {};
            }

            const data = doc.data();
            const lastDhikrDate = data?.lastDhikrDate ? data.lastDhikrDate.toDate() : null;

            // Check for daily reset
            if (lastDhikrDate) {
                const today = new Date();
                if (lastDhikrDate.toDateString() !== today.toDateString()) {
                    console.log('New day detected for Dhikr. Resetting progress.');

                    // Reset in DB asynchronously
                    firestore()
                        .collection('users')
                        .doc(user.uid)
                        .collection('onboarding-info')
                        .doc(user.uid)
                        .set({
                            dhikrProgress: {},
                            lastDhikrDate: firestore.FieldValue.serverTimestamp()
                        }, { merge: true })
                        .catch(err => console.error('Failed to reset dhikr progress:', err));

                    return {};
                }
            }

            return data?.dhikrProgress || {};
        } catch (error) {
            console.error('FirebaseService: Error getting dhikr progress:', error);
            throw error;
        }
    }

    /**
     * Save a dua to user's favorites collection
     * @param {Object} dua - Dua object with arabic, english, transliteration, etc.
     */
    static async saveFavoriteDua(dua) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const duaId = `dua_${Date.now()}`;
            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('saved-duas')
                .doc(duaId)
                .set({
                    ...dua,
                    savedAt: firestore.FieldValue.serverTimestamp()
                });

            console.log('Saved dua to collection');
            return duaId;
        } catch (error) {
            console.error('FirebaseService: Error saving favorite dua:', error);
            throw error;
        }
    }

    /**
     * Remove a dua from user's favorites
     * @param {string} duaId - ID of the dua to remove
     */
    static async removeFavoriteDua(duaId) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('saved-duas')
                .doc(duaId)
                .delete();

            console.log('Removed dua from collection');
        } catch (error) {
            console.error('FirebaseService: Error removing favorite dua:', error);
            throw error;
        }
    }

    /**
     * Get all saved duas for the user
     * @returns {Array} Array of saved dua objects
     */
    static async getSavedDuas() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const snapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('saved-duas')
                .orderBy('savedAt', 'desc')
                .get();

            const duas = [];
            snapshot.forEach(doc => {
                duas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return duas;
        } catch (error) {
            console.error('FirebaseService: Error getting saved duas:', error);
            throw error;
        }
    }

    /**
     * Save daily reading time (in seconds) to 'daily-quran' collection
     * Structure: users/{uid}/daily-quran/{date}
     * @param {number} seconds - Reading time in seconds
     */
    static async saveDailyReadingTime(seconds) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // 1. Get User's Goal from Settings (onboarding-info)
            let goalMinutes = 15; // Default
            try {
                const onboardingDoc = await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .collection('onboarding-info')
                    .doc(user.uid)
                    .get();

                if (onboardingDoc.exists && onboardingDoc.data().quran) {
                    goalMinutes = onboardingDoc.data().quran.minutesDay || 15;
                }
            } catch (err) {
                console.log('Error fetching goal, using default:', err);
            }

            // 2. Prepare Data
            const minutesFloat = parseFloat((seconds / 60).toFixed(2));
            const minutesInt = Math.floor(seconds / 60);
            const goalSeconds = goalMinutes * 60;

            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

            const docRef = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-quran')
                .doc(today);

            // 3. Update Reading Stats (Without Streak first)
            await docRef.set({
                actualSecondsDay: seconds,
                actualMinutesDay: minutesFloat,
                actualMinutesInt: minutesInt,
                goalMinutes: goalMinutes,
                lastUpdated: firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`Saved Quran time: ${seconds}s / ${goalSeconds}s (Goal: ${goalMinutes}m)`);

            // 4. Streak Logic (If Goal Reached)
            if (seconds >= goalSeconds) {
                const docSnap = await docRef.get();
                const data = docSnap.data();

                // Check if streak already recorded TODAY
                if (data && data.streak !== undefined) {
                    console.log('Quran streak already recorded for today:', data.streak);
                    return;
                }

                // Check Yesterday's Streak
                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

                const yesterdayDoc = await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .collection('daily-quran')
                    .doc(yesterday)
                    .get();

                let prevStreak = 0;
                if (yesterdayDoc.exists) {
                    const yData = yesterdayDoc.data();
                    if (yData && yData.streak !== undefined) {
                        prevStreak = yData.streak;
                    }
                }

                const newStreak = prevStreak + 1;
                console.log(`Updating Quran Streak: ${prevStreak} -> ${newStreak}`);

                // Save Streak Update
                await docRef.set({
                    streak: newStreak,
                    streakUpdatedAt: firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                // Clean up root user fields if they exist
                try {
                    await firestore().collection('users').doc(user.uid).update({
                        'onboarding-info.quran.currentStreak': firestore.FieldValue.delete(),
                        'onboarding-info.quran.lastStreakUpdate': firestore.FieldValue.delete()
                    });
                } catch (cleanupError) {
                    // Ignore
                }
            }
        } catch (error) {
            console.error('FirebaseService: Error saving daily reading time:', error);
            throw error;
        }
    }

    /**
     * Get daily reading time from 'daily-quran' collection
     * @returns {number} Reading time in SECONDS
     */
    static async getDailyReadingTime() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

            const doc = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-quran')
                .doc(today)
                .get();

            if (!doc.exists) {
                return 0;
            }

            const data = doc.data();
            return data.actualSecondsDay || 0;
        } catch (error) {
            console.error('FirebaseService: Error getting daily reading time:', error);
            return 0;
        }
    }

    /**
     * Get Quran stats for UI (Current Progress + Streak)
     */
    static async getQuranStats() {
        try {
            const user = auth().currentUser;
            if (!user) return { seconds: 0, streak: 0 };

            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

            // Get Today
            const todayDoc = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-quran')
                .doc(today)
                .get();

            let seconds = 0;
            let streak = 0;

            if (todayDoc.exists) {
                const data = todayDoc.data();
                seconds = data.actualSecondsDay || 0;
                if (data.streak !== undefined) {
                    streak = data.streak;
                }
            }

            // If no streak today, check if active from yesterday
            if (streak === 0) {
                const yesterdayDoc = await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .collection('daily-quran')
                    .doc(yesterday)
                    .get();

                if (yesterdayDoc.exists) {
                    const yData = yesterdayDoc.data();
                    if (yData && yData.streak !== undefined) {
                        streak = yData.streak; // Show current active streak even if not incremented yet
                    }
                }
            }

            return { seconds, streak };
        } catch (error) {
            console.error('Error getting quran stats:', error);
            return { seconds: 0, streak: 0 };
        }
    }

    /**
     * Reset daily reading time
     * No-op now as we use date-based documents
     */
    static async resetDailyReadingTime() {
        // No longer needed with new structure, keeping for compatibility
        console.log('resetDailyReadingTime called (No-op for daily-quran structure)');
    }

    /**
     * Save a journal entry to Firestore
     * Stores entries in a single document with an array field
     * @param {Object} entry - Journal entry data
     * @param {string} entry.mode - 'Guided' or 'Free write'
     * @param {string} entry.themeTitle - Theme title (for guided mode)
     * @param {string} entry.themeDescription - Theme description (for guided mode)
     * @param {string} entry.content - User's written content
     */
    /**
     * Save a journal entry to Firestore
     * Stores entries in 'daily-journals/{date}' collection
     * @param {Object} entry - Journal entry data
     */
    static async saveJournalEntry(entry) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

            const journalEntry = {
                id: `journal_${Date.now()}`,
                mode: entry.mode,
                themeTitle: entry.themeTitle || null,
                themeDescription: entry.themeDescription || null,
                content: entry.content,
                isArchived: entry.isArchived || false,
                createdAt: new Date().toISOString(),
            };

            const docRef = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-journals')
                .doc(today);

            // Save entry to array in daily doc
            await docRef.set({
                entries: firestore.FieldValue.arrayUnion(journalEntry),
                lastUpdated: firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log('Saved journal entry to daily-journals');

            // --- Streak Logic ---
            const docSnap = await docRef.get();
            const data = docSnap.data();

            // Only update streak if not already updated for today
            if (data && data.streak === undefined) {
                // Check Yesterday's Streak
                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

                const yesterdayDoc = await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .collection('daily-journals')
                    .doc(yesterday)
                    .get();

                let prevStreak = 0;
                if (yesterdayDoc.exists) {
                    const yData = yesterdayDoc.data();
                    if (yData && yData.streak !== undefined) {
                        prevStreak = yData.streak;
                    }
                }

                const newStreak = prevStreak + 1;
                console.log(`Updating Journal Streak: ${prevStreak} -> ${newStreak}`);

                // Save Streak Update
                await docRef.set({
                    streak: newStreak,
                    streakUpdatedAt: firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }

            // Cleanup old journals collection (if it exists)
            try {
                // We cannot delete a collection directly in client SDK, but we can delete the main doc
                // assuming users/{uid}/journals/{uid} was the only doc
                await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .collection('journals')
                    .doc(user.uid)
                    .delete();
            } catch (err) {
                // Ignore if already deleted or doesn't exist
            }

            return journalEntry.id;

        } catch (error) {
            console.error('FirebaseService: Error saving journal entry:', error);
            throw error;
        }
    }

    /**
     * Get all journal entries for the current user (Aggregated from daily collections)
     * @returns {Array} Array of journal entries
     */
    static async getJournalEntries() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // For now, we will query all docs in daily-journals
            // In a production app with years of data, you might want to limit this query (e.g. last 30 days)
            const snapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-journals')
                .get();

            let allEntries = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.entries && Array.isArray(data.entries)) {
                    allEntries = [...allEntries, ...data.entries];
                }
            });

            // Sort by createdAt descending (newest first)
            return allEntries.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        } catch (error) {
            console.error('FirebaseService: Error getting journal entries:', error);
            throw error;
        }
    }

    /**
     * Delete a journal entry
     * Needs to find which daily document contains the entry
     * @param {string} entryId - ID of the entry to delete
     * @param {string} entryDate - Optional: Date of the entry to optimize search
     */
    static async deleteJournalEntry(entryId, entryDate) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            let querySnapshot;
            if (entryDate) {
                const d = new Date(entryDate);
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                // Directly get that document
                const docRef = firestore().collection('users').doc(user.uid).collection('daily-journals').doc(dateKey);
                const doc = await docRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    const newEntries = (data.entries || []).filter(e => e.id !== entryId);
                    await docRef.update({ entries: newEntries });
                    console.log('Deleted journal entry from specific date');
                    return;
                }
            }

            // Fallback: search all (expensive but safe if date missing)
            querySnapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-journals')
                .get();

            for (const doc of querySnapshot.docs) {
                const data = doc.data();
                if (data.entries && Array.isArray(data.entries)) {
                    const entryExists = data.entries.some(e => e.id === entryId);
                    if (entryExists) {
                        const newEntries = data.entries.filter(e => e.id !== entryId);
                        await doc.ref.update({ entries: newEntries });
                        console.log('Deleted journal entry found in doc:', doc.id);
                        break;
                    }
                }
            }

        } catch (error) {
            console.error('FirebaseService: Error deleting journal entry:', error);
            throw error;
        }
    }

    static async markJournalComplete() {
        // This function is now deprecated - completion is tracked automatically
        // when entries are saved in the journals collection
        console.log('markJournalComplete called (now automatic via entries)');
    }

    /**
     * Get journal completion stats (today's status and streak)
     * Checks the journals collection entries array
     * @returns {Object} { completedToday: boolean, streak: number }
     */

    static async getJournalStats() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

            // Check Today
            const todayDoc = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-journals')
                .doc(today)
                .get();

            let completedToday = false;
            let streak = 0;

            if (todayDoc.exists) {
                const data = todayDoc.data();
                if (data) {
                    if (data.entries && data.entries.length > 0) {
                        completedToday = true;
                    }
                    if (data.streak !== undefined) {
                        streak = data.streak;
                    }
                }
            }

            // If no streak today, check if active from yesterday
            if (streak === 0) {
                const yesterdayDoc = await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .collection('daily-journals')
                    .doc(yesterday)
                    .get();

                if (yesterdayDoc.exists) {
                    const yData = yesterdayDoc.data();
                    if (yData && yData.streak !== undefined) {
                        streak = yData.streak; // Active streak
                    }
                }
            }

            return { completedToday, streak };
        } catch (error) {
            console.error('FirebaseService: Error getting journal stats:', error);
            return { completedToday: false, streak: 0 };
        }
    }

    /**
     * Listen to Today's Daily Journal Stats
     */
    static listenToDailyJournal(onUpdate) {
        try {
            const user = auth().currentUser;
            if (!user) return () => { };

            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

            const unsubscribe = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-journals')
                .doc(today)
                .onSnapshot(async (doc) => {
                    let completedToday = false;
                    let streak = 0;

                    if (doc.exists) {
                        const data = doc.data();
                        if (data) {
                            if (data.entries && data.entries.length > 0) {
                                completedToday = true;
                            }
                            streak = data.streak || 0;
                        }
                    }

                    if (streak === 0) {
                        try {
                            const yesterdayDoc = await firestore()
                                .collection('users')
                                .doc(user.uid)
                                .collection('daily-journals')
                                .doc(yesterday)
                                .get();

                            if (yesterdayDoc.exists) {
                                const yData = yesterdayDoc.data();
                                if (yData && yData.streak !== undefined) {
                                    streak = yData.streak;
                                }
                            }
                        } catch (e) { console.error(e); }
                    }

                    onUpdate({ completedToday, streak });
                });

            return unsubscribe;
        } catch (error) {
            console.error('Error listening to daily journal:', error);
            return () => { };
        }
    }


    /**
     * Save a new organization
     * @param {Object} org - Organization data
     * @param {string} org.name - Organization name
     * @param {string} org.url - Organization website URL
     * @param {string} org.color - Organization display color
     */
    static async saveOrganization(org) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const orgId = `org_${Date.now()}`;
            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('organizations')
                .doc(orgId)
                .set({
                    name: org.name,
                    url: org.url,
                    color: org.color || '#7A9181',
                    createdAt: firestore.FieldValue.serverTimestamp(),
                });

            console.log('Saved organization with color:', org.color, '| orgId:', orgId);
            return orgId;
        } catch (error) {
            console.error('FirebaseService: Error saving organization:', error);
            throw error;
        }
    }

    /**
     * Get all organizations for the current user
     * @returns {Array} Array of organizations
     */
    static async getOrganizations() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const snapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('organizations')
                .orderBy('createdAt', 'desc')
                .get();

            const organizations = [];
            snapshot.forEach(doc => {
                organizations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return organizations;
        } catch (error) {
            console.error('FirebaseService: Error getting organizations:', error);
            return [];
        }
    }

    /**
     * Delete an organization
     * @param {string} orgId - Organization ID to delete
     */
    static async deleteOrganization(orgId) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('organizations')
                .doc(orgId)
                .delete();

            console.log('Deleted organization');
        } catch (error) {
            console.error('FirebaseService: Error deleting organization:', error);
            throw error;
        }
    }

    /**
     * Save a new donation
     * @param {Object} donation - Donation data
     * @param {string} donation.organizationName - Name of organization
     * @param {number} donation.amount - Donation amount
     * @param {string} donation.date - Donation date (ISO string)
     * @param {string} donation.category - Donation category
     */
    static async saveDonation(donation) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const donationId = `donation_${Date.now()}`;
            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('donations')
                .doc(donationId)
                .set({
                    organizationName: donation.organizationName,
                    amount: donation.amount,
                    date: donation.date,
                    category: donation.category || '',
                    createdAt: firestore.FieldValue.serverTimestamp(),
                });

            console.log('Saved donation');
            return donationId;
        } catch (error) {
            console.error('FirebaseService: Error saving donation:', error);
            throw error;
        }
    }

    /**
     * Get all donations for the current user
     * @returns {Array} Array of donations
     */
    static async getDonations() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const snapshot = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('donations')
                .orderBy('createdAt', 'desc')
                .get();

            const donations = [];
            snapshot.forEach(doc => {
                donations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return donations;
        } catch (error) {
            console.error('FirebaseService: Error getting donations:', error);
            return [];
        }
    }

    /**
     * Delete a donation
     * @param {string} donationId - Donation ID to delete
     */
    static async deleteDonation(donationId) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('donations')
                .doc(donationId)
                .delete();

            console.log('Deleted donation');
        } catch (error) {
            console.error('FirebaseService: Error deleting donation:', error);
            throw error;
        }
    }

    /**
     * Get donation statistics (this month and this year)
     * @returns {Object} { thisMonth: number, thisYear: number }
     */
    static async getDonationStats() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const donations = await this.getDonations();

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            let thisMonth = 0;
            let thisYear = 0;

            donations.forEach(donation => {
                const donationDate = new Date(donation.date);
                const amount = parseFloat(donation.amount) || 0;

                if (donationDate.getFullYear() === currentYear) {
                    thisYear += amount;
                    if (donationDate.getMonth() === currentMonth) {
                        thisMonth += amount;
                    }
                }
            });

            return { thisMonth, thisYear };
        } catch (error) {
            console.error('FirebaseService: Error getting donation stats:', error);
            return { thisMonth: 0, thisYear: 0 };
        }
    }

    /**
     * Save prayer completion status for today
     * @param {Object} prayerCompletion - { Fajr: boolean, Dhuhr: boolean, Asr: boolean, Maghrib: boolean, Isha: boolean }
     */
    static async savePrayerCompletion(prayerCompletion) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-prayers')
                .doc(dateKey)
                .set({
                    date: dateKey,
                    Fajr: prayerCompletion.Fajr || false,
                    Dhuhr: prayerCompletion.Dhuhr || false,
                    Asr: prayerCompletion.Asr || false,
                    Maghrib: prayerCompletion.Maghrib || false,
                    Isha: prayerCompletion.Isha || false,
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

            console.log('Prayer completion saved for', dateKey);
        } catch (error) {
            console.error('FirebaseService: Error saving prayer completion:', error);
            throw error;
        }
    }

    /**
     * Get prayer completion status for today
     * @returns {Object} { Fajr: boolean, Dhuhr: boolean, Asr: boolean, Maghrib: boolean, Isha: boolean }
     */
    static async getPrayerCompletion() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const doc = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-prayers')
                .doc(dateKey)
                .get();

            if (doc.exists) {
                const data = doc.data();
                if (data) {
                    return {
                        Fajr: data.Fajr || false,
                        Dhuhr: data.Dhuhr || false,
                        Asr: data.Asr || false,
                        Maghrib: data.Maghrib || false,
                        Isha: data.Isha || false,
                    };
                }
            }

            // Return all false if no data for today
            return {
                Fajr: false,
                Dhuhr: false,
                Asr: false,
                Maghrib: false,
                Isha: false,
            };
        } catch (error) {
            console.error('FirebaseService: Error getting prayer completion:', error);
            return {
                Fajr: false,
                Dhuhr: false,
                Asr: false,
                Maghrib: false,
                Isha: false,
            };
        }
    }

    /**
     * Listen to prayer completion changes in real-time
     * @param {Function} onUpdate - Callback when prayer completion changes
     * @param {Function} onError - Callback when error occurs
     * @returns {Function} Unsubscribe function
     */
    static listenToPrayerCompletion(onUpdate, onError) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const unsubscribe = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-prayers')
                .doc(dateKey)
                .onSnapshot(
                    (doc) => {
                        if (doc.exists) {
                            const data = doc.data();
                            if (data) {
                                onUpdate({
                                    Fajr: data.Fajr || false,
                                    Dhuhr: data.Dhuhr || false,
                                    Asr: data.Asr || false,
                                    Maghrib: data.Maghrib || false,
                                    Isha: data.Isha || false,
                                });
                            } else {
                                onUpdate({
                                    Fajr: false,
                                    Dhuhr: false,
                                    Asr: false,
                                    Maghrib: false,
                                    Isha: false,
                                });
                            }
                        } else {
                            onUpdate({
                                Fajr: false,
                                Dhuhr: false,
                                Asr: false,
                                Maghrib: false,
                                Isha: false,
                            });
                        }
                    },
                    (error) => {
                        console.error('Error listening to prayer completion:', error);
                        if (onError) onError(error);
                    }
                );

            return unsubscribe;
        } catch (error) {
            console.error('FirebaseService: Error setting up prayer completion listener:', error);
            if (onError) onError(error);
            return () => { }; // Return empty unsubscribe function
        }
    }

    /**
     * Listen to Today's Daily Quran Stats
     */
    static listenToDailyQuran(onUpdate) {
        try {
            const user = auth().currentUser;
            if (!user) return () => { };

            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

            // Also need yesterday for streak if today's streak is 0
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

            const unsubscribe = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-quran')
                .doc(today)
                .onSnapshot(async (doc) => {
                    let seconds = 0;
                    let streak = 0;

                    if (doc.exists) {
                        const data = doc.data();
                        seconds = data.actualSecondsDay || 0;
                        streak = data.streak || 0;
                    }

                    // If streak is 0, check yesterday just to show active streak count
                    if (streak === 0) {
                        try {
                            const yesterdayDoc = await firestore()
                                .collection('users')
                                .doc(user.uid)
                                .collection('daily-quran')
                                .doc(yesterday)
                                .get();

                            if (yesterdayDoc.exists) {
                                const yData = yesterdayDoc.data();
                                if (yData && yData.streak !== undefined) {
                                    streak = yData.streak;
                                }
                            }
                        } catch (e) {
                            console.error('Error fetching yesterday streak in listener:', e);
                        }
                    }

                    onUpdate({ seconds, streak });
                });

            return unsubscribe;
        } catch (error) {
            console.error('Error listening to daily quran:', error);
            return () => { };
        }
    }

    /**
     * Save dhikr progress for a specific dhikr
     * @param {string} dhikrName - Name of the dhikr
     * @param {number} count - Current count
     */
    static async saveDhikrProgress(dhikrName, count) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-dhikr')
                .doc(dateKey)
                .set({
                    [dhikrName]: count,
                    lastUpdated: firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

            console.log(`✅ Dhikr saved locally & queued for sync: ${dhikrName} = ${count}`);
        } catch (error) {
            // If offline, Firestore persistence will queue this write automatically
            console.warn(`⚠️ Dhikr progress save (will sync when online): ${dhikrName} = ${count}`, error?.message);
            // Don't throw - let Firestore handle offline persistence
        }
    }

    /**
     * Get dhikr progress for today
     * @returns {Object} Object with dhikr names as keys and counts as values
     */
    static async getDhikrProgress() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const doc = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-dhikr')
                .doc(dateKey)
                .get();

            if (doc.exists) {
                const data = doc.data();
                if (data) {
                    // Remove metadata fields from the returned object so only dhikr counts remain
                    const { lastUpdated, streak, streakUpdatedAt, ...dhikrCounts } = data;
                    return dhikrCounts;
                }
            }

            // Return empty object if no data for today
            return {};
        } catch (error) {
            console.error('FirebaseService: Error getting dhikr progress:', error);
            return {};
        }
    }

    static async updateDhikrStreak() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

            // Check if streak already recorded for today
            const todayDocRef = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-dhikr')
                .doc(today);

            const todayDoc = await todayDocRef.get();
            if (todayDoc.exists) {
                const docData = todayDoc.data();
                if (docData && docData.streak !== undefined) {
                    console.log('Dhikr streak already updated for today:', docData.streak);
                    return docData.streak;
                }
            }

            // Get yesterday's streak
            const yesterdayDocRef = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-dhikr')
                .doc(yesterday);

            const yesterdayDoc = await yesterdayDocRef.get();
            let prevStreak = 0;

            if (yesterdayDoc.exists) {
                const docData = yesterdayDoc.data();
                if (docData && docData.streak !== undefined) {
                    prevStreak = docData.streak;
                }
            }

            const currentStreak = prevStreak + 1;
            console.log(`Dhikr Streak: Yesterday=${prevStreak}, Today=${currentStreak}`);

            // Save updated streak to today's document
            await todayDocRef.set({
                streak: currentStreak,
                streakUpdatedAt: firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Clean up root user fields if they exist
            try {
                await firestore().collection('users').doc(user.uid).update({
                    dhikrStreak: firestore.FieldValue.delete(),
                    dhikrLastCompletedDate: firestore.FieldValue.delete(),
                    dhikrLastStreakUpdate: firestore.FieldValue.delete()
                });
            } catch (cleanupError) {

            }

            return currentStreak;
        } catch (error) {
            console.error('Error updating dhikr streak:', error);
            throw error;
        }
    }

    static async getDhikrStreak() {
        try {
            const user = auth().currentUser;
            if (!user) return 0;

            const todayDate = new Date();
            const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

            // Check today
            const todayDoc = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-dhikr')
                .doc(today)
                .get();

            if (todayDoc.exists) {
                const data = todayDoc.data();
                if (data && data.streak !== undefined) {
                    return data.streak;
                }
            }

            // Check yesterday
            const yesterdayDoc = await firestore()
                .collection('users')
                .doc(user.uid)
                .collection('daily-dhikr')
                .doc(yesterday)
                .get();

            if (yesterdayDoc.exists) {
                const data = yesterdayDoc.data();
                if (data && data.streak !== undefined) {
                    return data.streak;
                }
            }

            return 0;
        } catch (error) {
            console.error('Error getting dhikr streak:', error);
            return 0;
        }
    }

    /**
     * Update overall daily progress (from DailyGrowthScreen)
     */
    static async updateOverallProgress(percentage) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user');

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const updateData = {
                'dailyProgress.overallPercentage': percentage,
                'dailyProgress.lastUpdated': firestore.FieldValue.serverTimestamp(),
            };

            await firestore()
                .collection('users')
                .doc(user.uid)
                .update(updateData);
        } catch (error) {
            console.error('FirebaseService: Error updating overall progress:', error);
            throw error;
        }
    }

    /**
     * Listen to overall daily progress (real-time)
     */
    static listenToOverallProgress(callback, errorCallback = () => { }) {
        try {
            const user = auth().currentUser;
            if (!user) {
                errorCallback(new Error('No authenticated user'));
                return () => { };
            }

            const unsubscribe = firestore()
                .collection('users')
                .doc(user.uid)
                .onSnapshot(
                    (doc) => {
                        if (doc.exists) {
                            const progress = doc.data()?.dailyProgress?.overallPercentage || 0;
                            callback(progress);
                        }
                    },
                    (error) => {
                        console.error('FirebaseService: Error listening to overall progress:', error);
                        errorCallback(error);
                    }
                );

            return unsubscribe;
        } catch (error) {
            console.error('FirebaseService: Error setting up overall progress listener:', error);
            errorCallback(error);
            return () => { };
        }
    }
}

export default FirebaseService;
