/**
 * OnboardingValidator.js
 * Validation service for onboarding data
 * Ensures data integrity before saving to Firebase
 */

class OnboardingValidator {
    /**
     * Validate Quran goals
     */
    static validateQuranGoals(pagesPerDay, versesPerDay, minutesPerDay) {
        const validateField = (value, fieldName) => {
            if (!value && value !== '0') return null;
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 1 || num > 500) {
                throw new Error(`${fieldName} must be between 1 and 500`);
            }
            return num;
        };

        return {
            pagesPerDay: validateField(pagesPerDay, 'Pages Per Day'),
            versesPerDay: validateField(versesPerDay, 'Verses Per Day'),
            minutesPerDay: validateField(minutesPerDay, 'Minutes Per Day'),
        };
    }

    /**
     * Validate Dhikr goals
     * Ensures mutual exclusivity between predefined and custom dhikr
     */
    static validateDhikrGoals(counter, word) {
        // At least one must be provided
        if (!counter && !word) {
            throw new Error('Please provide either a counter goal or a custom dhikr');
        }

        // Validate counter if provided
        if (counter) {
            const num = parseInt(counter, 10);
            if (isNaN(num) || num < 1 || num > 1000) {
                throw new Error('Counter must be between 1 and 1000');
            }
        }

        // Validate word if provided
        if (word && word.trim()) {
            if (word.trim().length > 500) {
                throw new Error('Custom dhikr text cannot exceed 500 characters');
            }
        }

        return true;
    }

    /**
     * Validate selected activities
     */
    static validateSelectedActivities(activities) {
        if (!activities || typeof activities !== 'object') {
            throw new Error('Invalid activities object');
        }

        const validKeys = ['prayers', 'quran', 'dhikr', 'journaling'];
        for (const key of validKeys) {
            if (!activities.hasOwnProperty(key)) {
                throw new Error(`Missing activity: ${key}`);
            }
            if (activities[key] !== 'yes' && activities[key] !== 'no') {
                throw new Error(`Invalid value for ${key}: must be 'yes' or 'no'`);
            }
        }

        return true;
    }

    /**
     * Validate location data
     */
    static validateLocation(latitude, longitude, city) {
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            throw new Error('Invalid location coordinates');
        }

        if (latitude < -90 || latitude > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }

        if (longitude < -180 || longitude > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }

        if (!city || typeof city !== 'string') {
            throw new Error('City name is required');
        }

        return true;
    }

    /**
     * Validate prayer settings
     */
    static validatePrayerSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            throw new Error('Invalid prayer settings object');
        }

        const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        for (const key of prayerKeys) {
            if (settings.hasOwnProperty(key) && typeof settings[key] !== 'boolean') {
                throw new Error(`Invalid value for ${key}: must be boolean`);
            }
        }

        const validSoundModes = ['athan', 'beep', 'vibration', 'silent'];
        if (settings.soundMode && !validSoundModes.includes(settings.soundMode)) {
            throw new Error(`Invalid sound mode: ${settings.soundMode}`);
        }

        return true;
    }

    /**
     * Validate journal entry
     */
    static validateJournalEntry(title, description) {
        if (!title || typeof title !== 'string') {
            throw new Error('Journal title is required');
        }

        if (!description || typeof description !== 'string') {
            throw new Error('Journal description is required');
        }

        if (title.trim().length === 0) {
            throw new Error('Journal title cannot be empty');
        }

        if (description.trim().length === 0) {
            throw new Error('Journal description cannot be empty');
        }

        if (title.length > 200) {
            throw new Error('Journal title cannot exceed 200 characters');
        }

        if (description.length > 2000) {
            throw new Error('Journal description cannot exceed 2000 characters');
        }

        return true;
    }

    /**
     * Validate donation entry
     */
    static validateDonation(name, amount, date) {
        if (!name || typeof name !== 'string') {
            throw new Error('Donation name is required');
        }

        if (name.trim().length === 0) {
            throw new Error('Donation name cannot be empty');
        }

        if (!amount || isNaN(parseFloat(amount))) {
            throw new Error('Donation amount must be a valid number');
        }

        const amountNum = parseFloat(amount);
        if (amountNum <= 0) {
            throw new Error('Donation amount must be greater than 0');
        }

        if (!date || isNaN(new Date(date).getTime())) {
            throw new Error('Invalid donation date');
        }

        return true;
    }

    /**
     * Validate organization entry
     */
    static validateOrganization(name, link) {
        if (!name || typeof name !== 'string') {
            throw new Error('Organization name is required');
        }

        if (name.trim().length === 0) {
            throw new Error('Organization name cannot be empty');
        }

        if (!link || typeof link !== 'string') {
            throw new Error('Organization link is required');
        }

        // Simple URL validation
        try {
            new URL(link);
        } catch (error) {
            throw new Error('Invalid URL format');
        }

        return true;
    }
}

export default OnboardingValidator;
