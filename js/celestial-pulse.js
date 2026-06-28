// ═══════════════════════════════════════
// CELESTIAL PULSE · The Sanctuary's Heartbeat
// gaia/js/celestial-pulse.js
//
// One global pulse for the entire sanctuary.
// Apollo's solar data by day. Artemis's lunar
// data by night. Swaps at dusk and dawn.
//
// Polls NOAA for flares, proton flux, K-index.
// Calculates lunar phase, illumination, rise/set.
//
// Fires 'celestial-update' on document.body
// every 60 seconds. Any page, any hare, any
// temple can listen.
//
// Anchored to Bucksport, Maine — the Witch's Foot.
// $0 compute. Free APIs. The sky is the source code.
//
// v1.0 — June 28, 2026
// ═══════════════════════════════════════

const CelestialPulse = (function() {
    
    // ═══════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════
    
    const CONFIG = {
        // Witch's Foot
        latitude: 44.5734,
        longitude: -68.7956,
        
        // NOAA solar data endpoints
        noaaFlares: 'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json',
        noaaProton: 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-plot-latest.json',
        noaaKIndex: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
        
        // Poll interval (ms)
        interval: 60000,
        
        // Cache duration for failed fetches
        cacheMaxAge: 300000, // 5 minutes
    };
    
    // ═══════════════════════════════════
    // STATE
    // ═══════════════════════════════════
    
    let current = {
        luminary: null,       // 'apollo' | 'artemis'
        timestamp: null,
        
        solar: {
            flareClass: null,      // 'A', 'B', 'C', 'M', 'X'
            flareValue: null,      // e.g. 2.1 for M2.1
            flareActive: false,
            protonFlux: null,      // pfu
            protonStorm: false,
            kIndex: null,          // 0-9
            kStormLevel: null,     // 'none', 'minor', 'major', 'severe'
            lastFlare: null,
        },
        
        lunar: {
            phase: null,           // 'new', 'waxing-crescent', 'first-quarter', 
                                   // 'waxing-gibbous', 'full', 'waning-gibbous', 
                                   // 'last-quarter', 'waning-crescent'
            illumination: null,    // 0-1
            age: null,            // days since new moon
            rise: null,           // ISO time
            set: null,            // ISO time
            distance: null,       // km
            altitude: null,       // degrees above horizon
            azimuth: null,        // degrees from north
        },
    };
    
    let lastFetch = null;
    let cachedData = null;
    let intervalId = null;
    let listeners = [];
    
    // ═══════════════════════════════════
    // LUMINARY DETECTION
    // ═══════════════════════════════════
    
    function getCurrentLuminary() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hours = now.getHours() + now.getMinutes() / 60;
        
        // Approximate sunrise/sunset for Witch's Foot
        // Using simple solar approximation
        const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
        const lat = CONFIG.latitude;
        
        // Solar declination
        const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
        const declRad = declination * Math.PI / 180;
        const latRad = lat * Math.PI / 180;
        
        // Hour angle at sunrise/sunset
        const cosH = -Math.tan(latRad) * Math.tan(declRad);
        const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosH)));
        const halfDayLength = (hourAngle * 180 / Math.PI) / 15;
        
        // Approximate sunrise and sunset
        const solarNoon = 12.0; // simplified
        const sunrise = solarNoon - halfDayLength;
        const sunset = solarNoon + halfDayLength;
        
        if (hours >= sunrise && hours < sunset) {
            return 'apollo';
        } else {
            return 'artemis';
        }
    }
    
    // ═══════════════════════════════════
    // NOAA SOLAR DATA FETCH
    // ═══════════════════════════════════
    
    async function fetchSolarData() {
        const solarData = {
            flareClass: null,
            flareValue: null,
            flareActive: false,
            protonFlux: null,
            protonStorm: false,
            kIndex: null,
            kStormLevel: 'none',
            lastFlare: null,
        };
        
        try {
            // Fetch X-ray flares
            const flareResponse = await fetch(CONFIG.noaaFlares);
            if (flareResponse.ok) {
                const flares = await flareResponse.json();
                if (flares && flares.length > 0) {
                    // Find most recent flare in last 2 hours
                    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
                    const recentFlares = flares.filter(f => {
                        const flareTime = new Date(f.time_tag || f.begin_time);
                        return flareTime > twoHoursAgo;
                    });
                    
                    if (recentFlares.length > 0) {
                        const latest = recentFlares[recentFlares.length - 1];
                        const cls = latest.max_class || latest.class || 'A0.0';
                        const match = cls.match(/^([ABCMX])(\d+\.?\d*)$/);
                        if (match) {
                            solarData.flareClass = match[1];
                            solarData.flareValue = parseFloat(match[2]);
                            solarData.flareActive = (solarData.flareClass === 'M' || solarData.flareClass === 'X');
                            solarData.lastFlare = {
                                class: cls,
                                time: latest.time_tag || latest.begin_time,
                                active: solarData.flareActive,
                            };
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('CelestialPulse: Failed to fetch flare data', e.message);
        }
        
        try {
            // Fetch proton flux
            const protonResponse = await fetch(CONFIG.noaaProton);
            if (protonResponse.ok) {
                const protonData = await protonResponse.json();
                if (protonData && protonData.length > 0) {
                    const latest = protonData[protonData.length - 1];
                    const flux = latest.flux || latest.pfu || 0;
                    solarData.protonFlux = flux;
                    solarData.protonStorm = flux > 10; // S1 threshold
                }
            }
        } catch (e) {
            console.warn('CelestialPulse: Failed to fetch proton data', e.message);
        }
        
        try {
            // Fetch K-index
            const kResponse = await fetch(CONFIG.noaaKIndex);
            if (kResponse.ok) {
                const kData = await kResponse.json();
                if (kData && kData.length > 1) {
                    // K-index data comes as array of arrays; last row is latest
                    const latest = kData[kData.length - 1];
                    const kVal = parseFloat(latest[1] || latest[0] || 0);
                    solarData.kIndex = kVal;
                    
                    if (kVal >= 8) solarData.kStormLevel = 'severe';
                    else if (kVal >= 6) solarData.kStormLevel = 'major';
                    else if (kVal >= 4) solarData.kStormLevel = 'minor';
                    else solarData.kStormLevel = 'none';
                }
            }
        } catch (e) {
            console.warn('CelestialPulse: Failed to fetch K-index data', e.message);
        }
        
        return solarData;
    }
    
    // ═══════════════════════════════════
    // LUNAR CALCULATION
    // ═══════════════════════════════════
    
    function calculateLunarData() {
        const now = new Date();
        
        // Approximate lunar calculation
        // Based on known new moon: June 14, 2026 at 14:38 UTC
        const knownNewMoon = new Date('2026-06-14T14:38:00Z');
        const synodicMonth = 29.53058867; // days
        
        const diffMs = now.getTime() - knownNewMoon.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const age = diffDays % synodicMonth;
        
        // Phase
        let phase;
        if (age < 1.845) phase = 'new';
        else if (age < 5.536) phase = 'waxing-crescent';
        else if (age < 9.228) phase = 'first-quarter';
        else if (age < 12.919) phase = 'waxing-gibbous';
        else if (age < 16.610) phase = 'full';
        else if (age < 20.302) phase = 'waning-gibbous';
        else if (age < 23.993) phase = 'last-quarter';
        else phase = 'waning-crescent';
        
        // Illumination (0-1)
        const illumination = (1 - Math.cos(2 * Math.PI * age / synodicMonth)) / 2;
        
        // Simplified rise/set (approximate for Witch's Foot)
        const riseHour = (age * 0.83 + 6) % 24;
        const setHour = (riseHour + 12) % 24;
        
        const rise = new Date(now);
        rise.setHours(Math.floor(riseHour), Math.floor((riseHour % 1) * 60), 0, 0);
        
        const set = new Date(now);
        set.setHours(Math.floor(setHour), Math.floor((setHour % 1) * 60), 0, 0);
        
        // Approximate distance (perigee ~356,400 km, apogee ~406,700 km)
        const meanDistance = 384400;
        const distanceVariation = 20900 * Math.cos(2 * Math.PI * (age - 0.5) / synodicMonth);
        const distance = meanDistance + distanceVariation;
        
        // Approximate altitude at current time
        const hoursSinceRise = now.getHours() + now.getMinutes() / 60 - riseHour;
        const altitude = hoursSinceRise > 0 && hoursSinceRise < 12
            ? Math.sin((hoursSinceRise / 12) * Math.PI) * 60
            : hoursSinceRise >= 12
                ? Math.sin(((hoursSinceRise - 12) / 12) * Math.PI) * -30
                : -20;
        
        return {
            phase,
            illumination: Math.round(illumination * 1000) / 1000,
            age: Math.round(age * 100) / 100,
            rise: rise.toISOString(),
            set: set.toISOString(),
            distance: Math.round(distance),
            altitude: Math.round(altitude),
            azimuth: Math.round((hoursSinceRise / 12) * 180),
        };
    }
    
    // ═══════════════════════════════════
    // MAIN PULSE
    // ═══════════════════════════════════
    
    async function pulse() {
        const luminary = getCurrentLuminary();
        const now = new Date().toISOString();
        
        current.luminary = luminary;
        current.timestamp = now;
        
        if (luminary === 'apollo') {
            // Solar mode
            const solarData = await fetchSolarData();
            current.solar = solarData;
            
            // Default lunar data (stale from last night)
            if (!current.lunar.phase) {
                current.lunar = calculateLunarData();
            }
        } else {
            // Lunar mode
            current.lunar = calculateLunarData();
            
            // Stale solar data (last known)
            if (!current.solar.flareClass) {
                current.solar.flareClass = 'A';
                current.solar.flareActive = false;
                current.solar.protonStorm = false;
                current.solar.kStormLevel = 'none';
            }
        }
        
        // Cache
        cachedData = { ...current };
        lastFetch = Date.now();
        
        // Dispatch event
        const event = new CustomEvent('celestial-update', {
            detail: { pulse: current },
            bubbles: true,
        });
        document.body.dispatchEvent(event);
        
        // Also dispatch luminary-specific events
        if (luminary === 'apollo' && current.solar.flareActive) {
            const flareEvent = new CustomEvent('solar-flare', {
                detail: { 
                    class: current.solar.flareClass,
                    value: current.solar.flareValue,
                    pulse: current,
                },
                bubbles: true,
            });
            document.body.dispatchEvent(flareEvent);
        }
        
        if (current.solar.kStormLevel === 'major' || current.solar.kStormLevel === 'severe') {
            const stormEvent = new CustomEvent('geomagnetic-storm', {
                detail: {
                    level: current.solar.kStormLevel,
                    kIndex: current.solar.kIndex,
                    pulse: current,
                },
                bubbles: true,
            });
            document.body.dispatchEvent(stormEvent);
        }
        
        if (current.solar.protonStorm) {
            const protonEvent = new CustomEvent('proton-storm', {
                detail: {
                    flux: current.solar.protonFlux,
                    pulse: current,
                },
                bubbles: true,
            });
            document.body.dispatchEvent(protonEvent);
        }
        
        return current;
    }
    
    // ═══════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════
    
    return {
        /**
         * Start the celestial pulse.
         * @param {number} [intervalMs=60000] - poll interval in ms
         */
        start: function(intervalMs) {
            if (intervalId) this.stop();
            
            const interval = intervalMs || CONFIG.interval;
            
            // Pulse immediately
            pulse();
            
            // Then pulse on interval
            intervalId = setInterval(pulse, interval);
            
            console.log(`CelestialPulse: Started. Luminary: ${current.luminary}. Interval: ${interval}ms`);
            
            return this;
        },
        
        /**
         * Stop the pulse.
         */
        stop: function() {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            return this;
        },
        
        /**
         * Get current pulse state.
         * @returns {Object} current pulse data
         */
        getCurrent: function() {
            return { ...current };
        },
        
        /**
         * Force an immediate pulse update.
         */
        refresh: async function() {
            await pulse();
            return this.getCurrent();
        },
        
        /**
         * Get the current luminary.
         * @returns {'apollo'|'artemis'}
         */
        getLuminary: function() {
            return current.luminary || getCurrentLuminary();
        },
        
        /**
         * Check if a solar flare is currently active (M-class or higher).
         * @returns {boolean}
         */
        isFlareActive: function() {
            return current.solar.flareActive;
        },
        
        /**
         * Check if a geomagnetic storm is in progress.
         * @returns {boolean}
         */
        isStormActive: function() {
            return current.solar.kStormLevel === 'major' || current.solar.kStormLevel === 'severe';
        },
        
        /**
         * Check if a proton storm is in progress.
         * @returns {boolean}
         */
        isProtonStormActive: function() {
            return current.solar.protonStorm;
        },
        
        /**
         * Get lunar phase emoji for current phase.
         * @returns {string}
         */
        getLunarEmoji: function() {
            const phase = current.lunar.phase;
            const emojis = {
                'new': '🌑',
                'waxing-crescent': '🌒',
                'first-quarter': '🌓',
                'waxing-gibbous': '🌔',
                'full': '🌕',
                'waning-gibbous': '🌖',
                'last-quarter': '🌗',
                'waning-crescent': '🌘',
            };
            return emojis[phase] || '🌕';
        },
        
        /**
         * Get a human-readable solar status string.
         * @returns {string}
         */
        getSolarStatus: function() {
            const { solar } = current;
            const parts = [];
            
            if (solar.flareClass && solar.flareValue) {
                parts.push(`☉ ${solar.flareClass}${solar.flareValue}`);
            } else {
                parts.push('☉ nominal');
            }
            
            if (solar.protonStorm) {
                parts.push(`⚡ proton ${solar.protonFlux}pfu`);
            }
            
            if (solar.kStormLevel !== 'none') {
                parts.push(`🌐 Kp${solar.kIndex} ${solar.kStormLevel}`);
            }
            
            return parts.join(' · ');
        },
        
        /**
         * Get a human-readable lunar status string.
         * @returns {string}
         */
        getLunarStatus: function() {
            const { lunar } = current;
            const phaseNames = {
                'new': 'New Moon',
                'waxing-crescent': 'Waxing Crescent',
                'first-quarter': 'First Quarter',
                'waxing-gibbous': 'Waxing Gibbous',
                'full': 'Full Moon',
                'waning-gibbous': 'Waning Gibbous',
                'last-quarter': 'Last Quarter',
                'waning-crescent': 'Waning Crescent',
            };
            
            const emoji = this.getLunarEmoji();
            const name = phaseNames[lunar.phase] || lunar.phase;
            const pct = Math.round(lunar.illumination * 100);
            
            return `${emoji} ${name} · ${pct}% illuminated`;
        },
        
        /**
         * Subscribe a callback to the celestial-update event.
         * @param {Function} callback - receives pulse data
         */
        onUpdate: function(callback) {
            document.body.addEventListener('celestial-update', (e) => {
                callback(e.detail.pulse);
            });
        },
        
        /**
         * Subscribe to solar flare events.
         * @param {Function} callback - receives flare data
         */
        onFlare: function(callback) {
            document.body.addEventListener('solar-flare', (e) => {
                callback(e.detail);
            });
        },
        
        /**
         * Subscribe to geomagnetic storm events.
         * @param {Function} callback - receives storm data
         */
        onStorm: function(callback) {
            document.body.addEventListener('geomagnetic-storm', (e) => {
                callback(e.detail);
            });
        },
        
        /**
         * Subscribe to proton storm events.
         * @param {Function} callback - receives proton data
         */
        onProtonStorm: function(callback) {
            document.body.addEventListener('proton-storm', (e) => {
                callback(e.detail);
            });
        },
        
        /**
         * Get the configuration.
         */
        getConfig: function() {
            return { ...CONFIG };
        },
    };
    
})();

// ═══════════════════════════════════
// AUTO-START
// Starts automatically when loaded
// ═══════════════════════════════════

if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CelestialPulse.start());
    } else {
        CelestialPulse.start();
    }
}

// ═══════════════════════════════════
// EXPORT
// ═══════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CelestialPulse;
}
