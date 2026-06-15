// Hephaestus.js - The Forger
// Responsible for: Word combination, expansion, structure forging

import { FALLBACK_WORDS, shuffleArray } from '../kernel/Config.js';

export const Hephaestus = {
    
    // Forge new entry from source material
    async forge(source, targetBand, targetWords, getRandomWords) {
        let body = source;
        let currentWords = body.split(/\s+/).length;
        const targetMin = targetWords[0];
        
        while (currentWords < targetMin) {
            const newWords = await getRandomWords(2);
            if (newWords && newWords.length) {
                body += ' · ' + newWords.join(' · ');
            } else {
                const fallback = shuffleArray([...FALLBACK_WORDS]);
                body += ' · ' + fallback[0];
            }
            currentWords = body.split(/\s+/).length;
        }
        
        return {
            success: true,
            body: body,
            wordCount: currentWords,
            forgedFrom: source
        };
    },
    
    // Combine two entries into one
    combine(entry1, entry2, ratio = 0.5) {
        const words1 = entry1.body.split(/\s+/);
        const words2 = entry2.body.split(/\s+/);
        
        const split1 = Math.floor(words1.length * ratio);
        const split2 = Math.floor(words2.length * (1 - ratio));
        
        const combined = [
            ...words1.slice(0, split1),
            ...words2.slice(0, split2),
            ...words1.slice(split1),
            ...words2.slice(split2)
        ];
        
        return {
            body: combined.join(' '),
            wordCount: combined.length,
            source1: entry1.label,
            source2: entry2.label
        };
    },
    
    // Structure validation - ensure entry has form
    hasStructure(body) {
        const wordCount = body.split(/\s+/).length;
        const hasSentence = /[A-Z][^.!?]*[.!?]/.test(body);
        return wordCount >= 5 && hasSentence;
    }
};

export default Hephaestus;
