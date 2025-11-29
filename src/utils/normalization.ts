export const normalizeText = (text: string | undefined): string => {
    if (!text) return "";
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

export const normalizeNumber = (text: string | undefined): string => {
    if (!text) return "";
    return text.replace(/\D/g, "");
};

export const normalizeCargo = (text: string | undefined): string => {
    if (!text) return "";
    // Common role normalizations can be added here
    return normalizeText(text);
};

export const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    // Try parsing DD/MM/YYYY
    const parts = dateStr.split("/");
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    // Try parsing YYYY-MM-DD
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
};
