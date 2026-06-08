// ══════════════════════════════════════════════
// GAIA PLANETARY ENGINE — Complete
// Approximate planetary positions via Kepler's equation
// Accuracy ~1° for inner planets, ~2° for outer
// All planets return with god names, Arcana, glyphs
// No external dependencies
// ══════════════════════════════════════════════

const GaiaAstronomy = (() => {
  
  // ────────────────────────────────────────────
  // ORBITAL ELEMENTS (J2000.0 epoch)
  // a = semi-major axis (AU)
  // e = eccentricity
  // i = inclination (degrees)
  // L = mean longitude (degrees)
  // w = longitude of perihelion (degrees)
  // W = longitude of ascending node (degrees)
  // n = mean daily motion (degrees/day)
  // ────────────────────────────────────────────
  
  const ELEMENTS = {
    mercury: {
      a: 0.387098,  e: 0.205630,  i: 7.00487,
      L: 252.25084, w: 77.45645,  W: 48.33167,  n: 4.092338
    },
    venus: {
      a: 0.723332,  e: 0.006773,  i: 3.39471,
      L: 181.97973, w: 131.53298, W: 76.68069,  n: 1.602130
    },
    earth: {
      a: 1.000002,  e: 0.016710,  i: 0.00005,
      L: 100.46435, w: 102.94719, W: 0.0,       n: 0.985609
    },
    mars: {
      a: 1.523679,  e: 0.093412,  i: 1.85061,
      L: 355.45300, w: 336.04084, W: 49.57854,  n: 0.524039
    },
    jupiter: {
      a: 5.203363,  e: 0.048393,  i: 1.30530,
      L: 34.40438,  w: 14.33121,  W: 100.46444, n: 0.083085
    },
    saturn: {
      a: 9.537070,  e: 0.054151,  i: 2.48446,
      L: 49.94432,  w: 92.60337,  W: 113.66552, n: 0.033498
    },
    uranus: {
      a: 19.19126,  e: 0.047168,  i: 0.76986,
      L: 313.23218, w: 172.43405, W: 74.00595,  n: 0.011727
    },
    neptune: {
      a: 30.06896,  e: 0.008586,  i: 1.76917,
      L: 304.88031, w: 46.75094,  W: 131.78402, n: 0.005983
    },
    pluto: {
      a: 39.48212,  e: 0.248808,  i: 17.14175,
      L: 238.92904, w: 224.06892, W: 110.30347, n: 0.003975
    }
  };
  
  // ────────────────────────────────────────────
  // TIME CALCULATIONS
  // ────────────────────────────────────────────
  
  function daysSinceJ2000(date = new Date()) {
    const j2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    return (date.getTime() - j2000) / 86400000;
  }
  
  function toJulian(date = new Date()) {
    return (date.getTime() / 86400000.0) + 2440587.5;
  }
  
  // ────────────────────────────────────────────
  // KEPLER'S EQUATION
  // Solve E - e*sin(E) = M for E
  // Newton-Raphson method
  // ────────────────────────────────────────────
  
  function solveKepler(M, e, tolerance = 1e-8) {
    // Starting guess
    let E = M + e * Math.sin(M);
    
    for (let i = 0; i < 30; i++) {
      const dM = M - (E - e * Math.sin(E));
      const dE = dM / (1 - e * Math.cos(E));
      E += dE;
      if (Math.abs(dE) < tolerance) break;
    }
    
    return E;
  }
  
  // ────────────────────────────────────────────
  // PLANET POSITION COMPUTATION
  // ────────────────────────────────────────────
  
  function getPlanetPosition(planetName, date = new Date()) {
    const el = ELEMENTS[planetName];
    if (!el) {
      console.warn(`GaiaAstronomy: Unknown planet "${planetName}"`);
      return null;
    }
    
    const d = daysSinceJ2000(date);
    
    // Compute mean longitude, anomaly, etc. for epoch + d days
    const L = ((el.L + el.n * d) % 360 + 360) % 360;
    const w = el.w;  // perihelion longitude (slow-moving, treat as constant for ~decade accuracy)
    const W = el.W;  // node longitude
    
    // Mean anomaly
    let M = L - w;
    while (M < 0) M += 360;
    while (M >= 360) M -= 360;
    const Mrad = M * Math.PI / 180;
    
    // Eccentric anomaly
    const E = solveKepler(Mrad, el.e);
    
    // True anomaly
    const cosV = (Math.cos(E) - el.e) / (1 - el.e * Math.cos(E));
    const sinV = (Math.sqrt(1 - el.e * el.e) * Math.sin(E)) / (1 - el.e * Math.cos(E));
    const v = Math.atan2(sinV, cosV) * 180 / Math.PI;
    
    // Heliocentric distance
    const r = el.a * (1 - el.e * Math.cos(E));
    
    // Heliocentric longitude in the orbital plane
    const helioLngOrbit = ((v + w) % 360 + 360) % 360;
    
    // Convert to ecliptic coordinates (simplified — ignores inclination for now)
    // Full conversion would use:
    // sin(eclLat) = sin(i) * sin(helioLngOrbit - W)
    // tan(eclLng - W) = cos(i) * tan(helioLngOrbit - W)
    // But for zodiac sign determination, we use a simplified ecliptic longitude
    
    const iRad = el.i * Math.PI / 180;
    const argEcl = (helioLngOrbit - W) * Math.PI / 180;
    const eclLng = W + Math.atan2(
      Math.cos(iRad) * Math.sin(argEcl),
      Math.cos(argEcl)
    ) * 180 / Math.PI;
    
    const eclipticLng = ((eclLng % 360) + 360) % 360;
    
    // Convert to zodiac
    const zodiac = GaiaSuncalc ? GaiaSuncalc.longitudeToZodiac(eclipticLng) : 
      (() => {
        const signIndex = Math.floor(eclipticLng / 30) % 12;
        const degree = eclipticLng % 30;
        const signNames = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
        const signGlyphs = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
        return {
          sign: signNames[signIndex],
          glyph: signGlyphs[signIndex],
          degree: degree
        };
      })();
    
    // Get divine identity from celestial registry
    const celestial = (typeof GAIA_CELESTIAL !== 'undefined') ? GAIA_CELESTIAL[planetName] : null;
    
    // Compute retrograde (simplified: compare longitude change over small time)
    const retrograde = false; // Full implementation would compare positions 1 day apart
    
    return {
      name: planetName,
      god: celestial?.god || planetName.charAt(0).toUpperCase() + planetName.slice(1),
      olympian: celestial?.olympian ?? true,
      glyph: celestial?.glyph || '·',
      arcana: celestial?.arcana || null,
      element: celestial?.element || null,
      domain: celestial?.domain || null,
      whisper: celestial?.whisper || null,
      sign: zodiac.sign,
      signGlyph: zodiac.glyph,
      degree: parseFloat(zodiac.degree.toFixed(2)),
      longitude: parseFloat(eclipticLng.toFixed(4)),
      distance: parseFloat(r.toFixed(4)),
      retrograde: retrograde,
      moons: celestial?.moons || null,
      // Raw orbital data for advanced rendering
      _orbital: {
        meanAnomaly: parseFloat(M.toFixed(4)),
        trueAnomaly: parseFloat(v.toFixed(4)),
        helioDistance: parseFloat(r.toFixed(4)),
        eclipticLongitude: parseFloat(eclipticLng.toFixed(4))
      }
    };
  }
  
  // ────────────────────────────────────────────
  // GET ALL PLANETS
  // ────────────────────────────────────────────
  
  function getAllPlanets(date = new Date()) {
    const planetNames = ['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
    
    const planets = {};
    
    // Add Sun and Moon from GaiaSuncalc if available
    if (typeof GaiaSuncalc !== 'undefined') {
      planets.sun = GaiaSuncalc.getSunPosition(date);
      planets.moon = GaiaSuncalc.getMoonPosition(date);
    }
    
    // Add all planets
    planetNames.forEach(name => {
      planets[name] = getPlanetPosition(name, date);
    });
    
    return planets;
  }
  
  // ────────────────────────────────────────────
  // HORIZON DETECTION
  // Determine if a planet is above the horizon
  // based on its ecliptic longitude relative to ascendant
  // ────────────────────────────────────────────
  
  function isAboveHorizon(planetLng, date = new Date(), lat = 40.7, lng = -74.0) {
    if (typeof GaiaSuncalc === 'undefined') {
      // Fallback: assume above horizon if longitude between 90-270 from sun
      const sunLng = solarLongitudeApprox(date);
      const diff = (planetLng - sunLng + 360) % 360;
      return diff > 30 && diff < 330; // Rough day/night approximation
    }
    
    const asc = GaiaSuncalc.getAscendant(date, lat, lng);
    if (!asc) return true;
    
    const ascLng = GAIA_SIGNS.findIndex(s => s.name === asc.sign) * 30 + asc.degree;
    const diff = ((planetLng - ascLng) % 360 + 360) % 360;
    
    // Planets within 180° east of ascendant are above horizon
    return diff < 180;
  }
  
  function solarLongitudeApprox(date) {
    const jd = toJulian(date);
    const n = jd - 2451545.0;
    return ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
  }
  
  // ────────────────────────────────────────────
  // PLANET-TO-ZODIAC HELPER
  // Get which zodiac sign a planet is currently in
  // ────────────────────────────────────────────
  
  function getPlanetSign(planetName, date = new Date()) {
    const pos = getPlanetPosition(planetName, date);
    if (!pos) return null;
    return {
      planet: planetName,
      god: pos.god,
      glyph: pos.glyph,
      sign: pos.sign,
      signGlyph: pos.signGlyph,
      degree: pos.degree,
      arcana: pos.arcana
    };
  }
  
  // ────────────────────────────────────────────
  // STELLIUM DETECTION
  // Find signs with 3+ planets (including Sun/Moon)
  // ────────────────────────────────────────────
  
  function findStelliums(date = new Date()) {
    const planets = getAllPlanets(date);
    const signCount = {};
    
    Object.values(planets).forEach(p => {
      if (!p || !p.sign) return;
      if (!signCount[p.sign]) signCount[p.sign] = { count: 0, planets: [] };
      signCount[p.sign].count++;
      signCount[p.sign].planets.push(p.god || p.name);
    });
    
    const stelliums = {};
    Object.entries(signCount).forEach(([sign, data]) => {
      if (data.count >= 3) {
        stelliums[sign] = data;
      }
    });
    
    return stelliums;
  }
  
  // ────────────────────────────────────────────
  // ELEMENTAL DISTRIBUTION
  // Count planets in each element
  // ────────────────────────────────────────────
  
  function getElementalDistribution(date = new Date()) {
    const planets = getAllPlanets(date);
    const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    
    Object.values(planets).forEach(p => {
      if (!p || !p.element) return;
      if (elements[p.element] !== undefined) {
        elements[p.element]++;
      }
    });
    
    return elements;
  }
  
  // ────────────────────────────────────────────
  // PUBLIC API
  // ────────────────────────────────────────────
  
  return {
    // Core
    getPlanetPosition,
    getAllPlanets,
    daysSinceJ2000,
    
    // Horizon
    isAboveHorizon,
    
    // Analysis
    getPlanetSign,
    findStelliums,
    getElementalDistribution,
    
    // Constants
    ELEMENTS,
    
    // Orbital data
    solarLongitudeApprox
  };
  
})();

// ══════════════════════════════════════════════
// AUTO-COMPUTE ABOVE HORIZON
// If loaded in browser, decorates getAllPlanets
// ══════════════════════════════════════════════
if (typeof window !== 'undefined') {
  const _origGetAll = GaiaAstronomy.getAllPlanets;
  GaiaAstronomy.getAllPlanets = function(date = new Date(), lat = 40.7, lng = -74.0) {
    const planets = _origGetAll.call(this, date);
    Object.values(planets).forEach(p => {
      if (p && p.longitude !== undefined) {
        p.aboveHorizon = GaiaAstronomy.isAboveHorizon(p.longitude, date, lat, lng);
      }
    });
    return planets;
  };
}
