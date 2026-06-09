// athena/js/watcher.js
export class AthenaWatcher {
    constructor({ sourceURL, onEvent }) {
        this.sourceURL = sourceURL;
        this.onEvent = onEvent; // callback to parser
        this.lastSeen = "";
    }

    async start() {
        console.log("🦉 Athena: Watching Apollo…");

        while (true) {
            try {
                const res = await fetch(this.sourceURL + "?t=" + Date.now());
                const text = await res.text();
                const lines = text.split("\n");

                for (const line of lines) {
                    if (line.trim() !== "" && line !== this.lastSeen) {
                        this.lastSeen = line;
                        this.onEvent(line);
                    }
                }
            } catch (err) {
                console.error("Athena watcher error:", err);
            }

            await new Promise(r => setTimeout(r, 500));
        }
    }
}
