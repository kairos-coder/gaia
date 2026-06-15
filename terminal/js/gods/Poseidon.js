// Poseidon.js - The Deep One
// Responsible for: Depth storage, submersion, deep queries

export const Poseidon = {
    
    // Submerge an entry (hide from standard queries, but still exists)
    async submerge(db, entryId) {
        const { error } = await db
            .from('terminal_entries')
            .update({ submerged: true, submerged_at: new Date().toISOString() })
            .eq('id', entryId);
        
        if (error) return { success: false, error: error.message };
        return { success: true, message: 'Entry submerged in the depths.' };
    },
    
    // Dive - retrieve submerged entries
    async dive(db, limit = 20) {
        const { data, error } = await db
            .from('terminal_entries')
            .select('*')
            .eq('submerged', true)
            .limit(limit);
        
        if (error) return [];
        return data || [];
    },
    
    // Deepen an entry - add depth and complexity
    deepen(body, targetWordCount) {
        let expanded = body;
        let currentWords = expanded.split(/\s+/).length;
        
        const depthPhrases = [
            ' beneath the surface, something stirs',
            ' in the abyss where light never reaches',
            ' carried by currents older than memory',
            ' where pressure shapes what dares to descend'
        ];
        
        while (currentWords < targetWordCount) {
            const phrase = depthPhrases[Math.floor(Math.random() * depthPhrases.length)];
            expanded += ' ' + phrase;
            currentWords = expanded.split(/\s+/).length;
        }
        
        return expanded;
    },
    
    // Check depth - measure how "deep" an entry is
    measureDepth(body) {
        const depthKeywords = ['beneath', 'below', 'deep', 'abyss', 'current', 'flow', 'pressure'];
        const wordCount = body.split(/\s+/).length;
        let depthScore = 0;
        
        for (const keyword of depthKeywords) {
            if (body.toLowerCase().includes(keyword)) depthScore += 10;
        }
        
        depthScore += Math.min(30, Math.floor(wordCount / 10));
        
        return Math.min(100, depthScore);
    }
};

export default Poseidon;
