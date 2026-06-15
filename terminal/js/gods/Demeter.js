// Demeter.js - The Grower
// Responsible for: Growth tracking, harvest, time-based accumulation

export const Demeter = {
    
    // Track growth of an entry over time
    trackGrowth(entry, previousVersions = []) {
        const currentWords = entry.body.split(/\s+/).length;
        const history = [...previousVersions, { 
            timestamp: new Date(), 
            wordCount: currentWords,
            body: entry.body 
        }];
        
        const growthRate = history.length > 1 
            ? (currentWords - history[0].wordCount) / history.length
            : 0;
        
        return {
            entry: entry,
            history: history,
            growthRate: growthRate,
            currentWordCount: currentWords
        };
    },
    
    // Harvest entries from a time period
    async harvestByTime(db, hours = 24) {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hours);
        
        const { data, error } = await db
            .from('terminal_entries')
            .select('*')
            .gte('created_at', cutoff.toISOString())
            .order('created_at', { ascending: false });
        
        if (error) return [];
        return data || [];
    },
    
    // Nurture - expand entry with gentle growth
    nurture(body, targetWordCount) {
        let expanded = body;
        let currentWords = expanded.split(/\s+/).length;
        
        const nurturingPhrases = [
            ' like seeds in spring soil',
            ' growing toward the light',
            ' as the harvest comes',
            ' nurtured by patient hands'
        ];
        
        while (currentWords < targetWordCount) {
            const phrase = nurturingPhrases[Math.floor(Math.random() * nurturingPhrases.length)];
            expanded += phrase;
            currentWords = expanded.split(/\s+/).length;
        }
        
        return expanded;
    },
    
    // Check if entry has "ripened" (ready for next band)
    isRipe(body, targetMinWords) {
        const wordCount = body.split(/\s+/).length;
        return wordCount >= targetMinWords;
    }
};

export default Demeter;
