/**
 * TS_player.js
 * window.TSPlayer — Browser TypeScript compiler shell
 * Ealdforn Studios · Nexus pillar
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/typescript@5.3.2/lib/typescript.min.js"></script>
 *   <script src="TS_player.js"></script>
 *   <script>TSPlayer.mount();</script>
 *
 * Theme (override in :root or pass as options.theme object):
 *   --ts-bg         page background
 *   --ts-surface    shell surface
 *   --ts-border     border color
 *   --ts-accent     primary accent (buttons, highlights)
 *   --ts-text       body text
 *   --ts-muted      secondary / dim text
 *   --ts-success    success state
 *   --ts-error      error state
 *   --ts-font-mono  monospace stack
 */

(function (global) {
  "use strict";

  // ─── CONSTANTS ─────────────────────────────────────────────────────────────

  const CORS_PROXY = "https://api.allorigins.win/raw?url=";
  const TS_CDN = "https://cdn.jsdelivr.net/npm/typescript@5.3.2/lib/typescript.min.js";

  const DEFAULT_THEME = {
    "--ts-bg":        "#0a0a0a",
    "--ts-surface":   "#111111",
    "--ts-border":    "#2a2a2a",
    "--ts-accent":    "#c9a84c",
    "--ts-text":      "#d8d8d8",
    "--ts-muted":     "#555555",
    "--ts-success":   "#5dba7d",
    "--ts-error":     "#cc5555",
    "--ts-font-mono": "'Courier New', 'Lucida Console', monospace",
  };

  // ─── CSS ───────────────────────────────────────────────────────────────────

  const STYLES = `
    :root {
      --ts-bg:        #0a0a0a;
      --ts-surface:   #111111;
      --ts-border:    #2a2a2a;
      --ts-accent:    #c9a84c;
      --ts-text:      #d8d8d8;
      --ts-muted:     #555555;
      --ts-success:   #5dba7d;
      --ts-error:     #cc5555;
      --ts-font-mono: 'Courier New', 'Lucida Console', monospace;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body.ts-player-active {
      background: var(--ts-bg);
      color: var(--ts-text);
      font-family: var(--ts-font-mono);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 2rem 1rem;
    }

    #ts-player-shell {
      width: 100%;
      max-width: 860px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* ── Header ── */
    #ts-player-shell .tsp-header {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      border-bottom: 1px solid var(--ts-border);
      padding-bottom: 0.75rem;
    }

    #ts-player-shell .tsp-wordmark {
      font-size: 0.7rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ts-accent);
    }

    #ts-player-shell .tsp-tagline {
      font-size: 0.7rem;
      color: var(--ts-muted);
      letter-spacing: 0.05em;
    }

    /* ── URL row ── */
    #ts-player-shell .tsp-url-row {
      display: flex;
      gap: 0.5rem;
    }

    #ts-player-shell .tsp-url-input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      background: transparent;
      border: 1px solid var(--ts-border);
      border-radius: 3px;
      color: var(--ts-text);
      font-family: var(--ts-font-mono);
      font-size: 0.78rem;
      transition: border-color 0.15s;
      outline: none;
    }

    #ts-player-shell .tsp-url-input:focus {
      border-color: var(--ts-accent);
    }

    #ts-player-shell .tsp-url-input::placeholder {
      color: var(--ts-muted);
    }

    /* ── Buttons ── */
    #ts-player-shell .tsp-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--ts-border);
      border-radius: 3px;
      font-family: var(--ts-font-mono);
      font-size: 0.78rem;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
      background: transparent;
      color: var(--ts-muted);
      letter-spacing: 0.05em;
    }

    #ts-player-shell .tsp-btn:hover {
      border-color: var(--ts-accent);
      color: var(--ts-accent);
    }

    #ts-player-shell .tsp-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    #ts-player-shell .tsp-btn-primary {
      border-color: var(--ts-accent);
      color: var(--ts-accent);
    }

    #ts-player-shell .tsp-btn-primary:hover {
      background: var(--ts-accent);
      color: var(--ts-bg);
    }

    #ts-player-shell .tsp-btn-primary:disabled {
      border-color: var(--ts-border);
      color: var(--ts-muted);
      background: transparent;
    }

    /* ── Action row ── */
    #ts-player-shell .tsp-action-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    /* ── Output panel ── */
    #ts-player-shell .tsp-output-wrap {
      position: relative;
      border: 1px solid var(--ts-border);
      border-radius: 3px;
      background: var(--ts-surface);
    }

    #ts-player-shell .tsp-output-label {
      font-size: 0.65rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--ts-muted);
      padding: 0.4rem 0.75rem;
      border-bottom: 1px solid var(--ts-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #ts-player-shell .tsp-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ts-muted);
      transition: background 0.2s;
    }

    #ts-player-shell .tsp-status-dot.running  { background: var(--ts-accent); }
    #ts-player-shell .tsp-status-dot.success  { background: var(--ts-success); }
    #ts-player-shell .tsp-status-dot.error    { background: var(--ts-error); }

    #ts-player-shell .tsp-output {
      padding: 1rem;
      min-height: 180px;
      font-size: 0.82rem;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--ts-text);
    }

    #ts-player-shell .tsp-output.ts-success { color: var(--ts-success); }
    #ts-player-shell .tsp-output.ts-error   { color: var(--ts-error); }

    /* ── Status bar ── */
    #ts-player-shell .tsp-statusbar {
      font-size: 0.68rem;
      color: var(--ts-muted);
      letter-spacing: 0.08em;
      height: 1rem;
    }

    /* ── History panel ── */
    #ts-player-shell .tsp-history-wrap {
      border: 1px solid var(--ts-border);
      border-radius: 3px;
    }

    #ts-player-shell .tsp-history-label {
      font-size: 0.65rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--ts-muted);
      padding: 0.4rem 0.75rem;
      border-bottom: 1px solid var(--ts-border);
    }

    #ts-player-shell .tsp-history-list {
      list-style: none;
      max-height: 120px;
      overflow-y: auto;
    }

    #ts-player-shell .tsp-history-list::-webkit-scrollbar {
      width: 4px;
    }
    #ts-player-shell .tsp-history-list::-webkit-scrollbar-thumb {
      background: var(--ts-border);
    }

    #ts-player-shell .tsp-history-item {
      padding: 0.35rem 0.75rem;
      font-size: 0.72rem;
      color: var(--ts-muted);
      cursor: pointer;
      border-bottom: 1px solid var(--ts-border);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.12s, background 0.12s;
    }

    #ts-player-shell .tsp-history-item:last-child {
      border-bottom: none;
    }

    #ts-player-shell .tsp-history-item:hover {
      color: var(--ts-accent);
      background: rgba(255,255,255,0.03);
    }

    #ts-player-shell .tsp-history-empty {
      padding: 0.5rem 0.75rem;
      font-size: 0.72rem;
      color: var(--ts-muted);
      font-style: italic;
    }

    /* ── Footer ── */
    #ts-player-shell .tsp-footer {
      font-size: 0.65rem;
      color: var(--ts-muted);
      text-align: center;
      letter-spacing: 0.1em;
      padding-top: 0.25rem;
    }

    @media (max-width: 480px) {
      body.ts-player-active { padding: 1rem 0.5rem; }
      #ts-player-shell .tsp-url-row { flex-direction: column; }
    }
  `;

  // ─── HTML TEMPLATE ─────────────────────────────────────────────────────────

  function buildShellHTML() {
    return `
      <div id="ts-player-shell">

        <div class="tsp-header">
          <span class="tsp-wordmark">⬡ TS_player</span>
          <span class="tsp-tagline">browser typescript shell · raw github urls</span>
        </div>

        <div class="tsp-url-row">
          <input
            id="tsp-url"
            class="tsp-url-input"
            type="text"
            placeholder="https://raw.githubusercontent.com/user/repo/main/file.ts"
            autocomplete="off"
            spellcheck="false"
          />
          <button id="tsp-run" class="tsp-btn tsp-btn-primary">▶ run</button>
        </div>

        <div class="tsp-action-row">
          <button id="tsp-clear" class="tsp-btn">clear</button>
          <button id="tsp-copy"  class="tsp-btn">copy output</button>
        </div>

        <div class="tsp-output-wrap">
          <div class="tsp-output-label">
            <span>output</span>
            <span id="tsp-dot" class="tsp-status-dot"></span>
          </div>
          <div id="tsp-output" class="tsp-output">Awaiting .ts file…</div>
        </div>

        <div class="tsp-statusbar" id="tsp-status"></div>

        <div class="tsp-history-wrap">
          <div class="tsp-history-label">run history</div>
          <ul id="tsp-history-list" class="tsp-history-list">
            <li class="tsp-history-empty">No runs yet.</li>
          </ul>
        </div>

        <div class="tsp-footer">ealdforn studios · nexus · $0 compute</div>

      </div>
    `;
  }

  // ─── CORE ENGINE ───────────────────────────────────────────────────────────

  function ensureTS() {
    return new Promise((resolve, reject) => {
      if (global.ts && typeof global.ts.transpile === "function") {
        resolve(global.ts);
        return;
      }
      const s = document.createElement("script");
      s.src = TS_CDN;
      s.onload = () => {
        if (global.ts) resolve(global.ts);
        else reject(new Error("TypeScript CDN loaded but ts not found on window."));
      };
      s.onerror = () => reject(new Error("Failed to load TypeScript compiler from CDN."));
      document.head.appendChild(s);
    });
  }

  async function fetchSource(url) {
    const proxied = CORS_PROXY + encodeURIComponent(url);
    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    return res.text();
  }

  async function compileAndRun(source) {
    await ensureTS();

    const js = global.ts.transpile(source, {
      target: global.ts.ScriptTarget.ES2020,
      module: global.ts.ModuleKind.None,
      strict: false,
    });

    const logs = [];
    const _log = console.log;
    console.log = (...args) => {
      logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "));
      _log(...args);
    };

    let returnValue;
    try {
      returnValue = new Function(`"use strict";\n${js}\nreturn typeof result !== 'undefined' ? result : undefined;`)();
    } finally {
      console.log = _log;
    }

    let out = "";
    if (logs.length) out += logs.join("\n");
    if (returnValue !== undefined) {
      out += (out ? "\n\n" : "") + "━━━ return value ━━━\n" + JSON.stringify(returnValue, null, 2);
    }
    if (!out.trim()) out = "✓ executed — no output";
    return out;
  }

  // ─── UI WIRING ─────────────────────────────────────────────────────────────

  function wireUI() {
    const urlInput    = document.getElementById("tsp-url");
    const runBtn      = document.getElementById("tsp-run");
    const clearBtn    = document.getElementById("tsp-clear");
    const copyBtn     = document.getElementById("tsp-copy");
    const outputEl    = document.getElementById("tsp-output");
    const statusEl    = document.getElementById("tsp-status");
    const dot         = document.getElementById("tsp-dot");
    const historyList = document.getElementById("tsp-history-list");

    const history = [];

    function setOutput(text, mode) {
      // mode: 'idle' | 'running' | 'success' | 'error'
      outputEl.textContent = text;
      outputEl.className = "tsp-output" + (mode === "success" ? " ts-success" : mode === "error" ? " ts-error" : "");
      dot.className = "tsp-status-dot" + (mode !== "idle" ? " " + mode : "");
    }

    function setStatus(msg) {
      statusEl.textContent = msg;
    }

    function pushHistory(url) {
      if (history.includes(url)) return;
      history.unshift(url);
      if (history.length > 12) history.pop();

      historyList.innerHTML = "";
      history.forEach((u) => {
        const li = document.createElement("li");
        li.className = "tsp-history-item";
        li.title = u;
        li.textContent = u.replace("https://raw.githubusercontent.com/", "gh:").replace("https://", "");
        li.addEventListener("click", () => {
          urlInput.value = u;
          urlInput.focus();
        });
        historyList.appendChild(li);
      });
    }

    async function run() {
      const url = urlInput.value.trim();
      if (!url) {
        setOutput("Enter a raw GitHub URL above and press ▶ run.", "idle");
        setStatus("");
        return;
      }

      runBtn.disabled = true;
      setOutput("fetching…", "running");
      setStatus("→ fetching " + url);

      try {
        const source = await fetchSource(url);
        setOutput("compiling…", "running");
        setStatus("→ compiling");
        const output = await compileAndRun(source);
        setOutput(output, "success");
        setStatus("✓ done · " + new Date().toLocaleTimeString());
        pushHistory(url);
      } catch (err) {
        setOutput("✗ " + err.message, "error");
        setStatus("✗ failed · " + new Date().toLocaleTimeString());
      } finally {
        runBtn.disabled = false;
      }
    }

    runBtn.addEventListener("click", run);

    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") run();
    });

    clearBtn.addEventListener("click", () => {
      setOutput("Awaiting .ts file…", "idle");
      setStatus("");
      urlInput.value = "";
      urlInput.focus();
    });

    copyBtn.addEventListener("click", () => {
      const text = outputEl.textContent;
      if (!text || text === "Awaiting .ts file…") return;
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = "copied ✓";
        setTimeout(() => (copyBtn.textContent = "copy output"), 1800);
      }).catch(() => {
        copyBtn.textContent = "copy failed";
        setTimeout(() => (copyBtn.textContent = "copy output"), 1800);
      });
    });
  }

  // ─── MOUNT ─────────────────────────────────────────────────────────────────

  function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v));
  }

  function injectStyles() {
    if (document.getElementById("ts-player-styles")) return;
    const style = document.createElement("style");
    style.id = "ts-player-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  /**
   * TSPlayer.mount(options?)
   *
   * options:
   *   theme  {object}  — CSS custom property overrides, e.g. { '--ts-accent': '#7c3aed' }
   *   url    {string}  — Pre-fill the URL input
   *   run    {boolean} — Auto-run the pre-filled URL on mount
   */
  function mount(options = {}) {
    injectStyles();
    applyTheme(options.theme);

    document.body.className = "ts-player-active";
    document.body.innerHTML = buildShellHTML();

    if (options.url) {
      document.getElementById("tsp-url").value = options.url;
    }

    wireUI();

    if (options.url && options.run) {
      document.getElementById("tsp-run").click();
    }
  }

  // ─── EXPORT ────────────────────────────────────────────────────────────────

  global.TSPlayer = {
    mount,
    /**
     * Utility: compile + run a TypeScript string without mounting the shell.
     * Returns a Promise<string> with the output.
     */
    run: compileAndRun,
    version: "1.0.0",
  };

})(window);
