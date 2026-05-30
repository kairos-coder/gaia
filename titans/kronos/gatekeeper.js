// ═══════════════════════════════════════════════
// kronos/gatekeeper.js
// Validates queries against Olympian domain.json patterns
// Ensures only valid operations reach the cognitive APIs
// ═══════════════════════════════════════════════

const Gatekeeper = {
  
  // Cache of loaded domain.json files
  domains: {},
  
  // ─── Initialize ──────────────────────────────────────────────────────────
  // Load an Olympian's domain.json for validation
  async loadDomain(olympian) {
    if (this.domains[olympian]) return this.domains[olympian];
    
    try {
      const resp = await fetch(`../${olympian}/domain.json`);
      if (!resp.ok) {
        console.warn(`[Kronos] No domain.json found for ${olympian}`);
        return null;
      }
      const domain = await resp.json();
      this.domains[olympian] = domain;
      console.log(`[Kronos] Domain loaded: ${olympian} — ${domain.query_patterns ? Object.keys(domain.query_patterns).length : 0} query patterns`);
      return domain;
    } catch (e) {
      console.warn(`[Kronos] Failed to load domain for ${olympian}: ${e.message}`);
      return null;
    }
  },
  
  // ─── Validate Query ──────────────────────────────────────────────────────
  // Check if a query matches the Olympian's declared query patterns
  validate(olympian, operation, params = {}) {
    const domain = this.domains[olympian];
    
    // No domain loaded — allow passthrough with warning
    if (!domain) {
      return {
        valid: false,
        reason: `No domain.json loaded for ${olympian}. Cannot validate.`,
        allow_passthrough: true
      };
    }
    
    // No query patterns declared — allow passthrough
    if (!domain.query_patterns || Object.keys(domain.query_patterns).length === 0) {
      return {
        valid: false,
        reason: `${olympian} has no declared query patterns.`,
        allow_passthrough: true
      };
    }
    
    // Check if operation exists in query patterns
    if (!domain.query_patterns[operation]) {
      return {
        valid: false,
        reason: `"${operation}" is not a valid query pattern for ${olympian}. Valid operations: ${Object.keys(domain.query_patterns).join(', ')}`,
        allow_passthrough: false
      };
    }
    
    // Check required params
    const pattern = domain.query_patterns[operation];
    const missingParams = (pattern.params || []).filter(p => !(p in params) || params[p] === undefined || params[p] === null || params[p] === '');
    
    if (missingParams.length > 0) {
      return {
        valid: false,
        reason: `Missing required parameters for "${operation}": ${missingParams.join(', ')}`,
        required: pattern.params,
        provided: Object.keys(params),
        allow_passthrough: false
      };
    }
    
    // Valid
    return {
      valid: true,
      olympian,
      operation,
      pattern,
      params
    };
  },
  
  // ─── Log Entry ───────────────────────────────────────────────────────────
  // Record a validated query to kronos/index.json (via localStorage accumulator)
  log(olympian, operation, params, responseSummary, metadata = {}) {
    const entry = {
      entry_id: `kronos_${String(this.ledger.length + 1).padStart(3, '0')}`,
      tick: this.ledger.length + 1,
      timestamp: new Date().toISOString(),
      olympian,
      operation,
      query_params: params,
      response_summary: responseSummary,
      fidelity: metadata.fidelity || null,
      from_domain: metadata.from_domain || null,
      to_domain: metadata.to_domain || null
    };
    
    this.ledger.push(entry);
    this._updateStats(entry);
    this._persist();
    
    console.log(`[Kronos] Entry ${entry.entry_id}: ${olympian}.${operation} — ${responseSummary}`);
    
    return entry;
  },
  
  // ─── Ledger Management ───────────────────────────────────────────────────
  ledger: [],
  stats: {
    total_entries: 0,
    by_olympian: {},
    by_operation: {},
    first_entry: null,
    last_entry: null
  },
  
  _updateStats(entry) {
    this.stats.total_entries = this.ledger.length;
    this.stats.by_olympian[entry.olympian] = (this.stats.by_olympian[entry.olympian] || 0) + 1;
    this.stats.by_operation[entry.operation] = (this.stats.by_operation[entry.operation] || 0) + 1;
    this.stats.last_entry = entry.timestamp;
    if (!this.stats.first_entry) this.stats.first_entry = entry.timestamp;
  },
  
  _persist() {
    try {
      localStorage.setItem('kronos_ledger', JSON.stringify(this.ledger));
      localStorage.setItem('kronos_stats', JSON.stringify(this.stats));
    } catch (e) {
      console.warn('[Kronos] localStorage full — ledger persists in memory only');
    }
  },
  
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('kronos_ledger');
      if (stored) {
        this.ledger = JSON.parse(stored);
        console.log(`[Kronos] Loaded ${this.ledger.length} entries from localStorage`);
      }
      const statsStored = localStorage.getItem('kronos_stats');
      if (statsStored) {
        this.stats = JSON.parse(statsStored);
      }
      // Recalculate stats to ensure accuracy
      this.stats.total_entries = this.ledger.length;
    } catch (e) {
      console.warn('[Kronos] Could not load from localStorage, starting fresh');
    }
  },
  
  // ─── Export ──────────────────────────────────────────────────────────────
  // Return the full ledger for syncing to index.json or Supabase
  exportLedger() {
    return {
      titan: 'kronos',
      title: 'The Accountant',
      domain: 'time_memory_ledger',
      version: '1.0',
      exported_at: new Date().toISOString(),
      ledger: this.ledger,
      stats: this.stats
    };
  }
};

// ─── Boot ───────────────────────────────────────────────────────────────────
Gatekeeper.loadFromStorage();
console.log(`[Kronos] Gatekeeper ready. ${Gatekeeper.ledger.length} entries in ledger.`);

// Export for use by Olympian APIs
if (typeof module !== 'undefined') module.exports = Gatekeeper;
window.Gatekeeper = Gatekeeper;
