export function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let prevCharWasQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
                prevCharWasQuote = true;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
            prevCharWasQuote = false;
        } else {
            current += char;
            prevCharWasQuote = false;
        }
    }

    result.push(current.trim());
    return result;
}
