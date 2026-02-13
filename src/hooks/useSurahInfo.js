import { useState } from 'react';

export const useSurahInfo = () => {
    const [surahInfoModalVisible, setSurahInfoModalVisible] = useState(false);
    const [surahInfoContent, setSurahInfoContent] = useState(null);
    const [surahInfoLoading, setSurahInfoLoading] = useState(false);

    const fetchSurahInfo = async (surahNumber) => {
        setSurahInfoModalVisible(true);
        setSurahInfoLoading(true);

        try {
            // Fetch both chapter metadata and chapter info
            const [chapterRes, infoRes] = await Promise.all([
                fetch(`https://api.quran.com/api/v4/chapters/${surahNumber}`),
                fetch(`https://api.quran.com/api/v4/chapters/${surahNumber}/info`)
            ]);

            const chapterData = await chapterRes.json();
            const infoData = await infoRes.json();

            console.log('Chapter Data:', chapterData);
            console.log('Info Data:', infoData);

            if (chapterData && chapterData.chapter && infoData && infoData.chapter_info) {
                // Combine both data sources
                const cleanedInfo = {
                    ...infoData.chapter_info,
                    revelation_place: chapterData.chapter.revelation_place,
                    verses_count: chapterData.chapter.verses_count,
                    name_simple: chapterData.chapter.name_simple,
                    name_arabic: chapterData.chapter.name_arabic,
                    short_text: infoData.chapter_info.short_text ?
                        infoData.chapter_info.short_text
                            .replace(/<\/(h[1-6]|p|div)>/gi, '\n\n') // Add newlines after block elements
                            .replace(/<br\s*\/?>/gi, '\n') // Replace breaks with newlines
                            .replace(/<[^>]+>/g, '') // Strip remaining tags
                            .trim()
                        : '',
                    text: infoData.chapter_info.text ?
                        infoData.chapter_info.text
                            .replace(/<\/(h[1-6]|p|div)>/gi, '\n\n')
                            .replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<[^>]+>/g, '')
                            .trim()
                        : ''
                };
                console.log('Cleaned Surah Info:', cleanedInfo);
                setSurahInfoContent(cleanedInfo);
            } else {
                setSurahInfoContent(null);
            }
        } catch (error) {
            console.error('Error fetching surah info:', error);
            setSurahInfoContent(null);
        } finally {
            setSurahInfoLoading(false);
        }
    };

    const closeSurahInfo = () => {
        setSurahInfoModalVisible(false);
    };

    return {
        surahInfoModalVisible,
        surahInfoContent,
        surahInfoLoading,
        fetchSurahInfo,
        closeSurahInfo
    };
};
