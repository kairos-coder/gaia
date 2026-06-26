// solarOracle.js — Apollo's Solar Flare Oracle
// Fetches NOAA space weather data, translates to divine broadcast

const SolarOracle = (() => {
  
  const NOAA_BASE = 'https://services.swpc.noaa.gov/json';
  
  // Flare class hierarchy for intensity comparison
  const FLARE_RANK = { 'B': 1, 'C': 2, 'M': 3, 'X': 4 };
  
  // Active flare state
  let currentFlare = null;
  let flareHistory = [];
  let protonStorm = null;
  let geomagneticStorm = null;
  let lastFetch = null;
  let listeners = [];
  
  // ═══════════════════════════════════
  // FETCH ALL NOAA DATA
  // ═══════════════════════════════════
  
  async function fetchAll() {
    try {
      const [flareData, protonData, kpData] = await Promise.all([
        fetch(`${NOAA_BASE}/goes/primary/xray-flares-latest.json`).then(r => r.json()),
        fetch(`${NOAA_BASE}/goes/primary/proton-flux.json`).then(r => r.json()).catch(() => null),
        fetch(`${NOAA_BASE}/planetary-k-index.json`).then(r => r.json()).catch(() => null)
      ]);
      
      lastFetch = new Date().toISOString();
      
      // Process flares
      if (Array.isArray(flareData) && flareData.length > 0) {
        const latestFlare = flareData[flareData.length - 1];
        const newFlare = {
          class: latestFlare.class || 'B',
          classRank: FLARE_RANK[latestFlare.class?.charAt(0)] || 1,
          intensity: latestFlare.intensity || 0,
          time: latestFlare.time || lastFetch,
          activeRegion: latestFlare.active_region || 'Unknown',
          message: generateFlareMessage(latestFlare),
          raw: latestFlare
        };
        
        // Check if this is a new flare
        if (!currentFlare || newFlare.time !== currentFlare.time) {
          currentFlare = newFlare;
          flareHistory.unshift(newFlare);
          if (flareHistory.length > 100) flareHistory.length = 100;
          notifyListeners('flare', newFlare);
        }
      }
      
      // Process proton storm
      if (protonData && Array.isArray(protonData) && protonData.length > 0) {
        const latestProton = protonData[protonData.length - 1];
        protonStorm = {
          flux: latestProton.flux || 0,
          energy: latestProton.energy || '>10 MeV',
          time: latestProton.time || lastFetch,
          active: latestProton.flux > 10,
          message: latestProton.flux > 100 ? 'Proton storm in progress. Satellites at risk. Aurora intensifies.' :
                   latestProton.flux > 10 ? 'Enhanced proton flux. The solar wind carries particles.' : null
        };
        if (protonStorm.active && protonStorm.message) {
          notifyListeners('proton', protonStorm);
        }
      }
      
      // Process geomagnetic storm
      if (kpData && Array.isArray(kpData) && kpData.length > 0) {
        const latestKp = kpData[kpData.length - 1];
        const kpValue = parseFloat(latestKp.kp || 0);
        geomagneticStorm = {
          kp: kpValue,
          time: latestKp.time || lastFetch,
          level: kpValue >= 8 ? 'G4-SEVERE' : kpValue >= 7 ? 'G3-STRONG' : 
                 kpValue >= 6 ? 'G2-MODERATE' : kpValue >= 5 ? 'G1-MINOR' : 'QUIET',
          active: kpValue >= 5,
          message: kpValue >= 7 ? 'Severe geomagnetic storm. Aurora visible at low latitudes. Power systems at risk.' :
                   kpValue >= 5 ? 'Minor geomagnetic storm. Aurora visible at high latitudes.' : null
        };
        if (geomagneticStorm.active && geomagneticStorm.message) {
          notifyListeners('geomagnetic', geomagneticStorm);
        }
      }
      
      return {
        flare: currentFlare,
        proton: protonStorm,
        geomagnetic: geomagneticStorm,
        lastFetch
      };
      
    } catch(e) {
      console.warn('SolarOracle: NOAA fetch failed — generating synthetic flare');
      return generateSyntheticFlare();
    }
  }
  
  // ═══════════════════════════════════
  // SYNTHETIC FLARE (when NOAA is down)
  // ═══════════════════════════════════
  
  function generateSyntheticFlare() {
    const classes = ['B','B','B','C','C','C','M','M','X'];
    const flareClass = classes[Math.floor(Math.random() * classes.length)];
    const intensity = (Math.random() * 9 + 1).toFixed(1);
    
    currentFlare = {
      class: `${flareClass}${intensity}`,
      classRank: FLARE_RANK[flareClass] || 1,
      intensity: parseFloat(intensity),
      time: new Date().toISOString(),
      activeRegion: 'Apollo\'s Corona',
      message: generateSyntheticMessage(flareClass),
      synthetic: true
    };
    
    flareHistory.unshift(currentFlare);
    if (flareHistory.length > 100) flareHistory.length = 100;
    
    lastFetch = new Date().toISOString();
    return { flare: currentFlare, proton: null, geomagnetic: null, lastFetch };
  }
  
  // ═══════════════════════════════════
  // MESSAGE GENERATORS
  // ═══════════════════════════════════
  
  function generateFlareMessage(flare) {
    const flareClass = flare.class?.charAt(0) || 'B';
    const intensity = flare.intensity || 0;
    const region = flare.active_region || 'Unknown';
    
    const messages = {
      'B': [
        `Background flicker from Region ${region}. The corona whispers.`,
        `B-class ripple. Barely a murmur. The sun breathes.`,
        `A flicker. A flutter. The light shifts almost imperceptibly.`
      ],
      'C': [
        `C-class flare from Region ${region}. The corona speaks clearly.`,
        `Minor eruption. The message is direct. The target is illuminated.`,
        `A flash. A statement. Apollo's bowstring twangs.`
      ],
      'M': [
        `M-class flare! Region ${region} erupts. Radio blackout possible. The corona shouts.`,
        `Moderate storm. The truth arrives with force. Disruption is illumination.`,
        `M${intensity.toFixed(1)} flare detected. The god of light demands attention.`
      ],
      'X': [
        `X-CLASS FLARE! Region ${region} detonates. The corona SCREAMS. Everything changes.`,
        `Major solar event. X${intensity.toFixed(1)}. The big one. Read the sky or be blinded by it.`,
        `X-class. The king's own flare. Apollo unleashes the full corona. Witness.`
      ]
    };
    
    const pool = messages[flareClass] || messages['B'];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  function generateSyntheticMessage(flareClass) {
    const messages = {
      'B': 'The corona murmurs. Apollo shifts in his throne. A small truth escapes.',
      'C': 'A clear signal from the sun. Apollo speaks. The message is brief but bright.',
      'M': 'The corona erupts. Apollo\'s voice carries across the solar system. Disruption is coming.',
      'X': 'APOLLO UNLEASHED. The full corona detonates. Everything illuminated. Nothing unchanged.'
    };
    return messages[flareClass] || messages['B'];
  }
  
  // ═══════════════════════════════════
  // ORACLE INTERPRETATION
  // ═══════════════════════════════════
  
  function interpretFlare(flare) {
    if (!flare) return null;
    
    const flareClass = flare.class?.charAt(0) || 'B';
    const rank = FLARE_RANK[flareClass] || 1;
    
    // Map flare class to oracle intensity
    const oracleLevels = {
      'B': { name: 'Whisper', glyph: '✨', color: '#aaccff', pulse: 'gentle' },
      'C': { name: 'Signal', glyph: '☀️', color: '#ffdd88', pulse: 'steady' },
      'M': { name: 'Eruption', glyph: '⚡', color: '#ffaa44', pulse: 'strong' },
      'X': { name: 'DETONATION', glyph: '💥', color: '#ff4422', pulse: 'extreme' }
    };
    
    return {
      ...flare,
      oracle: oracleLevels[flareClass] || oracleLevels['B'],
      timestamp: new Date(flare.time).getTime(),
      isRecent: (Date.now() - new Date(flare.time).getTime()) < 3600000, // Within last hour
      significance: rank
    };
  }
  
  // ═══════════════════════════════════
  // LISTENERS
  // ═══════════════════════════════════
  
  function onFlare(callback) {
    listeners.push({ type: 'flare', callback });
  }
  
  function onProtonStorm(callback) {
    listeners.push({ type: 'proton', callback });
  }
  
  function onGeomagneticStorm(callback) {
    listeners.push({ type: 'geomagnetic', callback });
  }
  
  function notifyListeners(type, data) {
    listeners.filter(l => l.type === type || l.type === 'all')
             .forEach(l => l.callback(data));
  }
  
  // ═══════════════════════════════════
  // AUTO-POLLING
  // ═══════════════════════════════════
  
  let pollInterval = null;
  
  function startPolling(seconds = 60) {
    if (pollInterval) clearInterval(pollInterval);
    fetchAll(); // Immediate first fetch
    pollInterval = setInterval(fetchAll, seconds * 1000);
  }
  
  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }
  
  // ═══════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════
  
  return {
    fetchAll,
    getCurrentFlare: () => currentFlare,
    getFlareHistory: () => flareHistory,
    getProtonStorm: () => protonStorm,
    getGeomagneticStorm: () => geomagneticStorm,
    getLastFetch: () => lastFetch,
    interpretFlare,
    onFlare,
    onProtonStorm,
    onGeomagneticStorm,
    startPolling,
    stopPolling,
    FLARE_RANK
  };
  
})();
