import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export const useAudioPlayer = () => {
    const [sound, setSound] = useState(null);
    const soundRef = useRef(null); // Ref to hold the current sound object
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSequentialMode, setIsSequentialMode] = useState(false);
    const isSequentialModeRef = useRef(false);
    const playlistRef = useRef([]);
    const currentIndexRef = useRef(0);
    const isLoadingRef = useRef(false);

    const playAudio = async (audioUrl, ayahNumber) => {
        try {
            // Prevent multiple simultaneous loads
            if (isLoadingRef.current) {
                console.log('Audio already loading, ignoring click');
                return;
            }

            // If same ayah is playing, pause it
            if (currentlyPlaying === ayahNumber && isPlaying) {
                if (soundRef.current) {
                    await soundRef.current.pauseAsync();
                }
                setIsPlaying(false);
                return;
            }

            // If same ayah is paused, resume it
            if (currentlyPlaying === ayahNumber && !isPlaying && soundRef.current) {
                await soundRef.current.playAsync();
                setIsPlaying(true);
                return;
            }

            // Set loading state
            isLoadingRef.current = true;
            setIsLoading(true);

            if (!audioUrl) {
                Alert.alert("Error", "Audio not available for this Ayah.");
                isLoadingRef.current = false;
                setIsLoading(false);
                return;
            }

            // If different ayah, stop current and play new (non-blocking unload)
            if (soundRef.current) {
                const previousSound = soundRef.current;
                soundRef.current = null;
                setSound(null);
                // Unload in background without blocking - don't await
                previousSound.unloadAsync().catch(err => console.log('Error unloading previous sound:', err));
            }

            // Set audio mode and load new sound in parallel for faster response
            const [audioModeResult, soundResult] = await Promise.all([
                Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: true,
                    shouldDuckAndroid: true,
                }),
                Audio.Sound.createAsync(
                    { uri: audioUrl },
                    { shouldPlay: true }
                )
            ]);

            const { sound: newSound } = soundResult;

            soundRef.current = newSound;
            setSound(newSound);
            setCurrentlyPlaying(ayahNumber);
            setIsPlaying(true);
            isLoadingRef.current = false;
            setIsLoading(false);

            // Handle playback completion
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    // If in sequential mode, play next ayah
                    if (isSequentialModeRef.current && playlistRef.current.length > 0) {
                        const currentIndex = currentIndexRef.current;
                        const nextIndex = currentIndex + 1;

                        if (nextIndex < playlistRef.current.length) {
                            // Don't set isPlaying to false - keep it true for continuous playback
                            currentIndexRef.current = nextIndex;
                            // Play next ayah immediately
                            playAudio(playlistRef.current[nextIndex].audio, playlistRef.current[nextIndex].numberInSurah);
                        } else {
                            // Playlist finished - now we can set isPlaying to false
                            setIsPlaying(false);
                            setCurrentlyPlaying(null);
                            setIsSequentialMode(false);
                            isSequentialModeRef.current = false;
                            playlistRef.current = [];
                            currentIndexRef.current = 0;
                        }
                    } else {
                        // Not in sequential mode - set isPlaying to false
                        setIsPlaying(false);
                        setCurrentlyPlaying(null);
                    }
                }
            });

        } catch (error) {
            console.error('Error playing audio:', error);
            isLoadingRef.current = false;
            setIsLoading(false);
            setIsPlaying(false);
            Alert.alert("Error", "Failed to play audio. Please try again.");
        }
    };

    const playSequential = async (ayahs, startIndex = 0) => {
        if (!ayahs || ayahs.length === 0) return;

        playlistRef.current = ayahs;
        currentIndexRef.current = startIndex;
        setIsSequentialMode(true);
        isSequentialModeRef.current = true;

        const firstAyah = ayahs[startIndex];
        await playAudio(firstAyah.audio, firstAyah.numberInSurah);
    };

    const pauseSequential = async () => {
        if (soundRef.current && isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
        }
    };

    const resumeSequential = async () => {
        if (soundRef.current && !isPlaying && isSequentialModeRef.current) {
            await soundRef.current.playAsync();
            setIsPlaying(true);
        }
    };

    const stopSequential = async () => {
        setIsSequentialMode(false);
        isSequentialModeRef.current = false;
        playlistRef.current = [];
        currentIndexRef.current = 0;

        if (soundRef.current) {
            try {
                // Unload instead of stop for complete reset
                const currentSound = soundRef.current; // access ref properly

                // Clear ref immediately to prevent race conditions
                soundRef.current = null;
                setSound(null);

                // Then unload the captured sound instance
                await currentSound.unloadAsync();
            } catch (error) {
                console.log('Error unloading sound:', error);
            }
        }
        setIsPlaying(false);
        setCurrentlyPlaying(null);
    };

    const cleanup = async () => {
        if (soundRef.current) {
            const currentSound = soundRef.current;
            soundRef.current = null;
            await currentSound.unloadAsync();
        }
    };

    return {
        playAudio,
        playSequential,
        pauseSequential,
        resumeSequential,
        stopSequential,
        currentlyPlaying,
        isPlaying,
        isLoading,
        isSequentialMode,
        cleanup
    };
};
