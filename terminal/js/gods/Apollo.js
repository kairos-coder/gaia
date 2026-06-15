// Apollo.js - The Truth Seer
// Responsible for: Syntax validation, truth checking, resonance

export const Apollo = {
    
    // Validate syntax of an entry
    validate(entry) {
        const body = typeof entry === 'string' ? entry : entry.body;
        const checks = {
            hasCapitalLetter: /[A-Z]/.test(body),
            hasEndPunctuation: /[.!?]$/.test(body),
            hasVowels: /[aeiou]/i.test(body),
            hasConsonants: /[bcdfghjklmnpqrstvwxyz]/i.test(body),
            minLength: body.length >= 10,
            noNonsense: !/^[^a-zA-Z]+$/.test(body) // Not just symbols
        };
        
        const passed = Object.values(checks).every(v => v === true);
        const score = Object.values(checks).filter(v => v === true).length;
        
        const feedback = [];
        if (!checks.hasCapitalLetter) feedback.push("Begin with a capital letter.");
        if (!checks.hasEndPunctuation) feedback.push("End with a period, question mark, or exclamation.");
        if (!checks.minLength) feedback.push("At least 10 characters, please.");
        if (!checks.hasVowels) feedback.push("Use vowels to give your words voice.");
        if (!checks.hasConsonants) feedback.push("Use consonants to give your words structure.");
        
        return {
            passed: passed,
            score: Math.round((score / 6) * 100),
            feedback: feedback,
            entry: entry
        };
    },
    
    // Measure resonance with existing hoard (simplified)
    async measureResonance(body, getDb) {
        try {
            const db = getDb();
            const { data } = await db.from('terminal_entries').select('body').limit(10);
            if (!data || data.length === 0) return 0;
            
            // Simple word overlap measure
            const words = new Set(body.toLowerCase().split(/\s+/));
            let maxOverlap = 0;
            
            for (const entry of data) {
                const entryWords = new Set(entry.body.toLowerCase().split(/\s+/));
                let overlap = 0;
                for (const word of words) {
                    if (entryWords.has(word)) overlap++;
                }
                maxOverlap = Math.max(maxOverlap, overlap);
            }
            
            return Math.min(100, Math.round((maxOverlap / words.size) * 100));
        } catch (err) {
            return 0;
        }
    },
    
    // Check if entry is gibberish
    isCoherent(text) {
        const words = text.split(/\s+/);
        if (words.length < 2) return false;
        
        // Check for repeated nonsense patterns
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        if (uniqueWords.size === 1 && words.length > 3) return false;
        
        return true;
    }
};

export default Apollo;
