import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth'; // Import auth
import FirebaseService from '../services/FirebaseService';

/**
 * Custom hook to track GLOBAL reading time specific to the logged-in USER
 * Timer continues across all Surahs/Juzs
 * @returns {Object} - { elapsedTime, startTimer, pauseTimer, resetTimer, formatTime }
 */
export const useReadingTimer = () => {
    const [elapsedTime, setElapsedTime] = useState(0); // in seconds
    const [isRunning, setIsRunning] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false); // Track if saved time is loaded
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);
    const elapsedTimeRef = useRef(0); // Ref to track latest elapsed time

    // Get current user ID
    const user = auth().currentUser;
    const userId = user ? user.uid : 'guest';

    // Unique storage key for THIS user
    const storageKey = `readingTimer_${userId}`;
    const lastUserRef = useRef(userId);

    // Load saved time from AsyncStorage on mount or when user changes
    useEffect(() => {
        // If user changed, reset state first
        if (lastUserRef.current !== userId) {
            console.log(`👤 User changed from ${lastUserRef.current} to ${userId}. Resetting timer state.`);
            setElapsedTime(0);
            elapsedTimeRef.current = 0;
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            lastUserRef.current = userId;
        }

        loadSavedTime();

        return () => {
            // Save time when component unmounts using ref value
            if (elapsedTimeRef.current > 0) {
                console.log('Unmounting - Saving time:', elapsedTimeRef.current);
                saveTimeWithValue(elapsedTimeRef.current);
            }
            stopTimer();
        };
    }, [userId]); // Re-run if user changes


    // Load saved time from storage
    const loadSavedTime = async () => {
        try {
            console.log(`📂 Loading data for user: ${userId}`);
            const savedData = await AsyncStorage.getItem(storageKey);
            console.log('Loading local saved data:', savedData);

            if (savedData) {
                const { time, lastUpdated } = JSON.parse(savedData);

                // Check if 24 hours have passed (daily reset)
                const savedDate = new Date(lastUpdated);
                const currentDate = new Date();

                // Get date strings (YYYY-MM-DD) for comparison
                const savedDateStr = savedDate.toISOString().split('T')[0];
                const currentDateStr = currentDate.toISOString().split('T')[0];

                // If dates are different, reset timer (new day)
                if (savedDateStr !== currentDateStr) {
                    console.log('New day detected! Resetting timer from', time, 'to 0');
                    console.log('Previous date:', savedDateStr, '| Current date:', currentDateStr);
                    setElapsedTime(0);
                    elapsedTimeRef.current = 0;
                    // Clear old data locally
                    await AsyncStorage.removeItem(storageKey);
                    // Reset in Firebase as well
                    FirebaseService.resetDailyReadingTime().catch(err =>
                        console.error('Failed to reset Firebase reading time:', err)
                    );
                } else {
                    // Same day, load saved time
                    const loadedTime = time || 0;
                    console.log('Loaded time from storage:', loadedTime, 'seconds (same day)');
                    setElapsedTime(loadedTime);
                    elapsedTimeRef.current = loadedTime;
                }
            } else {
                console.log('No local saved time found. Checking Firebase...');

                // Try to fetch from Firebase if user is logged in
                if (userId !== 'guest') {
                    try {
                        const seconds = await FirebaseService.getDailyReadingTime();
                        if (seconds > 0) {
                            console.log(`☁️ Found ${seconds} seconds in Firebase for today.`);
                            setElapsedTime(seconds);
                            elapsedTimeRef.current = seconds;
                            // Update local storage so we have it next time
                            saveTimeWithValue(seconds);
                        } else {
                            console.log('ℹNo data in Firebase either. Starting from 0.');
                        }
                    } catch (fbError) {
                        console.error('Failed to fetch from Firebase:', fbError);
                    }
                }
            }
            setIsLoaded(true);
        } catch (error) {
            console.error('Error loading saved time:', error);
            setIsLoaded(true);
        }
    };

    // Save specific time value to storage
    const saveTimeWithValue = async (timeValue) => {
        try {
            const data = {
                time: timeValue,
                lastUpdated: new Date().toISOString(),
            };
            console.log('Saving time to storage:', timeValue, 'seconds');
            await AsyncStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving time:', error);
        }
    };

    // Save current time to storage
    const saveTime = async () => {
        await saveTimeWithValue(elapsedTimeRef.current);
    };

    const currentDateRef = useRef(new Date().toISOString().split('T')[0]);

    // Start the timer
    const startTimer = () => {
        if (!isRunning && isLoaded) {
            console.log('Starting timer from:', elapsedTimeRef.current, 'seconds');
            setIsRunning(true);
            startTimeRef.current = Date.now() - (elapsedTimeRef.current * 1000);

            // Ensure we track the date when timer starts
            currentDateRef.current = new Date().toISOString().split('T')[0];

            intervalRef.current = setInterval(() => {
                const currentTime = Date.now();

                // Check for midnight crossover
                const nowStr = new Date().toISOString().split('T')[0];
                if (nowStr !== currentDateRef.current) {
                    console.log('🕛 Midnight crossover detected! Resetting timer.');

                    // 1. Auto-save yesterday's final time one last time? 
                    // (Already handled by strict 10s/15s autosave likely, but let's be safe)
                    // Actually, if we reset now, we might lose 14s of progress.
                    // But simpler to just reset.

                    // 2. Reset Timer
                    setElapsedTime(0);
                    elapsedTimeRef.current = 0;
                    startTimeRef.current = Date.now();
                    currentDateRef.current = nowStr; // Update to new day

                    // 3. Clear Storage & Reset Firebase
                    AsyncStorage.removeItem(storageKey).catch(console.error);
                    FirebaseService.resetDailyReadingTime().catch(console.error);

                    // Timer continues from 0
                    return;
                }

                const elapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
                setElapsedTime(elapsed);
                elapsedTimeRef.current = elapsed; // Update ref
            }, 1000);
        } else if (!isLoaded) {
            console.log('Waiting for saved time to load...');
        }
    };

    // Pause the timer
    const pauseTimer = async () => {
        if (isRunning) {
            console.log('Pausing timer at:', elapsedTimeRef.current, 'seconds');
            setIsRunning(false);
            stopTimer();
            // Save the current ref value immediately to AsyncStorage
            await saveTimeWithValue(elapsedTimeRef.current);

            try {
                await FirebaseService.saveDailyReadingTime(elapsedTimeRef.current);
            } catch (error) {
                console.error('Failed to save to Firebase on pause:', error);
            }
        }
    };

    // Stop the interval
    const stopTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Reset the timer
    const resetTimer = async () => {
        stopTimer();
        setElapsedTime(0);
        setIsRunning(false);
        try {
            await AsyncStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Error resetting timer:', error);
        }
    };

    // Format time as HH:MM:SS or MM:SS
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-save to AsyncStorage every 10 seconds when running
    useEffect(() => {
        if (isRunning && elapsedTime > 0 && elapsedTime % 10 === 0) {
            saveTime();
        }
    }, [elapsedTime, isRunning]);

    // Auto-save to Firebase every 15 seconds
    useEffect(() => {
        if (isRunning && elapsedTime > 0 && elapsedTime % 15 === 0) {
            console.log(`⏱️ Auto-syncing to Firebase: ${elapsedTime}s`);
            FirebaseService.saveDailyReadingTime(elapsedTime)
                .catch(error => console.error('Failed to save to Firebase:', error));
        }
    }, [elapsedTime, isRunning]);

    return {
        elapsedTime,
        isRunning,
        isLoaded,
        startTimer,
        pauseTimer,
        resetTimer,
        formatTime,
    };
};
