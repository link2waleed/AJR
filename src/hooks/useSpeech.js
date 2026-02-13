import * as Speech from 'expo-speech';

export const useSpeech = () => {
    const speak = (text, options = {}) => {
        const defaultOptions = {
            language: 'ar',
            pitch: 1.0,
            rate: 0.9,
        };

        Speech.speak(text, { ...defaultOptions, ...options });
    };

    return { speak };
};
