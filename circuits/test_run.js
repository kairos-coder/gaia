// ═══════════════════════════════════════════════
// circuits/test_run.js
// Minimum Viable Circuit: Zeus → Circuit → Kronos → Ground
// Run this in browser console or Node to see the first charge complete
// ═══════════════════════════════════════════════

// ── LAYER 1: OLYMPIAN (Voltage Source) ──
const Zeus = {
  id: 'zeus',
  domain: 'law, sovereignty, judgment',
  
  releaseCharge: function(target, intent) {
    return {
      source: 'zeus',
      type: 'lightning',
      voltage: 100,           // Raw Olympian voltage — dangerous
      intent: intent || 'mark_interval',
      target: target || 'kronos',
      timestamp: new Date().toISOString(),
      tick: 1
    };
  }
};

// ── LAYER 2: CIRCUIT (Signal Path) ──
const Circuit = {
  
  // Step 1: Isolate — Delta-Delta transformer
  isolate: function(charge) {
    console.log('  ⚡ Circuit: Isolating Olympian charge...');
    return {
      ...charge,
      isolated: true,
      isolation_type: 'delta_delta',
      voltage: charge.voltage * 0.95  // Slight induction loss
    };
  },
  
  // Step 2: Step Down — Delta-Wye transformer
  stepDown: function(charge, ratio = 10) {
    console.log(`  ⚡ Circuit: Stepping down ${ratio}:1...`);
    return {
      ...charge,
      voltage: charge.voltage / ratio,
      stepped_down: true,
      ratio: ratio
    };
  },
  
  // Step 3: Rectify — Full Bridge Rectifier
  rectify: function(charge) {
    console.log('  ⚡ Circuit: Rectifying (full bridge)...');
    return {
      ...charge,
      rectified: true,
      mode: 'full_bridge',
      signal_type: 'DC',
      ripple: charge.voltage * 0.05
    };
  },
  
  // Step 4: Route — Send to correct Titan
  route: function(charge) {
    console.log(`  ⚡ Circuit: Routing to ${charge.target}...`);
    return {
      ...charge,
      routed: true,
      destination: charge.target
    };
  },
  
  // Full path: isolate → step down → rectify → route
  process: function(charge) {
    console.log('─── CIRCUIT ACTIVE ───');
    let signal = this.isolate(charge);
    signal = this.stepDown(signal);
    signal = this.rectify(signal);
    signal = this.route(signal);
    console.log('─── CIRCUIT COMPLETE ───');
    console.log(`  Signal: ${signal.voltage.toFixed(2)}V DC, clean, routed to ${signal.destination}`);
    return signal;
  }
};

// ── LAYER 3: TITAN (Ground / Memory) ──
const Kronos = {
  id: 'kronos',
  name: 'Kronos',
  emoji: '⏳',
  title: 'The Accountant',
  memory: [],  // Local memory store (would be localStorage in production)
  
  // Ground the charge through memory
  ground: function(signal) {
    console.log(`\n⏳ ${this.name}: Receiving charge...`);
    
    // Query memory for similar past charges
    const pastCharges = this.memory.filter(m => m.type === signal.intent);
    const lessonCount = pastCharges.length;
    
    // Build response
    const response = {
      tick: signal.tick,
      titan: this.id,
      charge_type: signal.intent,
      voltage_received: signal.voltage,
      voice: `The Accountant marks Tick ${signal.tick}. The interval is precise.`,
      past_similar: lessonCount,
      lesson: lessonCount > 0 
        ? `I have grounded ${lessonCount} similar charges before.` 
        : 'This is the first charge of its kind.',
      output: this._manifest(signal),
      coherence: 0.91,
      grounded_at: new Date().toISOString()
    };
    
    // Store in memory
    this.memory.push({
      type: signal.intent,
      tick: signal.tick,
      voltage: signal.voltage,
      coherence: response.coherence,
      timestamp: response.grounded_at
    });
    
    console.log(`⏳ ${this.name}: "${response.voice}"`);
    console.log(`⏳ ${this.name}: ${response.lesson}`);
    console.log(`⏳ Memory: ${this.memory.length} events stored`);
    
    return response;
  },
  
  _manifest: function(signal) {
    return `function markInterval(tick) {\n  // Kronos marks Tick ${signal.tick}\n  const interval = {\n    tick: ${signal.tick},\n    phase: 'still_night',\n    marked_at: '${new Date().toISOString()}'\n  };\n  return interval;\n}`;
  }
};

// ── LAYER 4: GAIA (Ground / Chronicle) ──
const Gaia = {
  chronicle: [],
  
  // Complete the circuit — charge returns to ground
  complete: function(groundingEvent) {
    const entry = {
      id: `chronicle_${this.chronicle.length + 1}`,
      ...groundingEvent,
      circuit_complete: true
    };
    
    this.chronicle.push(entry);
    
    console.log('\n─── GAIA: CIRCUIT COMPLETE ───');
    console.log(`🌍 Grounded: Tick ${groundingEvent.tick} | ${groundingEvent.voice}`);
    console.log(`🌍 Chronicle: ${this.chronicle.length} entries`);
    console.log(`🌍 Output:\n${groundingEvent.output}`);
    
    return entry;
  },
  
  // In production, this syncs to GaiaDB (Supabase)
  syncToGaiaDB: async function(entry) {
    console.log('🌍 Syncing to GaiaDB... (stub)');
    // Stub: Supabase INSERT
    return entry;
  }
};

// ═══════════════════════════════════════════════
// TEST RUN — The First Circuit
// ═══════════════════════════════════════════════

async function testRun() {
  console.log('═══════════════════════════════════════');
  console.log('  MINIMUM VIABLE CIRCUIT TEST');
  console.log('  Zeus → Circuit → Kronos → Gaia');
  console.log('═══════════════════════════════════════\n');
  
  // 1. Zeus releases charge
  console.log('⚡ ZEUS: Releasing lightning...');
  const charge = Zeus.releaseCharge('kronos', 'mark_interval');
  console.log(`  Voltage: ${charge.voltage}V | Intent: ${charge.intent} | Target: ${charge.target}\n`);
  
  // 2. Circuit processes the charge
  const signal = Circuit.process(charge);
  
  // 3. Kronos grounds the charge through memory
  const groundingEvent = Kronos.ground(signal);
  
  // 4. Gaia completes the circuit
  const chronicleEntry = Gaia.complete(groundingEvent);
  
  // 5. Sync to GaiaDB (async)
  await Gaia.syncToGaiaDB(chronicleEntry);
  
  console.log('\n═══════════════════════════════════════');
  console.log('  CIRCUIT TEST COMPLETE');
  console.log('  Charge grounded. Chronicle updated.');
  console.log('═══════════════════════════════════════');
  
  // Return full state for inspection
  return {
    charge,
    signal,
    groundingEvent,
    chronicleEntry,
    kronosMemory: Kronos.memory,
    gaiaChronicle: Gaia.chronicle
  };
}

// ── RUN ──
// Run in console: testRun().then(result => console.log('Result:', result));
console.log('🃏 Circuit test ready. Run testRun() to fire the first charge.');
