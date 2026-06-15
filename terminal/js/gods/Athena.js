// Athena.js - Wisdom judgment, the gatekeeper to Zeus

import { DIVINE_BANDS } from '../kernel/Config.js';

export const Athena = {
    // Minimum wisdom score needed to pass (can be adjusted)
    threshold: 65,
    
    // Calculate wisdom score (0-100)
    calculateWisdomScore(body) {
        let score = 0;
        let totalWeight = 0;
        
        // Structure checks (30% weight)
        if (/[A-Z]/.test(body)) { score += 15; totalWeight += 15; }
        if (/[.!?]$/.test(body)) { score += 15; totalWeight += 15; }
        
        // Substance checks (40% weight)
        const wordCount = body.split(/\s+/).length;
        if (wordCount >= 20) { score += 20; totalWeight += 20; }
        
        const uniqueWords = new Set(body.toLowerCase().split(/\s+/)).size;
        if (uniqueWords > 8) { score += 10; totalWeight += 10; }
        
        if (!/(\b\w+\b)(?: \1){2,}/.test(body)) { score += 10; totalWeight += 10; }
        
        // Depth checks (30% weight)
        if (/(because|therefore|however|although|meanwhile|consequently)/i.test(body)) { score += 15; totalWeight += 15; }
        if (/(like|as|seems|appears|feels|sounds|looks)/i.test(body)) { score += 15; totalWeight += 15; }
        
        // Bonus for extra depth (up to +10)
        let bonus = 0;
        if (/\?/.test(body)) bonus += 5;
        if (/["']/.test(body)) bonus += 5;
        if (/\d+/.test(body)) bonus += 5;
        if (/(and|or|but|so|for|nor|yet)/i.test(body)) bonus += 5;
        
        // Calculate final score (normalize to 100)
        let finalScore = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
        finalScore = Math.min(100, finalScore + bonus);
        
        return finalScore;
    },
    
    // Generate specific feedback for rejection
    generateFeedback(body) {
        const feedback = [];
        const wordCount = body.split(/\s+/).length;
        
        if (!/[A-Z]/.test(body)) {
            feedback.push("Begin with a capital letter.");
        }
        if (!/[.!?]$/.test(body)) {
            feedback.push("End with a period, question mark, or exclamation.");
        }
        if (wordCount < 20) {
            feedback.push(`At least 20 words (you have ${wordCount}). Show depth.`);
        }
        const uniqueWords = new Set(body.toLowerCase().split(/\s+/)).size;
        if (uniqueWords <= 8) {
            feedback.push(`Use more varied vocabulary (only ${uniqueWords} unique words).`);
        }
        if (/(\b\w+\b)(?: \1){2,}/.test(body)) {
            feedback.push("Don't repeat the same words. Wisdom is diverse.");
        }
        if (!/(because|therefore|however|although|meanwhile|consequently)/i.test(body)) {
            feedback.push("Use connecting words (because, therefore, however, although).");
        }
        if (!/(like|as|seems|appears|feels|sounds|looks)/i.test(body)) {
            feedback.push("Paint a picture. Use imagery (like, as, seems, appears).");
        }
        
        return feedback.slice(0, 4);
    },
    
    // Judge an entry
    judge(entry, options = {}) {
        const { isDream = false, customThreshold = null } = options;
        const body = entry.body || entry;
        const score = this.calculateWisdomScore(body);
        const threshold = customThreshold !== null ? customThreshold : (isDream ? 50 : this.threshold);
        const passed = score >= threshold;
        
        return {
            passed,
            score,
            threshold,
            feedback: passed ? [] : this.generateFeedback(body),
            entry: entry
        };
    },
    
    // Suggest refinement for rejected entries
    suggestRefinement(entry) {
        const body = entry.body || entry;
        let refined = body;
        const wordCount = body.split(/\s+/).length;
        
        // Add capital letter if missing
        if (!/[A-Z]/.test(refined)) {
            refined = refined.charAt(0).toUpperCase() + refined.slice(1);
        }
        
        // Add ending punctuation if missing
        if (!/[.!?]$/.test(refined)) {
            refined += '.';
        }
        
        // Add connecting words if missing
        if (!/(because|therefore|however|although)/i.test(refined)) {
            const connectors = [' because ', ' therefore ', ' however ', ' although '];
            const randomConnector = connectors[Math.floor(Math.random() * connectors.length)];
            refined += randomConnector + 'this matters to the hoard.';
        }
        
        // Add imagery if missing
        if (!/(like|as|seems|appears)/i.test(refined)) {
            const images = [' like a dream fading at dawn', ' as the tide turns', ' seems to whisper from deep memory'];
            const randomImage = images[Math.floor(Math.random() * images.length)];
            refined += randomImage;
        }
        
        return {
            original: body,
            refined: refined,
            wordCount: refined.split(/\s+/).length
        };
    },
    
    // Format judgment for display
    formatJudgment(judgment, bandInfo) {
        let output = `🦉 ${bandInfo.name} Gatekeeper:\n`;
        output += `   Score: ${judgment.score}% (need ${judgment.threshold}%)\n`;
        
        if (judgment.passed) {
            output += `   ✓ WISDOM RECOGNIZED. Proceed to ${this.getNextBand(bandInfo.name)}.\n`;
        } else {
            output += `   ❌ REJECTED. Wisdom insufficient.\n`;
            output += `   Athena demands:\n`;
            judgment.feedback.forEach(f => {
                output += `   - ${f}\n`;
            });
        }
        
        return output;
    },
    
    getNextBand(currentName) {
        const nextMap = {
            'Hermes': 'Apollo',
            'Apollo': 'Hephaestus',
            'Hephaestus': 'Demeter',
            'Demeter': 'Poseidon',
            'Poseidon': 'Athena',
            'Athena': 'Zeus',
            'Zeus': 'Complete'
        };
        return nextMap[currentName] || 'Unknown';
    }
};

export default Athena;
