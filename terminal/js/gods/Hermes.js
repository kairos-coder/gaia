// Hermes.js - The Messenger
// Responsible for: Framing, parsing, tweet detection, initial routing

export const Hermes = {
    
    // Frame raw input into structured concept
    frame(rawInput) {
        if (!rawInput || typeof rawInput !== 'string') {
            return { success: false, error: 'No input provided' };
        }
        
        const trimmed = rawInput.trim();
        const wordCount = trimmed.split(/\s+/).length;
        
        // Detect if tweet-worthy (≤280 chars)
        const isTweetWorthy = trimmed.length <= 280;
        
        return {
            success: true,
            original: trimmed,
            wordCount: wordCount,
            isTweetWorthy: isTweetWorthy,
            band: this.getBandByWordCount(wordCount)
        };
    },
    
    // Determine band based on word count
    getBandByWordCount(wordCount) {
        if (wordCount <= 10) return 'hermes';
        if (wordCount <= 25) return 'apollo';
        if (wordCount <= 50) return 'hephaestus';
        if (wordCount <= 100) return 'demeter';
        if (wordCount <= 150) return 'poseidon';
        if (wordCount <= 225) return 'athena';
        return 'zeus';
    },
    
    // Parse add command from user input
    parseAddCommand(input) {
        const match = input.match(/^add\s+([^:]+):\s*(.+)$/i);
        if (!match) return null;
        
        return {
            label: match[1].trim(),
            body: match[2].trim()
        };
    },
    
    // Format output for terminal display
    formatOutput(text, band, isDream = false, isThunder = false) {
        return {
            text: text,
            band: band,
            isDream: isDream,
            isThunder: isThunder
        };
    },
    
    // Detect if entry contains meaningful content
    hasSubstance(text) {
        const wordCount = text.split(/\s+/).length;
        const hasLetters = /[a-zA-Z]/.test(text);
        return wordCount >= 1 && hasLetters;
    },
    
    // Simple tweet-worthy suggestion
    suggestTweetFormat(label, body) {
        if (body.length <= 280) {
            return `${label}: ${body}`;
        }
        return null;
    }
};

export default Hermes;
