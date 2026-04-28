export const filterJihad = (text) => {
    if (!text || typeof text !== 'string') return text;
    // Replace "jihad" (case insensitive) and "جهاد" with a dash "-"
    return text.replace(/jihad|جهاد/gi, '-');
};