// ══════════════════════════════════════════════
// GAIA PLANETARY ENGINE — Refactored
// Uses astronomy-engine for accurate positions
// Same library as divination/js/observe.js
// ══════════════════════════════════════════════

const GaiaAstronomy = (() => {
  
  // ────────────────────────────────────────────
  // ASTRONOMY-ENGINE BODY MAP
  // ────────────────────────────────────────────
  
  function getBody(bodyName) {
    if (typeof Astronomy === 'undefined' || !Astronomy.Body) return null;
    const bodyMap = {
      sun:     Astronomy.Body.Sun,
      moon:    Astronomy.Body.Moon,
      mercury: Astronomy.Body.Mercury,
      venus:   Astronomy.Body.Venus,
      mars:    Astronomy.Body.Mars,
      jupiter: Astronomy.Body.Jupiter,
      saturn:  Astronomy.Body.Saturn,
      uranus:  Astronomy.Body.Uranus,
      neptune: Astronomy.Body.Neptune,
      pluto:   Astronomy.Body.Pluto
    };
    return bodyMap[bodyName] || null;
  }
  
  // ────────────────────────────────────────────
  // ZODIAC CONVERSION
  // ────────────────────────────────────────────
  
  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  
  function longitudeToZodiac(lng) {
    const lon = ((lng % 360) + 360) % 360;
    const signIndex = Math.floor(lon / 30) % 12;
    return {
      sign: SIGN_NAMES[signIndex],
      glyph: SIGN_GLYPHS[signIndex],
      degree: parseFloat((lon % 30).toFixed(2))
    };
  }
  
  // ────────────────────────────────────────────
  // PLANET POSITION — using astronomy-engine
  // ────────────────────────────────────────────
  
  function getPlanetPosition(planetName, date = new Date(), lat = 40.7, lng = -74.0) {
    const body = getBody(planetName);
    if (!body) {
      console.warn(`GaiaAstronomy: Unknown planet "${planetName}"`);
      return null;
    }
    
    try {
      const observer = new Astronomy.Observer(lat, lng, 0);
      
      // Get equatorial coordinates (ofdate=true for precessed positions)
      const eq = Astronomy.Equator(body, date, observer, true, true);
      if (!eq) return null;
      
      // Convert to ecliptic
      let ecl;
      try {
        ecl = Astronomy.Ecliptic(eq);
      } catch(e1) {
        try {
          ecl = Astronomy.Ecliptic(eq.vec);
        } catch(e2) {
          console.warn(`GaiaAstronomy: Ecliptic conversion failed for ${planetName}`);
          return null;
        }
      }
      
      if (!ecl || ecl.elon === undefined) {
        console.warn(`GaiaAstronomy: Ecliptic returned no elon for ${planetName}`);
        return null;
      }
      
      // Normalise ecliptic longitude
      const eclipticLng = ((ecl.elon % 360) + 360) % 360;
      const zodiac = longitudeToZodiac(eclipticLng);
      
      // Horizon data
      let altitude = 0, azimuth = 0, aboveHorizon = false;
      try {
        const hor = Astronomy.Horizon(date, observer, body);
        if (hor && typeof hor.altitude === 'number') {
          altitude = hor.altitude;
          azimuth = hor.azimuth || 0;
          aboveHorizon = altitude > 0;
        }
      } catch(_) { /* optional */ }
      
      // Divine identity from GAIA_CELESTIAL registry
      const celestial = (typeof GAIA_CELESTIAL !== 'undefined') ? GAIA_CELESTIAL[planetName] : null;
      
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
        degree: zodiac.degree,
        longitude: parseFloat(eclipticLng.toFixed(4)),
        altitude: parseFloat(altitude.toFixed(2)),
        azimuth: parseFloat(azimuth.toFixed(2)),
        aboveHorizon: aboveHorizon,
        moons: celestial?.moons || null
      };
      
    } catch(e) {
      console.warn(`GaiaAstronomy: getPlanetPosition failed for ${planetName}:`, e.message);
      return null;
    }
  }
  
  // ────────────────────────────────────────────
  // GET ALL PLANETS
  // ────────────────────────────────────────────
  
  function getAllPlanets(date = new Date(), lat = 40.7, lng = -74.0) {
    const planetNames = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
    const planets = {};
    
    planetNames.forEach(name => {
      planets[name] = getPlanetPosition(name, date, lat, lng);
    });
    
    return planets;
  }
  
  // ────────────────────────────────────────────
  // STELLIUM DETECTION
  // ────────────────────────────────────────────
  
  function findStelliums(date = new Date(), lat = 40.7, lng = -74.0) {
    const planets = getAllPlanets(date, lat, lng);
    const signCount = {};
    
    Object.values(planets).forEach(p => {
      if (!p || !p.sign) return;
      if (!signCount[p.sign]) signCount[p.sign] = { count: 0, planets: [] };
      signCount[p.sign].count++;
      signCount[p.sign].planets.push(p.god || p.name);
    });
    
    const stelliums = {};
    Object.entries(signCount).forEach(([sign, data]) => {
      if (data.count >= 3) stelliums[sign] = data;
    });
    
    return stelliums;
  }
  
  // ────────────────────────────────────────────
  // ELEMENTAL DISTRIBUTION
  // ────────────────────────────────────────────
  
  function getElementalDistribution(date = new Date(), lat = 40.7, lng = -74.0) {
    const planets = getAllPlanets(date, lat, lng);
    const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    
    Object.values(planets).forEach(p => {
      if (!p || !p.element) return;
      if (elements[p.element] !== undefined) elements[p.element]++;
    });
    
    return elements;
  }
  
  // ────────────────────────────────────────────
  // PLANET SIGN HELPER
  // ────────────────────────────────────────────
  
  function getPlanetSign(planetName, date = new Date(), lat = 40.7, lng = -74.0) {
    const pos = getPlanetPosition(planetName, date, lat, lng);
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
  // PUBLIC API
  // ────────────────────────────────────────────
  
  return {
    getPlanetPosition,
    getAllPlanets,
    getPlanetSign,
    findStelliums,
    getElementalDistribution,
    longitudeToZodiac,
    SIGN_NAMES,
    SIGN_GLYPHS
  };
  
})();
