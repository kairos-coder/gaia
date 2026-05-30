// hermes/translator.js — Cross-domain message translation and memory routing
// Hermes reads domain.json files, translates vocabulary, and routes output to Titan memory

const HermesTranslator = {
  
  // Cache of loaded domain.json files
  domains: {},
  
  // Cache of Titan ingestion endpoints
  titanEndpoints: {},
  
  // ─── Load Domain ──────────────────────────────────────────────────────
  loadDomain: async function(olympian) {
    if (this.domains[olympian]) return this.domains[olympian];
    try {
      const resp = await fetch(`../${olympian}/domain.json`);
      if (resp.ok) {
        this.domains[olympian] = await resp.json();
        return this.domains[olympian];
      }
    } catch(e) { /* domain file may not exist yet */ }
    return null;
  },
  
  // ─── Translate ────────────────────────────────────────────────────────
  // Convert output from one Olympian's vocabulary to another's
  translate: function(message, fromDomain, toDomain) {
    if (!fromDomain?.translations?.[toDomain]) {
      return { translated: message, fidelity: 0.7, note: 'No translation map — passthrough' };
    }
    
    const map = fromDomain.translations[toDomain];
    const translated = {};
    let translatedFields = 0;
    let totalFields = 0;
    
    for (const [key, value] of Object.entries(message)) {
      totalFields++;
      if (map[key]) {
        translated[map[key]] = value;
        translatedFields++;
      } else {
        translated[key] = value; // Passthrough
      }
    }
    
    return {
      translated,
      fidelity: totalFields > 0 ? translatedFields / totalFields : 1.0,
      from: fromDomain.olympian,
      to: toDomain
    };
  },
  
  // ─── Route to Titan Memory ────────────────────────────────────────────
  // The critical function: deliver Olympian output to the correct Titans
  route: async function(olympianId, operation, output) {
    const domain = this.domains[olympianId];
    if (!domain?.titan_memory_queries?.[operation]) {
      return { error: `No Titan routing defined for ${olympianId}.${operation}` };
    }
    
    const routes = domain.titan_memory_queries[operation];
    const deliveries = [];
    
    for (const route of routes) {
      // Translate output to Titan's domain vocabulary
      const titanDomain = await this.loadDomain(`../titans/${route.titan}`);
      const translated = titanDomain 
        ? this.translate(output, domain, { olympian: route.titan, translations: this._reverseMap(titanDomain) })
        : { translated: output, fidelity: 1.0 };
      
      // Build the memory event
      const event = {
        type: route.type,
        olympian: olympianId,
        operation,
        timestamp: new Date().toISOString(),
        ...translated.translated
      };
      
      // Deliver to Titan's ingestion endpoint
      const delivery = await this._deliverToTitan(route.titan, event);
      deliveries.push({
        titan: route.titan,
        type: route.type,
        fidelity: translated.fidelity,
        delivered: delivery.success,
        event_id: delivery.event_id
      });
    }
    
    return {
      olympian: olympianId,
      operation,
      deliveries,
      all_delivered: deliveries.every(d => d.delivered)
    };
  },
  
  // ─── Deliver to Titan ─────────────────────────────────────────────────
  _deliverToTitan: async function(titanId, event) {
    try {
      // In production, this POSTs to the Titan's API
      // For static GitHub Pages, we use localStorage + console log
      const key = `${titanId}_memory`;
      const stored = JSON.parse(localStorage.getItem(key) || '{"events":[]}');
      stored.events.push(event);
      stored.last_tick = (stored.last_tick || 0) + 1;
      stored.total_events = stored.events.length;
      localStorage.setItem(key, JSON.stringify(stored));
      
      console.log(`[Hermes] → ${titanId}: ${event.type} event delivered. Total: ${stored.total_events}`);
      
      return { success: true, event_id: `${titanId}_${stored.total_events}` };
    } catch(e) {
      console.warn(`[Hermes] Failed to deliver to ${titanId}: ${e.message}`);
      return { success: false, error: e.message };
    }
  },
  
  // ─── Reverse Translation Map ──────────────────────────────────────────
  _reverseMap: function(titanDomain) {
    // Build a reverse translation from Titan vocabulary back to generic
    const map = {};
    if (titanDomain?.vocabulary) {
      for (const word of titanDomain.vocabulary) {
        map[word] = word; // Titan vocabulary is already domain-specific
      }
    }
    return map;
  },
  
  // ─── Get Available Routes ─────────────────────────────────────────────
  getRoutes: function() {
    const routes = [];
    for (const [olympian, domain] of Object.entries(this.domains)) {
      if (domain?.titan_memory_queries) {
        for (const [operation, titanRoutes] of Object.entries(domain.titan_memory_queries)) {
          for (const route of titanRoutes) {
            routes.push({
              from: olympian,
              operation,
              to: route.titan,
              type: route.type
            });
          }
        }
      }
    }
    return routes;
  }
};
