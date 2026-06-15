// main.js - Entry point for Kairos Terminal Modular

import { initDatabase, getEntryCount, getRecentEntries, getRandomEntry, insertEntry } from './kernel/Database.js';
import { DIVINE_BANDS, BAND_ORDER, PHI, PI, AWAKE_PULSES_TO_DREAM } from './kernel/Config.js';
import { Athena } from './gods/Athena.js';
import { startEvolution, pauseEvolution, resumeEvolution, getEvolutionState } from './phases/EvolutionChain.js';

// ============================================================
// UI Helpers
// ============================================================

function printLine(text, band = null, isDream = false, isThunder = false, isRejected = false) {
    const output = document.getElementById('output');
    const line = document.createElement('div');
    line.textContent = text;
    
    if (band && DIVINE_BANDS[band]) {
        line.classList.add(`band-${band}`);
    }
    if (isDream) line.classList.add('dream');
    if (isThunder) line.classList.add('thunder');
    if (isRejected) line.classList.add('rejected');
    
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function updateSpectrumDot(bandIndex) {
    const dots = document.querySelectorAll('.spectrum-dot');
    dots.forEach((dot, i) => {
        if (i <= bandIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function resetSpectrumDots() {
    const dots = document.querySelectorAll('.spectrum-dot');
    dots.forEach(dot => dot.classList.remove('active'));
}

// ============================================================
// State Management
// ============================================================

let commandHistory = [];
let historyIndex = -1;
let awakePulseCount = 0;
let isDreaming = false;
let pulseInterval = null;

// ============================================================
// Evolution UI Callbacks
// ============================================================

function onEvolutionStep(step) {
    const bandInfo = DIVINE_BANDS[step.band];
    const bandIndex = BAND_ORDER.indexOf(step.band);
    
    // Update spectrum dots
    updateSpectrumDot(bandIndex);
    
    // Display the step
    const preview = step.entry.substring(0, 70) + (step.entry.length > 70 ? '...' : '');
    
    if (step.status === 'rejected') {
        printLine(`🦉 ${bandInfo.name} Gatekeeper:`, step.band, false, false, true);
        printLine(`   Score: ${step.score}% (need ${Athena.threshold}%)`, step.band, false, false, true);
        printLine(`   ❌ REJECTED. Retrying with refinement...`, step.band, false, false, true);
        if (step.feedback && step.feedback.length) {
            step.feedback.slice(0, 2).forEach(f => {
                printLine(`   - ${f}`, step.band, false, false, true);
            });
        }
    } else if (step.status === 'passed') {
        printLine(`🦉 ${bandInfo.name} Gatekeeper: ✓ ACCEPTED (Score: ${step.score}%)`, step.band, false, false);
        printLine(`   "Wisdom recognized. Proceed to ${step.band === 'athena' ? 'Zeus' : 'next band'}."`, step.band);
    } else {
        const timeSec = (step.time / 1000).toFixed(2);
        printLine(`🌱 ${bandInfo.icon} ${bandInfo.name} (${bandInfo.index}φ = ${timeSec}s): "${preview}"`, step.band, false);
    }
}

function onEvolutionComplete(complete) {
    const zeusEntry = complete.zeusEntry;
    const preview = zeusEntry.substring(0, 100) + (zeusEntry.length > 100 ? '...' : '');
    
    printLine(``);
    printLine(`⚡ ZEUS THUNDERS — Evolution complete!`, 'zeus', false, true);
    printLine(`   "${preview}"`, 'zeus', false, true);
    printLine(`💫 New evolution chain begins in 5 seconds...`, null);
    
    // Reset spectrum dots
    resetSpectrumDots();
}

// ============================================================
// Awake Pulse Counter
// ============================================================

function updateCounter() {
    const counterEl = document.getElementById('counter');
    if (counterEl) {
        counterEl.textContent = `${awakePulseCount}/${AWAKE_PULSES_TO_DREAM}`;
    }
}

function startAwakePulses() {
    if (pulseInterval) clearInterval(pulseInterval);
    pulseInterval = setInterval(() => {
        if (!isDreaming) {
            awakePulseCount++;
            updateCounter();
            
            // Visual pulse feedback
            const pulseBeat = document.getElementById('pulseBeat');
            if (pulseBeat) {
                pulseBeat.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    if (pulseBeat) pulseBeat.style.transform = 'scale(1)';
                }, 100);
            }
            
            // Check if we should start dreaming
            if (awakePulseCount >= AWAKE_PULSES_TO_DREAM) {
                startDreaming();
            }
        }
    }, PHI);
}

// ============================================================
// Dream State (Placeholder - to be expanded)
// ============================================================

async function startDreaming() {
    isDreaming = true;
    pauseEvolution();
    
    document.getElementById('terminalContainer').classList.add('dreaming');
    document.getElementById('pulseBeat').classList.add('dream');
    document.getElementById('rhythmLabel').innerHTML = 'π = 3.14s';
    document.getElementById('stateLabel').innerHTML = 'DREAMING';
    
    printLine('✨ The terminal falls asleep... Dreams begin.', null, true);
    
    // Placeholder - dream logic will go here
    // For now, just wake up after a few seconds
    setTimeout(() => {
        endDreaming();
    }, 8000);
}

async function endDreaming() {
    isDreaming = false;
    awakePulseCount = 0;
    updateCounter();
    
    document.getElementById('terminalContainer').classList.remove('dreaming');
    document.getElementById('pulseBeat').classList.remove('dream');
    document.getElementById('rhythmLabel').innerHTML = 'φ = 1.618s';
    document.getElementById('stateLabel').innerHTML = 'AWAKE';
    
    printLine('💫 The dream fades. The terminal wakes.', null, true);
    
    resumeEvolution();
}

// ============================================================
// Command Handlers
// ============================================================

const commands = {
    help: () => {
        return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  KAIROS TERMINAL — MODULAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌱 EVOLUTION:
  Evolution runs continuously: Hermes → Apollo → Hephaestus → Demeter → Poseidon → Athena → Zeus
  Each band takes BAND_INDEX × φ seconds
  Athena judges wisdom at 65% threshold

📝 COMMANDS:
  help                    - Show this message
  clear                   - Clear terminal output
  stats                   - Show database statistics
  test-athena <text>      - Test Athena's judgment on text
  list                    - Show recent entries
  random                  - Get random entry
  add <label>: <body>     - Add a new entry
  evolution status        - Show current evolution state

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💫 Evolution brings order. Dreams bring chaos. Athena brings wisdom.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    },
    
    clear: () => {
        document.getElementById('output').innerHTML = '';
        return null;
    },
    
    stats: async () => {
        const count = await getEntryCount();
        const state = getEvolutionState();
        return `📊 Database Statistics\n\nTerminal Entries: ${count}\nAthena Threshold: ${Athena.threshold}%\nAwake Pulse: ${awakePulseCount}/${AWAKE_PULSES_TO_DREAM}\nState: ${isDreaming ? 'DREAMING' : 'AWAKE'}\nEvolution: ${state.isActive ? 'ACTIVE' : 'PAUSED'}\nCurrent Band: ${state.currentBand?.toUpperCase() || 'NONE'}`;
    },
    
    'evolution': async (args) => {
        if (args[0] === 'status') {
            const state = getEvolutionState();
            return `🌱 Evolution Status\n\nCurrent Band: ${state.currentBand?.toUpperCase() || 'NONE'}\nActive: ${state.isActive ? 'YES' : 'NO'}\nChain: ${Object.keys(state.currentChain).filter(b => state.currentChain[b]).join(' → ')}`;
        }
        return 'Usage: evolution status';
    },
    
    'test-athena': async (args) => {
        const text = args.join(' ');
        if (!text) return 'Usage: test-athena <text to judge>';
        
        const judgment = Athena.judge({ body: text });
        
        let output = `🦉 Athena Gatekeeper:\n`;
        output += `   Score: ${judgment.score}% (need ${judgment.threshold}%)\n`;
        
        if (judgment.passed) {
            output += `   ✓ WISDOM RECOGNIZED.\n`;
        } else {
            output += `   ❌ REJECTED. Wisdom insufficient.\n`;
            output += `   Athena demands:\n`;
            judgment.feedback.forEach(f => {
                output += `   - ${f}\n`;
            });
            
            // Show refinement suggestion
            const refined = Athena.suggestRefinement({ body: text });
            output += `\n   Suggested refinement:\n   "${refined.refined.substring(0, 100)}..."`;
        }
        
        return output;
    },
    
    list: async () => {
        const entries = await getRecentEntries(10);
        if (!entries || entries.length === 0) return 'No entries found.';
        
        let output = `📋 Recent Entries:\n\n`;
        for (const entry of entries) {
            const band = entry.divine_band || 'hermes';
            const bandInfo = DIVINE_BANDS[band];
            const preview = entry.body.substring(0, 60) + (entry.body.length > 60 ? '...' : '');
            output += `${bandInfo.icon} ${entry.label} [${bandInfo.freqValue}Hz]\n   ${preview}\n\n`;
        }
        return output;
    },
    
    random: async () => {
        const entry = await getRandomEntry();
        if (!entry) return 'No entries found.';
        const band = entry.divine_band || 'hermes';
        const bandInfo = DIVINE_BANDS[band];
        return `${bandInfo.icon} Random Entry [${bandInfo.freqValue}Hz]:\nLabel: ${entry.label}\nBody: ${entry.body}\nWords: ${entry.word_count}`;
    },
    
    add: async (args, fullInput) => {
        const match = fullInput.match(/^add\s+([^:]+):\s*(.+)$/i);
        if (!match) return 'Usage: add <label>: <body>';
        
        const label = match[1].trim();
        const body = match[2].trim();
        const wordCount = body.split(/\s+/).length;
        
        // Determine band by word count
        let band = 'hermes';
        if (wordCount <= 10) band = 'hermes';
        else if (wordCount <= 25) band = 'apollo';
        else if (wordCount <= 50) band = 'hephaestus';
        else if (wordCount <= 100) band = 'demeter';
        else if (wordCount <= 150) band = 'poseidon';
        else if (wordCount <= 225) band = 'athena';
        else band = 'zeus';
        
        const bandInfo = DIVINE_BANDS[band];
        
        // If target is Athena or Zeus, must pass judgment
        if (band === 'athena' || band === 'zeus') {
            const judgment = Athena.judge({ body });
            if (!judgment.passed) {
                let msg = `🦉 Athena rejects entry for ${bandInfo.name} band.\n`;
                msg += `   Score: ${judgment.score}% (need ${judgment.threshold}%)\n`;
                msg += `   Demands:\n`;
                judgment.feedback.forEach(f => msg += `   - ${f}\n`);
                return msg;
            }
        }
        
        await insertEntry({
            label, body, word_count: wordCount,
            divine_band: band, frequency_hz: bandInfo.freqValue,
            light_wavelength: bandInfo.light.toLowerCase().replace(' ', '_'),
            divine_color: bandInfo.color, divine_icon: bandInfo.icon
        });
        
        return `✓ "${label}" claimed by ${bandInfo.icon} ${bandInfo.name} [${bandInfo.freqValue}Hz] — ${wordCount} words`;
    }
};

// ============================================================
// Command Processor
// ============================================================

async function processCommand(input) {
    if (!input.trim()) return;
    
    // Reset awake counter on user input
    awakePulseCount = 0;
    updateCounter();
    
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (cmd === 'test-athena') {
        const result = await commands['test-athena'](args);
        if (result) printLine(result);
        return;
    }
    
    if (cmd === 'add') {
        const result = await commands.add(args, input);
        if (result) printLine(result);
        return;
    }
    
    if (cmd === 'evolution') {
        const result = await commands.evolution(args);
        if (result) printLine(result);
        return;
    }
    
    if (commands[cmd]) {
        const result = await commands[cmd](args);
        if (result) printLine(result);
    } else {
        printLine(`Unknown command: ${cmd}. Type 'help' for available commands.`);
    }
}

// ============================================================
// Initialization
// ============================================================

window.addEventListener('DOMContentLoaded', async () => {
    const input = document.getElementById('command');
    
    try {
        await initDatabase();
        printLine('✓ Connected to Supabase');
        printLine('✓ All gods loaded');
        printLine('✓ Evolution chain ready');
        printLine('');
        printLine('🌱 Evolution begins: Hermes → Apollo → Hephaestus → Demeter → Poseidon → Athena → Zeus');
        printLine('');
    } catch (err) {
        printLine(`ERROR: ${err.message}`);
    }
    
    // Start evolution with callbacks
    startEvolution(onEvolutionStep, onEvolutionComplete);
    
    // Start awake pulses
    startAwakePulses();
    
    // Input handler
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = input.value;
            if (val.trim()) {
                printLine(`> ${val}`);
                processCommand(val);
                commandHistory.push(val);
                historyIndex = commandHistory.length;
            }
            input.value = '';
        }
        
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                input.value = commandHistory[historyIndex];
            }
        }
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                input.value = commandHistory[historyIndex];
            } else if (historyIndex === commandHistory.length - 1) {
                historyIndex++;
                input.value = '';
            }
        }
    });
    
    input.focus();
});
