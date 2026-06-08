// ══════════════════════════════════════════════
// GAIA SUN/MOON CALCULATOR
// Native JS — no external dependencies
// Astronomical approximations good to ~0.5° accuracy
// ══════════════════════════════════════════════

const GaiaSuncalc = (() => {
  
  // ── JULIAN DATE ──
  function toJulian(date) {
    return (date.getTime() / 86400000.0) + 2440587.5;
  }
  
  function fromJulian(jd) {
    return new Date((jd - 2440587.5) * 86400000);
  }
  
  // ── SOLAR LONGITUDE ──
  // Returns ecliptic longitude in degrees (0-360)
  function solarLongitude(jd) {
    const n = jd - 2451545.0; // days since J2000.0
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;
    const gRad = g * Math.PI / 180;
    const lambda = L + 1.915 * Math.sin(gRad) + 0.020 * Math.sin(2 * gRad);
    return ((lambda % 360) + 360) % 360;
  }
  
  // ── LUNAR LONGITUDE (approximate) ──
  function lunarLongitude(jd) {
    const n = jd - 2451545.0;
    const L = (218.316 + 13.176396 * n) % 360;
    const M = (134.963 + 13.064993 * n) % 360;
    const F = (93.272 + 13.229350 * n) % 360;
    const MRad = M * Math.PI / 180;
    const lambda = L + 6.289 * Math.sin(MRad);
    return ((lambda % 360) + 360) % 360;
  }
  
  // ── LONGITUDE → ZODIAC ──
  function longitudeToZodiac(lng) {
    const signIndex = Math.floor(lng / 30) % 12;
    const degree = lng % 30;
    const sign = GAIA_SIGNS[signIndex];
    return {
      sign: sign.name,
      glyph: sign.glyph,
      degree: degree,
      element: sign.element,
      modality: sign.modality,
      arcana: sign.arcana
    };
  }
  
  // ── SUN POSITION ──
  function getSunPosition(date = new Date()) {
    const jd = toJulian(date);
    const lng = solarLongitude(jd);
    return {
      ...longitudeToZodiac(lng),
      longitude: lng,
      god: 'Apollo',
      arcana: GAIA_CELESTIAL.sun.arcana
    };
  }
  
  // ── MOON POSITION + PHASE ──
  function getMoonPosition(date = new Date()) {
    const jd = toJulian(date);
    const moonLng = lunarLongitude(jd);
    const sunLng = solarLongitude(jd);
    
    // Phase calculation
    let phaseAngle = (moonLng - sunLng) % 360;
    if (phaseAngle < 0) phaseAngle += 360;
    const phaseFraction = phaseAngle / 360; // 0 = new, 0.5 = full
    
    // Illumination
    const illumination = Math.round((1 - Math.cos(phaseAngle * Math.PI / 180)) * 50);
    
    // Phase name
    let phaseName, deity;
    if (phaseFraction < 0.0625 || phaseFraction > 0.9375) {
      phaseName = 'New Moon'; deity = 'Artemis the Unseen';
    } else if (phaseFraction < 0.1875) {
      phaseName = 'Waxing Crescent'; deity = 'Artemis the Huntress';
    } else if (phaseFraction < 0.3125) {
      phaseName = 'First Quarter'; deity = 'Artemis the Huntress';
    } else if (phaseFraction < 0.4375) {
      phaseName = 'Waxing Gibbous'; deity = 'Artemis the Huntress';
    } else if (phaseFraction < 0.5625) {
      phaseName = 'Full Moon'; deity = 'Artemis Resplendent';
    } else if (phaseFraction < 0.6875) {
      phaseName = 'Waning Gibbous'; deity = 'Melinoe';
    } else if (phaseFraction < 0.8125) {
      phaseName = 'Last Quarter'; deity = 'Melinoe';
    } else {
      phaseName = 'Waning Crescent'; deity = 'Melinoe';
    }
    
    return {
      ...longitudeToZodiac(moonLng),
      longitude: moonLng,
      god: deity.startsWith('Artemis') ? 'Artemis' : 'Melinoe',
      arcana: GAIA_CELESTIAL.moon.arcana,
      phase: phaseFraction,
      phaseName: phaseName,
      illumination: illumination,
      deity: deity
    };
  }
  
  // ── SUNRISE/SUNSET (simplified — latitude-dependent) ──
  function getSunTimes(date = new Date(), lat = 40.7, lng = -74.0) {
    const jd = toJulian(date);
    const n = jd - 2451545.0;
    
    // Solar declination
    const sunLng = solarLongitude(jd) * Math.PI / 180;
    const declination = Math.asin(Math.sin(sunLng) * Math.sin(23.44 * Math.PI / 180));
    
    // Hour angle at sunrise
    const latRad = lat * Math.PI / 180;
    const cosHourAngle = (Math.cos(90.833 * Math.PI / 180) - Math.sin(latRad) * Math.sin(declination)) 
                       / (Math.cos(latRad) * Math.cos(declination));
    
    if (cosHourAngle > 1 || cosHourAngle < -1) {
      // Polar day or night
      return { sunrise: null, sunset: null, polar: true };
    }
    
    const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
    
    // Solar noon in UTC hours
    const eqTime = equationOfTime(n);
    const solarNoon = 12.0 - lng / 15.0 - eqTime / 60.0;
    
    const sunriseHours = solarNoon - hourAngle / 15.0;
    const sunsetHours = solarNoon + hourAngle / 15.0;
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    const sunrise = new Date(year, month, day, 0, 0, 0);
    sunrise.setHours(sunriseHours, (sunriseHours % 1) * 60, 0, 0);
    
    const sunset = new Date(year, month, day, 0, 0, 0);
    sunset.setHours(sunsetHours, (sunsetHours % 1) * 60, 0, 0);
    
    return { sunrise, sunset, polar: false };
  }
  
  function equationOfTime(n) {
    const B = (360 / 365) * (n + 81);
    const BRad = B * Math.PI / 180;
    return 9.87 * Math.sin(2 * BRad) - 7.53 * Math.cos(BRad) - 1.5 * Math.sin(BRad);
  }
  
  // ── ASCENDANT (rising sign) ──
  function getAscendant(date = new Date(), lat = 40.7, lng = -74.0) {
    const jd = toJulian(date);
    const sunLng = solarLongitude(jd);
    
    // Local sidereal time (approximate)
    const utHours = date.getUTCHours() + date.getUTCMinutes() / 60;
    const n = jd - 2451545.0;
    let lst = (100.46 + 0.985647 * n + lng + 15 * utHours) % 360;
    if (lst < 0) lst += 360;
    
    // Obliquity
    const obliquity = 23.44;
    const latRad = lat * Math.PI / 180;
    const lstRad = lst * Math.PI / 180;
    const obRad = obliquity * Math.PI / 180;
    
    // Ascendant
    const ascLng = Math.atan2(
      -Math.cos(lstRad),
      Math.sin(latRad) * Math.sin(lstRad) + Math.cos(latRad) * Math.tan(obRad)
    ) * 180 / Math.PI;
    
    const asc = ((ascLng + 360) % 360);
    return longitudeToZodiac(asc);
  }
  
  // ── IS IT DAY OR NIGHT? ──
  function getPeriod(date = new Date(), lat = 40.7, lng = -74.0) {
    const times = getSunTimes(date, lat, lng);
    if (times.polar) return 'UNKNOWN';
    if (!times.sunrise || !times.sunset) return 'UNKNOWN';
    
    const now = date.getTime();
    if (now >= times.sunrise.getTime() && now <= times.sunset.getTime()) {
      return 'SUN'; // Solar period — Apollo reigns
    }
    return 'MOON'; // Lunar period — Artemis/Melinoe reigns
  }
  
  // ── FULL STATE ──
  function getFullState(date = new Date(), lat = 40.7, lng = -74.0) {
    const sun = getSunPosition(date);
    const moon = getMoonPosition(date);
    const ascendant = getAscendant(date, lat, lng);
    const period = getPeriod(date, lat, lng);
    const sunTimes = getSunTimes(date, lat, lng);
    
    return {
      timestamp: date.toISOString(),
      sun: sun,
      moon: moon,
      ascendant: ascendant,
      period: period,
      solar: {
        sunrise: sunTimes.sunrise,
        sunset: sunTimes.sunset,
        polar: sunTimes.polar
      },
      moonPhase: {
        phase: moon.phase,
        name: moon.phaseName,
        illumination: moon.illumination,
        deity: moon.deity
      }
    };
  }
  
  return {
    getSunPosition,
    getMoonPosition,
    getSunTimes,
    getAscendant,
    getPeriod,
    getFullState,
    longitudeToZodiac
  };
  
})();
