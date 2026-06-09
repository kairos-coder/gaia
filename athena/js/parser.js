// athena/js/parser.js
export class AthenaParser {
    constructor(memory) {
        this.memory = memory;
        this.stateBuffer = "";
        this.inStateBlock = false;
    }

    parse(line) {
        // 1. STATE BLOCK BEGIN
        if (line.includes("/*🜏STATE_BEGIN*/")) {
            this.inStateBlock = true;
            this.stateBuffer = "";
            return;
        }

        // 2. STATE BLOCK END
        if (line.includes("/*🜏STATE_END*/")) {
            this.inStateBlock = false;
            try {
                const parsed = JSON.parse(this.stateBuffer);
                this.memory.saveEvent({ type: "state", data: parsed });
            } catch (err) {
                console.error("Athena failed to parse state block:", err);
            }
            return;
        }

        // 3. INSIDE STATE BLOCK
        if (this.inStateBlock) {
            this.stateBuffer += line;
            return;
        }

        // 4. DRAW EVENT
        if (line.includes("Apollo draws")) {
            const draw = this.parseDraw(line);
            if (draw) this.memory.saveEvent(draw);
            return;
        }

        // 5. TICK EVENT
        if (line.includes("φ GOLDEN TICK")) {
            const tick = this.parseTick(line);
            if (tick) this.memory.saveEvent(tick);
            return;
        }
    }

    parseDraw(line) {
        // Example:
        // 🃏 Apollo draws: 🃏 The Moon — The Moon [water]

        const regex = /draws:\s+🃏\s+(.+?)\s+—\s+.+?\[(.+?)\]/;
        const match = line.match(regex);

        if (!match) return null;

        return {
            type: "draw",
            card: match[1].trim(),
            element: match[2].trim().toLowerCase(),
            timestamp: Date.now()
        };
    }

    parseTick(line) {
        // Example:
        // φ GOLDEN TICK #42: ☀️ APOLLO | Table: [empty]

        const regex = /GOLDEN TICK #(\d+)/;
        const match = line.match(regex);

        if (!match) return null;

        return {
            type: "tick",
            tick: parseInt(match[1], 10),
            timestamp: Date.now()
        };
    }
}
