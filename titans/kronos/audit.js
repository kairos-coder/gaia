// ═══════════════════════════════════════════════════════════════
// kronos/audit.js — The Accountant's Ledger of Ledgers
// Kronos walks all Titan memory. Validates. Reports. Ascends.
// Every call to runAudit() is a tick of the master clock.
// ═══════════════════════════════════════════════════════════════

const KronosAudit = (() => {

  // ── CONFIG ──────────────────────────────────────────────────
  const SUPABASE_URL   = 'https://nbdvavzqvxrlxhsbrluz.supabase.co';
  const SUPABASE_ANON  = 'sb_publishable_6x1xlieXjs3dWqEETQcxnQ_4L1UO2uR';
  const SCHEMA_VERSION = 1;

  // All twelve Titans. Order is the order Kronos walks them.
  const TITANS = [
    'kronos', 'themis', 'mnemosyne', 'koios',
    'rhea',   'hyperion', 'oceanus', 'tethys',
    'theia',  'phoibe',   'iapetos', 'kreios'
  ];

  // What a healthy Titan memory record must contain
  const REQUIRED_KEYS = ['titan', 'memory_version', 'last_tick', 'total_events', 'events'];

  // ── INTERNAL AUDIT CLOCK ─────────────────────────────────────
  // Stored in localStorage separately from any Titan — Kronos's own ledger-of-ledgers
  function getAuditState() {
    const raw = localStorage.getItem('kronos_audit_state');
    return raw ? JSON.parse(raw) : { audit_count: 0, last_audit: null, last_ascension: null };
  }

  function saveAuditState(state) {
    localStorage.setItem('kronos_audit_state', JSON.stringify(state));
  }

  // ── VALIDATE ONE TITAN ───────────────────────────────────────
  function inspectTitan(titanId) {
    const key    = `${titanId}_memory`;
    const raw    = localStorage.getItem(key);
    const result = {
      titan_id:       titanId,
      key,
      status:         null,   // 'healthy' | 'corrupted' | 'missing' | 'empty'
      schema_version: null,
      entry_count:    0,
      last_tick:      0,
      flags:          [],
      snapshot:       null
    };

    // MISSING — key doesn't exist at all
    if (raw === null) {
      result.status = 'missing';
      result.flags.push('no_localStorage_key');
      return result;
    }

    // PARSE — try to deserialize
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      result.status = 'corrupted';
      result.flags.push('json_parse_failure');
      return result;
    }

    // REQUIRED KEYS check
    const missingKeys = REQUIRED_KEYS.filter(k => !(k in data));
    if (missingKeys.length > 0) {
      result.status = 'corrupted';
      result.flags.push(`missing_keys:${missingKeys.join(',')}`);
      return result;
    }

    // SCHEMA VERSION check
    result.schema_version = data.memory_version ?? null;
    if (data.memory_version !== SCHEMA_VERSION) {
      result.flags.push(`schema_mismatch:expected_${SCHEMA_VERSION}_got_${data.memory_version}`);
    }

    // COUNT INTEGRITY check — total_events should match events.length
    const actualCount = Array.isArray(data.events) ? data.events.length : 0;
    if (data.total_events !== actualCount) {
      result.flags.push(`count_drift:declared_${data.total_events}_actual_${actualCount}`);
    }

    // TICK INTEGRITY — last_tick should be >= total_events (can diverge if events were pruned)
    if (data.last_tick < actualCount && actualCount > 0) {
      result.flags.push(`tick_behind_count:tick_${data.last_tick}_count_${actualCount}`);
    }

    // EMPTY is healthy but notable
    result.entry_count    = actualCount;
    result.last_tick      = data.last_tick || 0;
    result.status         = result.flags.some(f =>
      f.startsWith('missing_keys') || f.startsWith('json_parse')
    ) ? 'corrupted' : (actualCount === 0 ? 'empty' : 'healthy');

    // Store the snapshot (capped at last 100 events for Supabase payload size)
    result.snapshot = {
      titan:          data.titan,
      memory_version: data.memory_version,
      last_tick:      data.last_tick,
      total_events:   data.total_events,
      events:         Array.isArray(data.events) ? data.events.slice(-100) : []
    };

    return result;
  }

  // ── PERSIST AUDIT REPORT TO SUPABASE ────────────────────────
  async function persistAuditLog(auditReport) {
    const rows = auditReport.titans.map(t => ({
      titan_id:       t.titan_id,
      schema_version: String(t.schema_version ?? 'null'),
      status:         t.status,
      entry_count:    t.entry_count,
      flags:          t.flags.length > 0 ? { flags: t.flags } : {}
    }));

    const res = await fetch(`${SUPABASE_URL}/rest/v1/gaia_audit_log`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Prefer':        'return=representation'
      },
      body: JSON.stringify(rows)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Audit log insert failed: ${res.status} — ${err}`);
    }

    return await res.json(); // returns inserted rows with their IDs
  }

  // ── PERSIST ASCENSION (healthy snapshots only) ────────────────
  async function persistAscensions(auditReport, auditLogRows) {
    const healthy = auditReport.titans.filter(t => t.status === 'healthy' && t.snapshot);
    if (healthy.length === 0) return [];

    // Match each healthy Titan to the audit_log row that was just inserted
    const ascensionRows = healthy.map(t => {
      const logRow = auditLogRows.find(r => r.titan_id === t.titan_id);
      return {
        titan_id:  t.titan_id,
        domain:    t.titan_id,           // domain === titan_id for now; can be enriched later
        snapshot:  t.snapshot,
        audit_id:  logRow?.id ?? null
      };
    });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/gaia_memory_ascensions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Prefer':        'return=representation'
      },
      body: JSON.stringify(ascensionRows)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ascension insert failed: ${res.status} — ${err}`);
    }

    return await res.json();
  }

  // ── MAIN ENTRY POINT ─────────────────────────────────────────
  async function runAudit({ persist = true, onProgress = null } = {}) {
    const startedAt  = new Date().toISOString();
    const auditState = getAuditState();
    auditState.audit_count++;

    if (onProgress) onProgress({ phase: 'walking', message: 'Kronos begins the walk.' });

    // Walk all Titans
    const titanResults = TITANS.map(id => {
      const result = inspectTitan(id);
      if (onProgress) onProgress({ phase: 'inspected', titan: id, status: result.status });
      return result;
    });

    // Summary
    const summary = {
      total:     titanResults.length,
      healthy:   titanResults.filter(t => t.status === 'healthy').length,
      empty:     titanResults.filter(t => t.status === 'empty').length,
      missing:   titanResults.filter(t => t.status === 'missing').length,
      corrupted: titanResults.filter(t => t.status === 'corrupted').length,
      flagged:   titanResults.filter(t => t.flags.length > 0).length
    };

    const auditReport = {
      audit_number: auditState.audit_count,
      started_at:   startedAt,
      completed_at: null,
      summary,
      titans:       titanResults,
      persisted:    false,
      ascensions:   0,
      error:        null
    };

    // Persist to Supabase if requested
    if (persist) {
      if (onProgress) onProgress({ phase: 'ascending', message: 'Kronos opens the gate to Gaia.' });

      try {
        const logRows        = await persistAuditLog(auditReport);
        const ascensionRows  = await persistAscensions(auditReport, logRows);
        auditReport.persisted    = true;
        auditReport.ascensions   = ascensionRows.length;
        auditState.last_ascension = new Date().toISOString();

        if (onProgress) onProgress({
          phase:   'complete',
          message: `Audit persisted. ${ascensionRows.length} Titan(s) ascended to GaiaDB.`
        });

      } catch (err) {
        auditReport.error = err.message;
        if (onProgress) onProgress({ phase: 'error', message: err.message });
      }
    }

    auditReport.completed_at = new Date().toISOString();
    auditState.last_audit    = auditReport.completed_at;

    // Save audit state back to localStorage
    saveAuditState(auditState);

    // Also write a lightweight summary into kronos_memory so council.html can see it
    _writeAuditSummaryToKronos(auditReport);

    return auditReport;
  }

  // ── WRITE AUDIT SUMMARY INTO KRONOS LEDGER ───────────────────
  // Keeps the audit visible inside the existing memory viewer
  function _writeAuditSummaryToKronos(report) {
    const key    = 'kronos_memory';
    const stored = JSON.parse(localStorage.getItem(key) || '{"titan":"kronos","memory_version":1,"last_tick":0,"total_events":0,"events":[]}');
    stored.last_tick++;
    const entry = {
      tick:      stored.last_tick,
      type:      'audit',
      olympian:  'kronos',
      operation: 'system_audit',
      timestamp: report.completed_at,
      summary: {
        audit_number: report.audit_number,
        healthy:      report.summary.healthy,
        empty:        report.summary.empty,
        missing:      report.summary.missing,
        corrupted:    report.summary.corrupted,
        ascensions:   report.ascensions,
        persisted:    report.persisted,
        error:        report.error
      }
    };
    stored.events.push(entry);
    stored.total_events = stored.events.length;
    if (stored.events.length > 2000) stored.events = stored.events.slice(-2000);
    localStorage.setItem(key, JSON.stringify(stored));
  }

  // ── FETCH LAST N AUDIT LOGS FROM SUPABASE ────────────────────
  async function fetchAuditHistory(limit = 20) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/gaia_audit_log?order=created_at.desc&limit=${limit}`,
      {
        headers: {
          'apikey':        SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`
        }
      }
    );
    if (!res.ok) throw new Error(`fetchAuditHistory failed: ${res.status}`);
    return await res.json();
  }

  // ── FETCH LAST ASCENSION FOR A TITAN ─────────────────────────
  async function fetchLastAscension(titanId) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/gaia_memory_ascensions?titan_id=eq.${titanId}&order=ascended_at.desc&limit=1`,
      {
        headers: {
          'apikey':        SUPABASE_ANON,
          'Authorization': `Bearer ${SUPABASE_ANON}`
        }
      }
    );
    if (!res.ok) throw new Error(`fetchLastAscension failed: ${res.status}`);
    const rows = await res.json();
    return rows[0] ?? null;
  }

  // ── RESTORE TITAN FROM LAST ASCENSION ────────────────────────
  // Call this on page load if a Titan's localStorage is missing
  async function restoreTitan(titanId) {
    const ascension = await fetchLastAscension(titanId);
    if (!ascension) return { restored: false, reason: 'no_ascension_found' };

    const key = `${titanId}_memory`;
    localStorage.setItem(key, JSON.stringify(ascension.snapshot));
    return { restored: true, ascended_at: ascension.ascended_at, entry_count: ascension.snapshot?.total_events };
  }

  // ── PUBLIC API ───────────────────────────────────────────────
  return {
    runAudit,
    fetchAuditHistory,
    fetchLastAscension,
    restoreTitan,
    getAuditState,
    TITANS,
    SCHEMA_VERSION
  };

})();

// Export for Node/module environments (optional; GAIA runs browser-native)
if (typeof module !== 'undefined') module.exports = KronosAudit;
