import { useState } from 'react';

export const useTafsir = () => {
    const [tafsirModalVisible, setTafsirModalVisible] = useState(false);
    const [tafsirContent, setTafsirContent] = useState('');
    const [tafsirLoading, setTafsirLoading] = useState(false);
    const [currentTafsirAyah, setCurrentTafsirAyah] = useState(null);

    const fetchTafsir = async (surahNumber, ayahNumber) => {
        setTafsirModalVisible(true);
        setTafsirLoading(true);
        setCurrentTafsirAyah(ayahNumber);

        try {
            // Using Tafsir Ibn Kathir (ID 169)
            const response = await fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah/${surahNumber}:${ayahNumber}`);
            const data = await response.json();

            if (data && data.tafsir) {
                // Strip HTML tags for basic display
                let text = data.tafsir.text;
                text = text.replace(/<[^>]+>/g, '');
                setTafsirContent(text);
            } else {
                setTafsirContent("Tafsir not available for this Ayah.");
            }
        } catch (error) {
            console.error('Error fetching tafsir:', error);
            setTafsirContent("Failed to load Tafsir. Please try again.");
        } finally {
            setTafsirLoading(false);
        }
    };

    const closeTafsir = () => {
        setTafsirModalVisible(false);
    };

    return {
        tafsirModalVisible,
        tafsirContent,
        tafsirLoading,
        currentTafsirAyah,
        fetchTafsir,
        closeTafsir
    };
};
