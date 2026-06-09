// ══════════════════════════════════════════════
// APOLLO TOOLS — What Apollo Can Do
// 
// speak()     → voice (console, monaco, toast)
// remember()  → leave a note (localStorage)
// forget()    → remove a note
// schedule()  → delayed action (setTimeout)
// stagger()   → sequence of actions
// announce()  → change the tab title
// ══════════════════════════════════════════════

const ApolloTools = (() => {
  
  // ══ SPEAK — Voice through multiple channels ══
  
  function speak(apollo, message, channel = 'all') {
    const turn = apollo ? apollo.turn : '?';
    const timestamp = new Date().toISOString();
    const fullMessage = `[Apollo · Turn ${turn}] ${message}`;
    
    if (channel === 'all' || channel === 'console') {
      console.log(`☀️ ${fullMessage}`);
    }
    
    if ((channel === 'all' || channel === 'monaco') && apollo && apollo.onStatePersist) {
      apollo.onStatePersist(JSON.stringify({
        event: 'apollo_speaks',
        message: message,
        timestamp: timestamp,
        turn: turn
      }));
    }
    
    if (channel === 'all' || channel === 'toast') {
      if (typeof showToast === 'function') {
        showToast(`☀️ ${message}`);
      }
    }
    
    return fullMessage;
  }
  
  // ══ REMEMBER / FORGET — localStorage notes ══
  
  function remember(apollo, key, value) {
    const storeKey = `apollo_note_${key}`;
    const record = {
      value: value,
      turn: apollo ? apollo.turn : 0,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(storeKey, JSON.stringify(record));
    return record;
  }
  
  function forget(key) {
    localStorage.removeItem(`apollo_note_${key}`);
  }
  
  function clearNotes() {
    let count = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.startsWith('apollo_note_')) {
        localStorage.removeItem(key);
        count++;
      }
    }
    return count;
  }
  
  // ══ SCHEDULE — Delayed and staggered actions ══
  
  function schedule(apollo, fn, delayMs = 1000) {
    const scheduledAt = apollo ? apollo.turn : 0;
    const timerId = setTimeout(() => fn(apollo), delayMs);
    
    return {
      timerId,
      scheduledAt,
      delayMs,
      cancel: () => clearTimeout(timerId)
    };
  }
  
  function stagger(apollo, actions, delayMs = 500) {
    const timers = [];
    actions.forEach((fn, i) => {
      const timerId = setTimeout(() => fn(apollo), delayMs * (i + 1));
      timers.push(timerId);
    });
    
    return {
      timers,
      count: actions.length,
      cancel: () => timers.forEach(id => clearTimeout(id))
    };
  }
  
  // ══ ANNOUNCE — Change the tab title ══
  
  function announce(subtitle) {
    document.title = subtitle ? `☀️ Apollo · ${subtitle}` : '☀️ Apollo · The Living Tarot Table';
  }
  
  // ══ ATTACH ══
  
  function attach(apollo) {
    apollo.speak = (message, channel) => speak(apollo, message, channel);
    apollo.remember = (key, value) => remember(apollo, key, value);
    apollo.forget = (key) => forget(key);
    apollo.clearNotes = () => clearNotes();
    apollo.schedule = (fn, delayMs) => schedule(apollo, fn, delayMs);
    apollo.stagger = (actions, delayMs) => stagger(apollo, actions, delayMs);
    apollo.announce = (subtitle) => announce(subtitle);
    return apollo;
  }
  
  return {
    speak, remember, forget, clearNotes,
    schedule, stagger,
    announce,
    attach
  };
  
})();
