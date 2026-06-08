// ══════════════════════════════════════════════
// GAIA PLANETARY ENGINE
// Approximate positions for all 8 classical + Pluto
// Accuracy ~1° — sufficient for zodiac sign determination
// ══════════════════════════════════════════════

const GaiaAstronomy = (() => {
  
  // ── ORBITAL ELEMENTS (Mean elements for J2000 epoch) ──
  // [semiMajorAxis, eccentricity, inclination, meanLongitude, 
  //  perihelionLongitude, nodeLongitude, dailyMotion]
  
  const ELEMENTS = {
    mercury:  { a: 0.387, e: 0.2056, i: 7.00, L: 252.25, w: 77.46,  W: 48.33,  n: 4.0923 },
    venus:    { a: 0.723, e: 0.0068, i: 3.39, L: 181.98, w: 131.56, W: 76.68,  n: 1.6021 },
    earth:    { a: 1.000, e: 0.0167, i: 0.00, L: 100.47, w: 102.94, W: 0.0,    n: 0.9856 },
    mars:     { a: 1.524, e: 0.0934, i: 1.85, L: 355.45, w: 336.04, W: 49.56,  n: 0.5240 },
    jupiter:  { a: 5.203, e: 0.0484, i: 1.30, L: 34.40,  w: 14.33,  W: 100.46, n: 0.0831 },
    saturn:   { a: 9.537, e: 0.0539, i: 2.49, L: 49.94,  w: 92.66,  W: 113.67, n: 0.0335 },
    uranus:   { a: 19.19, e: 0.0473, i: 0.77, L: 313.23, w: 172.43, W: 74.01,  n: 0.0117 },
    neptune:  { a: 30.07, e: 0.0086, i: 1.77, L: 304.88, w: 46.75,  W: 131.78, n: 0.0060 },
    pluto:    { a: 39.48, e: 0.2488, i: 17.14, L: 238.93, w: 224.06, W: 110.30, n: 0.0040 }
  };
  
  // ── DAYS SINCE J2000 ──
  function daysSinceJ2000(date = new Date()) {
    const j2000 = new Date('2000-01-01T12:00:00Z');
    return (date.getTime() - j2000.getTime()) / 86400000;
  }
  
  // ── KEPLER EQUATION ──
  function solveKepler(M, e, tolerance = 1e-6) {
    let E = M;
    for (let i = 0; i < 20; i++) {
      const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < tolerance) break;
    }
    return E;
  }
  
  // ── COMPUTE PLANET POSITION ──
  function getPlanetPosition(planetName, date = new Date()) {
    const el = ELEMENTS[planetName];
    if (!el) return null;
    
    const d = daysSinceJ2000(date);
    
    // Mean anomaly
    const M = ((el.L - el.w + el.n * d) % 360 + 360) % 360;
    const Mrad = M * Math.PI / 180;
    
    // Eccentric anomaly (Kepler's equation)
    const E = solveKepler(Mrad, el.e);
    
    // True anomaly
    const v = 2 * Math.atan2(
      Math.sqrt(1 + el.e) * Math.sin(E / 2),
      Math.sqrt(1 - el.e) * Math.cos(E / 2)
    );
    
    // Heliocentric distance
    const r = el.a * (1 - el.e * Math.cos(E));
    
    // Heliocentric longitude
    const helioLng = (el.w + v * 180 / Math.PI) % 360;
    
    // Approximate ecliptic longitude (ignoring inclination for simplicity)
    const eclipticLng = ((helioLng + 360) % 360);
    
    // Zodiac conversion
    const zodiac = GaiaSuncalc.longitudeToZodiac(eclipticLng);
    
    // Get divine identity
    const celestial = GAIA_CELESTIAL[planetName];
    
    return {
      name: planetName,
      god: celestial?.god || planetName,
      olympian: celestial?.olympian ?? true,
      glyph: celestial?.glyph || '·',
      arcana: celestial?.arcana || null,
      element: celestial?.element || null,
      sign: zodiac.sign,
      signGlyph: zodiac.glyph,
      degree: zodiac.degree,
      longitude: eclipticLng,
      distance: r,
      moons: celestial?.moons || null
    };
  }
  
  // ── GET ALL PLANETS ──
  function getAllPlanets(date = new Date()) {
    return {
      sun:      GaiaSuncalc.getSunPosition(date),
      moon:     GaiaSuncalc.getMoonPosition(date),
      mercury:  getPlanetPosition('mercury', date),
      venus:    getPlanetPosition('venus', date),
      mars:     getPlanetPosition('mars', date),
      jupiter:  getPlanetPosition('jupiter', date),
      saturn:   getPlanetPosition('saturn', date),
      uranus:   getPlanetPosition('uranus', date),
      neptune:  getPlanetPosition('neptune', date),
      pluto:    getPlanetPosition('pluto', date)
    };
  }
  
  // ── ABOVE/BELOW HORIZON ──
  function isAboveHorizon(planetLng, date = new Date(), lat = 40.7, lng = -74.0) {
    const sunTimes = GaiaSuncalc.getSunTimes(date, lat, lng);
    const asc = GaiaSuncalc.getAscendant(date, lat, lng);
    // Simplified: compare planet longitude to ascendant
    const ascLng = asc ? (GAIA_SIGNS.findIndex(s => s.name === asc.sign) * 30 + asc.degree) : 0;
    const diff = (planetLng - ascLng + 360) % 360;
    return diff < 180; // Above horizon if within 180° east of ascendant
  }
  
  return {
    getPlanetPosition,
    getAllPlanets,
    isAboveHorizon,
    daysSinceJ2000
  };
  
})();
