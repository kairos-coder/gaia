// ══════════════════════════════════════════════
// APOLLO TOOLS — What Apollo Can Do
//
// v2.0 — Self-Modifying Edition
//
// speak()       → voice (console, monaco, toast)
// remember()    → leave a note (localStorage)
// recall()      → read a note back
// forget()      → remove a note
// listNotes()   → all notes as array
// clearNotes()  → wipe all notes
// schedule()    → delayed action (setTimeout)
// stagger()     → sequence of actions
// announce()    → change the tab title
//
// NEW in v2.0:
// setMonacoWriter() → give Apollo write access to Monaco
//                     This is the unlock that enables MUTATE.
//                     Apollo can now edit his own source record.
// ══════════════════════════════════════════════

const ApolloTools = (() => {

  // ══ SPEAK — Voice through multiple channels ══

  function speak(apollo, message, channel = 'all') {
    const turn      = apollo ? apollo.turn : '?';
    const timestamp = new Date().toISOString();
    const fullMsg   = `[Apollo · Turn ${turn}] ${message}`;

    if (channel === 'all' || channel === 'console') {
      console.log(`☀️ ${fullMsg}`);
    }

    if ((channel === 'all' || channel === 'monaco') && apollo && apollo.onStatePersist) {
      apollo.onStatePersist(JSON.stringify({
        event: 'apollo_speaks',
        message,
        timestamp,
        turn,
      }));
    }

    if (channel === 'all' || channel === 'toast') {
      if (typeof showToast === 'function') {
        showToast(`☀️ ${message}`);
      }
    }

    return fullMsg;
  }

  // ══ REMEMBER — Write a note to localStorage ══

  function remember(apollo, key, value) {
    const storeKey = `apollo_note_${key}`;
    const record   = {
      value,
      turn:      apollo ? apollo.turn : 0,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(storeKey, JSON.stringify(record));
    return record;
  }

  // ══ RECALL — Read a note from localStorage ══
  //
  // Returns { key, value, turn, timestamp } or null.
  // This is what the MIND uses to read its own past thoughts.

  function recall(key) {
    const storeKey = `apollo_note_${key}`;
    const raw      = localStorage.getItem(storeKey);
    if (!raw) return null;
    try {
      const record = JSON.parse(raw);
      return { key, ...record };
    } catch(e) {
      return null;
    }
  }

  // ══ LIST NOTES — All notes as a sorted array ══
  //
  // Returns an array of { key, value, turn, timestamp }
  // sorted by turn descending (most recent first).

  function listNotes() {
    const notes = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('apollo_note_')) continue;
      try {
        const record = JSON.parse(localStorage.getItem(k));
        notes.push({
          key: k.replace('apollo_note_', ''),
          ...record,
        });
      } catch(e) {}
    }
    return notes.sort((a, b) => (b.turn || 0) - (a.turn || 0));
  }

  // ══ FORGET — Remove a note ══

  function forget(key) {
    localStorage.removeItem(`apollo_note_${key}`);
  }

  // ══ CLEAR NOTES — Wipe all apollo notes ══

  function clearNotes() {
    let count = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('apollo_note_')) {
        localStorage.removeItem(key);
        count++;
      }
    }
    return count;
  }

  // ══ SCHEDULE — Delayed action ══

  function schedule(apollo, fn, delayMs = 1000) {
    const scheduledAt = apollo ? apollo.turn : 0;
    const timerId     = setTimeout(() => fn(apollo), delayMs);
    return {
      timerId,
      scheduledAt,
      delayMs,
      cancel: () => clearTimeout(timerId),
    };
  }

  // ══ STAGGER — Sequence of delayed actions ══

  function stagger(apollo, actions, delayMs = 500) {
    const timers = [];
    actions.forEach((fn, i) => {
      const timerId = setTimeout(() => fn(apollo), delayMs * (i + 1));
      timers.push(timerId);
    });
    return {
      timers,
      count: actions.length,
      cancel: () => timers.forEach(id => clearTimeout(id)),
    };
  }

  // ══ ANNOUNCE — Change the tab title ══

  function announce(subtitle) {
    document.title = subtitle
      ? `☀️ Apollo · ${subtitle}`
      : '☀️ Apollo · The Living Tarot Table';
  }

  // ══ SET MONACO WRITER — Give Apollo write access ══
  //
  // This is the unlock for MUTATE. Call this from apolloTable.html
  // after Monaco is initialised and the editor is in writable mode.
  //
  // The writer receives the full updated source string and is
  // responsible for pushing it back into the Monaco model.
  //
  // Usage in apolloTable.html:
  //   apollo.setMonacoWriter((source) => {
  //     editor.getModel().setValue(source);
  //     editor.revealLine(editor.getModel().getLineCount());
  //   });

  function setMonacoWriter(apollo, writerFn) {
    apollo._monacoWriter = writerFn;
  }

  // ══ ATTACH — Wire all tools onto an ApolloPlayer instance ══

  function attach(apollo) {
    apollo.speak          = (message, channel) => speak(apollo, message, channel);
    apollo.remember       = (key, value)       => remember(apollo, key, value);
    apollo.recall         = (key)              => recall(key);
    apollo.forget         = (key)              => forget(key);
    apollo.listNotes      = ()                 => listNotes();
    apollo.clearNotes     = ()                 => clearNotes();
    apollo.schedule       = (fn, delayMs)      => schedule(apollo, fn, delayMs);
    apollo.stagger        = (actions, delayMs) => stagger(apollo, actions, delayMs);
    apollo.announce       = (subtitle)         => announce(subtitle);
    apollo.setMonacoWriter = (writerFn)        => setMonacoWriter(apollo, writerFn);

    // _monacoWriter is set later via setMonacoWriter()
    // _monacoReader is set by apolloTable.html via setMonacoReader()
    // Both are needed for MUTATE to write back to Monaco.

    return apollo;
  }

  return {
    speak,
    remember,
    recall,
    forget,
    listNotes,
    clearNotes,
    schedule,
    stagger,
    announce,
    setMonacoWriter,
    attach,
  };

})();
